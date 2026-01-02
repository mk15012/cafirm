import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';
import { getRootCAId, getCAOrganizationUserIds } from '../utils/caOrganization';

// Get all services for the CA's organization
export async function getServices(req: Request, res: Response) {
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

    const services = await prisma.service.findMany({
      where: {
        createdById: caId,
        isActive: true,
      },
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    res.json(services);
  } catch (error) {
    console.error('Get services error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Get a single service
export async function getService(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const serviceId = parseInt(id, 10);

    if (isNaN(serviceId)) {
      return res.status(400).json({ error: 'Invalid service ID' });
    }

    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    if (service.createdById !== caId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(service);
  } catch (error) {
    console.error('Get service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Create a new service
export async function createService(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.role !== 'CA') {
      return res.status(403).json({ error: 'Only CA can create services' });
    }

    const { name, description, category, frequency, rate } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Service name is required' });
    }

    if (rate === undefined || rate < 0) {
      return res.status(400).json({ error: 'Valid rate is required' });
    }

    const service = await prisma.service.create({
      data: {
        name,
        description,
        category: category || 'OTHER',
        frequency: frequency || 'ONE_TIME',
        rate: Math.round(rate * 100), // Convert to paise
        createdById: user.userId,
      },
    });

    // Return with rate in rupees for frontend
    res.status(201).json({
      ...service,
      rate: service.rate / 100,
    });
  } catch (error) {
    console.error('Create service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Update a service
export async function updateService(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.role !== 'CA') {
      return res.status(403).json({ error: 'Only CA can update services' });
    }

    const { id } = req.params;
    const serviceId = parseInt(id, 10);

    if (isNaN(serviceId)) {
      return res.status(400).json({ error: 'Invalid service ID' });
    }

    const { name, description, category, frequency, rate, isActive } = req.body;

    // Verify service belongs to this CA
    const existingService = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!existingService) {
      return res.status(404).json({ error: 'Service not found' });
    }

    if (existingService.createdById !== user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedService = await prisma.service.update({
      where: { id: serviceId },
      data: {
        name: name !== undefined ? name : existingService.name,
        description: description !== undefined ? description : existingService.description,
        category: category !== undefined ? category : existingService.category,
        frequency: frequency !== undefined ? frequency : existingService.frequency,
        rate: rate !== undefined ? Math.round(rate * 100) : existingService.rate,
        isActive: isActive !== undefined ? isActive : existingService.isActive,
      },
    });

    res.json({
      ...updatedService,
      rate: updatedService.rate / 100,
    });
  } catch (error) {
    console.error('Update service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Delete a service (soft delete - mark as inactive)
export async function deleteService(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.role !== 'CA') {
      return res.status(403).json({ error: 'Only CA can delete services' });
    }

    const { id } = req.params;
    const serviceId = parseInt(id, 10);

    if (isNaN(serviceId)) {
      return res.status(400).json({ error: 'Invalid service ID' });
    }

    // Verify service belongs to this CA
    const existingService = await prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!existingService) {
      return res.status(404).json({ error: 'Service not found' });
    }

    if (existingService.createdById !== user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Soft delete - mark as inactive
    await prisma.service.update({
      where: { id: serviceId },
      data: { isActive: false },
    });

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Delete service error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Seed default services for a new CA
export async function seedDefaultServices(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (user.role !== 'CA') {
      return res.status(403).json({ error: 'Only CA can seed services' });
    }

    // Check if CA already has services
    const existingServices = await prisma.service.count({
      where: { createdById: user.userId },
    });

    if (existingServices > 0) {
      return res.status(400).json({ error: 'Services already exist. Delete existing services first.' });
    }

    const defaultServices = [
      // ITR Services
      { name: 'ITR - Salaried Individual', category: 'ITR', frequency: 'YEARLY', rate: 150000, description: 'Income Tax Return for salaried individuals' },
      { name: 'ITR - Business/Professional', category: 'ITR', frequency: 'YEARLY', rate: 300000, description: 'Income Tax Return for business owners and professionals' },
      { name: 'ITR - Capital Gains', category: 'ITR', frequency: 'YEARLY', rate: 250000, description: 'Income Tax Return with capital gains' },
      { name: 'ITR - NRI', category: 'ITR', frequency: 'YEARLY', rate: 500000, description: 'Income Tax Return for NRIs' },
      
      // GST Services
      { name: 'GST Registration', category: 'GST', frequency: 'ONE_TIME', rate: 200000, description: 'New GST registration' },
      { name: 'GSTR-1 (Monthly)', category: 'GST', frequency: 'MONTHLY', rate: 50000, description: 'Monthly outward supplies return' },
      { name: 'GSTR-3B (Monthly)', category: 'GST', frequency: 'MONTHLY', rate: 50000, description: 'Monthly summary return' },
      { name: 'GSTR-9 (Annual)', category: 'GST', frequency: 'YEARLY', rate: 250000, description: 'Annual GST return' },
      
      // TDS Services
      { name: 'TDS Return (Quarterly)', category: 'TDS', frequency: 'QUARTERLY', rate: 150000, description: 'Quarterly TDS return filing' },
      { name: 'TDS Compliance', category: 'TDS', frequency: 'MONTHLY', rate: 100000, description: 'Monthly TDS compliance and challan' },
      
      // Audit Services
      { name: 'Tax Audit', category: 'AUDIT', frequency: 'YEARLY', rate: 1500000, description: 'Annual tax audit u/s 44AB' },
      { name: 'Statutory Audit', category: 'AUDIT', frequency: 'YEARLY', rate: 2500000, description: 'Company statutory audit' },
      
      // ROC Services
      { name: 'Annual ROC Filing', category: 'ROC', frequency: 'YEARLY', rate: 500000, description: 'Annual company filings with ROC' },
      { name: 'ROC Compliance', category: 'ROC', frequency: 'YEARLY', rate: 300000, description: 'General ROC compliance work' },
      
      // Registration Services
      { name: 'Company Registration', category: 'REGISTRATION', frequency: 'ONE_TIME', rate: 1000000, description: 'Private Limited company incorporation' },
      { name: 'LLP Registration', category: 'REGISTRATION', frequency: 'ONE_TIME', rate: 800000, description: 'LLP incorporation' },
      { name: 'Partnership Deed', category: 'REGISTRATION', frequency: 'ONE_TIME', rate: 300000, description: 'Partnership deed drafting' },
      
      // Consultation
      { name: 'Tax Consultation (Per Hour)', category: 'CONSULTATION', frequency: 'ONE_TIME', rate: 200000, description: 'Tax advisory consultation' },
      { name: 'Business Advisory', category: 'CONSULTATION', frequency: 'ONE_TIME', rate: 300000, description: 'Business advisory services' },
    ];

    const createdServices = await prisma.service.createMany({
      data: defaultServices.map(s => ({
        ...s,
        createdById: user.userId,
      })),
    });

    res.status(201).json({ 
      message: `${createdServices.count} default services created`,
      count: createdServices.count,
    });
  } catch (error) {
    console.error('Seed services error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

