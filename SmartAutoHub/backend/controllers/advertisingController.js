/**
 * Advertising Controller
 * Handles advertising package submissions
 */

const { sendEmail } = require('../utils/email');
const Advertising = require('../models/Advertising');

/**
 * @route   POST /api/advertising/submit-package
 * @desc    Submit advertising package request
 * @access  Public
 */
exports.submitPackageRequest = async (req, res) => {
  try {
    console.log('=== Advertising Request Received ===');
    console.log('Body:', req.body);

    const { name, email, phone, company, message, packageName, placement, adPhoto, adPhotoBase64 } = req.body;

    // Validate required fields
    if (!name || !email || !phone) {
      console.warn('Validation failed - missing required fields');
      return res.status(400).json({
        success: false,
        error: 'Please provide name, email, and phone number'
      });
    }

    // Validate ad photo is provided
    if (!adPhoto) {
      console.warn('Validation failed - ad photo not provided');
      return res.status(400).json({
        success: false,
        error: 'Ad photo is required to proceed'
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.warn('Validation failed - invalid email format:', email);
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address'
      });
    }

    console.log('✓ Validation passed');
    console.log('Creating advertising request for:', name, email);
    console.log('Package: ', packageName, 'Placement:', placement);
    console.log('Photo received:', adPhotoBase64 ? 'Yes (base64)' : 'No');

    // Create advertising request document
    let advertisingRequest;
    try {
      const recordData = {
        name,
        email,
        phone,
        company: company || 'Not provided',
        message: message || 'No additional message',
        packageName,
        placement: placement || 'Not specified',
        adPhotoUpload: adPhoto ? true : false,
        adPhotoBase64: adPhotoBase64 || null,
        status: 'pending',
        submittedAt: new Date()
      };
      console.log('Creating record with:', JSON.stringify(recordData, null, 2));
      advertisingRequest = await Advertising.create(recordData);
      console.log('✓ Database record created:', advertisingRequest._id);
    } catch (dbError) {
      console.error('❌ Database error:', dbError.message);
      console.error('Database error details:', dbError);
      throw new Error(`Database error: ${dbError.message}`);
    }

    console.log('Preparing confirmation email...');

    // Prepare confirmation email
    const emailSubject = `Advertising Package Request Confirmation - ${packageName}`;
    const emailHTML = `
      <!DOCTYPE html>
      <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #000; border-bottom: 3px solid #000; padding-bottom: 10px;">
              ✓ Submission Received
            </h2>
            
            <p style="font-size: 16px; margin: 20px 0;">
              Dear <strong>${name}</strong>,
            </p>
            
            <p style="font-size: 14px;">
              Thank you for your interest in our advertising packages! We have successfully received your submission.
            </p>

            <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #000; margin: 20px 0;">
              <h3 style="color: #000; margin-top: 0;">Submission Details:</h3>
              <p><strong>Package:</strong> ${packageName}</p>
              <p><strong>Placement Location:</strong> ${placement === 'home' ? 'Home Page' : placement === 'browse' ? 'Browse Vehicles Page' : 'Not specified'}</p>
              <p><strong>Company:</strong> ${company || 'Not provided'}</p>
              <p><strong>Contact Email:</strong> ${email}</p>
              <p><strong>Contact Phone:</strong> ${phone}</p>
              ${adPhoto ? '<p><strong>Ad Photo:</strong> ✓ Uploaded</p>' : '<p><strong>Ad Photo:</strong> Not uploaded</p>'}
              <p><strong>Submission ID:</strong> ${advertisingRequest._id}</p>
            </div>

            <p style="font-size: 14px; margin: 20px 0;">
              <strong>What happens next?</strong><br>
              Our advertising team will review your request within 24 hours and contact you at the provided phone number or email address with:
            </p>

            <ul style="font-size: 14px;">
              <li>Confirmation of package availability</li>
              <li>Pricing details and payment terms</li>
              <li>Campaign setup and timeline</li>
              <li>Any additional requirements</li>
            </ul>

            <p style="font-size: 14px; margin: 20px 0;">
              If you have any questions in the meantime, please don't hesitate to contact us.
            </p>

            <div style="background-color: #f9f9f9; padding: 15px; margin: 20px 0; border-radius: 4px; text-align: center;">
              <p style="margin: 5px 0; font-size: 12px;">
                <strong>SmartAutoHub Advertising Team</strong>
              </p>
              <p style="margin: 5px 0; font-size: 12px; color: #666;">
                📧 support@smartautohub.com<br>
                📱 +1-800-SMART-AUTO
              </p>
            </div>

            <p style="font-size: 12px; color: #999; text-align: center; margin-top: 20px;">
              This is an automated response. Please do not reply to this email.
            </p>
          </div>
        </body>
      </html>
    `;

    // Send confirmation email to user (non-blocking)
    console.log('Attempting to send email to:', email);
    try {
      const emailResult = await sendEmail({
        email,
        subject: emailSubject,
        html: emailHTML
      });
      if (emailResult.success) {
        console.log('✓ Email sent successfully:', emailResult.messageId);
      } else {
        console.warn('⚠ Email sending failed:', emailResult.error);
      }
    } catch (emailError) {
      console.warn('⚠ Email error (non-blocking):', emailError.message);
      // Continue anyway - email is optional
    }

    console.log('✓ Request completed successfully');
    res.status(201).json({
      success: true,
      message: `Thank you! Request submitted successfully. Check your email for confirmation (${email}).`,
      data: {
        requestId: advertisingRequest._id,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('❌ Error submitting package request:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      error: error.message || 'Error processing advertising request',
      message: error.message || 'Error processing advertising request'
    });
  }
};

/**
 * @route   GET /api/advertising/status/:id
 * @desc    Check status of advertising request
 * @access  Public
 */
exports.checkRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const request = await Advertising.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        error: 'Advertising request not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        id: request._id,
        status: request.status,
        packageName: request.packageName,
        placement: request.placement,
        submittedAt: request.submittedAt,
        message: request.adminMessage || 'Awaiting review'
      }
    });

  } catch (error) {
    console.error('Error checking request status:', error);
    res.status(500).json({
      success: false,
      error: 'Error checking request status'
    });
  }
};
