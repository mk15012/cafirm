import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { logActivity } from '../middleware/activityLog';
import { getRootCAId, getCAOrganizationUserIds } from '../utils/caOrganization';

// Generate Google Calendar URL
function generateGoogleCalendarLink(
  title: string,
  date: Date,
  time: string,
  description?: string,
  location?: string
): string {
  const [hours, minutes] = time.split(':');
  const startDate = new Date(date);
  startDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  // End time is 1 hour after start (default meeting duration)
  const endDate = new Date(startDate);
  endDate.setHours(endDate.getHours() + 1);

  // Format dates as YYYYMMDDTHHMMSSZ
  const formatDate = (d: Date) => {
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
    details: description || '',
    location: location || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export const createMeeting = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { title, description, clientId, firmId, date, time, location, notes } = req.body;

    if (!title || !date || !time) {
      return res.status(400).json({ error: 'Title, date, and time are required' });
    }

    // Get the root CA ID for this user's organization
    const caId = await getRootCAId(userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Get all user IDs in this CA's organization
    const orgUserIds = await getCAOrganizationUserIds(caId);

    // Verify client belongs to organization if provided
    if (clientId) {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { createdById: true },
      });
      if (!client || !orgUserIds.includes(client.createdById)) {
        return res.status(403).json({ error: 'Access denied: Client does not belong to your organization' });
      }
    }

    // Verify firm belongs to organization if provided
    if (firmId) {
      const firm = await prisma.firm.findUnique({
        where: { id: firmId },
        select: { createdById: true },
      });
      if (!firm || !orgUserIds.includes(firm.createdById)) {
        return res.status(403).json({ error: 'Access denied: Firm does not belong to your organization' });
      }
    }

    // Combine date and time into a single DateTime
    const [hours, minutes] = time.split(':');
    const meetingDate = new Date(date);
    meetingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // Generate Google Calendar link
    const googleCalendarLink = generateGoogleCalendarLink(
      title,
      meetingDate,
      time,
      description || notes,
      location
    );

    const meeting = await prisma.meeting.create({
      data: {
        title,
        description: description || notes,
        clientId: clientId || null,
        firmId: firmId || null,
        meetingDate,
        meetingTime: time,
        location: location || null,
        notes: notes || null,
        googleCalendarLink,
        createdById: userId,
      },
      include: {
        client: true,
        firm: {
          include: {
            client: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log activity
    await logActivity(
      userId,
      'CREATE',
      'Meeting',
      meeting.id,
      `Created meeting: ${title}`,
      req.ip
    );

    res.status(201).json(meeting);
  } catch (error: any) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ error: error.message || 'Failed to create meeting' });
  }
};

export const getMeetings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    // Get the root CA ID for this user's organization
    const caId = await getRootCAId(userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Get all user IDs in this CA's organization
    const orgUserIds = await getCAOrganizationUserIds(caId);

    const { clientId, firmId, startDate, endDate } = req.query;

    const where: any = {
      createdById: { in: orgUserIds }, // Only meetings created by organization members
    };

    // Filter by client or firm if provided
    if (clientId) where.clientId = clientId as string;
    if (firmId) where.firmId = firmId as string;

    // Filter by date range if provided
    if (startDate || endDate) {
      where.meetingDate = {};
      if (startDate) where.meetingDate.gte = new Date(startDate as string);
      if (endDate) where.meetingDate.lte = new Date(endDate as string);
    }

    // Staff can only see meetings they created (already filtered by orgUserIds above)
    // Additional check: Staff should only see their own meetings
    if (user?.role === 'STAFF') {
      where.createdById = userId;
    }

    const meetings = await prisma.meeting.findMany({
      where,
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        firm: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        meetingDate: 'asc',
      },
    });

    res.json(meetings);
  } catch (error: any) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch meetings' });
  }
};

