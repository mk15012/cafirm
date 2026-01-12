import nodemailer from 'nodemailer';

// Email configuration from environment variables
const EMAIL_HOST = process.env.EMAIL_HOST || 'smtp.gmail.com';
const EMAIL_PORT = parseInt(process.env.EMAIL_PORT || '587', 10);
const EMAIL_USER = process.env.EMAIL_USER || '';
const EMAIL_PASS = process.env.EMAIL_PASS || '';
const EMAIL_FROM = process.env.EMAIL_FROM || EMAIL_USER;
const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'CA Firm Pro';

// Check if email is configured
export const isEmailConfigured = (): boolean => {
  return !!(EMAIL_USER && EMAIL_PASS);
};

// Create transporter
const createTransporter = () => {
  if (!isEmailConfigured()) {
    console.warn('⚠️ Email not configured. Set EMAIL_USER and EMAIL_PASS in environment variables.');
    return null;
  }

  return nodemailer.createTransport({
    host: EMAIL_HOST,
    port: EMAIL_PORT,
    secure: EMAIL_PORT === 465, // true for 465, false for other ports
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
};

// Send email function
export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> => {
  const transporter = createTransporter();

  if (!transporter) {
    console.log(`📧 [DEV] Would send email to: ${to}`);
    console.log(`📧 [DEV] Subject: ${subject}`);
    return false;
  }

  try {
    const info = await transporter.sendMail({
      from: `"${EMAIL_FROM_NAME}" <${EMAIL_FROM}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      html,
    });

    console.log(`✅ Email sent to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return false;
  }
};

// Password Reset Email Template
export const sendPasswordResetEmail = async (
  email: string,
  resetCode: string,
  userName?: string
): Promise<boolean> => {
  const subject = 'Reset Your Password - CA Firm Pro';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Reset</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 500px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 20px; text-align: center;">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 16px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                <span style="font-size: 28px;">🏢</span>
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #1e293b;">CA Firm Pro</h1>
              <p style="margin: 4px 0 0; font-size: 14px; color: #f59e0b; font-weight: 600;">Management System</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 20px 40px;">
              <h2 style="margin: 0 0 16px; font-size: 20px; font-weight: 600; color: #1e293b; text-align: center;">Password Reset Request</h2>
              <p style="margin: 0 0 24px; font-size: 15px; color: #64748b; line-height: 1.6; text-align: center;">
                ${userName ? `Hi ${userName},` : 'Hi,'}<br><br>
                We received a request to reset your password. Use the code below to reset it. This code is valid for <strong>15 minutes</strong>.
              </p>
              
              <!-- Reset Code Box -->
              <div style="background-color: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 1px;">Your Reset Code</p>
                <p style="margin: 0; font-size: 36px; font-weight: 700; color: #0ea5e9; letter-spacing: 8px; font-family: 'Courier New', monospace;">${resetCode}</p>
              </div>
              
              <p style="margin: 0; font-size: 14px; color: #94a3b8; text-align: center; line-height: 1.6;">
                If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 40px 40px; text-align: center; border-top: 1px solid #f1f5f9;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                © ${new Date().getFullYear()} CA Firm Pro. All rights reserved.<br>
                This is an automated email, please do not reply.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
CA Firm Pro - Password Reset

${userName ? `Hi ${userName},` : 'Hi,'}

We received a request to reset your password.

Your Reset Code: ${resetCode}

This code is valid for 15 minutes.

If you didn't request this password reset, you can safely ignore this email.

© ${new Date().getFullYear()} CA Firm Pro
  `;

  return sendEmail(email, subject, html, text);
};

// Welcome Email Template (optional - for future use)
export const sendWelcomeEmail = async (
  email: string,
  userName: string
): Promise<boolean> => {
  const subject = 'Welcome to CA Firm Pro!';
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 500px; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px; text-align: center;">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 16px; margin: 0 auto 16px;">
                <span style="font-size: 28px; line-height: 60px;">🏢</span>
              </div>
              <h1 style="margin: 0; font-size: 24px; font-weight: 700; color: #1e293b;">Welcome to CA Firm Pro!</h1>
              <p style="margin: 16px 0 0; font-size: 15px; color: #64748b; line-height: 1.6;">
                Hi ${userName},<br><br>
                Your account has been created successfully. You can now login and start managing your practice efficiently.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  return sendEmail(email, subject, html);
};

