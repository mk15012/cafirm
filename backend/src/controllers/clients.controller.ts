import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';
import { getRootCAId, getCAOrganizationUserIds } from '../utils/caOrganization';
import { checkSubscriptionLimit } from '../utils/subscriptionLimits';
import { getComplianceCalendarForMonth } from '../utils/complianceRules';

export async function getClients(req: Request, res: Response) {
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

    // Get accessible firm IDs based on role
    let accessibleFirmIds: number[] = [];
    
    if (user.role === 'CA' || user.role === 'MANAGER') {
      // CA and Manager see all firms in their organization
      const orgFirms = await prisma.firm.findMany({
        where: { createdById: { in: orgUserIds } },
        select: { id: true },
      });
      accessibleFirmIds = orgFirms.map(f => f.id);
    } else {
      // Staff only see firms they're assigned to OR firms of tasks assigned to them
      const mappings = await prisma.userFirmMapping.findMany({
        where: { userId: user.userId },
        select: { firmId: true },
      });
      const assignedTasks = await prisma.task.findMany({
        where: { assignedToId: user.userId },
        select: { firmId: true },
      });
      const firmIdsFromMappings = mappings.map(m => m.firmId);
      const firmIdsFromTasks = assignedTasks.map(t => t.firmId);
      accessibleFirmIds = [...new Set([...firmIdsFromMappings, ...firmIdsFromTasks])];
    }

    // For CA/Manager: show all clients in their organization
    // For Staff: show only clients that have firms they can access
    const whereClause = (user.role === 'CA' || user.role === 'MANAGER')
      ? { createdById: { in: orgUserIds } }
      : {
          createdById: { in: orgUserIds },
          firms: {
            some: {
              id: { in: accessibleFirmIds },
            },
          },
        };

    const clients = await prisma.client.findMany({
      where: whereClause,
      include: {
        firms: {
          where: user.role === 'CA' ? {} : { id: { in: accessibleFirmIds } },
          include: {
            _count: {
              select: {
                tasks: {
                  where: {
                    status: { notIn: ['COMPLETED', 'ERROR'] },
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            firms: true,
          },
        },
      },
    });

    res.json(clients);
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getClient(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const clientId = parseInt(id, 10);

    if (isNaN(clientId)) {
      return res.status(400).json({ error: 'Invalid client ID' });
    }
    
    // Get the root CA ID for this user's organization
    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Get all user IDs in this CA's organization
    const orgUserIds = await getCAOrganizationUserIds(caId);

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        firms: {
          include: {
            _count: {
              select: {
                tasks: true,
                documents: true,
                invoices: true,
              },
            },
          },
        },
      },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Verify client belongs to this CA's organization
    if (!orgUserIds.includes(client.createdById)) {
      return res.status(403).json({ error: 'Access denied: Client does not belong to your organization' });
    }

    res.json(client);
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createClient(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, contactPerson, email, phone, address, notes } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    // Get the root CA ID for subscription limit check
    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Check subscription limit for clients
    const limitCheck = await checkSubscriptionLimit(caId, 'clients');
    if (!limitCheck.allowed) {
      return res.status(403).json({ 
        error: limitCheck.message,
        limitReached: true,
        currentUsage: limitCheck.currentUsage,
        limit: limitCheck.limit,
        planName: limitCheck.planName,
      });
    }

    const client = await prisma.client.create({
      data: {
        name,
        contactPerson,
        email,
        phone,
        address,
        notes,
        createdById: user.userId,
      },
    });

    res.status(201).json(client);
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateClient(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const clientId = parseInt(id, 10);

    if (isNaN(clientId)) {
      return res.status(400).json({ error: 'Invalid client ID' });
    }

    const { name, contactPerson, email, phone, address, notes } = req.body;

    // Get the root CA ID for this user's organization
    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Get all user IDs in this CA's organization
    const orgUserIds = await getCAOrganizationUserIds(caId);

    // Verify client belongs to this CA's organization
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { createdById: true },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    if (!orgUserIds.includes(client.createdById)) {
      return res.status(403).json({ error: 'Access denied: Client does not belong to your organization' });
    }

    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        name,
        contactPerson,
        email,
        phone,
        address,
        notes,
      },
    });

    res.json(updatedClient);
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteClient(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const clientId = parseInt(id, 10);

    if (isNaN(clientId)) {
      return res.status(400).json({ error: 'Invalid client ID' });
    }

    // Get the root CA ID for this user's organization
    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Get all user IDs in this CA's organization
    const orgUserIds = await getCAOrganizationUserIds(caId);

    // Verify client belongs to this CA's organization
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { createdById: true },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    if (!orgUserIds.includes(client.createdById)) {
      return res.status(403).json({ error: 'Access denied: Client does not belong to your organization' });
    }

    await prisma.client.delete({
      where: { id: clientId },
    });

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
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

// Get compliance deadlines for a specific client
export async function getClientDeadlines(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const clientId = parseInt(id, 10);

    if (isNaN(clientId)) {
      return res.status(400).json({ error: 'Invalid client ID' });
    }

    // Get the root CA ID for this user's organization
    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Get all user IDs in this CA's organization
    const orgUserIds = await getCAOrganizationUserIds(caId);

    // Verify client belongs to this CA's organization
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, name: true, createdById: true },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    if (!orgUserIds.includes(client.createdById)) {
      return res.status(403).json({ error: 'Access denied: Client does not belong to your organization' });
    }

    // Get all firms for this client with compliance settings
    const firms = await prisma.firm.findMany({
      where: { clientId: clientId },
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

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Get deadlines for next 3 months
    const allDeadlines: any[] = [];
    
    for (let i = 0; i < 3; i++) {
      const month = ((currentMonth - 1 + i) % 12) + 1;
      const year = currentYear + Math.floor((currentMonth - 1 + i) / 12);
      
      const monthItems = getComplianceCalendarForMonth(firms, year, month);
      allDeadlines.push(...monthItems);
    }

    // Filter to only future deadlines and sort
    const futureDeadlines = allDeadlines
      .filter(item => item.dueDate >= now)
      .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    // Transform to a cleaner format
    const deadlines = futureDeadlines.map(item => ({
      id: `${item.firmId}-${item.type}-${item.dueDate.toISOString()}`,
      title: item.description,
      type: item.type,
      firmId: item.firmId,
      firmName: item.firmName,
      dueDate: item.dueDate,
      daysUntilDue: Math.ceil((item.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
      priority: item.dueDate <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'HIGH' : 
                item.dueDate <= new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) ? 'MEDIUM' : 'LOW',
    }));

    res.json({
      clientId,
      clientName: client.name,
      deadlines,
      totalDeadlines: deadlines.length,
    });
  } catch (error) {
    console.error('Get client deadlines error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

