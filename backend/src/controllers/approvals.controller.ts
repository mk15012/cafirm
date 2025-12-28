import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';

export async function getApprovals(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

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

    const { status } = req.query;

    const approvals = await prisma.approval.findMany({
      where: {
        task: {
          firmId: { in: accessibleFirmIds },
        },
        ...(status && { status: status as any }),
      },
      include: {
        task: {
          include: {
            firm: {
              include: {
                client: true,
              },
            },
          },
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(approvals);
  } catch (error) {
    console.error('Get approvals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getApproval(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const approval = await prisma.approval.findUnique({
      where: { id },
      include: {
        task: {
          include: {
            firm: {
              include: {
                client: true,
              },
            },
          },
        },
        requestedBy: true,
        approvedBy: true,
      },
    });

    if (!approval) {
      return res.status(404).json({ error: 'Approval not found' });
    }

    res.json(approval);
  } catch (error) {
    console.error('Get approval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createApproval(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { taskId, remarks } = req.body;

    if (!taskId) {
      return res.status(400).json({ error: 'Task ID is required' });
    }

    // Check if approval already exists
    const existing = await prisma.approval.findUnique({
      where: { taskId },
    });

    if (existing) {
      return res.status(400).json({ error: 'Approval already exists for this task' });
    }

    // Update task status to AWAITING_APPROVAL
    await prisma.task.update({
      where: { id: taskId },
      data: { status: 'AWAITING_APPROVAL' },
    });

    const approval = await prisma.approval.create({
      data: {
        taskId,
        requestedById: user.userId,
        remarks,
      },
      include: {
        task: {
          include: {
            firm: {
              include: {
                client: true,
              },
            },
          },
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json(approval);
  } catch (error) {
    console.error('Create approval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function approveRequest(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { remarks } = req.body;

    const approval = await prisma.approval.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedById: user.userId,
        approvedAt: new Date(),
        remarks,
      },
      include: {
        task: true,
      },
    });

    // Update task status to COMPLETED
    await prisma.task.update({
      where: { id: approval.taskId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    res.json(approval);
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function rejectRequest(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { remarks } = req.body;

    if (!remarks) {
      return res.status(400).json({ error: 'Remarks are required for rejection' });
    }

    const approval = await prisma.approval.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedById: user.userId,
        rejectedAt: new Date(),
        remarks,
      },
      include: {
        task: true,
      },
    });

    // Update task status back to IN_PROGRESS
    await prisma.task.update({
      where: { id: approval.taskId },
      data: { status: 'IN_PROGRESS' },
    });

    res.json(approval);
  } catch (error) {
    console.error('Reject request error:', error);
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

