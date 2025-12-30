import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';

export async function getActivityLogs(req: Request, res: Response) {
  try {
    const { userId, entityType, startDate, endDate, limit = 100 } = req.query;

    const where: any = {};
    if (userId) where.userId = userId as string;
    if (entityType) where.entityType = entityType as string;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const logs = await prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });

    res.json(logs);
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getActivityLog(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const log = await prisma.activityLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!log) {
      return res.status(404).json({ error: 'Activity log not found' });
    }

    res.json(log);
  } catch (error) {
    console.error('Get activity log error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

