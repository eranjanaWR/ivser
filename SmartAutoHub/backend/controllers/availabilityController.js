const mongoose = require('mongoose');
const DealerAvailability = require('../models/DealerAvailability');

/**
 * @desc    Save seller availability slots
 * @route   POST /api/availability
 * @access  Private
 */
const saveAvailability = async (req, res) => {
  try {
    const { availabilitySlots } = req.body;

    if (!Array.isArray(availabilitySlots)) {
      return res.status(400).json({
        success: false,
        message: 'availabilitySlots must be an array'
      });
    }

    for (const slot of availabilitySlots) {
      if (
        !slot ||
        !slot.startTime ||
        !slot.endTime ||
        !Array.isArray(slot.days) ||
        typeof slot.enabled !== 'boolean'
      ) {
        return res.status(400).json({
          success: false,
          message: 'Each slot must include startTime, endTime, days, and enabled'
        });
      }

      if (slot.days.length !== 7) {
        return res.status(400).json({
          success: false,
          message: 'days must contain exactly 7 values'
        });
      }
    }

    const availability = await DealerAvailability.findOneAndUpdate(
      { sellerId: req.user._id },
      { sellerId: req.user._id, availabilitySlots },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.json({
      success: true,
      message: 'Availability saved successfully',
      data: availability
    });
  } catch (error) {
    console.error('Save availability error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error saving availability',
      error: error.message
    });
  }
};

/**
 * @desc    Get current seller availability
 * @route   GET /api/availability
 * @access  Private
 */
const getAvailability = async (req, res) => {
  try {
    const availability = await DealerAvailability.findOne({ sellerId: req.user._id });

    if (!availability) {
      return res.json({
        success: true,
        data: {
          sellerId: req.user._id,
          availabilitySlots: [],
          isDefault24x7: true
        }
      });
    }

    return res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    console.error('Get availability error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching availability',
      error: error.message
    });
  }
};

/**
 * @desc    Get seller availability (public)
 * @route   GET /api/availability/seller/:sellerId
 * @access  Public
 */
const getSellerAvailability = async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid sellerId format'
      });
    }

    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);
    const availability = await DealerAvailability.findOne({ sellerId: sellerObjectId });

    if (!availability) {
      return res.json({
        success: true,
        data: {
          sellerId,
          availabilitySlots: [],
          isDefault24x7: true
        }
      });
    }

    return res.json({
      success: true,
      data: availability
    });
  } catch (error) {
    console.error('Get seller availability error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching seller availability',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a specific availability slot
 * @route   DELETE /api/availability/slot/:slotId
 * @access  Private
 */
const deleteSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const availability = await DealerAvailability.findOne({ sellerId: req.user._id });

    if (!availability) {
      return res.status(404).json({
        success: false,
        message: 'Availability not found'
      });
    }

    const originalCount = availability.availabilitySlots.length;
    availability.availabilitySlots = availability.availabilitySlots.filter((slot) => slot.id !== slotId);

    if (availability.availabilitySlots.length === originalCount) {
      return res.status(404).json({
        success: false,
        message: 'Slot not found'
      });
    }

    await availability.save();

    return res.json({
      success: true,
      message: 'Availability slot deleted successfully',
      data: availability
    });
  } catch (error) {
    console.error('Delete availability slot error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error deleting availability slot',
      error: error.message
    });
  }
};

/**
 * @desc    Reset availability to default 24x7
 * @route   DELETE /api/availability
 * @access  Private
 */
const resetAvailability = async (req, res) => {
  try {
    await DealerAvailability.deleteOne({ sellerId: req.user._id });

    return res.json({
      success: true,
      message: 'Availability reset to default 24x7'
    });
  } catch (error) {
    console.error('Reset availability error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error resetting availability',
      error: error.message
    });
  }
};

module.exports = {
  saveAvailability,
  getAvailability,
  getSellerAvailability,
  deleteSlot,
  resetAvailability
};
