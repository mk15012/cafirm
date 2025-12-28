import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';

export async function getClients(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get accessible firm IDs based on role
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

    const clients = await prisma.client.findMany({
      where: {
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
    const { id } = req.params;
    const client = await prisma.client.findUnique({
      where: { id },
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
    const { id } = req.params;
    const { name, contactPerson, email, phone, address, notes } = req.body;

    const client = await prisma.client.update({
      where: { id },
      data: {
        name,
        contactPerson,
        email,
        phone,
        address,
        notes,
      },
    });

    res.json(client);
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteClient(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.client.delete({
      where: { id },
    });

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
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

