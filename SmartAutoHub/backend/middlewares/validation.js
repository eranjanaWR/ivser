/**
 * Validation Middleware
 * Input validation using express-validator
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

/**
 * User Registration Validation
 */
const validateRegistration = [
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required')
    .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
  
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required')
    .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
  
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  
  body('role')
    .optional()
    .isIn(['seller', 'buyer', 'repairman']).withMessage('Invalid role'),
  
  body('phone')
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/).withMessage('Invalid phone number format'),
  
  handleValidationErrors
];

/**
 * Login Validation
 */
const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email')
    .normalizeEmail(),
  
  body('password')
    .notEmpty().withMessage('Password is required'),
  
  handleValidationErrors
];

/**
 * Vehicle Validation
 */
const validateVehicle = [
  body('brand')
    .trim()
    .notEmpty().withMessage('Brand is required'),
  
  body('model')
    .trim()
    .notEmpty().withMessage('Model is required'),
  
  body('year')
    .notEmpty().withMessage('Year is required')
    .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
    .withMessage('Please enter a valid year'),
  
  body('mileage')
    .notEmpty().withMessage('Mileage is required')
    .isInt({ min: 0 }).withMessage('Mileage cannot be negative'),
  
  body('price')
    .notEmpty().withMessage('Price is required')
    .isFloat({ min: 0 }).withMessage('Price cannot be negative'),
  
  body('fuelType')
    .optional()
    .isIn(['petrol', 'diesel', 'electric', 'hybrid', 'other'])
    .withMessage('Invalid fuel type'),
  
  body('transmission')
    .optional()
    .isIn(['automatic', 'manual', 'cvt', 'other'])
    .withMessage('Invalid transmission type'),
  
  body('bodyType')
    .optional()
    .isIn(['sedan', 'suv', 'hatchback', 'coupe', 'truck', 'van', 'wagon', 'convertible', 'other'])
    .withMessage('Invalid body type'),
  
  body('condition')
    .optional()
    .isIn(['new', 'excellent', 'good', 'fair', 'poor'])
    .withMessage('Invalid condition'),
  
  body('description')
    .optional()
    .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
  
  handleValidationErrors
];

/**
 * Test Drive Validation
 */
const validateTestDrive = [
  body('vehicleId')
    .notEmpty().withMessage('Vehicle ID is required')
    .isMongoId().withMessage('Invalid vehicle ID'),
  
  body('date')
    .notEmpty().withMessage('Date is required')
    .isISO8601().withMessage('Invalid date format'),
  
  body('time')
    .notEmpty().withMessage('Time is required'),
  
  body('buyerNotes')
    .optional()
    .isLength({ max: 500 }).withMessage('Notes cannot exceed 500 characters'),
  
  handleValidationErrors
];

/**
 * Breakdown Validation
 */
const validateBreakdown = [
  body('location.coordinates')
    .notEmpty().withMessage('Location coordinates are required')
    .isArray({ min: 2, max: 2 }).withMessage('Coordinates must be [longitude, latitude]'),
  
  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  
  body('category')
    .optional()
    .isIn(['engine', 'electrical', 'tire', 'battery', 'fuel', 'brakes', 'transmission', 'other'])
    .withMessage('Invalid category'),
  
  handleValidationErrors
];

/**
 * MongoDB ObjectId Validation
 */
const validateObjectId = (paramName = 'id') => [
  param(paramName)
    .isMongoId().withMessage(`Invalid ${paramName}`),
  
  handleValidationErrors
];

/**
 * OTP Validation
 */
const validateOTP = [
  body('otp')
    .trim()
    .notEmpty().withMessage('OTP is required')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
    .isNumeric().withMessage('OTP must contain only numbers'),
  
  handleValidationErrors
];

/**
 * ID Verification Validation
 */
const validateIDVerification = [
  body('idNumber')
    .trim()
    .notEmpty().withMessage('ID number is required'),
  
  handleValidationErrors
];

/**
 * Pagination Validation
 */
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateRegistration,
  validateLogin,
  validateVehicle,
  validateTestDrive,
  validateBreakdown,
  validateObjectId,
  validateOTP,
  validateIDVerification,
  validatePagination
};
