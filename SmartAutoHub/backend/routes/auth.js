/**
 * Authentication Routes
 * Handles signup, login, email/ID/face verification
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { uploadID, uploadSelfie, uploadProfileImage } = require('../middlewares/upload');
const { validateRegistration, validateLogin, validateOTP } = require('../middlewares/validation');

// Public routes
router.post('/register', validateRegistration, authController.register);
router.post('/login', validateLogin, authController.login);

// Protected routes (requires authentication)
router.use(protect);

// Get current user
router.get('/me', authController.getMe);

// Email verification
// POST /api/auth/verify-email  — verify OTP (original route)
// POST /api/auth/verify-otp    — alias used by frontend VerificationPage
router.post('/verify-email', validateOTP, authController.verifyEmail);
router.post('/verify-otp', validateOTP, authController.verifyEmail);

// POST /api/auth/resend-otp  — resend OTP (original route)
// POST /api/auth/send-otp    — alias used by frontend VerificationPage
router.post('/resend-otp', authController.resendOTP);
router.post('/send-otp', authController.resendOTP);

// ID verification (upload front and back of ID)
router.post('/verify-id', uploadID, authController.verifyID);

// Face verification (upload selfie)
router.post('/verify-face', uploadSelfie, authController.verifyFace);

// Profile management
router.put('/update-profile', uploadProfileImage, authController.updateProfile);

// Verification status
router.get('/verification-status', authController.getVerificationStatus);

module.exports = router;
