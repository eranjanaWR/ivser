const { Notification, Vehicle, UserAlert } = require('../models');
const { sendEmail } = require('../utils/email');

exports.subscribe = async (req, res) => {
  try {
    const { email, phone, searchCriteria } = req.body;

    console.log('Subscribe request received:', { email, phone, searchCriteria });

    // Validation
    if (!email || !phone) {
      console.log('Missing email or phone');
      return res.status(400).json({ message: 'Email and phone are required' });
    }

    // Normalize search criteria for comparison
    const normalizedCriteria = {
      search: (searchCriteria.search || '').trim().toLowerCase(),
      brand: (searchCriteria.brand || '').trim(),
      vehicleType: (searchCriteria.vehicleType || '').trim().toLowerCase(),
      fuelType: (searchCriteria.fuelType || '').trim(),
      transmission: (searchCriteria.transmission || '').trim(),
      condition: (searchCriteria.condition || '').trim(),
      minPrice: Number(searchCriteria.minPrice) || 0,
      maxPrice: Number(searchCriteria.maxPrice) || 50000000,
    };

    // Create a comparison key for the normalized criteria
    const criteriaKey = JSON.stringify(normalizedCriteria);

    // Get all user's subscriptions and check manually
    const userSubscriptions = await Notification.find({
      email: email.toLowerCase(),
    });

    const isDuplicate = userSubscriptions.some((sub) => {
      const existingNormalized = {
        search: (sub.searchCriteria?.search || '').trim().toLowerCase(),
        brand: (sub.searchCriteria?.brand || '').trim(),
        vehicleType: (sub.searchCriteria?.vehicleType || '').trim().toLowerCase(),
        fuelType: (sub.searchCriteria?.fuelType || '').trim(),
        transmission: (sub.searchCriteria?.transmission || '').trim(),
        condition: (sub.searchCriteria?.condition || '').trim(),
        minPrice: Number(sub.searchCriteria?.minPrice) || 0,
        maxPrice: Number(sub.searchCriteria?.maxPrice) || 50000000,
      };
      return JSON.stringify(existingNormalized) === criteriaKey;
    });

    if (isDuplicate) {
      console.log('Subscription already exists for these exact normalized criteria');
      return res.status(400).json({
        message: 'You are already subscribed to notifications for this search. Each search can only have one active subscription.',
      });
    }

    // Create new notification subscription
    const notification = new Notification({
      email: email.toLowerCase(),
      phone,
      searchCriteria: searchCriteria || {},
      isActive: true,
    });

    const saved = await notification.save();
    console.log('Notification saved:', saved._id);

    // Send confirmation email
    const emailResult = await sendEmail({
      to: email,
      subject: 'Notification Subscription Confirmed - SmartAuto Hub',
      template: 'notification-subscription',
      data: {
        email,
        searchCriteria,
      },
    });
    
    console.log('Confirmation email sent:', emailResult);

    res.status(201).json({
      message: 'Successfully subscribed to notifications',
      notification,
    });
  } catch (err) {
    console.error('Subscribe notification error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({
      message: 'Failed to subscribe to notifications',
      error: err.message,
    });
  }
};

/**
 * Unsubscribe from notifications
 */
exports.unsubscribe = async (req, res) => {
  try {
    const { email, id } = req.body;

    if (!email && !id) {
      return res.status(400).json({ message: 'Email or ID is required' });
    }

    const query = id ? { _id: id } : { email: email.toLowerCase() };
    await Notification.updateOne(query, { isActive: false });

    res.json({ message: 'Successfully unsubscribed from notifications' });
  } catch (err) {
    console.error('Unsubscribe error:', err);
    res.status(500).json({
      message: 'Failed to unsubscribe',
      error: err.message,
    });
  }
};

/**
 * Check and send notifications for new vehicles
 * This function should be called when a new vehicle is added
 */
