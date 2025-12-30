import { Request, Response } from 'express';
import { prisma } from '../utils/prisma';
import { AuthRequest } from '../types';
import { getRootCAId, getCAOrganizationUserIds } from '../utils/caOrganization';
import { generateInvoicePDF } from '../services/pdf.service';
import { sendInvoiceEmail } from '../services/email.service';
import fs from 'fs';

export async function getInvoices(req: Request, res: Response) {
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
    
    if (user.role === 'CA') {
      // CA sees all firms created by anyone in their organization
      const orgFirms = await prisma.firm.findMany({
        where: { createdById: { in: orgUserIds } },
        select: { id: true },
      });
      accessibleFirmIds = orgFirms.map(f => f.id);
    } else if (user.role === 'MANAGER') {
      const teamUserIds = await getTeamUserIds(user.userId);
      const mappings = await prisma.userFirmMapping.findMany({
        where: { userId: { in: teamUserIds } },
        select: { firmId: true },
      });
      accessibleFirmIds = [...new Set(mappings.map(m => m.firmId))];
    } else {
      // Staff only see firms they're assigned to
      const mappings = await prisma.userFirmMapping.findMany({
        where: { userId: user.userId },
        select: { firmId: true },
      });
      accessibleFirmIds = mappings.map(m => m.firmId);
    }

    // Filter to only firms in the organization
    const orgFirms = await prisma.firm.findMany({
      where: { createdById: { in: orgUserIds } },
      select: { id: true },
    });
    const orgFirmIds = new Set(orgFirms.map(f => f.id));
    accessibleFirmIds = accessibleFirmIds.filter(id => orgFirmIds.has(id));

    const { status, firmId } = req.query;

    const whereClause: any = {
      firmId: { in: accessibleFirmIds },
    };

    if (status) {
      whereClause.status = status as any;
    }

    if (firmId) {
      const parsedFirmId = parseInt(firmId as string, 10);
      if (!isNaN(parsedFirmId)) {
        whereClause.firmId = parsedFirmId;
      }
    }

    const invoices = await prisma.invoice.findMany({
      where: whereClause,
      include: {
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
      orderBy: { createdAt: 'desc' },
    });

    res.json(invoices);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getInvoice(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const invoiceId = parseInt(id, 10);

    if (isNaN(invoiceId)) {
      return res.status(400).json({ error: 'Invalid invoice ID' });
    }

    // Get the root CA ID for this user's organization
    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Get all user IDs in this CA's organization
    const orgUserIds = await getCAOrganizationUserIds(caId);

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        firm: {
          include: {
            client: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Verify invoice's firm belongs to this CA's organization
    const firm = await prisma.firm.findUnique({
      where: { id: invoice.firmId },
      select: { createdById: true },
    });

    if (!firm || !orgUserIds.includes(firm.createdById)) {
      return res.status(403).json({ error: 'Access denied: Invoice does not belong to your organization' });
    }

    res.json(invoice);
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function createInvoice(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { firmId, amount, taxAmount, totalAmount, dueDate } = req.body;

    if (!firmId || !amount || !dueDate) {
      return res.status(400).json({ error: 'Firm ID, amount, and due date are required' });
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

    // Generate invoice number
    const year = new Date().getFullYear();
    const count = await prisma.invoice.count({
      where: {
        invoiceNumber: {
          startsWith: `INV-${year}-`,
        },
      },
    });
    const invoiceNumber = `INV-${year}-${String(count + 1).padStart(4, '0')}`;

    const tax = taxAmount || 0;
    const total = totalAmount || (amount + tax);

    const invoice = await prisma.invoice.create({
      data: {
        firmId,
        invoiceNumber,
        amount,
        taxAmount: tax,
        totalAmount: total,
        dueDate: new Date(dueDate),
        createdById: user.userId,
      },
      include: {
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

    res.status(201).json(invoice);
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateInvoice(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const invoiceId = parseInt(id, 10);

    if (isNaN(invoiceId)) {
      return res.status(400).json({ error: 'Invalid invoice ID' });
    }

    const { amount, taxAmount, totalAmount, dueDate, status } = req.body;

    // Get the root CA ID for this user's organization
    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Get all user IDs in this CA's organization
    const orgUserIds = await getCAOrganizationUserIds(caId);

    // Verify invoice belongs to this CA's organization
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        firm: {
          select: { createdById: true },
        },
      },
    });

    if (!existingInvoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (!orgUserIds.includes(existingInvoice.firm.createdById)) {
      return res.status(403).json({ error: 'Access denied: Invoice does not belong to your organization' });
    }

    const updateData: any = {};
    if (amount !== undefined) updateData.amount = amount;
    if (taxAmount !== undefined) updateData.taxAmount = taxAmount;
    if (totalAmount !== undefined) updateData.totalAmount = totalAmount;
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (status) {
      updateData.status = status;
      if (status === 'PAID') {
        updateData.paidDate = new Date();
      }
    }

    const invoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: {
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

    // Auto-update overdue status
    if (invoice.dueDate < new Date() && invoice.status === 'UNPAID') {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'OVERDUE' },
      });
      invoice.status = 'OVERDUE';
    }

    res.json(invoice);
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function payInvoice(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const invoiceId = parseInt(id, 10);

    if (isNaN(invoiceId)) {
      return res.status(400).json({ error: 'Invalid invoice ID' });
    }

    const { paymentReference } = req.body;

    // Get the root CA ID for this user's organization
    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Get all user IDs in this CA's organization
    const orgUserIds = await getCAOrganizationUserIds(caId);

    // Verify invoice belongs to this CA's organization
    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        firm: {
          select: { createdById: true },
        },
      },
    });

    if (!existingInvoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    if (!orgUserIds.includes(existingInvoice.firm.createdById)) {
      return res.status(403).json({ error: 'Access denied: Invoice does not belong to your organization' });
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'PAID',
        paidDate: new Date(),
        paymentReference,
      },
      include: {
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

    res.json(updatedInvoice);
  } catch (error) {
    console.error('Pay invoice error:', error);
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

export async function sendInvoice(req: Request, res: Response) {
  try {
    const user = (req as AuthRequest).user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const invoiceId = parseInt(id, 10);

    if (isNaN(invoiceId)) {
      return res.status(400).json({ error: 'Invalid invoice ID' });
    }

    // Get the root CA ID for this user's organization
    const caId = await getRootCAId(user.userId);
    if (!caId) {
      return res.status(403).json({ error: 'Unable to determine organization' });
    }

    // Get all user IDs in this CA's organization
    const orgUserIds = await getCAOrganizationUserIds(caId);

    // Get invoice with all necessary data
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
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

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Verify invoice belongs to this CA's organization
    const firm = await prisma.firm.findUnique({
      where: { id: invoice.firmId },
      select: { createdById: true },
    });

    if (!firm || !orgUserIds.includes(firm.createdById)) {
      return res.status(403).json({ error: 'Access denied: Invoice does not belong to your organization' });
    }

    // Check if client has email
    if (!invoice.firm.client.email) {
      return res.status(400).json({ error: 'Client email not found. Please add email to the client profile.' });
    }

    // Check if CA has email
    if (!invoice.createdBy.email) {
      return res.status(400).json({ error: 'Your email is not configured. Please update your profile with an email address.' });
    }

    // Generate PDF
    let pdfPath: string | undefined;
    try {
      pdfPath = await generateInvoicePDF({
        invoiceNumber: invoice.invoiceNumber,
        amount: invoice.amount,
        taxAmount: invoice.taxAmount,
        totalAmount: invoice.totalAmount,
        dueDate: invoice.dueDate,
        createdAt: invoice.createdAt,
        firm: {
          name: invoice.firm.name,
          panNumber: invoice.firm.panNumber,
          gstNumber: invoice.firm.gstNumber || undefined,
          address: invoice.firm.address || undefined,
        },
        client: {
          name: invoice.firm.client.name,
          email: invoice.firm.client.email || undefined,
          phone: invoice.firm.client.phone || undefined,
          address: invoice.firm.client.address || undefined,
          contactPerson: invoice.firm.client.contactPerson || undefined,
        },
        createdBy: {
          name: invoice.createdBy.name,
          email: invoice.createdBy.email,
        },
      });
    } catch (pdfError) {
      console.error('Error generating PDF:', pdfError);
      return res.status(500).json({ error: 'Failed to generate invoice PDF' });
    }

    // Send email
    try {
      await sendInvoiceEmail({
        to: invoice.firm.client.email,
        from: invoice.createdBy.email,
        fromName: invoice.createdBy.name,
        invoiceNumber: invoice.invoiceNumber,
        firmName: invoice.firm.name,
        clientName: invoice.firm.client.name,
        amount: invoice.amount,
        totalAmount: invoice.totalAmount,
        dueDate: invoice.dueDate,
        pdfPath: pdfPath,
      });

      res.json({ 
        message: 'Invoice sent successfully',
        sentTo: invoice.firm.client.email,
      });
    } catch (emailError: any) {
      console.error('Error sending email:', emailError);
      
      // Clean up PDF if email fails
      if (pdfPath && fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }

      return res.status(500).json({ 
        error: 'Failed to send invoice email',
        details: emailError.message,
      });
    }
  } catch (error) {
    console.error('Send invoice error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

