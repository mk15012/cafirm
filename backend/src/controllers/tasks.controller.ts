import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';
import { TaskStatus } from '@prisma/client';
import { getRootCAId, getCAOrganizationUserIds } from '../utils/caOrganization';
import { generateTaxDeadlineTasks, getCurrentFinancialYear, getNextFinancialYear } from '../utils/taxDeadlines';

export async function getTasks(req: Request, res: Response) {
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

    // Get accessible firm IDs
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

    // Additional security: filter to only firms in the organization
    const orgFirms = await prisma.firm.findMany({
      where: { createdById: { in: orgUserIds } },
      select: { id: true },
    });
    const orgFirmIds = new Set(orgFirms.map(f => f.id));
    accessibleFirmIds = accessibleFirmIds.filter(id => orgFirmIds.has(id));

    const { status, firmId, assignedToId } = req.query;

    // Parse filter IDs to integers if provided
    const parsedFirmId = firmId ? parseInt(firmId as string, 10) : null;
    const parsedAssignedToId = assignedToId ? parseInt(assignedToId as string, 10) : null;

    // Build where clause - users should see tasks from accessible firms OR tasks assigned to them
    const whereClause: any = {
      OR: [
        { firmId: { in: accessibleFirmIds } },
        { assignedToId: user.userId }, // Also show tasks directly assigned to this user
      ],
      ...(status && { status: status as TaskStatus }),
      ...(parsedFirmId && !isNaN(parsedFirmId) && { firmId: parsedFirmId }),
      ...(parsedAssignedToId && !isNaN(parsedAssignedToId) && { assignedToId: parsedAssignedToId }),
    };

    // Additional filter to ensure tasks belong to the organization
    const orgFirmIdsArray = Array.from(orgFirmIds);
    whereClause.firmId = { in: orgFirmIdsArray };

    // Override with OR condition
    const tasks = await prisma.task.findMany({
      where: {
        AND: [
          { firmId: { in: orgFirmIdsArray } }, // Task must be from org's firms
          {
            OR: [
              { firmId: { in: accessibleFirmIds } }, // User has access to firm
              { assignedToId: user.userId }, // OR task is assigned to user
            ],
          },
          ...(status ? [{ status: status as TaskStatus }] : []),
          ...(parsedFirmId && !isNaN(parsedFirmId) ? [{ firmId: parsedFirmId }] : []),
          ...(parsedAssignedToId && !isNaN(parsedAssignedToId) ? [{ assignedToId: parsedAssignedToId }] : []),
        ],
      },
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
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getTask(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const taskId = parseInt(id, 10);

    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    // Get the root CA ID for this user's organization
    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Get all user IDs in this CA's organization
    const orgUserIds = await getCAOrganizationUserIds(caId);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
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
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
        approval: true,
        documents: {
          select: {
            id: true,
            fileName: true,
            documentType: true,
            createdAt: true,
          },
        },
      },
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Verify task's firm belongs to this CA's organization
    const firm = await prisma.firm.findUnique({
      where: { id: task.firmId },
      select: { createdById: true },
    });

    if (!firm || !orgUserIds.includes(firm.createdById)) {
      return res.status(403).json({ error: 'Access denied: Task does not belong to your organization' });
    }

    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createTask(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { firmId, title, description, assignedToId, priority, dueDate } = req.body;

    if (!firmId || !title || !assignedToId || !dueDate) {
      return res.status(400).json({ error: 'Firm ID, title, assigned to, and due date are required' });
    }

    // Parse IDs to integers
    const parsedFirmId = typeof firmId === 'string' ? parseInt(firmId, 10) : firmId;
    const parsedAssignedToId = typeof assignedToId === 'string' ? parseInt(assignedToId, 10) : assignedToId;

    if (isNaN(parsedFirmId) || isNaN(parsedAssignedToId)) {
      return res.status(400).json({ error: 'Invalid firm ID or assigned user ID' });
    }

    // Get the root CA ID for this user's organization
    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Get all user IDs in this CA's organization
    const orgUserIds = await getCAOrganizationUserIds(caId);

    // Verify firm belongs to this CA's organization
    const firm = await prisma.firm.findUnique({
      where: { id: parsedFirmId },
      select: { createdById: true },
    });

    if (!firm) {
      return res.status(404).json({ error: 'Firm not found' });
    }

    if (!orgUserIds.includes(firm.createdById)) {
      return res.status(403).json({ error: 'Access denied: Firm does not belong to your organization' });
    }

    // Verify assigned user belongs to this CA's organization
    if (!orgUserIds.includes(parsedAssignedToId)) {
      return res.status(403).json({ error: 'Access denied: Cannot assign task to user outside your organization' });
    }

    const task = await prisma.task.create({
      data: {
        firmId: parsedFirmId,
        title,
        description,
        assignedToId: parsedAssignedToId,
        priority: priority || 'MEDIUM',
        dueDate: new Date(dueDate),
        createdById: user.userId,
      },
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

    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateTask(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const taskId = parseInt(id, 10);

    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const { title, description, assignedToId, priority, dueDate, status } = req.body;

    // Get the root CA ID for this user's organization
    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Get all user IDs in this CA's organization
    const orgUserIds = await getCAOrganizationUserIds(caId);

    // Verify task belongs to this CA's organization
    const existingTask = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        firm: {
          select: { createdById: true },
        },
      },
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (!orgUserIds.includes(existingTask.firm.createdById)) {
      return res.status(403).json({ error: 'Access denied: Task does not belong to your organization' });
    }

    // If reassigning, verify new assignee belongs to organization
    const parsedAssignedToId = assignedToId ? (typeof assignedToId === 'string' ? parseInt(assignedToId, 10) : assignedToId) : null;
    if (parsedAssignedToId && !orgUserIds.includes(parsedAssignedToId)) {
      return res.status(403).json({ error: 'Access denied: Cannot assign task to user outside your organization' });
    }

    // Role-based status transition validation
    if (status && status !== existingTask.status) {
      const currentStatus = existingTask.status;
      const newStatus = status;

      // Define allowed transitions per role
      // Staff: Can work on tasks, submit for approval, withdraw, flag errors
      const staffAllowedTransitions: Record<string, string[]> = {
        'PENDING': ['IN_PROGRESS'],                          // Start working
        'IN_PROGRESS': ['AWAITING_APPROVAL', 'PENDING', 'ERROR'], // Submit, pause, or flag error
        'AWAITING_APPROVAL': ['IN_PROGRESS'],                // Withdraw (go back to working)
        'COMPLETED': [],                                      // Cannot modify completed tasks
        'ERROR': ['IN_PROGRESS', 'PENDING'],                 // Retry or reset
        'OVERDUE': ['IN_PROGRESS', 'AWAITING_APPROVAL'],     // Work on or submit overdue task
      };

      // Manager: All Staff transitions + can approve, reject, reopen tasks
      const managerAllowedTransitions: Record<string, string[]> = {
        'PENDING': ['IN_PROGRESS', 'COMPLETED'],              // Start or quick-complete
        'IN_PROGRESS': ['AWAITING_APPROVAL', 'PENDING', 'COMPLETED', 'ERROR'], // More flexibility
        'AWAITING_APPROVAL': ['COMPLETED', 'IN_PROGRESS'],   // Approve or send back for rework
        'COMPLETED': ['IN_PROGRESS'],                         // Reopen if issues found
        'ERROR': ['IN_PROGRESS', 'PENDING', 'COMPLETED'],    // Full control over error resolution
        'OVERDUE': ['IN_PROGRESS', 'AWAITING_APPROVAL', 'COMPLETED'], // Handle overdue tasks
      };

      // CA and INDIVIDUAL users can do anything - no restrictions
      // INDIVIDUAL users manage their own personal tasks, so they should have full control
      if (user.role !== 'CA' && user.role !== 'INDIVIDUAL') {
        const allowedTransitions = user.role === 'MANAGER' 
          ? managerAllowedTransitions 
          : staffAllowedTransitions;

        const allowed = allowedTransitions[currentStatus] || [];
        
        if (!allowed.includes(newStatus)) {
          const roleLabel = user.role === 'MANAGER' ? 'Managers' : 'Staff members';
          return res.status(403).json({ 
            error: `${roleLabel} cannot change status from "${currentStatus}" to "${newStatus}". Please contact your CA for this change.`
          });
        }
      }
    }

    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (parsedAssignedToId) updateData.assignedToId = parsedAssignedToId;
    if (priority) updateData.priority = priority;
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (status) {
      updateData.status = status;
      if (status === 'COMPLETED') {
        updateData.completedAt = new Date();
      }
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data: updateData,
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

    // Create Approval record when status changes to AWAITING_APPROVAL
    if (status === 'AWAITING_APPROVAL' && existingTask.status !== 'AWAITING_APPROVAL') {
      // Check if approval already exists for this task
      const existingApproval = await prisma.approval.findUnique({
        where: { taskId: taskId },
      });

      if (!existingApproval) {
        await prisma.approval.create({
          data: {
            taskId: taskId,
            requestedById: user.userId,
            status: 'PENDING',
          },
        });
      } else {
        // Reset existing approval to PENDING
        await prisma.approval.update({
          where: { taskId: taskId },
          data: {
            status: 'PENDING',
            requestedById: user.userId,
            approvedById: null,
            approvedAt: null,
            rejectedAt: null,
            remarks: null,
          },
        });
      }
    }

    // If Staff withdraws approval request (AWAITING_APPROVAL → IN_PROGRESS), delete the pending approval
    if (existingTask.status === 'AWAITING_APPROVAL' && status === 'IN_PROGRESS') {
      await prisma.approval.deleteMany({
        where: { 
          taskId: taskId,
          status: 'PENDING', // Only delete if still pending (not yet approved/rejected)
        },
      });
    }

    // Auto-update overdue status
    if (task.dueDate < new Date() && task.status !== 'COMPLETED' && task.status !== 'ERROR') {
      await prisma.task.update({
        where: { id: taskId },
        data: { status: 'OVERDUE' },
      });
      task.status = 'OVERDUE';
    }

    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteTask(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const taskId = parseInt(id, 10);

    if (isNaN(taskId)) {
      return res.status(400).json({ error: 'Invalid task ID' });
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

    await prisma.task.delete({
      where: { id: taskId },
    });

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
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

/**
 * Generate tax deadline tasks for INDIVIDUAL users
 * Can be used to regenerate tasks for current or next FY
 */
export async function generateTaxTasks(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only INDIVIDUAL users can use this
    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { role: true },
    });

    if (userData?.role !== 'INDIVIDUAL') {
      return res.status(403).json({ error: 'This feature is only for Individual users' });
    }

    const { financialYear } = req.body;
    const targetFY = financialYear || getCurrentFinancialYear();

    // Find the user's personal firm
    const firm = await prisma.firm.findFirst({
      where: {
        createdById: user.userId,
        entityType: 'INDIVIDUAL',
      },
    });

    if (!firm) {
      return res.status(404).json({ error: 'Personal firm not found. Please contact support.' });
    }

    // Check for existing tasks in this FY to avoid duplicates
    const existingTasks = await prisma.task.findMany({
      where: {
        firmId: firm.id,
        title: { contains: `FY ${targetFY}` },
      },
    });

    if (existingTasks.length > 0) {
      return res.status(400).json({ 
        error: `Tasks for FY ${targetFY} already exist. Delete them first if you want to regenerate.`,
        existingCount: existingTasks.length,
      });
    }

    // Generate and create tasks
    const taskData = generateTaxDeadlineTasks(firm.id, user.userId, targetFY);
    
    if (taskData.length === 0) {
      return res.status(400).json({ 
        error: 'No upcoming deadlines to create. All deadlines for this FY have passed.',
      });
    }

    await prisma.task.createMany({
      data: taskData,
    });

    res.status(201).json({
      message: `Created ${taskData.length} tax deadline tasks for FY ${targetFY}`,
      count: taskData.length,
      financialYear: targetFY,
    });
  } catch (error) {
    console.error('Generate tax tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Generate tasks for the next financial year
 */
export async function generateNextYearTasks(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userData = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { role: true },
    });

    if (userData?.role !== 'INDIVIDUAL') {
      return res.status(403).json({ error: 'This feature is only for Individual users' });
    }

    const currentFY = getCurrentFinancialYear();
    const nextFY = getNextFinancialYear(currentFY);

    // Forward to the main generator with next FY
    req.body.financialYear = nextFY;
    return generateTaxTasks(req, res);
  } catch (error) {
    console.error('Generate next year tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