exports.checkAndNotify = async (vehicle) => {
  try {
    console.log(`\n========== NOTIFICATION CHECK START ==========`);
    console.log(`Vehicle ID: ${vehicle._id}`);
    console.log(`Vehicle: ${vehicle.brand} ${vehicle.model}`);
    console.log(`Price: ${vehicle.price}`);
    console.log(`Location: ${vehicle.location?.city || 'N/A'}`);
    
    if (!vehicle || !vehicle.location || !vehicle.location.city) {
      console.log('❌ Vehicle missing location info for notifications');
      return;
    }

    const vehicleBrand = (vehicle.brand || '').toLowerCase();
    const vehicleModel = (vehicle.model || '').toLowerCase();
    const vehicleCity = (vehicle.location.city || '').toLowerCase();

    console.log(`\nSearching for subscriptions matching: ${vehicleBrand} ${vehicleModel}`);

    // Get all active subscriptions
    const allSubscriptions = await Notification.find({
      isActive: true,
    });

    console.log(`📋 Total active subscriptions in database: ${allSubscriptions.length}`);
    
    if (allSubscriptions.length > 0) {
      console.log(`\nSubscriptions found:`);
      allSubscriptions.forEach((sub, idx) => {
        console.log(`  ${idx+1}. Email: ${sub.email}, Search: "${sub.searchCriteria?.search || ''}", Brand: "${sub.searchCriteria?.brand || ''}"`);
      });
    }

    // Filter subscriptions that match this vehicle
    const matchingSubscriptions = allSubscriptions.filter((subscription) => {
      const searchTerm = (subscription.searchCriteria?.search || '').trim().toLowerCase();
      const brand = (subscription.searchCriteria?.brand || '').trim().toLowerCase();
      const vehicleType = (subscription.searchCriteria?.vehicleType || '').trim().toLowerCase();
      const fuelType = (subscription.searchCriteria?.fuelType || '').trim();
      const transmission = (subscription.searchCriteria?.transmission || '').trim();
      const condition = (subscription.searchCriteria?.condition || '').trim();
      const minPrice = Number(subscription.searchCriteria?.minPrice) || 0;
      const maxPrice = Number(subscription.searchCriteria?.maxPrice) || 50000000;

      // Check brand match
      const brandMatches = brand && vehicleBrand === brand;

      // Check search term match (could be brand, model, or keyword)
      const searchMatches = searchTerm && (
        vehicleBrand.includes(searchTerm) ||
        vehicleModel.includes(searchTerm) ||
        searchTerm.includes(vehicleBrand) ||
        searchTerm.includes(vehicleModel)
      );

      // Check price match
      const priceMatches = vehicle.price >= minPrice && vehicle.price <= maxPrice;

      // Check other criteria (optional filters - missing criteria means it's satisfied)
      const fuelMatches = !fuelType || vehicle.fuelType === fuelType;
      const transmissionMatches = !transmission || vehicle.transmission === transmission;
      const conditionMatches = !condition || vehicle.condition === condition;
      const vehicleTypeMatches = !vehicleType || vehicle.bodyType === vehicleType;

      // If brand or search term is specified, at least one must match
      // If neither is specified, that filter is satisfied
      const hasBrandOrSearchCriteria = brand || searchTerm;
      const brandOrSearchMatches = !hasBrandOrSearchCriteria || brandMatches || searchMatches;

      // Match if: (brand OR search term if specified) AND price AND all optional criteria match
      const isMatch = brandOrSearchMatches && priceMatches && fuelMatches && transmissionMatches && conditionMatches && vehicleTypeMatches;

      if (isMatch) {
        console.log(`✓ MATCH for ${subscription.email} - Brand: ${brandMatches}, Search: ${searchMatches}, Price: ${priceMatches}, Type: ${vehicleTypeMatches}, Fuel: ${fuelMatches}, Trans: ${transmissionMatches}`);
      }
      return isMatch;
    });

    console.log(`\n✉️  Found ${matchingSubscriptions.length} matching subscriptions`);

    // Send email notifications and create in-app alerts
    for (const subscription of matchingSubscriptions) {
      try {
        console.log(`\n📧 Sending notification to ${subscription.email}...`);
        
        // Get user preferences
        const user = await require('../models').User.findOne({ email: subscription.email });
        const preferences = user?.notificationPreferences || { systemAlerts: true, emailNotifications: true };
        
        console.log(`  Preferences: System Alerts=${preferences.systemAlerts}, Email=${preferences.emailNotifications}`);

        // Send email if email notifications are enabled
        if (preferences.emailNotifications) {
          try {
            const emailResult = await sendEmail({
              to: subscription.email,
              subject: `🚗 ${vehicle.brand} ${vehicle.model} Available - SmartAuto Hub`,
              template: 'vehicle-notification',
              data: {
                vehicle: {
                  _id: vehicle._id,
                  brand: vehicle.brand,
                  model: vehicle.model,
                  year: vehicle.year,
                  price: vehicle.price,
                  image: vehicle.images?.[0],
                  condition: vehicle.condition,
                  fuelType: vehicle.fuelType,
                  city: vehicle.location.city,
                },
              },
            });
            console.log(`✓ Email sent to ${subscription.email}`);
          } catch (err) {
            console.error(`✗ Failed to send email to ${subscription.email}:`, err.message);
          }
        } else {
          console.log(`⊘ Email notification skipped for ${subscription.email} (disabled in preferences)`);
        }

        // Create in-app alert if system alerts are enabled
        if (preferences.systemAlerts && user) {
          try {
            const alert = await UserAlert.create({
              userId: user._id,
              vehicleId: vehicle._id,
              vehicleBrand: vehicle.brand,
              vehicleModel: vehicle.model,
              vehiclePrice: vehicle.price,
              vehicleImage: vehicle.images?.[0] || null,
              sellerName: vehicle.sellerName || 'Not specified',
              alertType: 'available',
              message: `🎉 ${vehicle.brand} ${vehicle.model} is now available for ₹${vehicle.price}! Seller: ${vehicle.sellerName || 'Not specified'}`,
              isSeen: false
            });
            console.log(`✓ In-app alert created for user ${user._id}`);
          } catch (alertErr) {
            console.error(`✗ Failed to create in-app alert for ${subscription.email}:`, alertErr.message);
          }
        } else if (!preferences.systemAlerts) {
          console.log(`⊘ System alert skipped for ${subscription.email} (disabled in preferences)`);
        }

        // Update notification record
        await Notification.updateOne(
          { _id: subscription._id },
          {
            notificationsSent: (subscription.notificationsSent || 0) + 1,
            lastNotifiedAt: new Date(),
          }
        );
      } catch (err) {
        console.error(`✗ Failed to process notification for ${subscription.email}:`, err.message);
      }
    }
    
    console.log(`========== NOTIFICATION CHECK END ==========\n`);
  } catch (err) {
    console.error('❌ Check and notify error:', err);
  }
};

