/**
 * Authentication Controller
 * Handles user registration, login, email verification, ID verification, and face verification
 */

const User = require('../models/User');
const { generateToken, generateOTP, sendOTPEmail } = require('../utils');
const { extractIDText, verifyIDNumber } = require('../utils/ocr');
const { compareFaces } = require('../utils/faceVerification');
const path = require('path');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 * 
 * Account creation only - collects basic info + optional profile image.
 * ID verification is done separately on the Verification page after email is verified.
 */
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, role, idCardNumber } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }
    
    // Validate role (prevent direct admin registration)
    const allowedRoles = ['seller', 'buyer', 'repairman'];
    const userRole = allowedRoles.includes(role) ? role : 'buyer';
    
    // Generate OTP for email verification
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Handle profile image if uploaded
    let profileImagePath = '';
    if (req.file) {
      profileImagePath = req.file.path;
    }

    // Build user document
    const userData = {
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      phone,
      role: userRole,
      profileImage: profileImagePath,
      emailOTP: {
        code: otp,
        expiresAt: otpExpiry
      }
    };

    // Store ID card number if provided
    if (idCardNumber) {
      userData.idVerification = {
        idNumber: idCardNumber
      };
    }
    
    // Create user
    const user = await User.create(userData);
    
    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, firstName);
    
    // Generate token
    const token = generateToken({ id: user._id });
    
    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please verify your email.',
      data: {
        user: user.getPublicProfile(),
        token,
        emailSent: emailResult.success
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user and include password for verification
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }
    
    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });
    
    // Generate token
    const token = generateToken({ id: user._id });
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.getPublicProfile(),
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

/**
 * @desc    Verify email with OTP
 * @route   POST /api/auth/verify-email
 * @access  Private
 */
const verifyEmail = async (req, res) => {
  try {
    const { otp } = req.body;
    const user = await User.findById(req.user._id);
    
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }
    
    // Check OTP
    if (!user.emailOTP || !user.emailOTP.code) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new one.'
      });
    }
    
    // Check OTP expiry
    if (new Date() > user.emailOTP.expiresAt) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }
    
    // Verify OTP
    if (user.emailOTP.code !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }
    
    // Mark email as verified
    user.isEmailVerified = true;
    user.emailOTP = undefined;
    await user.save({ validateBeforeSave: false });
    
    res.json({
      success: true,
      message: 'Email verified successfully',
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying email',
      error: error.message
    });
  }
};

/**
 * @desc    Resend OTP for email verification
 * @route   POST /api/auth/resend-otp
 * @access  Private
 */
const resendOTP = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }
    
    // Generate new OTP
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    
    user.emailOTP = {
      code: otp,
      expiresAt: otpExpiry
    };
    await user.save({ validateBeforeSave: false });
    
    // Send OTP email
    const emailResult = await sendOTPEmail(user.email, otp, user.firstName);
    
    res.json({
      success: true,
      message: 'OTP sent successfully',
      data: {
        emailSent: emailResult.success
      }
    });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resending OTP',
      error: error.message
    });
  }
};

/**
 * @desc    Upload and verify ID using Tesseract.js OCR
 * @route   POST /api/auth/verify-id
 * @access  Private
 * 
 * Steps:
 * 1. Accept uploaded ID image (idFront or idDocument field)
 * 2. Get the ID number stored during registration (idVerification.idNumber)
 * 3. Use Tesseract.js to extract text from the uploaded ID image
 * 4. Compare extracted ID number with the stored ID number
 * 5. If match: set isIDVerified = true
 * 6. If no match or OCR fails: set manualIDVerification = true for Admin2 review
 */
