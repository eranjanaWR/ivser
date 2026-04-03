/**
 * Vehicle Controller
 * Handles CRUD operations for vehicles
 */

const fs = require('fs');
const path = require('path');
const Vehicle = require('../models/Vehicle');
const Image = require('../models/Image');
const Boost = require('../models/Boost');
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
        .populate({
          path: 'images',
          select: 'filename mimeType order'  // Exclude imageData for list views (performance)
        })
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Vehicle.countDocuments(filter)
    ]);
    
    // Trim images to first one for list view (optimization)
    const trimmedVehicles = vehicles.map(vehicle => {
      const vehicleObj = vehicle.toObject();
      
      // Include first image ID or empty array
      vehicleObj.images = vehicleObj.images && vehicleObj.images.length > 0 
        ? [vehicleObj.images[0]] 
        : [];
      
      // Add a flag to indicate if vehicle has no images
      if (!vehicleObj.images.length) {
        vehicleObj.hasNoImages = true;
      }
      
      return vehicleObj;
    });
    
    res.json({
      success: true,
      ...formatPaginationResponse(trimmedVehicles, total, pageNum, limitNum)
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
      .populate('sellerId', 'firstName lastName email phone profileImage isEmailVerified isIDVerified isFaceVerified')
      .populate({
        path: 'images',
        select: 'filename imageData mimeType order'
      });
    
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
      images: [],
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
    
    // Create vehicle first
    const vehicle = await Vehicle.create(vehicleData);
    
    // Handle image uploads - save to database
    if (req.files && req.files.length > 0) {
      const imageIds = [];
      
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        try {
          // Read file from disk
          const fileData = fs.readFileSync(file.path);
          
          // Convert to base64
          const base64Data = fileData.toString('base64');
          
          // Get MIME type
          const ext = path.extname(file.originalname).toLowerCase();
          const mimeTypeMap = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
          };
          const mimeType = mimeTypeMap[ext] || file.mimetype || 'image/jpeg';
          
          // Create image document in database
          const imageDoc = await Image.create({
            vehicleId: vehicle._id,
            filename: file.originalname,
            imageData: base64Data,
            mimeType: mimeType,
            fileSize: file.size,
            order: i
          });
          
          imageIds.push(imageDoc._id);
          
          // Delete file from disk after saving to database
          fs.unlinkSync(file.path);
        } catch (imageError) {
          console.error('Error saving image to database:', imageError);
          // Continue with other images even if one fails
        }
      }
      
      // Update vehicle with image references
      vehicle.images = imageIds;
      await vehicle.save();
    }
    
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
    
    // Handle new image uploads - save to database
    if (req.files && req.files.length > 0) {
      const existingImageCount = vehicle.images ? vehicle.images.length : 0;
      
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        try {
          // Read file from disk
          const fileData = fs.readFileSync(file.path);
          
          // Convert to base64
          const base64Data = fileData.toString('base64');
          
          // Get MIME type
          const ext = path.extname(file.originalname).toLowerCase();
          const mimeTypeMap = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp'
          };
          const mimeType = mimeTypeMap[ext] || file.mimetype || 'image/jpeg';
          
          // Create image document in database
          const imageDoc = await Image.create({
            vehicleId: vehicle._id,
            filename: file.originalname,
            imageData: base64Data,
            mimeType: mimeType,
            fileSize: file.size,
            order: existingImageCount + i
          });
          
          // Add to vehicle images array
          vehicle.images.push(imageDoc._id);
          
          // Delete file from disk after saving to database
          fs.unlinkSync(file.path);
        } catch (imageError) {
          console.error('Error saving image to database:', imageError);
          // Continue with other images even if one fails
        }
      }
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

    // Don't overwrite images from req.body - remove any image data from request
    if (req.body.images) {
      delete req.body.images;
    }
    // Also remove file paths if they somehow got into the body
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string' && req.body[key].includes('uploads')) {
        delete req.body[key];
      }
    });

    // Check if status is changing to 'available' to trigger notifications
    const wasUnavailable = vehicle.status !== 'available';
    const isBecomingAvailable = req.body.status === 'available';
    
    // Update other fields
    Object.assign(vehicle, req.body);
    vehicle = await vehicle.save({ runValidators: true });
    
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
    
    // Delete all associated images from database
    if (vehicle.images && vehicle.images.length > 0) {
      try {
        await Image.deleteMany({ _id: { $in: vehicle.images } });
      } catch (imageDeleteError) {
        console.error('Error deleting images:', imageDeleteError);
        // Continue with vehicle deletion even if image deletion fails
      }
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
        .populate({
          path: 'images',
          select: 'filename mimeType order',
          options: { limit: 1 }
        })
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
        .populate({
          path: 'images',
          select: 'filename mimeType order',
          options: { limit: 1 }
        })
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
    
    const filter = { savedBy: req.user._id, status: 'active' };
    
    const [vehicles, total] = await Promise.all([
      Vehicle.find(filter)
        .populate('sellerId', 'firstName lastName profileImage')
        .populate({
          path: 'images',
          select: 'filename mimeType order'
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      Vehicle.countDocuments(filter)
    ]);
    
    // Trim images to first one for list view
    const trimmedVehicles = vehicles.map(vehicle => ({
      ...vehicle.toObject(),
      images: vehicle.images ? [vehicle.images[0]] : []
    }));
    
    res.json({
      success: true,
      ...formatPaginationResponse(trimmedVehicles, total, pageNum, limitNum)
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

/**
 * @desc    Get vehicle images
 * @route   GET /api/vehicles/:id/images
 * @access  Public
 */
const getVehicleImages = async (req, res) => {
  try {
    const images = await Image.find({ vehicleId: req.params.id })
      .select('filename imageData mimeType order createdAt')
      .sort({ order: 1 });
    
    res.json({
      success: true,
      data: images
    });
  } catch (error) {
    console.error('Get vehicle images error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicle images',
      error: error.message
    });
  }
};

/**
 * @desc    Get single image by ID
 * @route   GET /api/images/:imageId
 * @access  Public
 */
const getImageById = async (req, res) => {
  try {
    const image = await Image.findById(req.params.imageId);
    
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }
    
    // Return image with proper headers
    res.set('Content-Type', image.mimeType);
    res.set('Content-Disposition', `inline; filename="${image.filename}"`);
    
    // Convert base64 back to buffer and send
    const imageBuffer = Buffer.from(image.imageData, 'base64');
    res.send(imageBuffer);
  } catch (error) {
    console.error('Get image error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching image',
      error: error.message
    });
  }
};

/**
 * @desc    Delete a specific image from a vehicle (Admin only)
 * @route   DELETE /api/vehicles/:vehicleId/images/:imageId
 * @access  Private (Admin only)
 */
const deleteVehicleImage = async (req, res) => {
  try {
    const { vehicleId, imageId } = req.params;

    // Check if user is admin
    if (!req.user || (req.user.role !== 'admin1' && req.user.role !== 'admin2')) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can delete vehicle images'
      });
    }

    // Find the vehicle
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Find and delete the image
    const image = await Image.findById(imageId);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Verify the image belongs to this vehicle
    if (image.vehicleId.toString() !== vehicleId) {
      return res.status(403).json({
        success: false,
        message: 'Image does not belong to this vehicle'
      });
    }

    // Delete the image document
    await Image.findByIdAndDelete(imageId);

    // Remove image ID from vehicle's images array
    vehicle.images = vehicle.images.filter(id => id.toString() !== imageId);
    await vehicle.save();

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('Delete vehicle image error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting image',
      error: error.message
    });
  }
};

