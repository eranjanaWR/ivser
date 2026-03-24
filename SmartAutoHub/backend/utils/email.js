/**
 * Email Utility
 * Handles email sending using Nodemailer
 * Supports Gmail, SendGrid, and other SMTP providers
 */

const nodemailer = require('nodemailer');

/**
 * Create email transporter based on configuration
 * 
 * For Gmail:
 *   1. Enable 2-Step Verification on your Google account
 *   2. Go to https://myaccount.google.com/apppasswords
 *   3. Generate an App Password for "Mail"
 *   4. Set EMAIL_USER = your Gmail address
 *   5. Set EMAIL_PASS = the 16-character App Password (no spaces)
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

  // Gmail SMTP configuration using App Password (free, no paid API needed)
  // Works with any Gmail or Google Workspace account
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
      user: process.env.EMAIL_USER, // e.g. yourname@gmail.com
      pass: process.env.EMAIL_PASS  // 16-char Google App Password
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

/**
 * Send generic email with template support
 */
const sendEmail = async (options) => {
  try {
    const { to, subject, template, data } = options;
    const transporter = createTransporter();

    let html = '';

    if (template === 'notification-subscription') {
      const { email, searchCriteria } = data;
      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a1a1a; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .criteria { background: white; border-left: 4px solid #0066ff; padding: 15px; margin: 20px 0; }
            .criteria p { margin: 5px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>SmartAuto Hub</h1>
            </div>
            <div class="content">
              <h2>Subscription Confirmed! 🎉</h2>
              <p>Thank you for subscribing to vehicle notifications. We'll send you an email as soon as a matching vehicle is added to our system.</p>
              
              <div class="criteria">
                <h3 style="margin-top: 0; color: #1a1a1a;">Your Search Criteria:</h3>
                ${searchCriteria.brand ? `<p><strong>Brand:</strong> ${searchCriteria.brand}</p>` : ''}
                ${searchCriteria.vehicleType ? `<p><strong>Vehicle Type:</strong> ${searchCriteria.vehicleType}</p>` : ''}
                ${searchCriteria.fuelType ? `<p><strong>Fuel Type:</strong> ${searchCriteria.fuelType}</p>` : ''}
                ${searchCriteria.transmission ? `<p><strong>Transmission:</strong> ${searchCriteria.transmission}</p>` : ''}
                ${searchCriteria.condition ? `<p><strong>Condition:</strong> ${searchCriteria.condition}</p>` : ''}
                <p><strong>Price Range:</strong> LKR ${searchCriteria.minPrice?.toLocaleString()} - LKR ${searchCriteria.maxPrice?.toLocaleString()}</p>
              </div>
              
              <p>You can manage your notifications anytime from your account dashboard.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SmartAuto Hub. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (template === 'vehicle-notification') {
      const { vehicle } = data;
      const formatPrice = (price) =>
        new Intl.NumberFormat('en-LK', {
          style: 'currency',
          currency: 'LKR',
          maximumFractionDigits: 0,
        }).format(price);

      html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a1a1a; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .vehicle-card { background: white; border-radius: 8px; overflow: hidden; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .vehicle-image { width: 100%; height: 300px; object-fit: cover; }
            .vehicle-details { padding: 20px; }
            .vehicle-title { font-size: 24px; font-weight: bold; color: #1a1a1a; margin: 10px 0; }
            .vehicle-price { font-size: 20px; color: #0066ff; font-weight: bold; margin: 10px 0; }
            .vehicle-specs { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 15px 0; }
            .spec { background: #f0f0f0; padding: 10px; border-radius: 4px; font-size: 14px; }
            .spec-label { font-weight: bold; color: #666; }
            .cta-button { background: #0066ff; color: white; padding: 12px 30px; border-radius: 4px; text-align: center; text-decoration: none; display: inline-block; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚗 New Vehicle Available!</h1>
            </div>
            <div class="content">
              <h2>Great News!</h2>
              <p>A vehicle matching your search criteria has been added to SmartAuto Hub.</p>
              
              <div class="vehicle-card">
                ${vehicle.image ? `<img src="${vehicle.image}" alt="${vehicle.brand} ${vehicle.model}" class="vehicle-image">` : ''}
                <div class="vehicle-details">
                  <div class="vehicle-title">${vehicle.brand} ${vehicle.model}</div>
                  <div class="vehicle-price">${formatPrice(vehicle.price)}</div>
                  
                  <div class="vehicle-specs">
                    <div class="spec">
                      <div class="spec-label">Year</div>
                      <div>${vehicle.year}</div>
                    </div>
                    <div class="spec">
                      <div class="spec-label">Condition</div>
                      <div>${vehicle.condition}</div>
                    </div>
                    <div class="spec">
                      <div class="spec-label">Fuel Type</div>
                      <div>${vehicle.fuelType}</div>
                    </div>
                    <div class="spec">
                      <div class="spec-label">Location</div>
                      <div>${vehicle.city}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <a href="${process.env.FRONTEND_URL}/vehicles/${vehicle._id}" class="cta-button">View Vehicle Details →</a>
              
              <p>Contact the seller directly to arrange a test drive or get more information about this vehicle.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} SmartAuto Hub. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    const mailOptions = {
      from: `"SmartAuto Hub" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendNotificationEmail,
  sendTestDriveNotification,
  sendBreakdownNotification,
  sendEmail
};
