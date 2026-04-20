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
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠ Email credentials not configured. Set EMAIL_USER and EMAIL_PASS in .env file.');
    return null; // Return null if credentials missing
  }

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
    
    // Check if transporter is null (email credentials not configured)
    if (!transporter) {
      console.warn('⚠ Email service is not configured. Skipping OTP email send to:', email);
      return { success: false, error: 'Email service not configured' };
    }
    
    const mailOptions = {
      from: `"TakGaala.lk" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Email Verification - TakGaala.lk',
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
              <h1>TakGaala.lk</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName},</h2>
              <p>Thank you for registering with TakGaala.lk. Please use the following OTP to verify your email address:</p>
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
              </div>
              <p>This OTP is valid for <strong>10 minutes</strong>.</p>
              <p>If you didn't request this verification, please ignore this email.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} TakGaala.lk. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent successfully to:', email, '| Message ID:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error sending OTP email to', email, ':', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send notification email
 */
const sendNotificationEmail = async (email, subject, message, firstName) => {
  try {
    const transporter = createTransporter();
    
    // Check if transporter is null (email credentials not configured)
    if (!transporter) {
      console.warn('⚠ Email service is not configured. Skipping email send to:', email);
      return { success: false, error: 'Email service not configured' };
    }
    
    const mailOptions = {
      from: `"TakGaala.lk" <${process.env.EMAIL_USER}>`,
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
              <h1>TakGaala.lk</h1>
            </div>
            <div class="content">
              <h2>Hello ${firstName},</h2>
              <p>${message}</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} TakGaala.lk. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Notification email sent successfully to:', email, '| Message ID:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error sending notification email to', email, ':', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send test drive notification to seller
 */
const sendTestDriveNotification = async (sellerEmail, sellerName, buyerName, vehicleName, date, time) => {
  const subject = 'New Test Drive Request - TakGaala.lk';
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
 * Send approved test drive email to buyer
 */
const sendTestDriveApprovedEmail = async (buyerEmail, buyerFirstName, vehicleName, details = {}) => {
  const subject = 'Test Drive Request Approved - TakGaala.lk';
  const message = `
    Great news! Your test drive request has been approved.<br><br>
    <strong>Vehicle:</strong> ${vehicleName}<br>
    <strong>Date:</strong> ${details.date || 'N/A'}<br>
    <strong>Time:</strong> ${details.time || 'N/A'}<br>
    <strong>Seller:</strong> ${details.sellerName || 'N/A'}<br>
    <strong>Seller Contact:</strong> ${details.sellerPhone || 'N/A'}<br><br>
    Please contact the seller if you need any additional details before the appointment.
  `;

  return await sendNotificationEmail(
    buyerEmail,
    subject,
    message,
    buyerFirstName || 'Buyer'
  );
};

/**
 * Send rejected/cancelled test drive email to buyer
 */
const sendTestDriveRejectedEmail = async (buyerEmail, buyerFirstName, vehicleName, details = {}) => {
  const subject = 'Test Drive Request Update - TakGaala.lk';
  const message = `
    Your test drive request has been updated.<br><br>
    <strong>Vehicle:</strong> ${vehicleName}<br>
    <strong>Date:</strong> ${details.date || 'N/A'}<br>
    <strong>Time:</strong> ${details.time || 'N/A'}<br>
    <strong>Seller:</strong> ${details.sellerName || 'N/A'}<br><br>
    If needed, you can submit a new request with another preferred time.
  `;

  return await sendNotificationEmail(
    buyerEmail,
    subject,
    message,
    buyerFirstName || 'Buyer'
  );
};

/**
 * Send cancellation email to buyers when vehicle becomes unavailable/deleted
 */
const sendTestDriveCancellationEmail = async (buyerEmail, buyerName, vehicleName, reason) => {
  const subject = 'Test Drive Cancelled - TakGaala.lk';
  const message = `
    We are sorry, your active test drive has been cancelled.<br><br>
    <strong>Vehicle:</strong> ${vehicleName}<br>
    <strong>Reason:</strong> ${reason || 'Vehicle is no longer available'}<br><br>
    You can browse similar vehicles and submit another test drive request.
  `;

  return await sendNotificationEmail(
    buyerEmail,
    subject,
    message,
    buyerName || 'Buyer'
  );
};

/**
 * Send breakdown notification to repairman
 */
const sendBreakdownNotification = async (repairmanEmail, repairmanName, location, description, category) => {
  const subject = 'New Breakdown Request - TakGaala.lk';
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
 * Send ID verification confirmation email
 */
const sendIDVerificationEmail = async (email, firstName) => {
  try {
    const transporter = createTransporter();
    
    if (!transporter) {
      console.warn('⚠ Email service is not configured. Skipping ID verification email send to:', email);
      return { success: false, error: 'Email service not configured' };
    }
    
    const subject = 'ID Verification Successful - TakGaala.lk';
    const mailOptions = {
      from: `"TakGaala.lk" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 20px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; }
            .content { padding: 40px; background: #f9f9f9; }
            .success-box { background: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .success-box h3 { margin-top: 0; color: #155724; }
            .success-box p { color: #155724; margin: 10px 0; }
            .checkmark { font-size: 48px; color: #28a745; text-align: center; }
            .verification-details { background: white; border: 1px solid #ddd; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .verification-details p { margin: 10px 0; }
            .detail-label { font-weight: bold; color: #667eea; }
            .next-steps { background: #e7f3ff; border-left: 4px solid #0066ff; padding: 20px; margin: 20px 0; border-radius: 4px; }
            .next-steps h3 { margin-top: 0; color: #004085; }
            .next-steps ol { padding-left: 20px; }
            .next-steps li { color: #004085; margin: 8px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
            .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 TakGaala.lk</h1>
            </div>
            <div class="content">
              <h2>ID Verification Successful, ${firstName}!</h2>
              
              <div class="success-box">
                <div class="checkmark">✓</div>
                <h3>Congratulations!</h3>
                <p>Your identity document has been successfully verified. Your account is one step closer to being fully verified.</p>
              </div>
              
              <div class="verification-details">
                <h3 style="margin-top: 0; color: #333;">Verification Status</h3>
                <p><span class="detail-label">Email Verification:</span> ✓ Completed</p>
                <p><span class="detail-label">ID Verification:</span> ✓ Completed</p>
                <p><span class="detail-label">Face Verification:</span> ⏳ Pending</p>
              </div>
              
              <div class="next-steps">
                <h3>What's Next?</h3>
                <p>To complete your account verification, you need to:</p>
                <ol>
                  <li>Complete Face Verification by taking a selfie</li>
                  <li>Your selfie will be compared with your ID document</li>
                  <li>Once verified, your account will be fully activated</li>
                </ol>
              </div>
              
              <p style="text-align: center;">
                <a href="${process.env.FRONTEND_URL}/verification" class="button">Continue to Face Verification</a>
              </p>
              
              <p>If you have any questions or encounter any issues, please don't hesitate to contact our support team.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} TakGaala.lk. All rights reserved.</p>
              <p>This is an automated message, please do not reply to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };
    
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ ID Verification email sent successfully to:', email, '| Message ID:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error sending ID verification email to', email, ':', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send generic email with template support
 */
const sendEmail = async (options) => {
  try {
    const { to, email, subject, template, data, html } = options;
    const transporter = createTransporter();

    // If transporter is null (no credentials), return error message
    if (!transporter) {
      console.warn('⚠ Transporter not initialized - email credentials missing');
      return { success: false, error: 'Email service not configured' };
    }

    let emailHtml = html || '';

    // If HTML is provided directly, use it
    if (html) {
      const mailOptions = {
        from: `"TakGaala.lk" <${process.env.EMAIL_USER}>`,
        to: to || email,
        subject: subject,
        html: html,
      };
      const result = await transporter.sendMail(mailOptions);
      console.log('Email sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    }

    // Otherwise, use template-based approach
    if (template === 'notification-subscription') {
      const { searchCriteria } = data;
      emailHtml = `
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
              <h1>TakGaala.lk</h1>
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
              <p>&copy; ${new Date().getFullYear()} TakGaala.lk. All rights reserved.</p>
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

      emailHtml = `
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
              <p>A vehicle matching your search criteria has been added to TakGaala.lk.</p>
              
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
              <p>&copy; ${new Date().getFullYear()} TakGaala.lk. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    const mailOptions = {
      from: `"TakGaala.lk" <${process.env.EMAIL_USER}>`,
      to: to || email,
      subject: subject,
      html: emailHtml,
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
  sendTestDriveApprovedEmail,
  sendTestDriveRejectedEmail,
  sendTestDriveCancellationEmail,
  sendBreakdownNotification,
  sendIDVerificationEmail,
  sendEmail
};