/**
 * @desc    Upload new images to an existing vehicle (Admin only)
 * @route   POST /api/vehicles/:vehicleId/images
 * @access  Private (Admin only)
 */
const uploadVehicleImages = async (req, res) => {
  try {
    const { vehicleId } = req.params;

    // Check if user is admin
    if (!req.user || (req.user.role !== 'admin1' && req.user.role !== 'admin2')) {
      return res.status(403).json({
        success: false,
        message: 'Only admins can upload vehicle images'
      });
    }

    // Find the vehicle
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Handle image uploads
    if ( !req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No images provided'
      });
    }

    const imageIds = [];

    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      try {
        // Read file from disk
        const fileData = fs.readFileSync(file.path);
        
        // Convert to base64
        const base64Data = fileData.toString('base64');
        
        // Get MIME type
        const ext = path.extname(file.originalname).toLowerCase();
        const mimeTypeMap = {
          '.jpg': 'image/jpeg',
          '.jpeg': 'image/jpeg',
          '.png': 'image/png',
          '.gif': 'image/gif',
          '.webp': 'image/webp'
        };
        const mimeType = mimeTypeMap[ext] || file.mimetype || 'image/jpeg';
        
        // Get current max order
        const maxOrderImage = await Image.findOne({ vehicleId }).sort({ order: -1 });
        const nextOrder = (maxOrderImage?.order || 0) + 1;
        
        // Create image document in database
        const imageDoc = await Image.create({
          vehicleId: vehicle._id,
          filename: file.originalname,
          imageData: base64Data,
          mimeType: mimeType,
          fileSize: file.size,
          order: nextOrder
        });
        
        imageIds.push(imageDoc._id);
        
        // Delete file from disk after saving to database
        fs.unlinkSync(file.path);
      } catch (imageError) {
        console.error('Error saving image to database:', imageError);
        // Continue with other images even if one fails
      }
    }

    // Update vehicle with new image references
    // Initialize images array if it doesn't exist
    if (!vehicle.images || !Array.isArray(vehicle.images)) {
      vehicle.images = [];
    }
    vehicle.images = [...vehicle.images, ...imageIds];
    await vehicle.save();

    res.status(200).json({
      success: true,
      message: `${imageIds.length} image(s) uploaded successfully`,
      data: vehicle
    });
  } catch (error) {
    console.error('Upload vehicle images error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading images',
      error: error.message
    });
  }
};

