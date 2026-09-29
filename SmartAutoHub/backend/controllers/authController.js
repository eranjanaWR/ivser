/**
 * Authentication Controller
 * Handles user registration, login, email verification, ID verification, and face verification
 */

const User = require('../models/User');
const { generateToken, generateOTP, sendOTPEmail } = require('../utils');
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
    const { firstName, lastName, email, password, phone, role } = req.body;
    
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
    
    console.log('\n🔑 LOGIN ATTEMPT');
    console.log('Email:', email);
    console.log('Password provided:', !!password);
    
    // Find user and include password for verification
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    console.log('✓ User lookup complete');
    console.log('User found:', !!user);
    if (user) {
      console.log('  Email:', user.email);
      console.log('  Role:', user.role);
      console.log('  Active:', user.isActive);
      console.log('  Password hash exists:', !!user.password);
    }
    
    if (!user) {
      console.log('❌ User not found in database');
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }
    
    // Check if account is active
    if (!user.isActive) {
      console.log('❌ Account is inactive');
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }
    
    // Verify password
    console.log('🔐 Comparing passwords...');
    const isMatch = await user.comparePassword(password);
    console.log('✓ Password comparison done');
    console.log('  Password matches:', isMatch);
    
    if (!isMatch) {
      console.log('❌ Password mismatch');
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
    
    console.log('✅ Login successful for:', user.email);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.getPublicProfile(),
        token
      }
    });
  } catch (error) {
    console.error('❌ Login error:', error);
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
 * @desc    Forgot Password - Send OTP to user's email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email'
      });
    }
    
    // Generate OTP for password reset (1 minute validity)
    const { generateOTP, sendPasswordResetOTP } = require('../utils');
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 1 * 60 * 1000); // 1 minute
    
    // Save OTP to user document
    user.passwordResetOTP = {
      code: otp,
      expiresAt: otpExpiry
    };
    await user.save({ validateBeforeSave: false });
    
    // Send OTP email
    const emailResult = await sendPasswordResetOTP(email, otp, user.firstName);
    
    res.json({
      success: true,
      message: 'Password reset OTP sent to your email',
      data: {
        emailSent: emailResult.success
      }
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing forgot password request',
      error: error.message
    });
  }
};

/**
 * @desc    Verify Reset OTP and Reset Password
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    // Validate input
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Email, OTP, and new password are required'
      });
    }
    
    // Validate password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email'
      });
    }
    
    // Check if OTP exists
    if (!user.passwordResetOTP || !user.passwordResetOTP.code) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new one.'
      });
    }
    
    // Check OTP expiry (1 minute)
    if (new Date() > user.passwordResetOTP.expiresAt) {
      user.passwordResetOTP = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }
    
    // Verify OTP
    if (user.passwordResetOTP.code !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }
    
    // Update password
    user.password = newPassword;
    user.passwordResetOTP = undefined;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password reset successfully. You can now login with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  resendOTP,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword
};









