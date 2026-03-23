/**
 * Vehicle Controller
 * Handles CRUD operations for vehicles
 */

const Vehicle = require('../models/Vehicle');
const { paginate, formatPaginationResponse } = require('../utils/helpers');
const notificationController = require('./notificationController');

/**
 * @desc    Get all vehicles with filters
 * @route   GET /api/vehicles
 * @access  Public
 */
const getVehicles = async (req, res) => {
  try {
    const { 
      brand, model, minPrice, maxPrice, minYear, maxYear,
      fuelType, transmission, bodyType, condition, city,
      sortBy, sortOrder, page, limit, search
    } = req.query;
    
    // Build filter object - only show active vehicles
    const filter = { status: 'active' };
    
    if (brand) filter.brand = new RegExp(brand, 'i');
    if (model) filter.model = new RegExp(model, 'i');
    if (fuelType) filter.fuelType = fuelType;
    if (transmission) filter.transmission = transmission;
    if (bodyType) filter.bodyType = bodyType;
    if (condition) filter.condition = condition;
    if (city) filter['location.city'] = new RegExp(city, 'i');
    
    // Price range
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    
    // Year range
    if (minYear || maxYear) {
      filter.year = {};
      if (minYear) filter.year.$gte = Number(minYear);
      if (maxYear) filter.year.$lte = Number(maxYear);
    }
    
    // Text search
    if (search) {
      filter.$text = { $search: search };
    }
    
    // Sorting
    const sortOptions = {};
    if (sortBy) {
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOptions.createdAt = -1; // Default: newest first
    }
    
    // Pagination
    const { skip, limit: limitNum, page: pageNum } = paginate(page, limit);
    
    // Execute query
    const [vehicles, total] = await Promise.all([
      Vehicle.find(filter)
        .populate('sellerId', 'firstName lastName email phone profileImage isEmailVerified isFaceVerified')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Vehicle.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      ...formatPaginationResponse(vehicles, total, pageNum, limitNum)
    });
  } catch (error) {
    console.error('Get vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicles',
      error: error.message
    });
  }
};

/**
 * @desc    Get single vehicle by ID
 * @route   GET /api/vehicles/:id
 * @access  Public
 */
const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('sellerId', 'firstName lastName email phone profileImage isEmailVerified isIDVerified isFaceVerified');
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }
    
    // Increment views
    vehicle.views += 1;
    await vehicle.save({ validateBeforeSave: false });
    
    res.json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    console.error('Get vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicle',
      error: error.message
    });
  }
};

/**
 * @desc    Create a new vehicle listing
 * @route   POST /api/vehicles
 * @access  Private (Verified Sellers only)
 */
const createVehicle = async (req, res) => {
  try {
    const {
      brand, model, year, mileage, price, fuelType, transmission,
      type, bodyType, color, engineCapacity, engineSize, doors, seats, condition,
      description, features, vin, location, manufacturedCountry
    } = req.body;
    
    // Handle image uploads
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(file => file.path);
    }
    
    // Parse features if it's a string or array
    let parsedFeatures = features;
    if (typeof features === 'string') {
      try {
        parsedFeatures = JSON.parse(features);
      } catch {
        parsedFeatures = features.split(',').map(f => f.trim()).filter(Boolean);
      }
    } else if (Array.isArray(features)) {
      parsedFeatures = features.filter(Boolean);
    }
    
    // Convert enum values to lowercase
    const vehicleData = {
      sellerId: req.user._id,
      brand: brand?.trim(),
      model: model?.trim(),
      year: parseInt(year),
      mileage: parseInt(mileage),
      price: parseFloat(price),
      fuelType: fuelType?.toLowerCase(),
      transmission: transmission?.toLowerCase(),
      bodyType: (type || bodyType)?.toLowerCase(),
      type: (type || bodyType)?.toLowerCase(),
      color: color?.trim(),
      engineSize: engineCapacity || engineSize,
      engineCapacity: engineCapacity || engineSize,
      doors: doors ? parseInt(doors) : undefined,
      seats: seats ? parseInt(seats) : undefined,
      condition: condition?.toLowerCase(),
      description: description?.trim(),
      features: parsedFeatures,
      images,
      vin: vin?.trim(),
      manufacturedCountry: manufacturedCountry?.trim()
    };
    
    // Parse location if it's a string (JSON)
    if (location && typeof location === 'string') {
      try {
        vehicleData.location = JSON.parse(location);
      } catch {
        vehicleData.location = { city: location, country: 'Sri Lanka' };
      }
    } else {
      vehicleData.location = location;
    }
    
    // Remove undefined fields
    Object.keys(vehicleData).forEach(key => vehicleData[key] === undefined && delete vehicleData[key]);
    
    // Create vehicle
    const vehicle = await Vehicle.create(vehicleData);
    
    // Check and send notifications to subscribed users
    try {
      await notificationController.checkAndNotify(vehicle);
    } catch (notifError) {
      console.error('Error in checkAndNotify:', notifError);
    }
    
    res.status(201).json({
      success: true,
      message: 'Vehicle listed successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('Create vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating vehicle listing',
      error: error.message
    });
  }
};

