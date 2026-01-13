import nodemailer from 'nodemailer';

/**
 * Create SMTP transporter for sending emails
 */
export function createTransporter() {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

/**
 * Send OTP email
 */
export async function sendOTPEmail(email: string, otp: string, type: 'verification' | 'reset' = 'verification') {
  try {
    const transporter = createTransporter();

    const subject = type === 'verification' 
      ? 'Verify Your Email - Virtual Bill' 
      : 'Reset Your Password - Virtual Bill';

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background-color: #7c3aed;
              color: white;
              padding: 20px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .otp-box {
              background-color: #f3f4f6;
              border: 2px dashed #7c3aed;
              padding: 20px;
              text-align: center;
              margin: 20px 0;
              border-radius: 8px;
            }
            .otp-code {
              font-size: 32px;
              font-weight: bold;
              color: #7c3aed;
              letter-spacing: 8px;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Virtual Bill</h1>
            </div>
            <div class="content">
              <h2>${type === 'verification' ? 'Email Verification' : 'Password Reset'}</h2>
              <p>Hello,</p>
              <p>${type === 'verification' 
                ? 'Thank you for signing up! Please use the OTP below to verify your email address:'
                : 'You requested to reset your password. Please use the OTP below to proceed:'}</p>
              
              <div class="otp-box">
                <p style="margin: 0 0 10px 0; color: #666;">Your OTP Code:</p>
                <div class="otp-code">${otp}</div>
              </div>
              
              <p><strong>This OTP will expire in 10 minutes.</strong></p>
              <p>If you didn't request this, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} Virtual Bill. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const mailOptions = {
      from: `"Virtual Bill" <${process.env.SMTP_USER}>`,
      to: email,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('❌ Error sending email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Generate random 6-digit OTP
 */
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}
