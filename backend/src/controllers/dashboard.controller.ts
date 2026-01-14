import { Request, Response } from 'express';
import { getDashboardMetrics } from '../services/dashboard.service';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';
import { getComplianceCalendarForMonth } from '../utils/complianceRules';
import { getRootCAId, getCAOrganizationUserIds } from '../utils/caOrganization';

export async function getMetrics(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const metrics = await getDashboardMetrics(user.userId, user.role);
    res.json(metrics);
  } catch (error) {
    console.error('Get metrics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getRecentTasks(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get accessible firm IDs
    let accessibleFirmIds: number[] = [];
    
    if (user.role === 'CA') {
      // CA only sees firms created by non-INDIVIDUAL users (their team)
      const teamFirms = await prisma.firm.findMany({ 
        where: {
          createdBy: {
            role: { not: 'INDIVIDUAL' }
          }
        },
        select: { id: true } 
      });
      accessibleFirmIds = teamFirms.map(f => f.id);
    } else if (user.role === 'INDIVIDUAL') {
      // INDIVIDUAL users see only firms they created (their personal firm)
      const userFirms = await prisma.firm.findMany({
        where: { createdById: user.userId },
        select: { id: true },
      });
      accessibleFirmIds = userFirms.map(f => f.id);
    } else if (user.role === 'MANAGER') {
      const teamUserIds = await getTeamUserIds(user.userId);
      const mappings = await prisma.userFirmMapping.findMany({
        where: { userId: { in: teamUserIds } },
        select: { firmId: true },
      });
      accessibleFirmIds = [...new Set(mappings.map(m => m.firmId))];
    } else {
      const mappings = await prisma.userFirmMapping.findMany({
        where: { userId: user.userId },
        select: { firmId: true },
      });
      accessibleFirmIds = mappings.map(m => m.firmId);
    }

    const tasks = await prisma.task.findMany({
      where: {
        firmId: { in: accessibleFirmIds },
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        firm: {
          include: {
            client: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.json(tasks);
  } catch (error) {
    console.error('Get recent tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getUpcomingDeadlines(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get accessible firm IDs (same logic as recent tasks)
    let accessibleFirmIds: number[] = [];
    
    if (user.role === 'CA') {
      // CA only sees firms created by non-INDIVIDUAL users (their team)
      const teamFirms = await prisma.firm.findMany({ 
        where: {
          createdBy: {
            role: { not: 'INDIVIDUAL' }
          }
        },
        select: { id: true } 
      });
      accessibleFirmIds = teamFirms.map(f => f.id);
    } else if (user.role === 'INDIVIDUAL') {
      // INDIVIDUAL users see only firms they created (their personal firm)
      const userFirms = await prisma.firm.findMany({
        where: { createdById: user.userId },
        select: { id: true },
      });
      accessibleFirmIds = userFirms.map(f => f.id);
    } else if (user.role === 'MANAGER') {
      const teamUserIds = await getTeamUserIds(user.userId);
      const mappings = await prisma.userFirmMapping.findMany({
        where: { userId: { in: teamUserIds } },
        select: { firmId: true },
      });
      accessibleFirmIds = [...new Set(mappings.map(m => m.firmId))];
    } else {
      const mappings = await prisma.userFirmMapping.findMany({
        where: { userId: user.userId },
        select: { firmId: true },
      });
      accessibleFirmIds = mappings.map(m => m.firmId);
    }

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30); // Next 30 days

    const tasks = await prisma.task.findMany({
      where: {
        firmId: { in: accessibleFirmIds },
        dueDate: {
          gte: now,
          lte: futureDate,
        },
        status: {
          notIn: ['COMPLETED', 'ERROR'],
        },
      },
      take: 10,
      orderBy: { dueDate: 'asc' },
      include: {
        firm: {
          include: {
            client: true,
          },
        },
      },
    });

    // Transform tasks to deadline format
    const taskDeadlines = tasks.map(task => ({
      id: String(task.id),
      title: task.title,
      type: 'Task',
      firm: task.firm.name,
      client: task.firm.client.name,
      dueDate: task.dueDate,
      priority: task.priority,
    }));

    // Get compliance calendar deadlines for the next 30 days
    let complianceDeadlines: any[] = [];
    try {
      // Get the CA ID for this user's organization
      const caId = await getRootCAId(user.userId);
      if (caId) {
        const orgUserIds = await getCAOrganizationUserIds(caId);
        
        // Get all firms in the organization with compliance flags
        const firms = await prisma.firm.findMany({
          where: {
            createdById: { in: orgUserIds },
          },
          select: {
            id: true,
            name: true,
            client: {
              select: { name: true },
            },
            hasGST: true,
            gstFrequency: true,
            hasTDS: true,
            hasITR: true,
            itrDueDate: true,
            hasTaxAudit: true,
            hasAdvanceTax: true,
            hasROC: true,
          },
        });

        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();
        const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
        const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;

        // Get items for current and next month
        const currentMonthItems = getComplianceCalendarForMonth(firms, currentYear, currentMonth);
        const nextMonthItems = getComplianceCalendarForMonth(firms, nextMonthYear, nextMonth);

        const allComplianceItems = [...currentMonthItems, ...nextMonthItems];

        // Filter to next 30 days
        const upcomingComplianceItems = allComplianceItems.filter(item => 
          item.dueDate >= now && item.dueDate <= futureDate
        );

        // Transform to deadline format
        complianceDeadlines = upcomingComplianceItems.map(item => ({
          id: `compliance-${item.firmId}-${item.code}-${item.dueDate.toISOString()}`,
          title: item.name, // Use 'name' instead of 'description'
          type: item.category, // Use 'category' instead of 'type'
          code: item.code, // Include code for more detail
          firm: item.firmName,
          client: item.clientName,
          dueDate: item.dueDate,
          priority: item.dueDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'HIGH' : 'MEDIUM',
        }));
      }
    } catch (complianceError) {
      console.error('Error fetching compliance deadlines:', complianceError);
      // Continue with just task deadlines if compliance fails
    }

    // Merge and sort by due date
    const allDeadlines = [...taskDeadlines, ...complianceDeadlines]
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 10); // Limit to 10 items

    res.json(allDeadlines);
  } catch (error) {
    console.error('Get upcoming deadlines error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getTeamUserIds(managerId: number): Promise<number[]> {
  const teamMembers = await prisma.user.findMany({
    where: { reportsToId: managerId },
    select: { id: true },
  });
  return [managerId, ...teamMembers.map(u => u.id)];
}

export async function getTodaysBirthdays(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const today = new Date();
    const currentMonth = today.getMonth() + 1; // 1-indexed
    const currentDay = today.getDate();

    // INDIVIDUAL users only see their own birthday
    if (user.role === 'INDIVIDUAL') {
      const individualUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { id: true, name: true, role: true, birthday: true } as any,
      });
      
      let isMyBirthday = false;
      if ((individualUser as any)?.birthday) {
        const bday = new Date((individualUser as any).birthday);
        isMyBirthday = bday.getMonth() + 1 === currentMonth && bday.getDate() === currentDay;
      }
      
      return res.json({
        isMyBirthday,
        myName: individualUser?.name,
        teamBirthdays: isMyBirthday ? [{
          id: individualUser?.id,
          name: individualUser?.name,
          role: individualUser?.role,
          isMe: true,
        }] : [],
      });
    }

    // For CA/MANAGER/STAFF - only get users in their organization (not INDIVIDUAL users)
    const allUsers = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        birthday: { not: null },
        role: { not: 'INDIVIDUAL' }, // Exclude INDIVIDUAL users from team birthdays
      } as any,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        birthday: true,
        reportsToId: true,
      } as any,
    });

    // Filter users whose birthday matches today (month and day)
    const birthdayUsers = (allUsers as any[]).filter((u: any) => {
      if (!u.birthday) return false;
      const bday = new Date(u.birthday);
      return bday.getMonth() + 1 === currentMonth && bday.getDate() === currentDay;
    });

    // Check if the logged-in user has birthday today
    const loggedInUserBirthday = birthdayUsers.find(u => u.id === user.userId);
    
    // Determine which team birthdays to show based on role
    let teamBirthdays: typeof birthdayUsers = [];
    
    if (user.role === 'CA') {
      // CA sees team members' birthdays (CA, MANAGER, STAFF in their org - not INDIVIDUAL)
      // For now, CA sees all non-INDIVIDUAL birthdays
      // TODO: Filter by organization when multi-CA is implemented
      teamBirthdays = birthdayUsers;
    } else if (user.role === 'MANAGER') {
      // Manager sees:
      // 1. Their own birthday (handled separately as isMyBirthday)
      // 2. Birthdays of staff who report directly to them
      teamBirthdays = birthdayUsers.filter(u => 
        u.id === user.userId || u.reportsToId === user.userId
      );
    } else {
      // Staff sees only their own birthday
      teamBirthdays = birthdayUsers.filter(u => u.id === user.userId);
    }

    res.json({
      isMyBirthday: !!loggedInUserBirthday,
      myName: loggedInUserBirthday?.name,
      teamBirthdays: teamBirthdays.map(u => ({
        id: u.id,
        name: u.name,
        role: u.role,
        isMe: u.id === user.userId,
      })),
    });
  } catch (error) {
    console.error('Get todays birthdays error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