export const getMeeting = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Get the root CA ID for this user's organization
    const caId = await getRootCAId(userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Get all user IDs in this CA's organization
    const orgUserIds = await getCAOrganizationUserIds(caId);

    const meeting = await prisma.meeting.findUnique({
      where: { id },
      include: {
        client: true,
        firm: {
          include: {
            client: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Verify meeting belongs to this CA's organization
    if (!orgUserIds.includes(meeting.createdById)) {
      return res.status(403).json({ error: 'Access denied: Meeting does not belong to your organization' });
    }

    res.json(meeting);
  } catch (error: any) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch meeting' });
  }
};

export const updateMeeting = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { title, description, clientId, firmId, date, time, location, notes } = req.body;

    // Get the root CA ID for this user's organization
    const caId = await getRootCAId(userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Get all user IDs in this CA's organization
    const orgUserIds = await getCAOrganizationUserIds(caId);

    const existingMeeting = await prisma.meeting.findUnique({
      where: { id },
    });

    if (!existingMeeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Verify meeting belongs to this CA's organization
    if (!orgUserIds.includes(existingMeeting.createdById)) {
      return res.status(403).json({ error: 'Access denied: Meeting does not belong to your organization' });
    }

    // Only creator or CA can update
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (existingMeeting.createdById !== userId && user?.role !== 'CA') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Verify client/firm belong to organization if being updated
    if (clientId) {
      const client = await prisma.client.findUnique({
        where: { id: clientId },
        select: { createdById: true },
      });
      if (!client || !orgUserIds.includes(client.createdById)) {
        return res.status(403).json({ error: 'Access denied: Client does not belong to your organization' });
      }
    }

    if (firmId) {
      const firm = await prisma.firm.findUnique({
        where: { id: firmId },
        select: { createdById: true },
      });
      if (!firm || !orgUserIds.includes(firm.createdById)) {
        return res.status(403).json({ error: 'Access denied: Firm does not belong to your organization' });
      }
    }

    let meetingDate = existingMeeting.meetingDate;
    let meetingTime = existingMeeting.meetingTime;
    let googleCalendarLink = existingMeeting.googleCalendarLink;

    if (date || time) {
      if (date && time) {
        const [hours, minutes] = time.split(':');
        meetingDate = new Date(date);
        meetingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        meetingTime = time;
      } else if (date) {
        const [hours, minutes] = meetingTime.split(':');
        meetingDate = new Date(date);
        meetingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
      } else if (time) {
        const [hours, minutes] = time.split(':');
        meetingDate = new Date(existingMeeting.meetingDate);
        meetingDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        meetingTime = time;
      }

      // Regenerate Google Calendar link
      googleCalendarLink = generateGoogleCalendarLink(
        title || existingMeeting.title,
        meetingDate,
        meetingTime,
        description || notes || existingMeeting.description,
        location || existingMeeting.location || undefined
      );
    }

    const meeting = await prisma.meeting.update({
      where: { id },
      data: {
        title: title || existingMeeting.title,
        description: description !== undefined ? description : existingMeeting.description,
        clientId: clientId !== undefined ? clientId : existingMeeting.clientId,
        firmId: firmId !== undefined ? firmId : existingMeeting.firmId,
        meetingDate,
        meetingTime,
        location: location !== undefined ? location : existingMeeting.location,
        notes: notes !== undefined ? notes : existingMeeting.notes,
        googleCalendarLink,
      },
      include: {
        client: true,
        firm: {
          include: {
            client: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log activity
    await logActivity(
      userId,
      'UPDATE',
      'Meeting',
      meeting.id,
      `Updated meeting: ${meeting.title}`,
      req.ip
    );

    res.json(meeting);
  } catch (error: any) {
    console.error('Error updating meeting:', error);
    res.status(500).json({ error: error.message || 'Failed to update meeting' });
  }
};

export const deleteMeeting = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    // Get the root CA ID for this user's organization
    const caId = await getRootCAId(userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Get all user IDs in this CA's organization
    const orgUserIds = await getCAOrganizationUserIds(caId);

    const meeting = await prisma.meeting.findUnique({
      where: { id },
    });

    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }

    // Verify meeting belongs to this CA's organization
    if (!orgUserIds.includes(meeting.createdById)) {
      return res.status(403).json({ error: 'Access denied: Meeting does not belong to your organization' });
    }

    // Only creator or CA can delete
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (meeting.createdById !== userId && user?.role !== 'CA') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.meeting.delete({
      where: { id },
    });

    // Log activity
    await logActivity(
      userId,
      'DELETE',
      'Meeting',
      id,
      `Deleted meeting: ${meeting.title}`,
      req.ip
    );

    res.json({ message: 'Meeting deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting meeting:', error);
    res.status(500).json({ error: error.message || 'Failed to delete meeting' });
  }
};


