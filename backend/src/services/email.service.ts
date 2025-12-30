import nodemailer from 'nodemailer';
import fs from 'fs';

interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    password: string;
  };
}

interface SendInvoiceEmailParams {
  to: string;
  from: string;
  fromName: string;
  invoiceNumber: string;
  firmName: string;
  clientName: string;
  amount: number;
  totalAmount: number;
  dueDate: Date;
  pdfPath?: string;
}

let transporter: nodemailer.Transporter | null = null;

export function initializeEmailService() {
  const emailConfig: EmailConfig = {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      password: process.env.SMTP_PASSWORD || '',
    },
  };

  if (!emailConfig.auth.user || !emailConfig.auth.password) {
    console.warn('Email service not configured. SMTP_USER and SMTP_PASSWORD must be set in .env');
    return;
  }

  transporter = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    secure: emailConfig.secure,
    auth: emailConfig.auth,
  });

  console.log('Email service initialized');
}

export async function sendInvoiceEmail(params: SendInvoiceEmailParams): Promise<void> {
  if (!transporter) {
    throw new Error('Email service not initialized. Please configure SMTP settings in .env');
  }

  const { to, from, fromName, invoiceNumber, firmName, clientName, amount, totalAmount, dueDate, pdfPath } = params;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #0284c7; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
        .content { background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }
        .invoice-details { background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .amount-box { background-color: #0284c7; color: white; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #0284c7; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Invoice #${invoiceNumber}</h1>
        </div>
        <div class="content">
          <p>Dear ${clientName},</p>
          <p>Please find attached the invoice for services rendered to <strong>${firmName}</strong>.</p>
          
          <div class="invoice-details">
            <h3>Invoice Details:</h3>
            <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
            <p><strong>Service Amount:</strong> ₹${amount.toLocaleString('en-IN')}</p>
            <p><strong>Total Amount:</strong> ₹${totalAmount.toLocaleString('en-IN')}</p>
            <p><strong>Due Date:</strong> ${formatDate(dueDate)}</p>
          </div>

          <div class="amount-box">
            <h2 style="margin: 0;">Amount Due: ₹${totalAmount.toLocaleString('en-IN')}</h2>
          </div>

          <p>Please make payment by the due date mentioned above. If you have any questions, please contact us.</p>
          
          <p>Thank you for your business!</p>
          
          <p>Best regards,<br>${fromName}</p>
        </div>
        <div class="footer">
          <p>This is an automated email. Please do not reply to this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"${fromName}" <${from}>`,
    to: to,
    subject: `Invoice #${invoiceNumber} - Payment Due: ₹${totalAmount.toLocaleString('en-IN')}`,
    html: htmlContent,
    attachments: pdfPath && fs.existsSync(pdfPath)
      ? [
          {
            filename: `invoice-${invoiceNumber}.pdf`,
            path: pdfPath,
          },
        ]
      : [],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Invoice email sent:', info.messageId);
  } catch (error) {
    console.error('Error sending invoice email:', error);
    throw error;
  }
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