/**
 * @desc    Update a vehicle listing
 * @route   PUT /api/vehicles/:id
 * @access  Private (Owner only)
 */
const updateVehicle = async (req, res) => {
  try {
    let vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }
    
    // Check ownership
    if (vehicle.sellerId.toString() !== req.user._id.toString() && 
        !['admin1', 'admin2'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this vehicle'
      });
    }
    
    // Handle image uploads
    if (req.files && req.files.length > 0) {
      const newImages = req.files.map(file => file.path);
      req.body.images = [...(vehicle.images || []), ...newImages];
    }
    
    // Parse features if needed
    if (req.body.features && typeof req.body.features === 'string') {
      try {
        req.body.features = JSON.parse(req.body.features);
      } catch {
        req.body.features = req.body.features.split(',').map(f => f.trim());
      }
    }
    
    // Parse location if needed
    if (req.body.location && typeof req.body.location === 'string') {
      req.body.location = JSON.parse(req.body.location);
    }

    // Check if status is changing to 'available' to trigger notifications
    const wasUnavailable = vehicle.status !== 'available';
    const isBecomingAvailable = req.body.status === 'available';
    
    vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    // Trigger notifications if vehicle is now available
    if (isBecomingAvailable && wasUnavailable) {
      console.log(`Vehicle ${vehicle._id} is now available. Checking for subscriptions...`);
      notificationController.checkAndNotify(vehicle);
    }
    
    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('Update vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating vehicle',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a vehicle listing
 * @route   DELETE /api/vehicles/:id
 * @access  Private (Owner only)
 */
const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }
    
    // Check ownership
    if (vehicle.sellerId.toString() !== req.user._id.toString() && 
        !['admin1', 'admin2'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this vehicle'
      });
    }
    
    await Vehicle.findByIdAndDelete(req.params.id);
    
    res.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    console.error('Delete vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting vehicle',
      error: error.message
    });
  }
};

/**
 * @desc    Get vehicles by seller
 * @route   GET /api/vehicles/seller/:sellerId
 * @access  Public
 */
const getVehiclesBySeller = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { skip, limit: limitNum, page: pageNum } = paginate(page, limit);
    
    const filter = { sellerId: req.params.sellerId };
    
    const [vehicles, total] = await Promise.all([
      Vehicle.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Vehicle.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      ...formatPaginationResponse(vehicles, total, pageNum, limitNum)
    });
  } catch (error) {
    console.error('Get seller vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching seller vehicles',
      error: error.message
    });
  }
};

/**
 * @desc    Get my vehicles (seller's own listings)
 * @route   GET /api/vehicles/my-vehicles
 * @access  Private
 */
const getMyVehicles = async (req, res) => {
  try {
    const { page, limit, status } = req.query;
    const { skip, limit: limitNum, page: pageNum } = paginate(page, limit);
    
    const filter = { sellerId: req.user._id };
    if (status) filter.status = status;
    
    const [vehicles, total] = await Promise.all([
      Vehicle.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Vehicle.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      ...formatPaginationResponse(vehicles, total, pageNum, limitNum)
    });
  } catch (error) {
    console.error('Get my vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching your vehicles',
      error: error.message
    });
  }
};

/**
 * @desc    Save/unsave vehicle
 * @route   POST /api/vehicles/:id/save
 * @access  Private
 */
const toggleSaveVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }
    
    const userId = req.user._id;
    const isSaved = vehicle.savedBy.includes(userId);
    
    if (isSaved) {
      vehicle.savedBy = vehicle.savedBy.filter(id => id.toString() !== userId.toString());
    } else {
      vehicle.savedBy.push(userId);
    }
    
    await vehicle.save({ validateBeforeSave: false });
    
    res.json({
      success: true,
      message: isSaved ? 'Vehicle unsaved' : 'Vehicle saved',
      data: { isSaved: !isSaved }
    });
  } catch (error) {
    console.error('Toggle save vehicle error:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving vehicle',
      error: error.message
    });
  }
};

/**
 * @desc    Get saved vehicles
 * @route   GET /api/vehicles/saved
 * @access  Private
 */
const getSavedVehicles = async (req, res) => {
  try {
    const { page, limit } = req.query;
    const { skip, limit: limitNum, page: pageNum } = paginate(page, limit);
    
    const filter = { savedBy: req.user._id, status: 'available' };
    
    const [vehicles, total] = await Promise.all([
      Vehicle.find(filter)
        .populate('sellerId', 'firstName lastName profileImage')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Vehicle.countDocuments(filter)
    ]);
    
    res.json({
      success: true,
      ...formatPaginationResponse(vehicles, total, pageNum, limitNum)
    });
  } catch (error) {
    console.error('Get saved vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching saved vehicles',
      error: error.message
    });
  }
};

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehiclesBySeller,
  getMyVehicles,
  toggleSaveVehicle,
  getSavedVehicles
};
