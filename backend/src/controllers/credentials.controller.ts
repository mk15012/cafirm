import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';
import { getRootCAId, getCAOrganizationUserIds } from '../utils/caOrganization';
import { checkSubscriptionLimit } from '../utils/subscriptionLimits';
import crypto from 'crypto';

// Encryption key for storing portal credentials
// IMPORTANT: Set ENCRYPTION_KEY in environment variables (must be 32 characters)
const getEncryptionKey = (): string => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    console.warn('⚠️ WARNING: ENCRYPTION_KEY not set. Using default key. Set a secure 32-character key in production!');
    return 'ca-firm-default-key-32chars!!!'; // Fallback for development only
  }
  if (key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters long');
  }
  return key;
};

const ENCRYPTION_KEY = getEncryptionKey();
const IV_LENGTH = 16;

function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  try {
    const parts = text.split(':');
    const iv = Buffer.from(parts.shift()!, 'hex');
    const encryptedText = parts.join(':');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32).slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    return '***decryption-failed***';
  }
}

export async function getCredentials(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // All team members (CA, Manager, Staff) can view credentials
    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    const orgUserIds = await getCAOrganizationUserIds(caId);

    const { clientId, firmId } = req.query;

    const whereClause: any = {
      createdById: { in: orgUserIds },
    };

    if (clientId) {
      whereClause.clientId = parseInt(clientId as string, 10);
    }
    if (firmId) {
      whereClause.firmId = parseInt(firmId as string, 10);
    }

    const credentials = await prisma.clientCredential.findMany({
      where: whereClause,
      include: {
        client: {
          select: { id: true, name: true },
        },
        firm: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
      orderBy: [{ clientId: 'asc' }, { portalName: 'asc' }],
    });

    // Decrypt passwords for response
    const decryptedCredentials = credentials.map(cred => ({
      ...cred,
      password: decrypt(cred.password),
    }));

    res.json(decryptedCredentials);
  } catch (error) {
    console.error('Get credentials error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getCredential(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // All team members (CA, Manager, Staff) can view credentials
    const { id } = req.params;
    const credentialId = parseInt(id, 10);

    if (isNaN(credentialId)) {
      return res.status(400).json({ error: 'Invalid credential ID' });
    }

    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    const orgUserIds = await getCAOrganizationUserIds(caId);

    const credential = await prisma.clientCredential.findUnique({
      where: { id: credentialId },
      include: {
        client: {
          select: { id: true, name: true },
        },
        firm: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, name: true },
        },
      },
    });

    if (!credential) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    if (!orgUserIds.includes(credential.createdById)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({
      ...credential,
      password: decrypt(credential.password),
    });
  } catch (error) {
    console.error('Get credential error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createCredential(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // CA and INDIVIDUAL users can manage their own credentials
    if (user.role !== 'CA' && user.role !== 'INDIVIDUAL') {
      return res.status(403).json({ error: 'Only CA or Individual users can manage portal credentials' });
    }

    const { clientId, firmId, portalName, portalUrl, username, password, remarks } = req.body;

    // Validate required fields - clientId is optional for INDIVIDUAL users (auto-created)
    if (!portalName || !username || !password) {
      return res.status(400).json({ error: 'Portal name, username, and password are required' });
    }

    let parsedClientId: number;
    const parsedFirmId = firmId ? (typeof firmId === 'string' ? parseInt(firmId, 10) : firmId) : null;

    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Check subscription limit for credentials
    const limitCheck = await checkSubscriptionLimit(caId, 'credentials');
    if (!limitCheck.allowed) {
      return res.status(403).json({ 
        error: limitCheck.message,
        limitReached: true,
        currentUsage: limitCheck.currentUsage,
        limit: limitCheck.limit,
        planName: limitCheck.planName,
      });
    }

    const orgUserIds = await getCAOrganizationUserIds(caId);

    // For INDIVIDUAL users without a clientId, auto-create or find their personal client
    if (!clientId && user.role === 'INDIVIDUAL') {
      // Find existing personal client or create one
      let personalClient = await prisma.client.findFirst({
        where: { createdById: user.userId },
        select: { id: true, email: true, phone: true, contactPerson: true },
      });

      // Get user details to populate client fields
      const userData = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { name: true, email: true, phone: true },
      });

      if (!personalClient) {
        // Create new personal client with user's details
        personalClient = await prisma.client.create({
          data: {
            name: userData?.name || 'Personal',
            contactPerson: userData?.name || null,
            email: userData?.email || null,
            phone: userData?.phone || null,
            notes: 'Auto-created for personal credential management',
            createdById: user.userId,
          },
          select: { id: true, email: true, phone: true, contactPerson: true },
        });
      } else if (!personalClient.email || !personalClient.phone || !personalClient.contactPerson) {
        // Update existing client if fields are missing
        await prisma.client.update({
          where: { id: personalClient.id },
          data: {
            contactPerson: personalClient.contactPerson || userData?.name || null,
            email: personalClient.email || userData?.email || null,
            phone: personalClient.phone || userData?.phone || null,
          },
        });
      }

      parsedClientId = personalClient.id;
    } else if (!clientId) {
      return res.status(400).json({ error: 'Client is required' });
    } else {
      parsedClientId = typeof clientId === 'string' ? parseInt(clientId, 10) : clientId;

      // Verify client belongs to organization
      const client = await prisma.client.findUnique({
        where: { id: parsedClientId },
        select: { createdById: true },
      });

      if (!client || !orgUserIds.includes(client.createdById)) {
        return res.status(403).json({ error: 'Client does not belong to your organization' });
      }
    }

    // If firmId provided, verify it belongs to the client
    if (parsedFirmId) {
      const firm = await prisma.firm.findUnique({
        where: { id: parsedFirmId },
        select: { clientId: true },
      });

      if (!firm || firm.clientId !== parsedClientId) {
        return res.status(400).json({ error: 'Firm does not belong to the selected client' });
      }
    }

    const credential = await prisma.clientCredential.create({
      data: {
        clientId: parsedClientId,
        firmId: parsedFirmId,
        portalName,
        portalUrl: portalUrl || null,
        username,
        password: encrypt(password),
        remarks: remarks || null,
        createdById: user.userId,
      },
      include: {
        client: { select: { id: true, name: true } },
        firm: { select: { id: true, name: true } },
      },
    });

    res.status(201).json({
      ...credential,
      password: '********', // Don't return password on create
    });
  } catch (error) {
    console.error('Create credential error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateCredential(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // CA and INDIVIDUAL users can manage their own credentials
    if (user.role !== 'CA' && user.role !== 'INDIVIDUAL') {
      return res.status(403).json({ error: 'Only CA or Individual users can manage portal credentials' });
    }

    const { id } = req.params;
    const credentialId = parseInt(id, 10);

    if (isNaN(credentialId)) {
      return res.status(400).json({ error: 'Invalid credential ID' });
    }

    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    const orgUserIds = await getCAOrganizationUserIds(caId);

    const existingCredential = await prisma.clientCredential.findUnique({
      where: { id: credentialId },
    });

    if (!existingCredential) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    if (!orgUserIds.includes(existingCredential.createdById)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { portalName, portalUrl, username, password, remarks } = req.body;

    const updateData: any = {
      lastUpdated: new Date(),
    };

    if (portalName) updateData.portalName = portalName;
    if (portalUrl !== undefined) updateData.portalUrl = portalUrl || null;
    if (username) updateData.username = username;
    if (password) updateData.password = encrypt(password);
    if (remarks !== undefined) updateData.remarks = remarks || null;

    const credential = await prisma.clientCredential.update({
      where: { id: credentialId },
      data: updateData,
      include: {
        client: { select: { id: true, name: true } },
        firm: { select: { id: true, name: true } },
      },
    });

    res.json({
      ...credential,
      password: '********',
    });
  } catch (error) {
    console.error('Update credential error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteCredential(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // CA and INDIVIDUAL users can manage their own credentials
    if (user.role !== 'CA' && user.role !== 'INDIVIDUAL') {
      return res.status(403).json({ error: 'Only CA or Individual users can manage portal credentials' });
    }

    const { id } = req.params;
    const credentialId = parseInt(id, 10);

    if (isNaN(credentialId)) {
      return res.status(400).json({ error: 'Invalid credential ID' });
    }

    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    const orgUserIds = await getCAOrganizationUserIds(caId);

    const credential = await prisma.clientCredential.findUnique({
      where: { id: credentialId },
    });

    if (!credential) {
      return res.status(404).json({ error: 'Credential not found' });
    }

    if (!orgUserIds.includes(credential.createdById)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.clientCredential.delete({
      where: { id: credentialId },
    });

    res.json({ message: 'Credential deleted successfully' });
  } catch (error) {
    console.error('Delete credential error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

