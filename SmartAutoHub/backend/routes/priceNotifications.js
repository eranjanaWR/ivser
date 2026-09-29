/**
 * Price Notification Routes
 * Handles price change notification endpoints
 */

const express = require('express');
const router = express.Router();
const priceNotificationController = require('../controllers/priceNotificationController');
const { protect } = require('../middlewares/auth');

// All routes require authentication
router.use(protect);

// Get all price notifications for user
router.get('/', priceNotificationController.getPriceNotifications);

// Get unread notifications count
router.get('/count/unread', priceNotificationController.getUnreadCount);

// Mark specific notification as read
router.put('/:id/read', priceNotificationController.markAsRead);

// Mark all notifications as read
router.put('/mark-all-read', priceNotificationController.markAllAsRead);

// Delete specific notification
router.delete('/:id', priceNotificationController.deleteNotification);

module.exports = router;
