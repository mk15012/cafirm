import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';
import path from 'path';
import fs from 'fs';

export async function getDocuments(req: Request, res: Response) {
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

    const { firmId, taskId, documentType } = req.query;

    const documents = await prisma.document.findMany({
      where: {
        firmId: { in: accessibleFirmIds },
        ...(firmId && { firmId: firmId as string }),
        ...(taskId && { taskId: taskId as string }),
        ...(documentType && { documentType: documentType as any }),
      },
      include: {
        firm: {
          include: {
            client: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(documents);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        firm: {
          include: {
            client: true,
          },
        },
        task: true,
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    console.error('Get document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function uploadDocument(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { firmId, taskId, documentType } = req.body;

    if (!firmId || !documentType) {
      return res.status(400).json({ error: 'Firm ID and document type are required' });
    }

    const document = await prisma.document.create({
      data: {
        firmId,
        taskId: taskId || null,
        documentType: documentType as any,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
        uploadedById: user.userId,
      },
      include: {
        firm: {
          include: {
            client: true,
          },
        },
      },
    });

    res.status(201).json(document);
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function downloadDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const filePath = path.join(process.cwd(), document.filePath);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    res.download(filePath, document.fileName);
  } catch (error) {
    console.error('Download document error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function deleteDocument(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    // Delete file from filesystem
    const filePath = path.join(process.cwd(), document.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await prisma.document.delete({
      where: { id },
    });

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
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

