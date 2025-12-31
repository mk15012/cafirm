import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';
import { getRootCAId, getCAOrganizationUserIds } from '../utils/caOrganization';

export async function getFirms(req: Request, res: Response) {
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
    
    if (user.role === 'CA' || user.role === 'MANAGER') {
      // CA and Manager see all firms in their organization
      const orgFirms = await prisma.firm.findMany({
        where: { createdById: { in: orgUserIds } },
        select: { id: true },
      });
      accessibleFirmIds = orgFirms.map(f => f.id);
    } else {
      // Staff see firms they're assigned to OR firms of tasks assigned to them
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

    // Filter firms to only those created by the CA's organization
    const firms = await prisma.firm.findMany({
      where: {
        id: { in: accessibleFirmIds },
        createdById: { in: orgUserIds }, // Additional security: ensure firm belongs to organization
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
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const firmId = parseInt(id, 10);

    if (isNaN(firmId)) {
      return res.status(400).json({ error: 'Invalid firm ID' });
    }

    // Get the root CA ID for this user's organization
    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Get all user IDs in this CA's organization
    const orgUserIds = await getCAOrganizationUserIds(caId);

    const firm = await prisma.firm.findUnique({
      where: { id: firmId },
      include: {
        client: true,
        tasks: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        documents: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            tasks: true,
            documents: true,
            invoices: true,
          },
        },
      },
    });

    if (!firm) {
      return res.status(404).json({ error: 'Firm not found' });
    }

    // Verify firm belongs to this CA's organization
    if (!orgUserIds.includes(firm.createdById)) {
      return res.status(403).json({ error: 'Access denied: Firm does not belong to your organization' });
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

    // Parse clientId to integer
    const parsedClientId = parseInt(clientId, 10);
    if (isNaN(parsedClientId)) {
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
      where: { id: parsedClientId },
      select: { createdById: true },
    });

    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    if (!orgUserIds.includes(client.createdById)) {
      return res.status(403).json({ error: 'Access denied: Client does not belong to your organization' });
    }

    const firm = await prisma.firm.create({
      data: {
        clientId: parsedClientId,
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
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const firmId = parseInt(id, 10);
    
    if (isNaN(firmId)) {
      return res.status(400).json({ error: 'Invalid firm ID' });
    }

    const { name, panNumber, gstNumber, registrationNumber, address, status } = req.body;

    // Get the root CA ID for this user's organization
    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Get all user IDs in this CA's organization
    const orgUserIds = await getCAOrganizationUserIds(caId);

    // Verify firm belongs to this CA's organization
    const existingFirm = await prisma.firm.findUnique({
      where: { id: firmId },
      select: { createdById: true },
    });

    if (!existingFirm) {
      return res.status(404).json({ error: 'Firm not found' });
    }

    if (!orgUserIds.includes(existingFirm.createdById)) {
      return res.status(403).json({ error: 'Access denied: Firm does not belong to your organization' });
    }

    const firm = await prisma.firm.update({
      where: { id: firmId },
      data: {
        name,
        panNumber,
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
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'PAN or GST number already exists' });
    }
    console.error('Update firm error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteFirm(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const firmId = parseInt(id, 10);
    
    if (isNaN(firmId)) {
      return res.status(400).json({ error: 'Invalid firm ID' });
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
      where: { id: firmId },
      select: { createdById: true },
    });

    if (!firm) {
      return res.status(404).json({ error: 'Firm not found' });
    }

    if (!orgUserIds.includes(firm.createdById)) {
      return res.status(403).json({ error: 'Access denied: Firm does not belong to your organization' });
    }

    await prisma.firm.delete({
      where: { id: firmId },
    });

    res.json({ message: 'Firm deleted successfully' });
  } catch (error) {
    console.error('Delete firm error:', error);
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

