const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || 
        process.env.EMAIL_USER === 'your_email@gmail.com' || 
        process.env.EMAIL_PASS === 'your_app_password') {
      console.warn('⚠️  Email credentials not configured. Email functionality will be disabled.');
      this.transporter = null;
      return;
    }

    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  async sendPasswordResetEmail(email, resetToken, userName) {
    // Check if email service is configured
    if (!this.transporter) {
      console.log('📧 Email service not configured - simulating password reset email');
      console.log(`Reset token for ${email}: ${resetToken}`);
      console.log(`Reset URL: ${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`);
      return { success: true, messageId: 'simulated', mode: 'development' };
    }

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Password Reset Request - EnamelPure',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset - EnamelPure</title>
          <style>
            body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb, #38bdf8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #2563eb; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .button:hover { background: #1e40af; }
            .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 4px; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
              <p>EnamelPure Invoice Management System</p>
            </div>
            <div class="content">
              <h2>Hello ${userName || 'User'},</h2>
              <p>We received a request to reset your password for your EnamelPure account.</p>
              <p>Click the button below to reset your password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">Reset Password</a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; background: #e5e7eb; padding: 10px; border-radius: 4px;">
                ${resetUrl}
              </p>
              
              <div class="warning">
                <strong>⚠️ Important:</strong>
                <ul>
                  <li>This link will expire in ${process.env.RESET_TOKEN_EXPIRY || 30} minutes</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>For security, never share this link with anyone</li>
                </ul>
              </div>
              
              <p>If you're having trouble clicking the button, you can also visit the reset page directly and enter this token:</p>
              <p style="font-family: monospace; background: #f3f4f6; padding: 10px; border-radius: 4px; font-size: 14px;">
                ${resetToken}
              </p>
            </div>
            <div class="footer">
              <p>This email was sent from EnamelPure Invoice Management System</p>
              <p>If you have any questions, please contact our support team</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Password reset email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw new Error('Failed to send password reset email');
    }
  }

  async sendWelcomeEmail(email, userName) {
    // Check if email service is configured
    if (!this.transporter) {
      console.log('📧 Email service not configured - simulating welcome email');
      console.log(`Welcome email for ${email} (${userName})`);
      return { success: true, messageId: 'simulated', mode: 'development' };
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Welcome to EnamelPure - Account Created Successfully',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to EnamelPure</title>
          <style>
            body { font-family: 'Arial', sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #2563eb, #38bdf8); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; background: #2563eb; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
            .feature { background: white; padding: 20px; margin: 15px 0; border-radius: 8px; border-left: 4px solid #2563eb; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to EnamelPure!</h1>
              <p>Your account has been created successfully</p>
            </div>
            <div class="content">
              <h2>Hello ${userName},</h2>
              <p>Thank you for joining EnamelPure Invoice Management System! Your account is now ready to use.</p>
              
              <div style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/login" class="button">Login to Your Account</a>
              </div>
              
              <h3>What you can do with EnamelPure:</h3>
              
              <div class="feature">
                <h4>📊 Invoice Management</h4>
                <p>Create, manage, and track all your invoices in one place</p>
              </div>
              
              <div class="feature">
                <h4>📄 PDF Generation</h4>
                <p>Generate professional PDF invoices with your branding</p>
              </div>
              
              <div class="feature">
                <h4>📈 Data Analytics</h4>
                <p>View detailed reports and analytics of your business</p>
              </div>
              
              <div class="feature">
                <h4>☁️ Cloud Storage</h4>
                <p>Access your data from anywhere with secure cloud storage</p>
              </div>
              
              <p>If you have any questions or need help getting started, don't hesitate to reach out to our support team.</p>
            </div>
            <div class="footer">
              <p>Welcome to EnamelPure Invoice Management System</p>
              <p>Start managing your invoices like a pro!</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      // Don't throw error for welcome email - it's not critical
      return { success: false, error: error.message };
    }
  }

  async testConnection() {
    if (!this.transporter) {
      console.log('📧 Email service not configured - skipping connection test');
      return false;
    }
    
    try {
      await this.transporter.verify();
      console.log('Email service connection verified');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }
}

module.exports = new EmailService();
