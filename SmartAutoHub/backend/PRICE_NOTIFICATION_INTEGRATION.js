/**
 * PRICE CHANGE NOTIFICATION INTEGRATION GUIDE
 * ===========================================
 * 
 * This document explains how to integrate the price change notification system
 * with your vehicle management code.
 * 
 * IMPLEMENTATION LOCATION:
 * When a seller updates a vehicle's price, call the notifyPriceChange() function
 * from the priceNotificationController.
 * 
 * ===========================================
 * INTEGRATION EXAMPLE
 * ===========================================
 */

/**
 * INTEGRATION POINT 1: In your Vehicle Update Controller
 * Location: backend/controllers/vehicleController.js or similar
 * 
 * When updating a vehicle price, do the following:
 */

// 1. Import the notification controller
const { notifyPriceChange } = require('../controllers/priceNotificationController');

// 2. In your vehicle update route/function, add this code AFTER the price is updated:

exports.updateVehicle = async (req, res) => {
  try {
    const vehicleId = req.params.id;
    const { price, ...otherUpdates } = req.body;
    
    // Find the vehicle BEFORE updating to get old price
    const oldVehicle = await Vehicle.findById(vehicleId);
    const oldPrice = oldVehicle.price;
    
    // Update the vehicle
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      vehicleId,
      { price, ...otherUpdates },
      { new: true }
    );
    
    // PRICE CHANGE NOTIFICATION INTEGRATION START ===
    // Only notify if price actually changed
    if (oldPrice !== updatedVehicle.price) {
      const newPrice = updatedVehicle.price;
      
      // Step 1: Get all buyers who have this vehicle in their wishlist
      const Wishlist = require('../models/Wishlist'); // Adjust path as needed
      const wishlistEntries = await Wishlist.find({ vehicleId: vehicleId });
      const buyerIds = wishlistEntries.map(entry => entry.userId);
      
      // Step 2: Prepare vehicle info snapshot for email
      const vehicleInfo = {
        vehicleId: updatedVehicle._id,
        brand: updatedVehicle.brand,
        model: updatedVehicle.model,
        year: updatedVehicle.year,
        image: updatedVehicle.images?.[0], // First image if available
      };
      
      // Step 3: Call the notification service
      const notificationResult = await notifyPriceChange(
        vehicleId,           // Vehicle ID
        oldPrice,            // Old price (number)
        newPrice,            // New price (number)
        vehicleInfo,         // Vehicle details snapshot
        req.user._id,        // Seller ID (from authenticated request)
        buyerIds             // Array of buyer IDs to notify
      );
      
      console.log(`Price change notifications sent to ${notificationResult.notificationCount} buyers`);
    }
    // PRICE CHANGE NOTIFICATION INTEGRATION END ===
    
    res.status(200).json({
      success: true,
      data: updatedVehicle,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * ===========================================
 * FUNCTION SIGNATURE
 * ===========================================
 * 
 * notifyPriceChange(vehicleId, oldPrice, newPrice, vehicleInfo, sellerId, buyerIds)
 * 
 * PARAMETERS:
 * -----------
 * 
 * @param {String} vehicleId
 *   - MongoDB ID of the vehicle
 *   - Example: "507f1f77bcf86cd799439011"
 * 
 * @param {Number} oldPrice
 *   - Previous price before update
 *   - Example: 1500000
 * 
 * @param {Number} newPrice
 *   - New price after update
 *   - Example: 1450000
 * 
 * @param {Object} vehicleInfo
 *   - Snapshot of vehicle details (for email content)
 *   - Required properties:
 *     {
 *       vehicleId: String,
 *       brand: String,      // e.g., "Honda"
 *       model: String,      // e.g., "Civic"
 *       year: Number,       // e.g., 2020
 *       image: String       // (optional) URL to vehicle image
 *     }
 *   - Example:
 *     {
 *       vehicleId: "507f1f77bcf86cd799439011",
 *       brand: "Toyota",
 *       model: "Prius",
 *       year: 2021,
 *       image: "https://example.com/image.jpg"
 *     }
 * 
 * @param {String} sellerId
 *   - MongoDB ID of the seller who updated the price
 *   - Example: "507f1f77bcf86cd799439012"
 * 
 * @param {Array<String>} buyerIds
 *   - Array of MongoDB user IDs who have this vehicle in wishlist
 *   - Example: ["507f1f77bcf86cd799439013", "507f1f77bcf86cd799439014"]
 *   - Can be empty array if no buyers are watching
 * 
 * RETURN VALUE:
 * ----------
 * Returns Promise that resolves to:
 * {
 *   success: true,
 *   notificationCount: Number,  // How many notifications were created
 *   emailCount: Number,         // How many emails were sent
 *   message: String
 * }
 * 
 * ===========================================
 * WHAT THE FUNCTION DOES
 * ===========================================
 * 
 * 1. Creates a PriceNotification record in database for EACH buyer
 *    - Stores old price, new price, change amount, change percentage
 *    - Stores type: 'price_increase' or 'price_decrease'
 *    - Stores vehicle info snapshot for email content
 * 
 * 2. Sends email to each buyer (if they have emailNotifications enabled)
 *    - Email shows price change with color coding:
 *      * RED background for price INCREASE
 *      * GREEN background for price DECREASE
 *    - Email includes vehicle details and change percentage
 * 
 * 3. Updates buyer's User.unreadNotificationsCount for UI badge
 *    - So notification bell shows "5" if 5 unread notifications
 * 
 * 4. Returns count of notifications created and emails sent
 * 
 * ===========================================
 * IMPORTANT NOTES
 * ===========================================
 * 
 * ✓ ERROR HANDLING:
 *   - The function handles validation internally
 *   - Invalid parameters will reject the Promise with error
 *   - Email failures don't stop notification creation
 * 
 * ✓ ASYNC/AWAIT:
 *   - Always use 'await' when calling this function
 *   - It's a Promise-based function
 * 
 * ✓ BUYER PRIVACY:
 *   - Only buyers who have this vehicle in their wishlist get notified
 *   - Wishlist model must have: userId, vehicleId fields
 * 
 * ✓ EMAIL PREFERENCES:
 *   - Emails only send if buyer has priceChangeNotifications enabled
 *   - Notifications are created regardless of email preference
 *   - Frontend can show 'Email sent: yes/no' in notification details
 * 
 * ✓ PERFORMANCE:
 *   - Function uses bulk insert for efficiency with many buyers
 *   - Emails are sent in parallel for all buyers
 * 
 * ===========================================
 * FRONTEND DISPLAY
 * ===========================================
 * 
 * After implementing this, users will see:
 * 
 * 1. NOTIFICATION BELL (top-right navbar)
 *    - Badge shows unread count
 *    - Click to see 5 most recent notifications
 *    - Color-coded: Red trending up (increase), Green trending down (decrease)
 * 
 * 2. NOTIFICATION HISTORY PAGE (/notifications)
 *    - Full list with pagination
 *    - Filters: by type, by read status
 *    - Mark as read functionality
 *    - Delete notification button
 * 
 * 3. EMAIL NOTIFICATION
 *    - Automatic email sent to buyer's email address
 *    - Shows vehicle name, price change, percentage
 *    - Color-coded price display (red/green)
 *    - View Vehicle button links to vehicle page
 * 
 * ===========================================
 * TESTING
 * ===========================================
 * 
 * To test the integration:
 * 
 * 1. Add a vehicle to your wishlist (as buyer user)
 * 2. Switch to seller account
 * 3. Update that vehicle's price
 * 4. Check notification bell badge increases
 * 5. Click notification bell to see new alert
 * 6. Check your email for price change notification
 * 7. Go to /notifications page to see full history
 * 
 * ===========================================
 * TROUBLESHOOTING
 * ===========================================
 * 
 * Issue: Notifications not appearing
 * Solution: Check that buyerIds array contains valid MongoDB IDs
 * 
 * Issue: Emails not sending
 * Solution: 
 * - Check buyer has priceChangeNotifications enabled in User settings
 * - Check .env has EMAIL_USER and EMAIL_PASS configured
 * - Check Gmail app password is correct (not regular password)
 * 
 * Issue: Bell badge not showing count
 * Solution:
 * - Verify authentication middleware is protecting /user/price-notifications/count/unread route
 * - Check token is being sent in Authorization header
 * 
 * ===========================================
 * FILE LOCATIONS
 * ===========================================
 * 
 * Backend Implementation:
 * - Controller: backend/controllers/priceNotificationController.js (line 115+)
 * - Routes: backend/routes/priceNotifications.js
 * - Model: backend/models/PriceNotification.js
 * 
 * Frontend Components:
 * - Notification Bell: frontend/src/components/NotificationBell.js
 * - History Page: frontend/src/pages/NotificationHistoryPage.js
 * - Email Template: backend/utils/email.js (sendPriceChangeNotification function)
 * 
 * ===========================================
 */

// ============ QUICK REFERENCE ============

/*
// Quick Copy-Paste Integration:

// 1. Add at top of your vehicle controller:
const { notifyPriceChange } = require('../controllers/priceNotificationController');

// 2. In your update function, after price is updated:
if (oldPrice !== newPrice) {
  const buyerIds = await getWishlistBuyersForVehicle(vehicleId);
  await notifyPriceChange(
    vehicleId,
    oldPrice,
    newPrice,
    {
      vehicleId,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      image: vehicle.images?.[0]
    },
    req.user._id,
    buyerIds
  );
}
*/