/**
 * @desc    Boost vehicle ad
 * @route   POST /api/vehicles/:vehicleId/boost
 * @access  Private (authenticated users)
 */
const boostVehicleAd = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { packageType, duration, amount, startDate, paymentMethod, contactPerson, contactPhone, additionalNotes, cardLast4, cardHolder } = req.body;
    const userId = req.user._id;

    // Validate required fields
    if (!packageType || !duration || !amount || !startDate || !paymentMethod || !contactPerson || !contactPhone) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check if user owns the vehicle or is admin
    const isAdmin = ['admin1', 'admin2'].includes(req.user.role);
    if (vehicle.sellerId.toString() !== userId.toString() && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to boost this vehicle'
      });
    }

    // Handle bank slip upload if bank transfer
    let bankSlipPath = null;
    if (paymentMethod === 'bank_transfer' && req.file) {
      bankSlipPath = req.file.path;
    }

    // Create and save boost record to database
    const newBoost = new Boost({
      vehicleId,
      userId,
      packageType,
      duration,
      amount,
      startDate: new Date(startDate),
      endDate: new Date(new Date(startDate).getTime() + duration * 24 * 60 * 60 * 1000),
      paymentMethod,
      contactPerson,
      contactPhone,
      additionalNotes,
      ...(cardLast4 && { cardLast4 }),
      ...(cardHolder && { cardHolder }),
      ...(bankSlipPath && { bankSlipPath }),
      // Free boosts are automatically activated, others are pending
      status: packageType === 'free' ? 'active' : 'pending'
    });

    const savedBoost = await newBoost.save();

    // Send notification to admins only for paid boosts
    if (packageType !== 'free') {
      try {
        await notificationController.sendNotificationToRole(
          'admin1',
          `New Ad Boost Request`,
          `${req.user.name} has requested to boost ${vehicle.brand} ${vehicle.model} for LKR ${amount}`,
          { type: 'boost_request', boostId: savedBoost._id }
        );
      } catch (err) {
        console.error('Failed to send notification:', err);
      }
    }

    const message = packageType === 'free' 
      ? 'Free boost activated successfully! Your vehicle will be featured for 1 day.'
      : 'Boost request submitted successfully. Our team will contact you shortly.';

    res.status(201).json({
      success: true,
      message,
      data: {
        _id: savedBoost._id,
        vehicleId,
        packageType,
        duration,
        amount,
        startDate: savedBoost.startDate,
        endDate: savedBoost.endDate,
        status: savedBoost.status,
        paymentMethod
      }
    });
  } catch (error) {
    console.error('Boost vehicle ad error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing boost request',
      error: error.message
    });
  }
};