const verifyID = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    // Check if already verified
    if (user.isIDVerified) {
      return res.status(400).json({
        success: false,
        message: 'ID is already verified'
      });
    }
    
    // Get ID image from either idFront, idDocument, or idImage field
    let idImagePath = null;
    if (req.files) {
      if (req.files.idFront && req.files.idFront[0]) {
        idImagePath = req.files.idFront[0].path;
      } else if (req.files.idDocument && req.files.idDocument[0]) {
        idImagePath = req.files.idDocument[0].path;
      } else if (req.files.idImage && req.files.idImage[0]) {
        idImagePath = req.files.idImage[0].path;
      }
    }
    
    // Check if file was uploaded
    if (!idImagePath) {
      return res.status(400).json({
        success: false,
        message: 'ID image is required. Please upload your ID document.'
      });
    }
    
    // Get ID number: from request body or from stored registration data
    let idNumber = req.body.idNumber;
    if (!idNumber && user.idVerification && user.idVerification.idNumber) {
      idNumber = user.idVerification.idNumber;
    }
    
    if (!idNumber) {
      return res.status(400).json({
        success: false,
        message: 'ID number not found. Please ensure you entered your ID number during registration.'
      });
    }
    
    // Optional: get back image if provided
    const idBackPath = req.files && req.files.idBack ? req.files.idBack[0].path : null;
    
    // Try to extract text from ID image using Tesseract.js OCR
    let extractedText = null;
    let ocrSuccess = false;
    let verificationResult = null;
    
    try {
      extractedText = await extractIDText(idImagePath, idBackPath);
      ocrSuccess = true;
      
      // Verify ID number against extracted text
      verificationResult = verifyIDNumber(idNumber, extractedText.combinedText);
    } catch (ocrError) {
      console.error('OCR processing error:', ocrError.message);
      ocrSuccess = false;
    }
    
    // Decision logic
    if (ocrSuccess && verificationResult && (verificationResult.isMatch || verificationResult.confidence >= 70)) {
      // ✅ ID verified successfully - OCR matched the ID number
      user.isIDVerified = true;
      user.manualIDVerification = false;
      user.manualIDStatus = null;
      user.idVerification = {
        idNumber: idNumber,
        idFrontImage: idImagePath,
        idBackImage: idBackPath,
        extractedText: extractedText ? extractedText.combinedText : '',
        ocrConfidence: verificationResult ? verificationResult.confidence : 0,
        verifiedAt: new Date()
      };
      await user.save({ validateBeforeSave: false });
      
      return res.json({
        success: true,
        message: 'ID verified successfully.',
        data: {
          user: user.getPublicProfile(),
          verification: verificationResult
        }
      });
    } else {
      // ❌ OCR failed or numbers don't match - set for manual verification
      user.manualIDVerification = true;
      user.manualIDStatus = 'pending';
      user.idVerification = {
        idNumber: idNumber,
        idFrontImage: idImagePath,
        idBackImage: idBackPath,
        extractedText: extractedText ? extractedText.combinedText : '',
        ocrConfidence: verificationResult ? verificationResult.confidence : 0
      };
      await user.save({ validateBeforeSave: false });
      
      return res.json({
        success: true,
        message: 'ID could not be verified automatically. Admin will verify manually.',
        data: {
          user: user.getPublicProfile(),
          manualVerificationRequired: true,
          ocrConfidence: verificationResult ? verificationResult.confidence : 0
        }
      });
    }
  } catch (error) {
    console.error('ID verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying ID',
      error: error.message
    });
  }
};

/**
 * @desc    Upload and verify face
 * @route   POST /api/auth/verify-face
 * @access  Private
 */
const verifyFace = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (user.isFaceVerified) {
      return res.status(400).json({
        success: false,
        message: 'Face is already verified'
      });
    }
    
    if (!user.isIDVerified || !user.idVerification.idFrontImage) {
      return res.status(400).json({
        success: false,
        message: 'Please verify your ID first before face verification'
      });
    }
    
    // Check if selfie was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Selfie image is required'
      });
    }
    
    const selfiePath = req.file.path;
    const idPhotoPath = user.idVerification.idFrontImage;
    
    // Compare faces
    const comparisonResult = await compareFaces(idPhotoPath, selfiePath);
    
    if (comparisonResult.success && comparisonResult.isMatch) {
      // Mark face as verified
      user.isFaceVerified = true;
      user.faceVerification = {
        selfieImage: selfiePath,
        faceDescriptor: comparisonResult.selfieDescriptor || [],
        matchScore: comparisonResult.similarity,
        verifiedAt: new Date()
      };
      await user.save({ validateBeforeSave: false });
      
      res.json({
        success: true,
        message: 'Face verified successfully',
        data: {
          user: user.getPublicProfile(),
          verification: {
            similarity: comparisonResult.similarity,
            message: comparisonResult.message
          }
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: comparisonResult.message || 'Face verification failed',
        data: {
          verification: comparisonResult
        }
      });
    }
  } catch (error) {
    console.error('Face verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying face',
      error: error.message
    });
  }
};

/**
 * @desc    Get current user profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      success: true,
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user profile',
      error: error.message
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/update-profile
 * @access  Private
 */
const updateProfile = async (req, res) => {
  try {
    const allowedUpdates = ['firstName', 'lastName', 'phone', 'address', 'profileImage'];
    const updates = {};
    
    // Filter allowed updates
    Object.keys(req.body).forEach(key => {
      if (allowedUpdates.includes(key)) {
        updates[key] = req.body[key];
      }
    });
    
    // Handle profile image upload
    if (req.file) {
      updates.profileImage = req.file.path;
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.getPublicProfile()
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

/**
 * @desc    Get verification status
 * @route   GET /api/auth/verification-status
 * @access  Private
 */
const getVerificationStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    res.json({
      success: true,
      data: {
        isEmailVerified: user.isEmailVerified,
        isIDVerified: user.isIDVerified,
        isFaceVerified: user.isFaceVerified,
        isFullyVerified: user.isFullyVerified()
      }
    });
  } catch (error) {
    console.error('Get verification status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching verification status',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  resendOTP,
  verifyID,
  verifyFace,
  getMe,
  updateProfile,
  getVerificationStatus
};
