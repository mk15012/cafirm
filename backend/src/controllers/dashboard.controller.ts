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
    let accessibleFirmIds: string[] = [];
    
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
    let accessibleFirmIds: string[] = [];
    
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

async function getTeamUserIds(managerId: string): Promise<string[]> {
  const teamMembers = await prisma.user.findMany({
    where: { reportsToId: managerId },
    select: { id: true },
  });
  return [managerId, ...teamMembers.map(u => u.id)];
}

