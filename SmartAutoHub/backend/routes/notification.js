const express = require('express');
const router = express.Router();
const {
  subscribe,
  unsubscribe,
  getUserSubscriptions,
  getUnseenAlerts,
  markAlertsSeen,
  getNotificationPreferences,
  updateNotificationPreferences,
} = require('../controllers/notificationController');
const { protect } = require('../middlewares/auth');

/**
 * @route   POST /api/notifications/subscribe
 * @desc    Subscribe to vehicle notifications
 * @access  Public
 */
router.post('/subscribe', subscribe);

/**
 * @route   POST /api/notifications/unsubscribe
 * @desc    Unsubscribe from notifications
 * @access  Public
 */
router.post('/unsubscribe', unsubscribe);

/**
 * @route   GET /api/notifications/subscriptions
 * @desc    Get user's notification subscriptions
 * @access  Public
 */
router.get('/subscriptions', getUserSubscriptions);

/**
 * @route   GET /api/notifications/alerts/unseen
 * @desc    Get unseen alerts for logged-in user
 * @access  Private
 */
router.get('/alerts/unseen', protect, getUnseenAlerts);

/**
 * @route   PUT /api/notifications/alerts/mark-seen
 * @desc    Mark alerts as seen
 * @access  Private
 */
router.put('/alerts/mark-seen', protect, markAlertsSeen);

/**
 * @route   GET /api/notifications/preferences
 * @desc    Get user's notification preferences
 * @access  Private
 */
router.get('/preferences', protect, getNotificationPreferences);

/**
 * @route   PUT /api/notifications/preferences
 * @desc    Update user's notification preferences
 * @access  Private
 */
router.put('/preferences', protect, updateNotificationPreferences);

module.exports = router;
