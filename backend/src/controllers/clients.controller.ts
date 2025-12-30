import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';
import { getRootCAId, getCAOrganizationUserIds } from '../utils/caOrganization';

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
    let accessibleFirmIds: string[] = [];
    
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

    const clients = await prisma.client.findMany({
      where: {
        createdById: { in: orgUserIds }, // Only clients created by this CA's organization
        firms: {
          some: {
            id: { in: accessibleFirmIds },
          },
        },
      },
      include: {
        firms: {
          where: {
            id: { in: accessibleFirmIds },
          },
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
            firms: {
              where: {
                id: { in: accessibleFirmIds },
              },
            },
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

