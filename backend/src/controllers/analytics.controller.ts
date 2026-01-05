import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';
import { getRootCAId, getCAOrganizationUserIds } from '../utils/caOrganization';

// Get revenue analytics
export async function getRevenueAnalytics(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only CA can view revenue analytics
    if (user.role !== 'CA') {
      return res.status(403).json({ error: 'Only CA can view revenue analytics' });
    }

    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    const orgUserIds = await getCAOrganizationUserIds(caId);

    // Get year from query params (default to current year)
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
    
    // Date range for the selected year
    const startDate = new Date(year, 0, 1); // Jan 1st of selected year
    const endDate = new Date(year, 11, 31, 23, 59, 59); // Dec 31st of selected year

    const invoices = await prisma.invoice.findMany({
      where: {
        createdById: { in: orgUserIds },
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        amount: true,
        totalAmount: true,
        status: true,
        createdAt: true,
        dueDate: true,
      },
    });

    // Calculate monthly revenue
    const monthlyRevenue: Record<string, { total: number; paid: number; pending: number }> = {};
    
    // Initialize all 12 months of the selected year
    for (let i = 0; i < 12; i++) {
      const key = `${year}-${String(i + 1).padStart(2, '0')}`;
      monthlyRevenue[key] = { total: 0, paid: 0, pending: 0 };
    }

    invoices.forEach(invoice => {
      const date = new Date(invoice.createdAt);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyRevenue[key]) {
        // Use totalAmount (includes GST/tax) for revenue reporting
        const amount = Number(invoice.totalAmount || invoice.amount);
        monthlyRevenue[key].total += amount;
        if (invoice.status === 'PAID') {
          monthlyRevenue[key].paid += amount;
        } else {
          monthlyRevenue[key].pending += amount;
        }
      }
    });

    // Calculate totals (use totalAmount which includes GST/tax)
    const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || inv.amount), 0);
    const paidRevenue = invoices
      .filter(inv => inv.status === 'PAID')
      .reduce((sum, inv) => sum + Number(inv.totalAmount || inv.amount), 0);
    const pendingRevenue = totalRevenue - paidRevenue;

    // For current year: show current month stats. For past years: show December stats
    const now = new Date();
    const isCurrentYear = year === now.getFullYear();
    const referenceMonth = isCurrentYear ? now.getMonth() + 1 : 12;
    
    const currentMonth = `${year}-${String(referenceMonth).padStart(2, '0')}`;
    const currentMonthRevenue = monthlyRevenue[currentMonth]?.total || 0;

    // Calculate previous month for comparison
    const prevMonthNum = referenceMonth > 1 ? referenceMonth - 1 : 12;
    const prevMonthYear = referenceMonth > 1 ? year : year - 1;
    const lastMonthDate = new Date(prevMonthYear, prevMonthNum - 1, 1);
    const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;
    const lastMonthRevenue = monthlyRevenue[lastMonth]?.total || 0;

    const monthlyGrowth = lastMonthRevenue > 0 
      ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 
      : 0;

    res.json({
      summary: {
        totalRevenue,
        paidRevenue,
        pendingRevenue,
        currentMonthRevenue,
        monthlyGrowth: Math.round(monthlyGrowth * 10) / 10,
        invoiceCount: invoices.length,
        paidCount: invoices.filter(inv => inv.status === 'PAID').length,
      },
      monthlyData: Object.entries(monthlyRevenue).map(([month, data]) => ({
        month,
        ...data,
      })),
    });
  } catch (error) {
    console.error('Revenue analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get task analytics
export async function getTaskAnalytics(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    const orgUserIds = await getCAOrganizationUserIds(caId);

    // Get year from query params (default to current year)
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
    
    // Date range for the selected year
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    const tasks = await prisma.task.findMany({
      where: {
        createdById: { in: orgUserIds },
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        status: true,
        priority: true,
        createdAt: true,
        dueDate: true,
        assignedTo: {
          select: { id: true, name: true },
        },
      },
    });

    // Task status distribution
    const statusCounts = {
      PENDING: 0,
      IN_PROGRESS: 0,
      AWAITING_APPROVAL: 0,
      COMPLETED: 0,
      ERROR: 0,
      OVERDUE: 0,
    };

    const priorityCounts = {
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      URGENT: 0,
    };

    // Monthly task completion
    const monthlyTasks: Record<string, { created: number; completed: number }> = {};
    
    // Initialize all 12 months of the selected year
    for (let i = 0; i < 12; i++) {
      const key = `${year}-${String(i + 1).padStart(2, '0')}`;
      monthlyTasks[key] = { created: 0, completed: 0 };
    }
    
    const now = new Date();

    // Staff performance
    const staffPerformance: Record<number, { name: string; assigned: number; completed: number }> = {};

    tasks.forEach(task => {
      // Status counts
      if (statusCounts[task.status as keyof typeof statusCounts] !== undefined) {
        statusCounts[task.status as keyof typeof statusCounts]++;
      }

      // Priority counts
      if (priorityCounts[task.priority as keyof typeof priorityCounts] !== undefined) {
        priorityCounts[task.priority as keyof typeof priorityCounts]++;
      }

      // Monthly data
      const createdDate = new Date(task.createdAt);
      const key = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyTasks[key]) {
        monthlyTasks[key].created++;
        if (task.status === 'COMPLETED') {
          monthlyTasks[key].completed++;
        }
      }

      // Staff performance
      if (task.assignedTo) {
        if (!staffPerformance[task.assignedTo.id]) {
          staffPerformance[task.assignedTo.id] = {
            name: task.assignedTo.name,
            assigned: 0,
            completed: 0,
          };
        }
        staffPerformance[task.assignedTo.id].assigned++;
        if (task.status === 'COMPLETED') {
          staffPerformance[task.assignedTo.id].completed++;
        }
      }
    });

    // Calculate overdue tasks
    const overdueTasks = tasks.filter(
      task => 
        task.status !== 'COMPLETED' && 
        task.status !== 'ERROR' && 
        new Date(task.dueDate) < now
    ).length;

    const completionRate = tasks.length > 0 
      ? (statusCounts.COMPLETED / tasks.length) * 100 
      : 0;

    res.json({
      summary: {
        totalTasks: tasks.length,
        completedTasks: statusCounts.COMPLETED,
        pendingTasks: statusCounts.PENDING + statusCounts.IN_PROGRESS + statusCounts.AWAITING_APPROVAL,
        overdueTasks,
        completionRate: Math.round(completionRate * 10) / 10,
      },
      statusDistribution: Object.entries(statusCounts).map(([status, count]) => ({
        status,
        count,
      })),
      priorityDistribution: Object.entries(priorityCounts).map(([priority, count]) => ({
        priority,
        count,
      })),
      monthlyData: Object.entries(monthlyTasks).map(([month, data]) => ({
        month,
        ...data,
      })),
      staffPerformance: Object.values(staffPerformance)
        .sort((a, b) => b.completed - a.completed)
        .slice(0, 10),
    });
  } catch (error) {
    console.error('Task analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get client analytics
export async function getClientAnalytics(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    const orgUserIds = await getCAOrganizationUserIds(caId);

    // Get year from query params (default to current year)
    const year = req.query.year ? parseInt(req.query.year as string) : new Date().getFullYear();
    
    // Date range for the selected year
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31, 23, 59, 59);

    // Get clients with their firms count
    const clients = await prisma.client.findMany({
      where: {
        createdById: { in: orgUserIds },
      },
      include: {
        _count: {
          select: { firms: true },
        },
        firms: {
          include: {
            _count: {
              select: { tasks: true, invoices: true },
            },
          },
        },
      },
    });

    const monthlyClients: Record<string, number> = {};
    
    // Initialize all 12 months of the selected year
    for (let i = 0; i < 12; i++) {
      const key = `${year}-${String(i + 1).padStart(2, '0')}`;
      monthlyClients[key] = 0;
    }

    // Count clients created in the selected year
    clients.forEach(client => {
      const createdDate = new Date(client.createdAt);
      if (createdDate >= startDate && createdDate <= endDate) {
        const key = `${createdDate.getFullYear()}-${String(createdDate.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyClients[key] !== undefined) {
          monthlyClients[key]++;
        }
      }
    });

    // Calculate cumulative growth
    let cumulative = clients.filter(c => new Date(c.createdAt) < startDate).length;
    const cumulativeGrowth = Object.entries(monthlyClients).map(([month, newClients]) => {
      cumulative += newClients;
      return { month, newClients, total: cumulative };
    });

    // Top clients by revenue
    const clientRevenue = await Promise.all(
      clients.slice(0, 20).map(async (client) => {
        const firmIds = client.firms.map(f => f.id);
        const invoices = await prisma.invoice.findMany({
          where: { firmId: { in: firmIds } },
          select: { amount: true, totalAmount: true, status: true },
        });
        // Use totalAmount (includes GST/tax) for revenue reporting
        const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || inv.amount), 0);
        const paidRevenue = invoices
          .filter(inv => inv.status === 'PAID')
          .reduce((sum, inv) => sum + Number(inv.totalAmount || inv.amount), 0);
        return {
          id: client.id,
          name: client.name,
          firms: client._count.firms,
          totalRevenue,
          paidRevenue,
          tasks: client.firms.reduce((sum, f) => sum + f._count.tasks, 0),
        };
      })
    );

    const totalFirms = clients.reduce((sum, c) => sum + c._count.firms, 0);

    res.json({
      summary: {
        totalClients: clients.length,
        totalFirms,
        activeClients: clients.length, // All clients are considered active
        avgFirmsPerClient: clients.length > 0 ? Math.round((totalFirms / clients.length) * 10) / 10 : 0,
      },
      monthlyGrowth: cumulativeGrowth,
      topClients: clientRevenue
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .slice(0, 10),
    });
  } catch (error) {
    console.error('Client analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get overview analytics (dashboard summary)
export async function getOverviewAnalytics(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    const orgUserIds = await getCAOrganizationUserIds(caId);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Current month stats
    const [
      currentMonthTasks,
      lastMonthTasks,
      currentMonthInvoices,
      lastMonthInvoices,
      totalClients,
      totalFirms,
      pendingApprovals,
    ] = await Promise.all([
      prisma.task.count({
        where: {
          createdById: { in: orgUserIds },
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.task.count({
        where: {
          createdById: { in: orgUserIds },
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
      }),
      prisma.invoice.aggregate({
        where: {
          createdById: { in: orgUserIds },
          createdAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.invoice.aggregate({
        where: {
          createdById: { in: orgUserIds },
          createdAt: { gte: startOfLastMonth, lte: endOfLastMonth },
        },
        _sum: { amount: true },
      }),
      prisma.client.count({
        where: { createdById: { in: orgUserIds } },
      }),
      prisma.firm.count({
        where: { createdById: { in: orgUserIds } },
      }),
      prisma.approval.count({
        where: {
          status: 'PENDING',
          task: { createdById: { in: orgUserIds } },
        },
      }),
    ]);

    const currentRevenue = Number(currentMonthInvoices._sum.amount || 0);
    const lastRevenue = Number(lastMonthInvoices._sum.amount || 0);
    const revenueGrowth = lastRevenue > 0 ? ((currentRevenue - lastRevenue) / lastRevenue) * 100 : 0;
    const taskGrowth = lastMonthTasks > 0 ? ((currentMonthTasks - lastMonthTasks) / lastMonthTasks) * 100 : 0;

    res.json({
      currentMonth: {
        tasks: currentMonthTasks,
        revenue: currentRevenue,
        invoices: currentMonthInvoices._count,
      },
      growth: {
        revenue: Math.round(revenueGrowth * 10) / 10,
        tasks: Math.round(taskGrowth * 10) / 10,
      },
      totals: {
        clients: totalClients,
        firms: totalFirms,
        pendingApprovals,
      },
    });
  } catch (error) {
    console.error('Overview analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

