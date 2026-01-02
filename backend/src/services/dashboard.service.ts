import { prisma } from '../utils/prisma';
import { getRootCAId, getCAOrganizationUserIds } from '../utils/caOrganization';
import { UserRole } from '@prisma/client';
import { DashboardMetrics } from '../types';

export async function getDashboardMetrics(userId: number, userRole: UserRole): Promise<DashboardMetrics> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Get the root CA ID for this user's organization
  const caId = await getRootCAId(userId);
  if (!caId) {
    throw new Error('Unable to determine organization');
  }

  // Get all user IDs in this CA's organization
  const orgUserIds = await getCAOrganizationUserIds(caId);

  // Get accessible firm IDs based on role
  let accessibleFirmIds: number[] = [];
  
  if (userRole === 'CA' || userRole === 'INDIVIDUAL') {
    // CA sees all firms created by anyone in their organization
    // INDIVIDUAL users see only firms they created (their personal firm)
    const orgFirms = await prisma.firm.findMany({
      where: { createdById: { in: orgUserIds } },
      select: { id: true },
    });
    accessibleFirmIds = orgFirms.map(f => f.id);
  } else if (userRole === 'MANAGER') {
    // Manager can see firms assigned to them and their team
    const teamUserIds = await getTeamUserIds(userId);
    const mappings = await prisma.userFirmMapping.findMany({
      where: { userId: { in: teamUserIds } },
      select: { firmId: true },
    });
    accessibleFirmIds = [...new Set(mappings.map(m => m.firmId))];
  } else {
    // Staff can only see assigned firms
    const mappings = await prisma.userFirmMapping.findMany({
      where: { userId },
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

  // Active Tasks
  const activeTasks = await prisma.task.count({
    where: {
      firmId: { in: accessibleFirmIds },
      status: 'IN_PROGRESS',
    },
  });

  const activeTasksLastMonth = await prisma.task.count({
    where: {
      firmId: { in: accessibleFirmIds },
      status: 'IN_PROGRESS',
      createdAt: { lte: endOfLastMonth },
    },
  });

  const activeTasksChange = activeTasksLastMonth > 0
    ? Math.round(((activeTasks - activeTasksLastMonth) / activeTasksLastMonth) * 100)
    : activeTasks > 0 ? 100 : 0;

  // Pending Approvals
  const pendingApprovals = await prisma.approval.count({
    where: {
      status: 'PENDING',
      task: {
        firmId: { in: accessibleFirmIds },
      },
    },
  });

  // Overdue Items
  const overdueItems = await prisma.task.count({
    where: {
      firmId: { in: accessibleFirmIds },
      dueDate: { lt: now },
      status: { notIn: ['COMPLETED', 'ERROR'] },
    },
  });

  const overdueItemsLastMonth = await prisma.task.count({
    where: {
      firmId: { in: accessibleFirmIds },
      dueDate: { lt: endOfLastMonth },
      status: { notIn: ['COMPLETED', 'ERROR'] },
      createdAt: { lte: endOfLastMonth },
    },
  });

  const overdueItemsChange = overdueItems - overdueItemsLastMonth;

  // Documents
  const documents = await prisma.document.count({
    where: {
      firmId: { in: accessibleFirmIds },
    },
  });

  const documentsLastMonth = await prisma.document.count({
    where: {
      firmId: { in: accessibleFirmIds },
      createdAt: { lte: endOfLastMonth },
    },
  });

  const documentsChange = documents - documentsLastMonth;

  // Active Clients (only clients created by organization)
  const activeClients = await prisma.client.count({
    where: {
      createdById: { in: orgUserIds },
      firms: {
        some: {
          id: { in: accessibleFirmIds },
        },
      },
    },
  });

  const activeClientsLastMonth = await prisma.client.count({
    where: {
      createdById: { in: orgUserIds },
      firms: {
        some: {
          id: { in: accessibleFirmIds },
        },
      },
      createdAt: { lte: endOfLastMonth },
    },
  });

  const activeClientsChange = activeClients - activeClientsLastMonth;

  // Firms Managed
  const firmsManaged = accessibleFirmIds.length;

  const firmsManagedLastMonth = userRole === 'CA'
    ? await prisma.firm.count({ where: { createdById: { in: orgUserIds }, createdAt: { lte: endOfLastMonth } } })
    : await prisma.userFirmMapping.count({
        where: {
          userId: userRole === 'MANAGER' ? { in: await getTeamUserIds(userId) } : userId,
          assignedAt: { lte: endOfLastMonth },
        },
      });

  const firmsManagedChange = firmsManaged - firmsManagedLastMonth;

  // Monthly Revenue (CA and Manager only)
  let monthlyRevenue = 0;
  let monthlyRevenueLastMonth = 0;
  let monthlyRevenueChange = 0;

  if (userRole === 'CA' || userRole === 'MANAGER') {
    monthlyRevenue = await prisma.invoice.aggregate({
      where: {
        firmId: { in: accessibleFirmIds },
        status: 'PAID',
        paidDate: { gte: startOfMonth },
      },
      _sum: { totalAmount: true },
    }).then(result => result._sum.totalAmount || 0);

    monthlyRevenueLastMonth = await prisma.invoice.aggregate({
      where: {
        firmId: { in: accessibleFirmIds },
        status: 'PAID',
        paidDate: { gte: startOfLastMonth, lte: endOfLastMonth },
      },
      _sum: { totalAmount: true },
    }).then(result => result._sum.totalAmount || 0);

    monthlyRevenueChange = monthlyRevenueLastMonth > 0
      ? Math.round(((monthlyRevenue - monthlyRevenueLastMonth) / monthlyRevenueLastMonth) * 100)
      : monthlyRevenue > 0 ? 100 : 0;
  }

  // Unpaid Invoices
  const unpaidInvoices = await prisma.invoice.count({
    where: {
      firmId: { in: accessibleFirmIds },
      status: { in: ['UNPAID', 'OVERDUE'] },
    },
  });

  return {
    activeTasks,
    activeTasksChange,
    pendingApprovals,
    overdueItems,
    overdueItemsChange,
    documents,
    documentsChange,
    activeClients,
    activeClientsChange,
    firmsManaged,
    firmsManagedChange,
    monthlyRevenue,
    monthlyRevenueChange,
    unpaidInvoices,
  };
}

async function getTeamUserIds(managerId: number): Promise<number[]> {
  const teamMembers = await prisma.user.findMany({
    where: { reportsToId: managerId },
    select: { id: true },
  });
  return [managerId, ...teamMembers.map(u => u.id)];
}

