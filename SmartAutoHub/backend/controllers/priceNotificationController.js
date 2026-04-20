/**
 * Price Change Notification Controller
 * Handles price change notifications for wishlist items
 */

const PriceNotification = require('../models/PriceNotification');
const User = require('../models/User');
const { sendPriceChangeNotification } = require('../utils');

/**
 * @desc    Get all price notifications for current user
 * @route   GET /api/user/price-notifications
 * @access  Private
 */
const getPriceNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, unreadOnly = false } = req.query;
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await PriceNotification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PriceNotification.countDocuments(query);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit),
        },
      },
    });
  } catch (error) {
    console.error('Get price notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching notifications',
      error: error.message,
    });
  }
};

/**
 * @desc    Get unread price notifications count
 * @route   GET /api/user/price-notifications/count/unread
 * @access  Private
 */
const getUnreadCount = async (req, res) => {
  try {
    const unreadCount = await PriceNotification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    res.json({
      success: true,
      data: {
        unreadCount,
      },
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching unread count',
      error: error.message,
    });
  }
};

/**
 * @desc    Mark price notification as read
 * @route   PUT /api/user/price-notifications/:id/read
 * @access  Private
 */
const markAsRead = async (req, res) => {
  try {
    const notification = await PriceNotification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    // Verify ownership
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this notification',
      });
    }

    await notification.markAsRead();

    // Update user's unread count
    const unreadCount = await PriceNotification.countDocuments({
      userId: req.user._id,
      isRead: false,
    });

    await User.findByIdAndUpdate(req.user._id, {
      unreadNotificationsCount: unreadCount,
    });

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: { notification },
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking notification as read',
      error: error.message,
    });
  }
};

/**
 * @desc    Mark all price notifications as read
 * @route   PUT /api/user/price-notifications/mark-all-read
 * @access  Private
 */
const markAllAsRead = async (req, res) => {
  try {
    await PriceNotification.updateMany(
      { userId: req.user._id, isRead: false },
      { isRead: true, readAt: new Date() }
    );

    // Update user's unread count to 0
    await User.findByIdAndUpdate(req.user._id, {
      unreadNotificationsCount: 0,
    });

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Error marking all notifications as read',
      error: error.message,
    });
  }
};

/**
 * @desc    Delete price notification
 * @route   DELETE /api/user/price-notifications/:id
 * @access  Private
 */
const deleteNotification = async (req, res) => {
  try {
    const notification = await PriceNotification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    // Verify ownership
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this notification',
      });
    }

    await PriceNotification.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Notification deleted',
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting notification',
      error: error.message,
    });
  }
};

/**
 * Internal function to send price change notifications
 * This is called from the vehicle update workflow
 * 
 * @param {string} vehicleId - Vehicle ID
 * @param {number} oldPrice - Previous price
 * @param {number} newPrice - New price
 * @param {object} vehicleInfo - Vehicle info {brand, model, year, name, image, userId}
 * @param {string} sellerId - Seller user ID
 * @param {array} buyerIds - Array of buyer user IDs who have this in wishlist
 */
const notifyPriceChange = async (vehicleId, oldPrice, newPrice, vehicleInfo, sellerId, buyerIds = []) => {
  try {
    // Only notify if prices actually changed
    if (oldPrice === newPrice) {
      console.log('Prices are the same, no notification needed');
      return { success: true, notificationsCreated: 0 };
    }

    const priceChange = newPrice - oldPrice;
    const priceChangePercent = ((priceChange / oldPrice) * 100).toFixed(1);
    const notificationType = priceChange > 0 ? 'price_increase' : 'price_decrease';

    let notificationsCreated = 0;

    // Create notifications for each buyer
    for (const buyerId of buyerIds) {
      try {
        const buyer = await User.findById(buyerId);
        
        if (!buyer) continue;

        // Only send if price change notifications are enabled
        if (!buyer.notificationPreferences?.priceChangeNotifications) {
          continue;
        }

        // Create notification record
        const notification = await PriceNotification.create({
          userId: buyerId,
          vehicleId,
          sellerId,
          type: notificationType,
          oldPrice,
          newPrice,
          priceChange,
          priceChangePercent,
          vehicleInfo: {
            brand: vehicleInfo.brand,
            model: vehicleInfo.model,
            year: vehicleInfo.year,
            name: vehicleInfo.name,
            image: vehicleInfo.image,
            vehicleId: vehicleId,
          },
        });

        // Send email notification if enabled
        if (buyer.notificationPreferences?.emailNotifications) {
          const emailResult = await sendPriceChangeNotification(
            buyer.email,
            buyer.firstName,
            {
              brand: vehicleInfo.brand,
              model: vehicleInfo.model,
              year: vehicleInfo.year,
              name: vehicleInfo.name,
              image: vehicleInfo.image,
              vehicleId: vehicleId,
            },
            oldPrice,
            newPrice
          );

          if (emailResult.success) {
            await PriceNotification.findByIdAndUpdate(notification._id, {
              emailSent: true,
              emailSentAt: new Date(),
            });
          }
        }

        // Update user's unread notifications count
        const unreadCount = await PriceNotification.countDocuments({
          userId: buyerId,
          isRead: false,
        });

        await User.findByIdAndUpdate(buyerId, {
          unreadNotificationsCount: unreadCount,
        });

        notificationsCreated++;

        console.log(`✅ Price change notification created for buyer ${buyerId}`);
      } catch (err) {
        console.error(`Error creating notification for buyer ${buyerId}:`, err.message);
      }
    }

    console.log(`Total notifications created: ${notificationsCreated}`);
    return { success: true, notificationsCreated };
  } catch (error) {
    console.error('Error in notifyPriceChange:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  getPriceNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  notifyPriceChange,
};