/**
 * @desc    Get all boost requests (Admin only)
 * @route   GET /api/vehicles/boost/all
 * @access  Private (admin)
 */
const getAllBoostRequests = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    
    const filter = {};
    if (status) filter.status = status;
    
    const skip = (page - 1) * limit;
    
    const boosts = await Boost.find(filter)
      .populate('vehicleId', 'brand model price')
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Boost.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      data: boosts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all boost requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching boost requests',
      error: error.message
    });
  }
};

/**
 * @desc    Approve boost request
 * @route   PUT /api/vehicles/boost/:boostId/approve
 * @access  Private (admin)
 */
const approveBoostRequest = async (req, res) => {
  try {
    const { boostId } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user._id;
    
    const boost = await Boost.findById(boostId);
    if (!boost) {
      return res.status(404).json({
        success: false,
        message: 'Boost request not found'
      });
    }
    
    // Update boost status
    boost.status = 'approved';
    boost.approvedBy = adminId;
    boost.approvalDate = new Date();
    if (adminNotes) boost.adminNotes = adminNotes;
    
    await boost.save();
    
    // Send notification to user
    try {
      const user = await boost.populate('userId');
      await notificationController.sendNotificationToUser(
        boost.userId,
        `Boost Request Approved! ✓`,
        `Your ad boost request has been approved. It will go live on ${new Date(boost.startDate).toLocaleDateString()}`,
        { type: 'boost_approved', boostId: boost._id }
      );
    } catch (err) {
      console.error('Failed to send approval notification:', err);
    }
    
    res.status(200).json({
      success: true,
      message: 'Boost request approved successfully',
      data: boost
    });
  } catch (error) {
    console.error('Approve boost request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving boost request',
      error: error.message
    });
  }
};

/**
 * @desc    Reject boost request
 * @route   PUT /api/vehicles/boost/:boostId/reject
 * @access  Private (admin)
 */
const rejectBoostRequest = async (req, res) => {
  try {
    const { boostId } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user._id;
    
    if (!adminNotes) {
      return res.status(400).json({
        success: false,
        message: 'Admin notes are required for rejection'
      });
    }
    
    const boost = await Boost.findById(boostId);
    if (!boost) {
      return res.status(404).json({
        success: false,
        message: 'Boost request not found'
      });
    }
    
    // Update boost status
    boost.status = 'rejected';
    boost.approvedBy = adminId;
    boost.rejectionDate = new Date();
    boost.adminNotes = adminNotes;
    
    await boost.save();
    
    // Send notification to user
    try {
      await notificationController.sendNotificationToUser(
        boost.userId,
        `Boost Request Rejected`,
        `Your ad boost request has been rejected. Reason: ${adminNotes}`,
        { type: 'boost_rejected', boostId: boost._id }
      );
    } catch (err) {
      console.error('Failed to send rejection notification:', err);
    }
    
    res.status(200).json({
      success: true,
      message: 'Boost request rejected successfully',
      data: boost
    });
  } catch (error) {
    console.error('Reject boost request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting boost request',
      error: error.message
    });
  }
};

/**
 * @desc    Get single boost request details
 * @route   GET /api/vehicles/boost/:boostId
 * @access  Private
 */
