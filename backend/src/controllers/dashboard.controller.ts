import { Request, Response } from 'express';
import { getDashboardMetrics } from '../services/dashboard.service';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';

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
      const allFirms = await prisma.firm.findMany({ select: { id: true } });
      accessibleFirmIds = allFirms.map(f => f.id);
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
      const allFirms = await prisma.firm.findMany({ select: { id: true } });
      accessibleFirmIds = allFirms.map(f => f.id);
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

    // Transform to deadline format
    const deadlines = tasks.map(task => ({
      id: task.id,
      title: task.title,
      type: 'Task',
      firm: task.firm.name,
      client: task.firm.client.name,
      dueDate: task.dueDate,
      priority: task.priority,
    }));

    res.json(deadlines);
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

    // Get all active users with birthdays and their reporting structure
    // Note: Using 'as any' because TypeScript may not have picked up the new birthday field yet
    const allUsers = await prisma.user.findMany({
      where: {
        status: 'ACTIVE',
        birthday: { not: null },
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
      // CA sees all team members' birthdays (everyone except themselves)
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

