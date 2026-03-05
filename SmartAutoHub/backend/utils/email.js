/**
 * Email Utility
 * Handles email sending using Nodemailer
 * Supports Gmail, SendGrid, and other SMTP providers
 */

const nodemailer = require('nodemailer');

/**
 * Create email transporter based on configuration
 */
const createTransporter = () => {
  if (process.env.EMAIL_SERVICE === 'sendgrid') {
    // SendGrid configuration
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY
      }
    });
  }
  
  // Gmail or other SMTP configuration
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

/**
 * Generate a 6-digit OTP
 */
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send OTP email for verification
 */
const sendOTPEmail = async (email, otp, firstName) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"SmartAuto Hub" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Email Verification - SmartAuto Hub',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a1a1a; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .otp-box { background: #fff; border: 2px solid #0066ff; padding: 20px; text-align: center; margin: 20px 0; }
            .otp-code { font-size: 32px; font-weight: bold; color: #0066ff; letter-spacing: 5px; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>SmartAuto Hub</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName},</h2>
              <p>Thank you for registering with SmartAuto Hub. Please use the following OTP to verify your email address:</p>
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
              </div>
              <p>This OTP is valid for <strong>10 minutes</strong>.</p>
              <p>If you didn't request this verification, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SmartAuto Hub. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('OTP email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send notification email
 */
const sendNotificationEmail = async (email, subject, message, firstName) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"SmartAuto Hub" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a1a1a; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>SmartAuto Hub</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName},</h2>
              <p>${message}</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SmartAuto Hub. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending notification email:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Send test drive notification to seller
 */
const sendTestDriveNotification = async (sellerEmail, sellerName, buyerName, vehicleName, date, time) => {
  const subject = 'New Test Drive Request - SmartAuto Hub';
  const message = `
    You have received a new test drive request!<br><br>
    <strong>Buyer:</strong> ${buyerName}<br>
    <strong>Vehicle:</strong> ${vehicleName}<br>
    <strong>Date:</strong> ${date}<br>
    <strong>Time:</strong> ${time}<br><br>
    Please log in to your dashboard to approve or reject this request.
  `;
  
  return await sendNotificationEmail(sellerEmail, subject, message, sellerName);
};

/**
 * Send breakdown notification to repairman
 */
const sendBreakdownNotification = async (repairmanEmail, repairmanName, location, description, category) => {
  const subject = 'New Breakdown Request - SmartAuto Hub';
  const message = `
    You have received a new breakdown assistance request!<br><br>
    <strong>Location:</strong> ${location}<br>
    <strong>Category:</strong> ${category}<br>
    <strong>Description:</strong> ${description}<br><br>
    Please log in to accept this job.
  `;
  
  return await sendNotificationEmail(repairmanEmail, subject, message, repairmanName);
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendNotificationEmail,
  sendTestDriveNotification,
  sendBreakdownNotification
};