const getBoostRequestDetails = async (req, res) => {
  try {
    const { boostId } = req.params;
    
    const boost = await Boost.findById(boostId)
      .populate('vehicleId')
      .populate('userId', 'name email phone')
      .populate('approvedBy', 'name email');
    
    if (!boost) {
      return res.status(404).json({
        success: false,
        message: 'Boost request not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: boost
    });
  } catch (error) {
    console.error('Get boost request error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching boost request',
      error: error.message
    });
  }
};

/**
 * @desc    Get featured/boosted vehicles
 * @route   GET /api/vehicles/featured/active
 * @access  Public
 */
const getFeaturedVehicles = async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    
    console.log('🔍 Fetching active/pending boosts...');
    console.log('📅 Current time:', new Date());
    
    // Find boosts (active or pending) that haven't ended yet
    const activeBoosts = await Boost.find({
      status: { $in: ['active', 'pending'] },
      endDate: { $gte: new Date() }
    })
      .populate({
        path: 'vehicleId',
        populate: {
          path: 'images',
          select: 'filename imageData mimeType order'
        }
      })
      .populate('userId', 'firstName lastName email phone profileImage')
      .sort({ startDate: -1 })
      .limit(parseInt(limit));
    
    console.log(`✅ Found ${activeBoosts.length} featured boosts`);
    
    if (activeBoosts.length > 0) {
      activeBoosts.forEach(boost => {
        console.log(`  - Boost: ${boost.packageType} (${boost.status}), Vehicle: ${boost.vehicleId ? boost.vehicleId.brand + ' ' + boost.vehicleId.model : 'DELETED'}, EndDate: ${boost.endDate}`);
      });
    }
    
    // Extract vehicles and add boost info
    const featuredVehicles = activeBoosts
      .filter(boost => {
        if (!boost.vehicleId) {
          console.log('⚠️ Boost has no vehicle reference');
          return false;
        }
        return true;
      })
      .map(boost => {
        const vehicleObj = boost.vehicleId.toObject ? boost.vehicleId.toObject() : boost.vehicleId;
        console.log(`📍 Processing vehicle: ${vehicleObj.brand} ${vehicleObj.model}`);
        return {
          ...vehicleObj,
          boost: {
            _id: boost._id,
            packageType: boost.packageType,
            endDate: boost.endDate,
            startDate: boost.startDate,
            status: boost.status
          }
        };
      });
    
    console.log(`📊 Returning ${featuredVehicles.length} featured vehicles`);
    
    res.json({
      success: true,
      count: featuredVehicles.length,
      data: featuredVehicles
    });
  } catch (error) {
    console.error('❌ Get featured vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching featured vehicles',
      error: error.message
    });
  }
};

/**
 * @desc    DEBUG: Get all boosts (for testing)
 * @route   GET /api/vehicles/debug/boosts
 * @access  Public
 */
const getAllBoosts = async (req, res) => {
  try {
    console.log('🔍 DEBUG: Fetching all boosts...');
    const allBoosts = await Boost.find()
      .select('_id packageType status startDate endDate vehicleId')
      .populate('vehicleId', 'brand model')
      .limit(20);
    
    console.log(`Found ${allBoosts.length} total boosts`);
    allBoosts.forEach(b => {
      console.log(`  Status: ${b.status}, Package: ${b.packageType}, Vehicle: ${b.vehicleId ? b.vehicleId.brand + ' ' + b.vehicleId.model : 'DELETED'}, EndDate: ${b.endDate}, Active: ${b.endDate >= new Date()}`);
    });
    
    res.json({
      success: true,
      total: allBoosts.length,
      data: allBoosts
    });
  } catch (error) {
    console.error('DEBUG: Error fetching all boosts:', error);
    res.status(500).json({
      success: false,
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
  getSavedVehicles,
  getVehicleImages,
  getImageById,
  deleteVehicleImage,
  uploadVehicleImages,
  boostVehicleAd,
  getAllBoostRequests,
  approveBoostRequest,
  rejectBoostRequest,
  getBoostRequestDetails,
  getFeaturedVehicles,
  getAllBoosts
};
