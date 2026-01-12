import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';

// Middleware version for automatic logging
export async function logActivityMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const originalSend = res.send;

  res.send = function (body: any) {
    // Get user AFTER auth middleware has run (inside res.send, not before)
    const user = (req as AuthRequest).user;
    
    // Log after response is sent (only for non-GET requests with authenticated user)
    if (user && req.method !== 'GET') {
      const actionType = getActionType(req.method);
      const entityType = getEntityType(req.path);
      const entityId = extractEntityId(req.path) || 'unknown';

      // Create activity log asynchronously (don't block response)
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
        .then(() => {
          console.log(`Activity logged: ${actionType} ${entityType} by user ${user.userId}`);
        })
        .catch((error) => {
          console.error('Failed to log activity:', error);
        });
    }

    return originalSend.call(this, body);
  };

  next();
}

// Direct function for manual logging from controllers
export async function logActivity(
  userId: number,
  actionType: string,
  entityType: string,
  entityId: number | string,
  description: string,
  ipAddress?: string
) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        actionType,
        entityType,
        entityId: String(entityId),
        description,
        ipAddress: ipAddress || undefined,
      },
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
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

