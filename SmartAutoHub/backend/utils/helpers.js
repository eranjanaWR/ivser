/**
 * General Helper Utilities
 */

const jwt = require('jsonwebtoken');

/**
 * Generate JWT token
 * @param {object} payload - Token payload
 * @param {string} expiresIn - Token expiration time
 * @returns {string} - JWT token
 */
const generateToken = (payload, expiresIn = '30d') => {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {object} - Decoded token or error
 */
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} - Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

const toRad = (value) => {
  return (value * Math.PI) / 180;
};

/**
 * Paginate results
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object} - skip and limit values
 */
const paginate = (page = 1, limit = 10) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;
  
  return { skip, limit: limitNum, page: pageNum };
};

/**
 * Format pagination response
 */
const formatPaginationResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

/**
 * Generate a random string
 */
const generateRandomString = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Clean object by removing undefined/null values
 */
const cleanObject = (obj) => {
  return Object.entries(obj)
    .filter(([_, value]) => value !== undefined && value !== null)
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
};

/**
 * Format phone number
 */
const formatPhoneNumber = (phone) => {
  if (!phone) return null;
  // Remove all non-numeric characters except +
  return phone.replace(/[^\d+]/g, '');
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Sleep utility for async operations
 */
const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Format currency
 */
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};

/**
 * Get file extension from filename
 */
const getFileExtension = (filename) => {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2);
};

/**
 * Check if value is a valid MongoDB ObjectId
 */
const isValidObjectId = (id) => {
  const mongoose = require('mongoose');
  return mongoose.Types.ObjectId.isValid(id);
};

module.exports = {
  generateToken,
  verifyToken,
  calculateDistance,
  paginate,
  formatPaginationResponse,
  generateRandomString,
  cleanObject,
  formatPhoneNumber,
  isValidEmail,
  sleep,
  formatCurrency,
  getFileExtension,
  isValidObjectId
};
