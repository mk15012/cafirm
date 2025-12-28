import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';

export async function getFirms(req: Request, res: Response) {
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

    const firms = await prisma.firm.findMany({
      where: {
        id: { in: accessibleFirmIds },
      },
      include: {
        client: true,
        _count: {
          select: {
            tasks: true,
            documents: true,
            invoices: true,
          },
        },
      },
    });

    res.json(firms);
  } catch (error) {
    console.error('Get firms error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getFirm(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const firm = await prisma.firm.findUnique({
      where: { id },
      include: {
        client: true,
        tasks: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        documents: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!firm) {
      return res.status(404).json({ error: 'Firm not found' });
    }

    res.json(firm);
  } catch (error) {
    console.error('Get firm error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createFirm(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { clientId, name, panNumber, gstNumber, registrationNumber, address } = req.body;

    if (!clientId || !name || !panNumber) {
      return res.status(400).json({ error: 'Client ID, name, and PAN number are required' });
    }

    const firm = await prisma.firm.create({
      data: {
        clientId,
        name,
        panNumber,
        gstNumber,
        registrationNumber,
        address,
        createdById: user.userId,
      },
      include: {
        client: true,
      },
    });

    res.status(201).json(firm);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'PAN or GST number already exists' });
    }
    console.error('Create firm error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateFirm(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { name, gstNumber, registrationNumber, address, status } = req.body;

    const firm = await prisma.firm.update({
      where: { id },
      data: {
        name,
        gstNumber,
        registrationNumber,
        address,
        status,
      },
      include: {
        client: true,
      },
    });

    res.json(firm);
  } catch (error) {
    console.error('Update firm error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteFirm(req: Request, res: Response) {
  try {
    const { id } = req.params;
    await prisma.firm.delete({
      where: { id },
    });

    res.json({ message: 'Firm deleted successfully' });
  } catch (error) {
    console.error('Delete firm error:', error);
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

