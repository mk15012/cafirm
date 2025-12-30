import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';

export async function logActivity(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const originalSend = res.send;
  const user = (req as AuthRequest).user;

  res.send = function (body: any) {
    // Log after response is sent
    if (user && req.method !== 'GET') {
      const actionType = getActionType(req.method);
      const entityType = getEntityType(req.path);
      const entityId = extractEntityId(req.path) || 'unknown';

      prisma.activityLog
        .create({
          data: {
            userId: user.userId,
            actionType,
            entityType,
            entityId,
            description: `${actionType} ${entityType}`,
            ipAddress: req.ip || req.socket.remoteAddress || undefined,
            metadata: JSON.stringify({ path: req.path, method: req.method }),
          },
        })
        .catch(console.error);
    }

    return originalSend.call(this, body);
  };

  next();
}

function getActionType(method: string): string {
  switch (method) {
    case 'POST':
      return 'CREATE';
    case 'PUT':
    case 'PATCH':
      return 'UPDATE';
    case 'DELETE':
      return 'DELETE';
    default:
      return 'VIEW';
  }
}

function getEntityType(path: string): string {
  const segments = path.split('/').filter(Boolean);
  if (segments.length >= 2) {
    return segments[1].charAt(0).toUpperCase() + segments[1].slice(1).replace(/s$/, '');
  }
  return 'Unknown';
}

function extractEntityId(path: string): string | null {
  const match = path.match(/\/([^/]+)$/);
  return match ? match[1] : null;
}

