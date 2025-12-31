import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';
import { getRootCAId, getCAOrganizationUserIds } from '../utils/caOrganization';
import { 
  suggestCompliances, 
  getComplianceCalendarForMonth,
  ENTITY_TYPES,
  SPECIAL_CATEGORY_STATES,
  COMPLIANCE_TYPES,
} from '../utils/complianceRules';

// Get entity types for dropdown
export async function getEntityTypes(req: Request, res: Response) {
  try {
    res.json(ENTITY_TYPES);
  } catch (error) {
    console.error('Get entity types error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get states list
export async function getStates(req: Request, res: Response) {
  try {
    const states = [
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
      'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
      'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
      'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
      'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
      'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
      'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
    ];
    
    res.json(states.map(name => ({
      name,
      isSpecialCategory: SPECIAL_CATEGORY_STATES.includes(name),
    })));
  } catch (error) {
    console.error('Get states error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Suggest compliances based on firm details
export async function suggestFirmCompliances(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { entityType, natureOfBusiness, state, annualTurnover } = req.body;

    if (!entityType || !natureOfBusiness || !annualTurnover) {
      return res.status(400).json({ error: 'Entity type, nature of business, and annual turnover are required' });
    }

    const suggestions = suggestCompliances({
      entityType,
      natureOfBusiness,
      state: state || 'Maharashtra',
      annualTurnover: parseFloat(annualTurnover),
    });

    res.json(suggestions);
  } catch (error) {
    console.error('Suggest compliances error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Save firm compliance settings
export async function saveFirmCompliances(req: Request, res: Response) {
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

    const {
      entityType,
      natureOfBusiness,
      state,
      annualTurnover,
      financialYear,
      hasGST,
      gstFrequency,
      hasTDS,
      hasITR,
      itrType,
      itrDueDate,
      hasTaxAudit,
      hasAdvanceTax,
      hasROC,
      complianceNotes,
    } = req.body;

    // Verify firm belongs to user's organization
    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    const orgUserIds = await getCAOrganizationUserIds(caId);

    const firm = await prisma.firm.findUnique({
      where: { id: firmId },
      select: { createdById: true },
    });

    if (!firm) {
      return res.status(404).json({ error: 'Firm not found' });
    }

    if (!orgUserIds.includes(firm.createdById)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Update firm with compliance settings
    const updatedFirm = await prisma.firm.update({
      where: { id: firmId },
      data: {
        entityType,
        natureOfBusiness,
        state,
        annualTurnover: annualTurnover ? parseFloat(annualTurnover) : null,
        financialYear,
        hasGST: hasGST || false,
        gstFrequency: hasGST ? gstFrequency : null,
        hasTDS: hasTDS || false,
        hasITR: hasITR !== false, // Default true
        itrType,
        itrDueDate,
        hasTaxAudit: hasTaxAudit || false,
        hasAdvanceTax: hasAdvanceTax || false,
        hasROC: hasROC || false,
        complianceNotes,
      },
      include: {
        client: {
          select: { id: true, name: true },
        },
      },
    });

    res.json(updatedFirm);
  } catch (error) {
    console.error('Save firm compliances error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get compliance calendar for a month
export async function getComplianceCalendar(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { year, month } = req.query;
    const calendarYear = year ? parseInt(year as string, 10) : new Date().getFullYear();
    const calendarMonth = month ? parseInt(month as string, 10) : new Date().getMonth() + 1;

    // Get the root CA ID for this user's organization
    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    const orgUserIds = await getCAOrganizationUserIds(caId);

    // Get all firms in the organization with compliance flags
    const firms = await prisma.firm.findMany({
      where: {
        createdById: { in: orgUserIds },
      },
      select: {
        id: true,
        name: true,
        client: {
          select: { name: true },
        },
        hasGST: true,
        gstFrequency: true,
        hasTDS: true,
        hasITR: true,
        itrDueDate: true,
        hasTaxAudit: true,
        hasAdvanceTax: true,
        hasROC: true,
      },
    });

    const calendarItems = getComplianceCalendarForMonth(firms, calendarYear, calendarMonth);

    // Group by date for easier frontend rendering
    const groupedByDate: Record<string, typeof calendarItems> = {};
    for (const item of calendarItems) {
      const dateKey = item.dueDate.toISOString().split('T')[0];
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = [];
      }
      groupedByDate[dateKey].push(item);
    }

    res.json({
      year: calendarYear,
      month: calendarMonth,
      items: calendarItems,
      groupedByDate,
    });
  } catch (error) {
    console.error('Get compliance calendar error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get upcoming compliance deadlines (next 30 days)
export async function getUpcomingDeadlines(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    const orgUserIds = await getCAOrganizationUserIds(caId);

    const firms = await prisma.firm.findMany({
      where: {
        createdById: { in: orgUserIds },
      },
      select: {
        id: true,
        name: true,
        client: {
          select: { name: true },
        },
        hasGST: true,
        gstFrequency: true,
        hasTDS: true,
        hasITR: true,
        itrDueDate: true,
        hasTaxAudit: true,
        hasAdvanceTax: true,
        hasROC: true,
      },
    });

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextMonthYear = currentMonth === 12 ? currentYear + 1 : currentYear;

    // Get items for current and next month
    const currentMonthItems = getComplianceCalendarForMonth(firms, currentYear, currentMonth);
    const nextMonthItems = getComplianceCalendarForMonth(firms, nextMonthYear, nextMonth);

    const allItems = [...currentMonthItems, ...nextMonthItems];

    // Filter to next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const upcomingItems = allItems.filter(item => 
      item.dueDate >= now && item.dueDate <= thirtyDaysFromNow
    );

    // Add days until due
    const itemsWithDaysLeft = upcomingItems.map(item => ({
      ...item,
      daysUntilDue: Math.ceil((item.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)),
    }));

    res.json(itemsWithDaysLeft);
  } catch (error) {
    console.error('Get upcoming deadlines error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get compliance types
export async function getComplianceTypes(req: Request, res: Response) {
  try {
    res.json(COMPLIANCE_TYPES);
  } catch (error) {
    console.error('Get compliance types error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

