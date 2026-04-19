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
 * Send auction winner notification email
 */
const sendAuctionWinnerNotificationEmail = async ({
  winnerEmail,
  winnerName,
  vehicleName,
  brand,
  model,
  year,
  finalWinningBid,
  seller,
}) => {
  try {
    const transporter = createTransporter();

    if (!transporter) {
      console.warn('⚠ Email service is not configured. Skipping auction winner email to:', winnerEmail);
      return { success: false, error: 'Email service not configured' };
    }

    if (!winnerEmail) {
      return { success: false, error: 'Winner email is missing' };
    }

    const formattedBid = new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
      maximumFractionDigits: 0,
    }).format(finalWinningBid || 0);

    const sellerName = seller?.fullName || 'Seller';
    const sellerPhone = seller?.phone || 'Not provided';
    const sellerEmail = seller?.email || 'Not provided';
    const safeVehicleName = vehicleName || [year, brand, model].filter(Boolean).join(' ') || 'Auction Vehicle';

    const mailOptions = {
      from: `"TakGaala.lk" <${process.env.EMAIL_USER}>`,
      to: winnerEmail,
      subject: `Congratulations! You won the bid for ${safeVehicleName} on TakGaala.lk 🎉`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 640px; margin: 0 auto; padding: 20px; }
            .header { background: #1a1a1a; color: white; padding: 22px; text-align: center; }
            .content { padding: 24px; background: #f9f9f9; }
            .card { background: white; border-left: 4px solid #28a745; padding: 14px 16px; margin: 16px 0; }
            .row { margin: 8px 0; }
            .label { font-weight: bold; color: #222; }
            .footer { padding: 16px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Congratulations! You Won 🎉</h1>
            </div>

            <div class="content">
              <p>Hello ${winnerName || 'Winner'},</p>
              <p>Great news. You are the winning bidder for <strong>${safeVehicleName}</strong> on TakGaala.lk.</p>

              <div class="card">
                <div class="row"><span class="label">Vehicle:</span> ${safeVehicleName}</div>
                <div class="row"><span class="label">Brand:</span> ${brand || '-'}</div>
                <div class="row"><span class="label">Model:</span> ${model || '-'}</div>
                <div class="row"><span class="label">Year:</span> ${year || '-'}</div>
                <div class="row"><span class="label">Final Winning Bid:</span> ${formattedBid}</div>
              </div>

              <div class="card">
                <div class="row"><span class="label">Seller Full Name:</span> ${sellerName}</div>
                <div class="row"><span class="label">Seller Phone Number:</span> ${sellerPhone}</div>
                <div class="row"><span class="label">Seller Email:</span> ${sellerEmail}</div>
              </div>

              <p>Please contact the seller to finalize the deal and complete the next steps.</p>
              <p>Thank you for using TakGaala.lk.</p>
            </div>

            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} TakGaala.lk. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Auction winner email sent to:', winnerEmail, '| Message ID:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('❌ Error sending auction winner email:', error.message);
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

/**
 * Send test drive approved email to buyer
 */
const sendTestDriveApprovedEmail = async (buyerEmail, buyerName, vehicleName, vehicleDetails) => {
  const subject = 'Your Test Drive Request Has Been Approved! ✓ - SmartAuto Hub';
  const message = `
    <p>Good news! Your test drive request has been <strong>approved</strong>!</p><br>
    
    <div style="background: #f0f8ff; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #28a745;">Test Drive Approved</h3>
      <p><strong>Vehicle:</strong> ${vehicleName}</p>
      <p><strong>Date:</strong> ${vehicleDetails.date}</p>
      <p><strong>Time:</strong> ${vehicleDetails.time}</p>
      <p><strong>Seller:</strong> ${vehicleDetails.sellerName}</p>
      <p><strong>Contact:</strong> ${vehicleDetails.sellerPhone || 'Available in your dashboard'}</p>
    </div>
    
    <p>The seller has approved your request and is ready for your test drive. Please check your dashboard for more details and stay in touch with the seller to confirm any final details.</p>
    <p>Thank you for using SmartAuto Hub!</p>
  `;
  
  return await sendNotificationEmail(buyerEmail, subject, message, buyerName);
};

/**
 * Send test drive rejected/cancelled email to buyer
 */
const sendTestDriveRejectedEmail = async (buyerEmail, buyerName, vehicleName, vehicleDetails) => {
  const subject = 'Your Test Drive Request Has Been Rejected - SmartAuto Hub';
  const message = `
    <p>Unfortunately, your test drive request for the <strong>${vehicleName}</strong> has been <strong>rejected</strong>.</p><br>
    
    <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #856404;">Request Declined</h3>
      <p><strong>Vehicle:</strong> ${vehicleName}</p>
      <p><strong>Requested Date:</strong> ${vehicleDetails.date}</p>
      <p><strong>Requested Time:</strong> ${vehicleDetails.time}</p>
    </div>
    
    <p>The seller was unable to accommodate your test drive request at this time. But don't worry! You can:</p>
    <ul>
      <li><strong>Try another date and time</strong> - Contact the seller to check their availability</li>
      <li><strong>Browse similar vehicles</strong> - Explore other listings that match your preferences</li>
      <li><strong>Set up alerts</strong> - Get notified when new vehicles matching your criteria are added</li>
    </ul>
    
    <p>We encourage you to keep exploring and find the perfect vehicle for your needs!</p>
    <p>Best regards,<br>SmartAuto Hub Team</p>
  `;
  
  return await sendNotificationEmail(buyerEmail, subject, message, buyerName);
};

/**
 * Send test drive cancellation email when vehicle is sold/deleted
 */
const sendTestDriveCancellationEmail = async (buyerEmail, buyerName, vehicleName, reason = 'vehicle sold out') => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"SmartAuto Hub" <${process.env.EMAIL_USER}>`,
      to: buyerEmail,
      subject: 'Test Drive Booking Cancelled - SmartAuto Hub',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1a1a1a; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px; background: #f9f9f9; }
            .alert { background: #fff3cd; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 12px; }
            .button { display: inline-block; background: #0066ff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>SmartAuto Hub</h1>
            </div>
            <div class="content">
              <h2>Test Drive Booking Cancelled</h2>
              <p>Hello ${buyerName},</p>
              
              <p>Thank you for your interest in scheduling a test drive with SmartAuto Hub.</p>
              
              <div class="alert">
                <strong>⚠ Your test drive booking has been automatically cancelled</strong><br><br>
                <strong>Vehicle:</strong> ${vehicleName}<br>
              </div>
              
              <p>Unfortunately, we must inform you that the vehicle you booked a test drive for is no longer available because it has been ${reason}. As a result, your booking has been cancelled by our system.</p>
              
              <p>We sincerely apologize for any inconvenience this may cause you. We have many other similar vehicles available on our platform, and we encourage you to explore our listings to find another vehicle that matches your preferences!</p>
              
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/vehicles" class="button">Browse Available Vehicles</a>
              
              <p style="margin-top: 30px; color: #666;">If you have any questions, please don't hesitate to contact our support team.</p>
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
    console.log('Test drive cancellation email sent:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending test drive cancellation email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail,
  sendNotificationEmail,
  sendTestDriveNotification,
  sendBreakdownNotification,
  sendAuctionWinnerNotificationEmail,
  sendTestDriveApprovedEmail,
  sendTestDriveRejectedEmail,
  sendTestDriveCancellationEmail,
  sendEmail
};
