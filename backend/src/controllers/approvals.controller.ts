import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';
import { getRootCAId, getCAOrganizationUserIds } from '../utils/caOrganization';

export async function getApprovals(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get the root CA ID for this user's organization
    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Get all user IDs in this CA's organization
    const orgUserIds = await getCAOrganizationUserIds(caId);

    let accessibleFirmIds: number[] = [];
    
    if (user.role === 'CA') {
      // CA sees all firms created by anyone in their organization
      const orgFirms = await prisma.firm.findMany({
        where: { createdById: { in: orgUserIds } },
        select: { id: true },
      });
      accessibleFirmIds = orgFirms.map(f => f.id);
    } else if (user.role === 'MANAGER') {
      const teamUserIds = await getTeamUserIds(user.userId);
      const mappings = await prisma.userFirmMapping.findMany({
        where: { userId: { in: teamUserIds } },
        select: { firmId: true },
      });
      accessibleFirmIds = [...new Set(mappings.map(m => m.firmId))];
    } else {
      // Staff only see firms they're assigned to
      const mappings = await prisma.userFirmMapping.findMany({
        where: { userId: user.userId },
        select: { firmId: true },
      });
      accessibleFirmIds = mappings.map(m => m.firmId);
    }

    // Filter to only firms in the organization
    const orgFirms = await prisma.firm.findMany({
      where: { createdById: { in: orgUserIds } },
      select: { id: true },
    });
    const orgFirmIds = new Set(orgFirms.map(f => f.id));
    accessibleFirmIds = accessibleFirmIds.filter(id => orgFirmIds.has(id));

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
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const approvalId = parseInt(id, 10);
    
    if (isNaN(approvalId)) {
      return res.status(400).json({ error: 'Invalid approval ID' });
    }

    // Get the root CA ID for this user's organization
    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Get all user IDs in this CA's organization
    const orgUserIds = await getCAOrganizationUserIds(caId);

    const approval = await prisma.approval.findUnique({
      where: { id: approvalId },
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

    // Verify approval's task firm belongs to this CA's organization
    const firm = await prisma.firm.findUnique({
      where: { id: approval.task.firmId },
      select: { createdById: true },
    });

    if (!firm || !orgUserIds.includes(firm.createdById)) {
      return res.status(403).json({ error: 'Access denied: Approval does not belong to your organization' });
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

    // Get the root CA ID for this user's organization
    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Get all user IDs in this CA's organization
    const orgUserIds = await getCAOrganizationUserIds(caId);

    // Verify task belongs to this CA's organization
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        firm: {
          select: { createdById: true },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (!orgUserIds.includes(task.firm.createdById)) {
      return res.status(403).json({ error: 'Access denied: Task does not belong to your organization' });
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
    const approvalId = parseInt(id, 10);
    
    if (isNaN(approvalId)) {
      return res.status(400).json({ error: 'Invalid approval ID' });
    }
    
    const { remarks } = req.body;

    // Get the root CA ID for this user's organization
    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Get all user IDs in this CA's organization
    const orgUserIds = await getCAOrganizationUserIds(caId);

    // Verify approval belongs to this CA's organization
    const existingApproval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        task: {
          include: {
            firm: {
              select: { createdById: true },
            },
          },
        },
      },
    });

    if (!existingApproval) {
      return res.status(404).json({ error: 'Approval not found' });
    }

    if (!orgUserIds.includes(existingApproval.task.firm.createdById)) {
      return res.status(403).json({ error: 'Access denied: Approval does not belong to your organization' });
    }

    const approval = await prisma.approval.update({
      where: { id: approvalId },
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
    const approvalId = parseInt(id, 10);
    
    if (isNaN(approvalId)) {
      return res.status(400).json({ error: 'Invalid approval ID' });
    }
    
    const { remarks } = req.body;

    if (!remarks) {
      return res.status(400).json({ error: 'Remarks are required for rejection' });
    }

    // Get the root CA ID for this user's organization
    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Get all user IDs in this CA's organization
    const orgUserIds = await getCAOrganizationUserIds(caId);

    // Verify approval belongs to this CA's organization
    const existingApproval = await prisma.approval.findUnique({
      where: { id: approvalId },
      include: {
        task: {
          include: {
            firm: {
              select: { createdById: true },
            },
          },
        },
      },
    });

    if (!existingApproval) {
      return res.status(404).json({ error: 'Approval not found' });
    }

    if (!orgUserIds.includes(existingApproval.task.firm.createdById)) {
      return res.status(403).json({ error: 'Access denied: Approval does not belong to your organization' });
    }

    const approval = await prisma.approval.update({
      where: { id: approvalId },
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

async function getTeamUserIds(managerId: number): Promise<number[]> {
  const teamMembers = await prisma.user.findMany({
    where: { reportsToId: managerId },
    select: { id: true },
  });
  return [managerId, ...teamMembers.map(u => u.id)];
}

