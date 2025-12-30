import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

interface InvoiceData {
  invoiceNumber: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  dueDate: Date;
  createdAt: Date;
  firm: {
    name: string;
    panNumber: string;
    gstNumber?: string;
    address?: string;
  };
  client: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    contactPerson?: string;
  };
  createdBy: {
    name: string;
    email: string;
  };
}

export async function generateInvoicePDF(invoice: InvoiceData): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      // Create uploads directory if it doesn't exist
      const uploadsDir = path.join(process.cwd(), 'uploads', 'invoices');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const fileName = `invoice-${invoice.invoiceNumber}-${Date.now()}.pdf`;
      const filePath = path.join(uploadsDir, fileName);

      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('INVOICE', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').text(`Invoice #: ${invoice.invoiceNumber}`, { align: 'center' });
      doc.moveDown(2);

      // From (CA Firm)
      let currentY = 120;
      doc.fontSize(12).font('Helvetica-Bold').text('From:', 50, currentY);
      currentY += 20;
      doc.fontSize(10).font('Helvetica');
      doc.text(invoice.createdBy.name, 50, currentY);
      currentY += 15;
      doc.text(invoice.createdBy.email, 50, currentY);
      currentY += 30;

      // To (Client/Firm)
      doc.fontSize(12).font('Helvetica-Bold').text('Bill To:', 50, currentY);
      currentY += 20;
      doc.fontSize(10).font('Helvetica');
      doc.text(invoice.firm.name, 50, currentY);
      currentY += 15;
      if (invoice.client.contactPerson) {
        doc.text(`Contact: ${invoice.client.contactPerson}`, 50, currentY);
        currentY += 15;
      }
      if (invoice.client.email) {
        doc.text(`Email: ${invoice.client.email}`, 50, currentY);
        currentY += 15;
      }
      if (invoice.client.phone) {
        doc.text(`Phone: ${invoice.client.phone}`, 50, currentY);
        currentY += 15;
      }
      if (invoice.firm.address || invoice.client.address) {
        const address = invoice.firm.address || invoice.client.address || '';
        const addressLines = address.split('\n');
        addressLines.forEach((line: string) => {
          doc.text(line, 50, currentY);
          currentY += 15;
        });
      }
      currentY += 20;

      // Invoice Details (right side)
      const detailsY = 120;
      doc.fontSize(10).font('Helvetica');
      doc.text(`Invoice Date: ${formatDate(invoice.createdAt)}`, 350, detailsY);
      doc.text(`Due Date: ${formatDate(invoice.dueDate)}`, 350, detailsY + 15);

      // Line items table
      const tableTop = currentY + 20;
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text('Description', 50, tableTop);
      doc.text('Amount', 450, tableTop, { align: 'right' });

      // Draw line
      doc.moveTo(50, tableTop + 20).lineTo(550, tableTop + 20).stroke();

      // Service description
      doc.fontSize(10).font('Helvetica');
      doc.text('Professional Services', 50, tableTop + 30);
      doc.text(`₹${invoice.amount.toLocaleString('en-IN')}`, 450, tableTop + 30, { align: 'right' });

      if (invoice.taxAmount > 0) {
        doc.text('Tax (GST)', 50, tableTop + 50);
        doc.text(`₹${invoice.taxAmount.toLocaleString('en-IN')}`, 450, tableTop + 50, { align: 'right' });
      }

      // Total line
      doc.moveTo(50, tableTop + 80).lineTo(550, tableTop + 80).stroke();
      doc.fontSize(12).font('Helvetica-Bold');
      doc.text('Total Amount', 50, tableTop + 90);
      doc.text(`₹${invoice.totalAmount.toLocaleString('en-IN')}`, 450, tableTop + 90, { align: 'right' });

      // Firm details
      doc.moveDown(3);
      doc.fontSize(9).font('Helvetica');
      doc.text(`Firm PAN: ${invoice.firm.panNumber}`, 50);
      if (invoice.firm.gstNumber) {
        doc.text(`Firm GST: ${invoice.firm.gstNumber}`, 50);
      }

      // Footer
      doc.fontSize(8).font('Helvetica');
      const footerY = 750;
      doc.text('Thank you for your business!', 50, footerY, { align: 'center', width: 500 });
      doc.text('Please make payment by the due date mentioned above.', 50, footerY + 15, { align: 'center', width: 500 });

      doc.end();

      stream.on('finish', () => {
        resolve(filePath);
      });

      stream.on('error', (error) => {
        reject(error);
      });
    } catch (error) {
      reject(error);
    }
  });
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