/**
 * Get user's notification subscriptions
 */
exports.getUserSubscriptions = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const subscriptions = await Notification.find({
      email: email.toLowerCase(),
      isActive: true,
    });

    res.json({
      subscriptions,
      count: subscriptions.length,
    });
  } catch (err) {
    console.error('Get subscriptions error:', err);
    res.status(500).json({
      message: 'Failed to fetch subscriptions',
      error: err.message,
    });
  }
};

/**
 * Get unseen alerts for logged-in user
 * @route   GET /api/notifications/alerts/unseen
 * @access  Private
 */
exports.getUnseenAlerts = async (req, res) => {
  try {
    const userId = req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const unseeAlerts = await UserAlert.find({
      userId: userId,
      isSeen: false
    })
      .sort({ createdAt: -1 })
      .limit(10);

    console.log(`📋 Found ${unseeAlerts.length} unseen alerts for user ${userId}`);

    res.json({
      success: true,
      data: unseeAlerts,
      count: unseeAlerts.length
    });
  } catch (err) {
    console.error('Get unseen alerts error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch alerts',
      error: err.message
    });
  }
};

/**
 * Mark alerts as seen
 * @route   PUT /api/notifications/alerts/mark-seen
 * @access  Private
 */
exports.markAlertsSeen = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { alertIds } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!alertIds || !Array.isArray(alertIds) || alertIds.length === 0) {
      // If no specific alerts provided, mark all unseen alerts as seen
      const result = await UserAlert.updateMany(
        { userId: userId, isSeen: false },
        { isSeen: true, seenAt: new Date() }
      );
      console.log(`✓ Marked ${result.modifiedCount} alerts as seen for user ${userId}`);
      return res.json({
        success: true,
        message: 'All alerts marked as seen',
        updatedCount: result.modifiedCount
      });
    }

    // Mark specific alerts as seen
    const result = await UserAlert.updateMany(
      { _id: { $in: alertIds }, userId: userId },
      { isSeen: true, seenAt: new Date() }
    );

    console.log(`✓ Marked ${result.modifiedCount} specific alerts as seen for user ${userId}`);

    res.json({
      success: true,
      message: 'Alerts marked as seen',
      updatedCount: result.modifiedCount
    });
  } catch (err) {
    console.error('Mark alerts seen error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to mark alerts as seen',
      error: err.message
    });
  }
};

/**
 * Get user's notification preferences
 * @route   GET /api/notifications/preferences
 * @access  Private
 */
exports.getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await require('../models').User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const preferences = user.notificationPreferences || {
      systemAlerts: true,
      emailNotifications: true,
    };

    res.json({
      success: true,
      preferences,
    });
  } catch (err) {
    console.error('Get notification preferences error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notification preferences',
      error: err.message,
    });
  }
};

/**
 * Update user's notification preferences
 * @route   PUT /api/notifications/preferences
 * @access  Private
 */
exports.updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { systemAlerts, emailNotifications } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Validate input
    if (typeof systemAlerts !== 'boolean' && typeof emailNotifications !== 'boolean') {
      return res.status(400).json({ 
        message: 'systemAlerts and emailNotifications must be boolean values' 
      });
    }

    const updateData = {};
    if (typeof systemAlerts === 'boolean') {
      updateData['notificationPreferences.systemAlerts'] = systemAlerts;
    }
    if (typeof emailNotifications === 'boolean') {
      updateData['notificationPreferences.emailNotifications'] = emailNotifications;
    }

    const user = await require('../models').User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    console.log(`✓ Updated notification preferences for user ${userId}`);

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      preferences: user.notificationPreferences,
    });
  } catch (err) {
    console.error('Update notification preferences error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: err.message,
    });
  }
};
