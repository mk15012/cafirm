import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { hashPassword } from '../utils/bcrypt';
import { AuthRequest } from '../types';
import { getRootCAId, getCAOrganizationUserIds } from '../utils/caOrganization';

export async function getUsers(req: Request, res: Response) {
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

    const users = await prisma.user.findMany({
      where: {
        id: { in: orgUserIds }, // Only users in this CA's organization
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        reportsToId: true,
        reportsTo: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getUser(req: Request, res: Response) {
  try {
    const requestingUser = (req as AuthRequest).user;
    if (!requestingUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const userId = parseInt(id, 10);

    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Get the root CA ID for the requesting user's organization
    const caId = await getRootCAId(requestingUser.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Get all user IDs in this CA's organization
    const orgUserIds = await getCAOrganizationUserIds(caId);

    // Verify the requested user belongs to the same organization
    if (!orgUserIds.includes(userId)) {
      return res.status(403).json({ error: 'Access denied: User does not belong to your organization' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        reportsToId: true,
        reportsTo: {
          select: {
            id: true,
            name: true,
          },
        },
        firmAssignments: {
          include: {
            firm: {
              include: {
                client: true,
              },
            },
          },
        },
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createUser(req: Request, res: Response) {
  try {
    const requestingUser = (req as AuthRequest).user;
    if (!requestingUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name, email, password, phone, role, reportsToId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'Name, email, password, and role are required' });
    }

    // Get the root CA ID for the requesting user's organization
    const caId = await getRootCAId(requestingUser.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Get all user IDs in this CA's organization
    const orgUserIds = await getCAOrganizationUserIds(caId);

    // If reportsToId is provided, verify they belong to the same organization
    if (reportsToId && !orgUserIds.includes(reportsToId)) {
      return res.status(403).json({ error: 'Access denied: Cannot assign reports to user outside your organization' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role,
        reportsToId: reportsToId || caId, // Default to CA if no reportsToId provided
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
      },
    });

    res.status(201).json(user);
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateUser(req: Request, res: Response) {
  try {
    const requestingUser = (req as AuthRequest).user;
    if (!requestingUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { name, email, phone, role, reportsToId, status } = req.body;

    // Get the root CA ID for the requesting user's organization
    const caId = await getRootCAId(requestingUser.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Get all user IDs in this CA's organization
    const orgUserIds = await getCAOrganizationUserIds(caId);

    // Verify the user being updated belongs to the same organization
    if (!orgUserIds.includes(id)) {
      return res.status(403).json({ error: 'Access denied: User does not belong to your organization' });
    }

    // If reportsToId is being updated, verify they belong to the same organization
    if (reportsToId !== undefined && reportsToId && !orgUserIds.includes(reportsToId)) {
      return res.status(403).json({ error: 'Access denied: Cannot assign reports to user outside your organization' });
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (role) updateData.role = role;
    if (reportsToId !== undefined) updateData.reportsToId = reportsToId;
    if (status) updateData.status = status;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        status: true,
      },
    });

    res.json(user);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteUser(req: Request, res: Response) {
  try {
    const requestingUser = (req as AuthRequest).user;
    if (!requestingUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Get the root CA ID for the requesting user's organization
    const caId = await getRootCAId(requestingUser.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Get all user IDs in this CA's organization
    const orgUserIds = await getCAOrganizationUserIds(caId);

    // Verify the user being deleted belongs to the same organization
    if (!orgUserIds.includes(id)) {
      return res.status(403).json({ error: 'Access denied: User does not belong to your organization' });
    }

    // Prevent CA from deleting themselves
    if (id === caId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function assignFirm(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { firmId } = req.body;

    if (!firmId) {
      return res.status(400).json({ error: 'Firm ID is required' });
    }

    // Get the root CA ID for this user's organization
    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Get all user IDs in this CA's organization
    const orgUserIds = await getCAOrganizationUserIds(caId);

    // Verify the user being assigned belongs to the same organization
    if (!orgUserIds.includes(id)) {
      return res.status(403).json({ error: 'Access denied: User does not belong to your organization' });
    }

    // Verify the firm belongs to the same organization
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

    const mapping = await prisma.userFirmMapping.create({
      data: {
        userId: id,
        firmId,
        assignedById: user.userId,
      },
      include: {
        firm: {
          include: {
            client: true,
          },
        },
      },
    });

    res.status(201).json(mapping);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'User is already assigned to this firm' });
    }
    console.error('Assign firm error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function unassignFirm(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id, firmId } = req.params;

    // Get the root CA ID for this user's organization
    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Get all user IDs in this CA's organization
    const orgUserIds = await getCAOrganizationUserIds(caId);

    // Verify the user belongs to the same organization
    if (!orgUserIds.includes(id)) {
      return res.status(403).json({ error: 'Access denied: User does not belong to your organization' });
    }

    // Verify the firm belongs to the same organization
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

    await prisma.userFirmMapping.delete({
      where: {
        userId_firmId: {
          userId: id,
          firmId,
        },
      },
    });

    res.json({ message: 'Firm unassigned successfully' });
  } catch (error) {
    console.error('Unassign firm error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

