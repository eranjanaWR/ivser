/**
 * User Routes
 * Handles user profile and repairman location updates
 */

const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middlewares/auth');

// Update repairman location
router.put('/location', protect, authorize('repairman'), async (req, res) => {
  try {
    const { longitude, latitude } = req.body;
    
    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        message: 'Longitude and latitude are required'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        location: {
          type: 'Point',
          coordinates: [parseFloat(longitude), parseFloat(latitude)]
        }
      },
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'Location updated',
      data: {
        location: user.location
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating location',
      error: error.message
    });
  }
});

// Update repairman availability
router.put('/availability', protect, authorize('repairman'), async (req, res) => {
  try {
    const { isAvailable } = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        'repairmanDetails.isAvailable': isAvailable
      },
      { new: true }
    );
    
    res.json({
      success: true,
      message: `Availability set to ${isAvailable ? 'available' : 'unavailable'}`,
      data: {
        isAvailable: user.repairmanDetails.isAvailable
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating availability',
      error: error.message
    });
  }
});

// Update repairman details
router.put('/repairman-details', protect, authorize('repairman'), async (req, res) => {
  try {
    const { specialization, experience, serviceRadius } = req.body;
    
    const updates = {};
    if (specialization) updates['repairmanDetails.specialization'] = specialization;
    if (experience) updates['repairmanDetails.experience'] = experience;
    if (serviceRadius) updates['repairmanDetails.serviceRadius'] = serviceRadius;
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'Repairman details updated',
      data: {
        repairmanDetails: user.repairmanDetails
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating repairman details',
      error: error.message
    });
  }
});

// Update user role
router.put('/update-role', protect, async (req, res) => {
  try {
    const { role } = req.body;
    
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required'
      });
    }
    
    // Allow updating to buyer/seller for buyers
    const currentRole = req.user.role;
    const validRoles = ['buyer', 'seller', 'buyer/seller', 'repairman', 'admin1', 'admin2'];
    
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role'
      });
    }
    
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { role },
      { new: true }
    );
    
    res.json({
      success: true,
      message: 'User role updated',
      data: {
        user,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating user role',
      error: error.message
    });
  }
});

// Get user profile by ID (public profile) - must be last to avoid matching specific routes
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('firstName lastName profileImage role repairmanDetails createdAt');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message
    });
  }
});

module.exports = router;
