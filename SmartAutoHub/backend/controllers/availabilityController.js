/**
 * Dealer Availability Controller
 * Handles test drive availability settings for sellers
 */

const mongoose = require('mongoose');
const DealerAvailability = require('../models/DealerAvailability');

/**
 * Save or update dealer availability slots
 * POST /api/availability
 */
exports.saveAvailability = async (req, res) => {
  try {
    console.log('=== SAVE AVAILABILITY REQUEST ===');
    console.log('User ID:', req.user?._id);
    console.log('Request body:', req.body);
    
    const { availabilitySlots } = req.body;
    const sellerId = req.user._id;
    
    console.log('Extracted sellerId:', sellerId);
    console.log('Extracted availabilitySlots:', availabilitySlots);

    // Validate availability slots
    if (!Array.isArray(availabilitySlots)) {
      console.log('❌ Validation failed: Availability slots must be an array');
      return res.status(400).json({
        success: false,
        message: 'Availability slots must be an array',
      });
    }

    // Validate each slot
    for (const slot of availabilitySlots) {
      if (!slot.startTime || !slot.endTime || !slot.days || slot.enabled === undefined) {
        console.log('❌ Validation failed: Missing required fields in slot');
        return res.status(400).json({
          success: false,
          message: 'Each slot must have startTime, endTime, days array, and enabled status',
        });
      }

      if (slot.days.length !== 7) {
        console.log('❌ Validation failed: Days array length is not 7');
        return res.status(400).json({
          success: false,
          message: 'Days array must have exactly 7 values (Monday-Sunday)',
        });
      }
    }

    console.log('✅ Validation passed');

    // Find existing availability record
    console.log('🔍 Finding existing availability for sellerId:', sellerId);
    let availability = await DealerAvailability.findOne({ sellerId });
    console.log('Found existing record:', availability ? 'YES' : 'NO');

    if (availability) {
      console.log('📝 Updating existing record');
      availability.availabilitySlots = availabilitySlots;
      availability.updatedAt = new Date();
    } else {
      console.log('➕ Creating new record');
      availability = new DealerAvailability({
        sellerId,
        availabilitySlots,
      });
    }

    // Save to database
    console.log('💾 About to save to database...');
    console.log('Document before save:', JSON.stringify(availability, null, 2));
    
    const savedDoc = await availability.save();
    
    console.log('✅ Document saved successfully');
    console.log('Saved document ID:', savedDoc._id);
    console.log('Saved document:', JSON.stringify(savedDoc, null, 2));

    res.status(200).json({
      success: true,
      message: 'Test drive availability updated successfully',
      data: savedDoc,
    });
  } catch (error) {
    console.error('❌ ERROR in saveAvailability:');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: error.message || 'Error saving availability settings',
    });
  }
};

/**
 * Get dealer availability slots
 * GET /api/availability
 */
exports.getAvailability = async (req, res) => {
  try {
    const sellerId = req.user._id;
    console.log('=== GET AVAILABILITY REQUEST ===');
    console.log('Fetching availability for seller:', sellerId);

    const availability = await DealerAvailability.findOne({ sellerId });
    console.log('Found availability:', availability);

    if (!availability) {
      console.log('No availability found, returning default');
      return res.status(200).json({
        success: true,
        message: 'Default availability: 24/7 (All Days)',
        data: {
          availabilitySlots: [],
          isDefault24x7: true,
        },
      });
    }

    console.log('Returning availability with slots:', availability.availabilitySlots);
    res.status(200).json({
      success: true,
      data: availability,
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching availability settings',
    });
  }
};

/**
 * Get availability for a specific seller (public)
 * GET /api/availability/seller/:sellerId
 */
exports.getSellerAvailability = async (req, res) => {
  try {
    const { sellerId } = req.params;

    // Convert string sellerId to MongoDB ObjectId
    let sellerObjectId;
    try {
      sellerObjectId = new mongoose.Types.ObjectId(sellerId);
    } catch (err) {
      console.error('❌ Invalid seller ID format:', sellerId);
      return res.status(400).json({
        success: false,
        message: 'Invalid seller ID format',
      });
    }

    const availability = await DealerAvailability.findOne({ sellerId: sellerObjectId });
    console.log('📦 Seller availability query - sellerId:', sellerObjectId, ', found:', availability ? 'YES' : 'NO');

    if (!availability) {
      return res.status(200).json({
        success: true,
        message: 'Default availability: 24/7 (All Days)',
        data: {
          availabilitySlots: [],
          isDefault24x7: true,
        },
      });
    }

    res.status(200).json({
      success: true,
      data: availability,
    });
  } catch (error) {
    console.error('Error fetching seller availability:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error fetching seller availability',
    });
  }
};

/**
 * Delete an availability slot
 * DELETE /api/availability/slot/:slotId
 */
exports.deleteSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const sellerId = req.user._id;

    const availability = await DealerAvailability.findOne({ sellerId });

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'Availability settings not found',
      });
    }

    // Remove the slot
    availability.availabilitySlots = availability.availabilitySlots.filter((slot) => slot.id !== slotId);
    await availability.save();

    res.status(200).json({
      success: true,
      message: 'Slot deleted successfully',
      data: availability,
    });
  } catch (error) {
    console.error('Error deleting slot:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error deleting slot',
    });
  }
};

/**
 * Reset availability to default 24/7
 * DELETE /api/availability
 */
exports.resetAvailability = async (req, res) => {
  try {
    const sellerId = req.user._id;

    await DealerAvailability.deleteOne({ sellerId });

    res.status(200).json({
      success: true,
      message: 'Availability reset to default (24/7)',
      data: {
        slots: [],
        isDefault24x7: true,
      },
    });
  } catch (error) {
    console.error('Error resetting availability:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error resetting availability',
    });
  }
};
