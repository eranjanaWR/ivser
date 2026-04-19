/**
 * Vehicle Controller
 * Handles CRUD operations for vehicles
 */

const fs = require('fs');
const path = require('path');
const Vehicle = require('../models/Vehicle');
const Image = require('../models/Image');
const TestDrive = require('../models/TestDrive');
const Boost = require('../models/Boost');
const ViewHistory = require('../models/ViewHistory');
const { paginate, formatPaginationResponse } = require('../utils/helpers');
const notificationController = require('./notificationController');
const AuctionVehicle = require('../models/AuctionVehicle');
const { sendTestDriveCancellationEmail, sendNotificationEmail } = require('../utils/email');
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
      sortBy, sortOrder, page, limit, search, status
    } = req.query;

    // 1. DEBUG: Log incoming query 
    console.log(`🚗 GET /api/vehicles called with:`, {
      status, brand, model, bodyType, fuelType, limit
    });

    // 2. Build filter object
    const filter = {};
    if (status !== 'all') {
      filter.status = 'active'; 
    }
    
    if (brand) filter.brand = new RegExp(brand, 'i');
    if (model) filter.model = new RegExp(model, 'i');
    if (fuelType) filter.fuelType = fuelType;
    if (transmission) filter.transmission = transmission;
    if (bodyType) filter.bodyType = bodyType;
    if (condition) filter.condition = condition;
    if (city) filter['location.city'] = new RegExp(city, 'i');

    // 3. Pagination & Sorting
    const { skip, limit: limitNum, page: pageNum } = paginate(page, limit);
    let sortOptions = { createdAt: -1 };
    if (sortBy) {
      sortOptions = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    }

    // 4. Execute query
    const [vehicles, total] = await Promise.all([
      Vehicle.find(filter)
        .populate('sellerId', 'firstName lastName email phone profileImage isEmailVerified isFaceVerified')
        .populate({
          path: 'images',
          select: '_id filename mimeType order'
        })
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Vehicle.countDocuments(filter)
    ]);

    // 5. DEBUG: Log results
    const allVehiclesCount = await Vehicle.countDocuments({});
    console.log(`📊 Query result:`, {
      filter: filter,
      totalVehiclesInDB: allVehiclesCount,
      matchingFilter: total,
      returned: vehicles.length
    });

    // 6. Optimization: Trim images 
    const trimmedVehicles = vehicles.map(vehicle => {
      const vehicleObj = vehicle.toObject();
      vehicleObj.images = vehicleObj.images && vehicleObj.images.length > 0 
        ? [vehicleObj.images[0]] 
        : [];
      if (!vehicleObj.images.length) {
        vehicleObj.hasNoImages = true;
      }
      return vehicleObj;
    });

    // 7. Final Response
    res.json({
      success: true,
      ...formatPaginationResponse(trimmedVehicles, total, pageNum, limitNum)
    });

  } catch (error) {
    console.error('❌ Get vehicles error:', error);
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
    
    // Increment views on vehicle document
    vehicle.views += 1;
    await vehicle.save({ validateBeforeSave: false });
    
    // Log view to ViewHistory for persistent trending (survives vehicle deletion)
    try {
      await ViewHistory.create({
        vehicleId: vehicle._id,
        brand: vehicle.brand,
        model: vehicle.model,
        userId: req.user?._id || null,
        viewedAt: new Date()
      });
      console.log(`📊 View logged for ${vehicle.brand} ${vehicle.model}`);
    } catch (viewHistoryError) {
      console.error('Error logging to ViewHistory:', viewHistoryError);
      // Don't fail the request if view history logging fails
    }
    
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
 * @desc    Get vehicles available for bidding
 * @route   GET /api/vehicles/bidding/available
 * @access  Public
 */
const getBiddingVehicles = async (req, res) => {
  try {
    const { page, limit, sortBy, sortOrder } = req.query;
    
    // Filter for active vehicles marked for bidding
    const filter = { 
      status: 'active',
      isAvailableForBidding: true
    };
    
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
    console.error('Get bidding vehicles error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching bidding vehicles',
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
      description, features, vin, location, manufacturedCountry,
      existingImages, originalAuctionId // ✅ Extract originalAuctionId
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
      manufacturedCountry: manufacturedCountry?.trim(),
      fromAuctionId: originalAuctionId || null // ✅ Save origin ID
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
    
    // Handle image storage (New uploads + Existing images from auction transition)
    const imageIds = [];

    // 1. Process NEW uploads
    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        try {
          const fileData = fs.readFileSync(file.path);
          const base64Data = fileData.toString('base64');
          const ext = path.extname(file.originalname).toLowerCase();
          const mimeTypeMap = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp' };
          const mimeType = mimeTypeMap[ext] || file.mimetype || 'image/jpeg';
          
          const imageDoc = await Image.create({
            vehicleId: vehicle._id,
            filename: file.originalname,
            imageData: base64Data,
            mimeType: mimeType,
            fileSize: file.size,
            order: imageIds.length
          });
          imageIds.push(imageDoc._id);
          fs.unlinkSync(file.path);
        } catch (imageError) {
          console.error('Error saving new image:', imageError);
        }
      }
    }

    // 2. Process EXISTING images (Carried over from Auction record)
    if (existingImages) {
      let paths = [];
      try {
        paths = typeof existingImages === 'string' ? JSON.parse(existingImages) : existingImages;
      } catch (e) {
        paths = [];
      }

      for (let i = 0; i < paths.length; i++) {
        const relativePath = paths[i]; // e.g., /uploads/vehicles/filename.jpg
        // Paths from auction are relative to the project root or backend root
        // We need to resolve to absolute path. Assuming relativePath starts with /
        const absolutePath = path.join(process.cwd(), relativePath);

        if (fs.existsSync(absolutePath)) {
          try {
            const fileData = fs.readFileSync(absolutePath);
            const base64Data = fileData.toString('base64');
            const filename = path.basename(relativePath);
            const ext = path.extname(filename).toLowerCase();
            const mimeTypeMap = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp' };
            const mimeType = mimeTypeMap[ext] || 'image/jpeg';

            const imageDoc = await Image.create({
              vehicleId: vehicle._id,
              filename: filename,
              imageData: base64Data,
              mimeType: mimeType,
              fileSize: fileData.length,
              order: imageIds.length
            });
            imageIds.push(imageDoc._id);
          } catch (copyError) {
            console.error('Error copying auction image to marketplace:', copyError);
          }
        } else {
          console.warn('⚠️ Auction image not found on disk:', absolutePath);
        }
      }
    }

    // Save image references if any were created
    if (imageIds.length > 0) {
      vehicle.images = imageIds;
      await vehicle.save();
    }
    
    // 3. ✅ Update Auction record if this was a settlement flow
    if (originalAuctionId) {
      try {
        await AuctionVehicle.findByIdAndUpdate(originalAuctionId, { 
          isSettledToMarketplace: true 
        });
        console.log(`✅ Auction ${originalAuctionId} marked as settled to marketplace.`);
      } catch (auctionErr) {
        console.error('Error updating auction settlement flag:', auctionErr);
      }
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
          // Check if file exists before reading
          if (!fs.existsSync(file.path)) {
            console.error(`File not found at path: ${file.path}`);
            console.error(`File object:`, {
              fieldname: file.fieldname,
              originalname: file.originalname,
              path: file.path,
              destination: file.destination,
              filename: file.filename
            });
            throw new Error(`Uploaded file not found at: ${file.path}`);
          }
          
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
          try {
            fs.unlinkSync(file.path);
          } catch (unlinkError) {
            console.error('Error deleting temp file:', unlinkError);
            // Continue even if we can't delete the temp file
          }
        } catch (imageError) {
          console.error('Error saving image to database:', {
            error: imageError.message,
            filePath: file.path,
            fileName: file.filename
          });
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
    const wasUnavailable = vehicle.status !== 'active';
    const isBecomingAvailable = req.body.status === 'active';
    
    // Check if status is changing to unavailable/sold to cancel test drives
    const wasAvailable = ['active', 'pending'].includes(vehicle.status);
    const isBecomingUnavailable = ['sold', 'removed', 'inactive'].includes(req.body.status);
    
    // Update other fields
    Object.assign(vehicle, req.body);
    vehicle = await vehicle.save({ runValidators: true });
    
    // Trigger notifications if vehicle is now available
    if (isBecomingAvailable && wasUnavailable) {
      console.log(`Vehicle ${vehicle._id} is now available. Checking for subscriptions...`);
      notificationController.checkAndNotify(vehicle);
    }
    
    // Cancel active test drives if vehicle becomes sold/removed
    if (wasAvailable && isBecomingUnavailable) {
      try {
        const vehicleName = `${vehicle.brand} ${vehicle.model} (${vehicle.year})`;
        const BuyerBooking = require('../models/BuyerBooking');
        const activeTestDrives = await BuyerBooking.find({
          vehicleId: vehicle._id,
          status: { $in: ['Pending', 'Accepted'] }
        }).populate('buyerId', 'firstName lastName email');
        
        for (const testDrive of activeTestDrives) {
          try {
            if (testDrive.buyerId && testDrive.buyerId.email) {
              const buyerName = `${testDrive.buyerId.firstName} ${testDrive.buyerId.lastName}`;
              await sendTestDriveCancellationEmail(
                testDrive.buyerId.email,
                buyerName,
                vehicleName,
                req.body.status === 'sold' ? 'sold' : 'removed from the platform'
              );
            }
            testDrive.status = 'Cancelled';
            await testDrive.save();
          } catch (emailError) {
            console.warn('⚠️ Failed to send cancellation email:', emailError.message);
          }
        }
      } catch (tdError) {
        console.warn('⚠️ Error cancelling test drives on vehicle update:', tdError.message);
      }
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
    console.log('🗑️  Attempting to delete vehicle:', req.params.id);
    console.log('👤 User ID:', req.user._id);
    
    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }
    
    console.log('🔍 Vehicle sellerId:', vehicle.sellerId.toString());
    console.log('🔍 Current user ID:', req.user._id.toString());
    
    // Check ownership
    if (vehicle.sellerId.toString() !== req.user._id.toString() && 
        !['admin1', 'admin2'].includes(req.user.role)) {
      console.log('❌ Authorization check failed');
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this vehicle'
      });
    }
    
    // ✅ SYNC LOGIC: If vehicle was settled from an auction, reset the auction's settlement flag
    if (vehicle.fromAuctionId) {
      try {
        await AuctionVehicle.findByIdAndUpdate(vehicle.fromAuctionId, { 
          isSettledToMarketplace: false 
        });
        console.log(`🔄 [SYNC] Reset settlement flag for Auction: ${vehicle.fromAuctionId}`);
      } catch (auctionErr) {
        console.warn('⚠️ [SYNC] Failed to reset auction settlement flag:', auctionErr.message);
      }
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
    
    // Store vehicle info before deletion (for email notifications)
    const vehicleName = `${vehicle.brand} ${vehicle.model} (${vehicle.year})`;
    
    // Find all active test drive bookings for this vehicle
    try {
      const BuyerBooking = require('../models/BuyerBooking');
      const activeTestDrives = await BuyerBooking.find({
        vehicleId: req.params.id,
        status: { $in: ['Pending', 'Accepted'] }
      }).populate('buyerId', 'firstName lastName email');
      
      console.log('📋 Found', activeTestDrives.length, 'active test drives');
      
      // Send cancellation emails to all buyers with active bookings
      for (const testDrive of activeTestDrives) {
        try {
          if (testDrive.buyerId && testDrive.buyerId.email) {
            const buyerName = `${testDrive.buyerId.firstName} ${testDrive.buyerId.lastName}`;
            await sendTestDriveCancellationEmail(
              testDrive.buyerId.email,
              buyerName,
              vehicleName,
              'sold or removed from the platform'
            );
            console.log('✉️  Email sent to', buyerName);
          }
          
          // Update test drive status to cancelled
          testDrive.status = 'Cancelled';
          await testDrive.save();
        } catch (emailError) {
          console.warn('⚠️  Failed to send email for test drive:', emailError.message);
          // Continue with other test drives even if email fails
        }
      }
      
      console.log('✅ Cancelled', activeTestDrives.length, 'test drive bookings');
    } catch (testDriveError) {
      console.warn('⚠️  Error processing test drives:', testDriveError.message);
      // Continue with vehicle deletion even if test drive processing fails
    }
    
    // Delete the vehicle
    console.log('🗑️  Deleting vehicle from database...');
    await Vehicle.findByIdAndDelete(req.params.id);
    console.log('✅ Vehicle deleted successfully');
    
    res.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    console.error('❌ Delete vehicle error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Error deleting vehicle: ' + error.message
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
          select: '_id filename mimeType order',
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
          select: '_id filename mimeType order',
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
 * @desc    Toggle bidding status for a vehicle
 * @route   PUT /api/vehicles/:id/bidding
 * @access  Private (Owner only)
 */
const toggleBiddingStatus = async (req, res) => {
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
    
    // Toggle bidding status
    vehicle.isAvailableForBidding = !vehicle.isAvailableForBidding;
    await vehicle.save({ validateBeforeSave: false });
    
    res.json({
      success: true,
      message: vehicle.isAvailableForBidding ? 
        'Vehicle enabled for bidding' : 
        'Vehicle disabled for bidding',
      data: { 
        vehicleId: vehicle._id,
        isAvailableForBidding: vehicle.isAvailableForBidding 
      }
    });
  } catch (error) {
    console.error('Toggle bidding status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling bidding status',
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
          select: '_id filename mimeType order'
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
        // Check if file exists before reading
        if (!fs.existsSync(file.path)) {
          console.error(`File not found at path: ${file.path}`);
          console.error(`File object:`, {
            fieldname: file.fieldname,
            originalname: file.originalname,
            path: file.path,
            destination: file.destination,
            filename: file.filename
          });
          throw new Error(`Uploaded file not found at: ${file.path}`);
        }
        
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
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkError) {
          console.error('Error deleting temp file:', unlinkError);
          // Continue even if we can't delete the temp file
        }
      } catch (imageError) {
        console.error('Error saving image to database:', {
          error: imageError.message,
          filePath: file.path,
          fileName: file.filename
        });
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
    console.log('🚀 [BOOST] POST /boost endpoint called');
    const { vehicleId } = req.params;
    const { packageType, duration, amount, startDate, paymentMethod, contactPerson, contactPhone, notificationEmail, additionalNotes, cardLast4, cardHolder, paymentRefNumber } = req.body;
    const userId = req.user?._id;

    console.log('📝 [BOOST] Request body:', { packageType, duration, amount, startDate, paymentMethod, contactPerson, contactPhone, notificationEmail, paymentRefNumber });
    console.log('📝 [BOOST] VehicleId:', vehicleId, 'UserId:', userId);
    console.log('📝 [BOOST] User info:', { email:  req.user?.email, role: req.user?.role, authenticated: !!req.user });
    console.log('📝 [BOOST] Files received:', {
      bankSlipCount: req.files?.bankSlip?.length || 0,
      cardProofCount: req.files?.cardProof?.length || 0,
      allFileKeys: Object.keys(req.files || {})
    });

    // Validate required fields
    if (!packageType || !duration || !amount || !startDate || !paymentMethod || !contactPerson || !contactPhone || !notificationEmail) {
      console.log('❌ [BOOST] Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Check if vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      console.log('❌ [BOOST] Vehicle not found:', vehicleId);
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    console.log('✅ [BOOST] Vehicle found:', vehicle.brand, vehicle.model);

    // Check if user owns the vehicle or is admin
    const isAdmin = ['admin1', 'admin2'].includes(req.user.role);
    if (vehicle.sellerId.toString() !== userId.toString() && !isAdmin) {
      console.log('❌ [BOOST] Not authorized - seller:', vehicle.sellerId, 'user:', userId);
      return res.status(403).json({
        success: false,
        message: 'Not authorized to boost this vehicle'
      });
    }

    console.log('✅ [BOOST] Authorization passed');

    // Log all files received
    console.log('📦 [BOOST] All files received:');
    if (req.files) {
      Object.keys(req.files).forEach(fieldName => {
        const fileArray = req.files[fieldName];
        console.log(`   ${fieldName}:`, fileArray.map(f => ({
          originalName: f.originalname,
          mimetype: f.mimetype,
          size: f.size,
          filename: f.filename,
          path: f.path
        })));
      });
    } else {
      console.log('   No files received');
    }

    // Process files
    let bankSlipPath = null;
    let cardProofPath = null;
    
    if (req.files?.bankSlip?.[0]) {
      const file = req.files.bankSlip[0];
      bankSlipPath = `bank_slips/${file.filename}`;
      console.log(`✅ [BOOST] bankSlip saved: ${bankSlipPath}`);
    }
    
    if (req.files?.cardProof?.[0]) {
      const file = req.files.cardProof[0];
      cardProofPath = `bank_slips/${file.filename}`;
      console.log(`✅ [BOOST] cardProof saved: ${cardProofPath}`);
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
      notificationEmail,
      additionalNotes,
      ...(paymentRefNumber && { paymentRefNumber }),
      ...(cardLast4 && { cardLast4 }),
      ...(cardHolder && { cardHolder }),
      ...(bankSlipPath && { bankSlipPath }),
      ...(cardProofPath && { cardProofPath }),
      // Free boosts are automatically activated, others are pending
      status: packageType === 'free' ? 'active' : 'pending'
    });

    console.log('📝 [BOOST] Creating boost with status:', newBoost.status);

    const savedBoost = await newBoost.save();

    console.log('✅ [BOOST] Boost saved successfully:', savedBoost._id, 'Status:', savedBoost.status);
    console.log('📊 [BOOST] Saved boost details:');
    console.log('  - vehicleId:', savedBoost.vehicleId);
    console.log('  - packageType:', savedBoost.packageType);
    console.log('  - status:', savedBoost.status);
    console.log('  - startDate:', savedBoost.startDate);
    console.log('  - endDate:', savedBoost.endDate);
    console.log('📄 [BOOST] File paths:');
    console.log('  - bankSlipPath:', savedBoost.bankSlipPath || 'NOT SET');
    console.log('  - cardProofPath:', savedBoost.cardProofPath || 'NOT SET');
    console.log('  - duration:', savedBoost.duration);

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
      ? 'Free boost activated successfully! Your vehicle will be featured for 28 days (4 weeks).'
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
    console.log('📢 [BOOST] GET /api/vehicles/boost/all called');
    console.log('👤 [BOOST] User:', req.user?._id, 'Role:', req.user?.role);
    const { status, page = 1, limit = 10 } = req.query;
    console.log('📋 [BOOST] Query params:', { status, page, limit });
    
    // Check authorization manually
    if (!req.user) {
      console.log('❌ [BOOST] No user authenticated');
      return res.status(401).json({
        success: false,
        message: 'Not authenticated'
      });
    }

    if (!['admin1', 'admin2'].includes(req.user.role)) {
      console.log('❌ [BOOST] User role not authorized:', req.user.role);
      return res.status(403).json({
        success: false,
        message: `Not authorized. Your role is: ${req.user.role}`
      });
    }

    console.log('✅ [BOOST] Authorization passed');
    
    const filter = {};
    // Only add status filter if it's not 'all'
    if (status && status !== 'all') {
      filter.status = status;
      console.log('📋 [BOOST] Filtering by status:', status);
    } else {
      console.log('📋 [BOOST] Fetching ALL boosts (no status filter)');
    }
    
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    
    console.log('📋 [BOOST] Pagination:', { pageNum, limitNum, skip });
    
    const boosts = await Boost.find(filter)
      .populate('vehicleId', 'brand model price')
      .populate('userId', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();
    
    console.log('📄 [BOOST] Retrieved boosts count:', boosts.length);
    if (boosts.length > 0) {
      console.log('📄 [BOOST] Sample boost data:');
      boosts.slice(0, 3).forEach((boost, idx) => {
        console.log(`   Boost ${idx}:`, {
          _id: boost._id,
          paymentMethod: boost.paymentMethod,
          bankSlipPath: boost.bankSlipPath || 'null',
          cardProofPath: boost.cardProofPath || 'null',
          hasBankSlip: !!boost.bankSlipPath,
          hasCardProof: !!boost.cardProofPath
        });
      });
    }
    
    const total = await Boost.countDocuments(filter);
    
    console.log(`✅ [BOOST] Found ${boosts.length} boosts, total: ${total}`);
    
    res.status(200).json({
      success: true,
      data: boosts,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('❌ [BOOST] Get all boost requests error:', error.message);
    console.error('🔍 [BOOST] Error stack:', error.stack);
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
    
    console.log(`📋 Processing boost approval for ID: ${boostId}`);
    
    const boost = await Boost.findById(boostId).populate('userId');
    if (!boost) {
      return res.status(404).json({
        success: false,
        message: 'Boost request not found'
      });
    }
    
    console.log(`✓ Boost found: ${boost._id}`);
    
    // Validate user is populated
    if (!boost.userId) {
      console.error('❌ Boost user not populated');
      return res.status(400).json({
        success: false,
        message: 'Boost user information is missing'
      });
    }
    
    // Ensure notificationEmail is set with a valid email before saving
    const userEmail = boost.userId?.email || boost.userId?._doc?.email;
    if (!userEmail) {
      console.error('❌ User email not found:', { userId: boost.userId._id });
      return res.status(400).json({
        success: false,
        message: 'User email address not found'
      });
    }
    
    // Set notificationEmail to user's email if it's missing or invalid
    if (!boost.notificationEmail || !boost.notificationEmail.includes('@')) {
      console.log(`⚠️ Setting notificationEmail to user email: ${userEmail}`);
      boost.notificationEmail = userEmail;
    }
    
    // Update boost status to 'active' (not 'approved') so it displays in featured vehicles
    boost.status = 'active';
    boost.approvedBy = adminId;
    boost.approvalDate = new Date();
    if (adminNotes) boost.adminNotes = adminNotes;
    
    await boost.save();
    console.log(`✅ Boost status updated to active`);
    
    // Send in-app notification to user
    try {
      await notificationController.sendNotificationToUser(
        boost.userId._id,
        `Boost Request Approved! ✓`,
        `Your ad boost request has been approved. It will go live on ${new Date(boost.startDate).toLocaleDateString()}`,
        { type: 'boost_approved', boostId: boost._id }
      );
      console.log(`✅ In-app notification sent`);
    } catch (err) {
      console.error('⚠️ Failed to send in-app approval notification:', err.message);
      // Don't fail the whole request if notification fails
    }
    
    // Send email notification to user (use notificationEmail if provided, otherwise fallback to user email)
    try {
      const notificationsEmail = boost.notificationEmail || boost.userId?.email;
      
      if (!notificationsEmail) {
        console.warn('⚠️ No email address found for notification');
      } else {
        const startDateFormatted = new Date(boost.startDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        const message = `
          <p>Good news! Your boost request for your ad has been <strong>approved by our admin team</strong>! 🎉</p>
          <p><strong>Here are the details:</strong></p>
          <ul>
            <li><strong>Boost Package:</strong> ${boost.packageType.charAt(0).toUpperCase() + boost.packageType.slice(1)}</li>
            <li><strong>Duration:</strong> ${boost.duration} days</li>
            <li><strong>Payment Reference:</strong> ${boost.paymentRefNumber}</li>
            <li><strong>Start Date:</strong> ${startDateFormatted}</li>
          </ul>
          <p>Your ad will now get increased visibility on our platform! Your customers will see it more prominently in search results and featured listings.</p>
          <p>Thank you for boosting your ad with TakGaala.lk! 🚗</p>
        `;
        
        const emailResult = await sendNotificationEmail(
          notificationsEmail,
          'Boost Request Approved! 🎉 - TakGaala.lk',
          message,
          boost.userId?.firstName || 'User'
        );
        
        if (emailResult.success) {
          console.log(`✅ Approval email sent successfully to ${notificationsEmail} | Message ID: ${emailResult.messageId}`);
        } else {
          console.warn(`⚠️ Approval email failed for ${notificationsEmail}: ${emailResult.error}`);
        }
      }
    } catch (err) {
      console.error('⚠️ Failed to send approval email - Exception:', err.message);
      // Don't fail the whole request if email sending fails
    }
    
    res.status(200).json({
      success: true,
      message: 'Boost request approved successfully',
      data: boost
    });
  } catch (error) {
    console.error('❌ Approve boost request error:', error.message);
    console.error('Stack:', error.stack);
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
    let { adminNotes } = req.body;
    const adminId = req.user._id;
    
    const boost = await Boost.findById(boostId).populate('userId');
    if (!boost) {
      return res.status(404).json({
        success: false,
        message: 'Boost request not found'
      });
    }
    
    // Determine if this is a deactivation (for active boosts) or rejection (for pending boosts)
    const isDeactivation = boost.status === 'active' || boost.status === 'approved';
    const notificationType = isDeactivation ? 'boost_deactivated' : 'boost_rejected';
    
    // For rejection without notes, provide a default message
    if (!adminNotes) {
      if (isDeactivation) {
        adminNotes = 'Boost deactivated by admin';
      } else {
        return res.status(400).json({
          success: false,
          message: 'Admin notes are required for rejection'
        });
      }
    }
    
    // Ensure notificationEmail is set with a valid email before saving
    if (!boost.userId) {
      console.error('❌ Boost user not populated');
      return res.status(400).json({
        success: false,
        message: 'Boost user information is missing'
      });
    }
    
    const userEmail = boost.userId?.email || boost.userId?._doc?.email;
    if (!userEmail) {
      console.error('❌ User email not found:', { userId: boost.userId._id });
      return res.status(400).json({
        success: false,
        message: 'User email address not found'
      });
    }
    
    // Set notificationEmail to user's email if it's missing or invalid
    if (!boost.notificationEmail || !boost.notificationEmail.includes('@')) {
      console.log(`⚠️ Setting notificationEmail to user email: ${userEmail}`);
      boost.notificationEmail = userEmail;
    }
    
    // Update boost status
    boost.status = 'rejected';
    boost.approvedBy = adminId;
    boost.rejectionDate = new Date();
    boost.adminNotes = adminNotes;
    
    await boost.save();
    
    // Send in-app notification to user
    try {
      const notificationTitle = isDeactivation ? `Boost Deactivated` : `Boost Request Rejected`;
      const notificationMessage = isDeactivation 
        ? `Your active boost has been deactivated. Reason: ${adminNotes}`
        : `Your ad boost request has been rejected. Reason: ${adminNotes}`;
      
      await notificationController.sendNotificationToUser(
        boost.userId._id,
        notificationTitle,
        notificationMessage,
        { type: notificationType, boostId: boost._id }
      );
    } catch (err) {
      console.error('Failed to send in-app rejection/deactivation notification:', err);
    }
    
    // Send email notification to user (use notificationEmail if provided, otherwise fallback to user email)
    try {
      const notificationsEmail = boost.notificationEmail || boost.userId.email;
      let emailSubject;
      let message;
      
      if (isDeactivation) {
        emailSubject = 'Your Boost Has Been Deactivated - TakGaala.lk';
        message = `
          <p>We wanted to notify you that your boost post has been <strong>deactivated</strong> by our admin team.</p>
          <p><strong>Reason:</strong> ${adminNotes}</p>
          <p><strong>Boost Details:</strong></p>
          <ul>
            <li><strong>Package:</strong> ${boost.packageType.charAt(0).toUpperCase() + boost.packageType.slice(1)}</li>
            <li><strong>Payment Reference:</strong> ${boost.paymentRefNumber}</li>
          </ul>
          <p>If you have any questions or would like to appeal this decision, please contact our support team.</p>
          <p>Thank you for your understanding.</p>
        `;
      } else {
        emailSubject = 'Boost Request Rejected - TakGaala.lk';
        message = `
          <p>Unfortunately, your boost request has been <strong>rejected</strong> by our admin team.</p>
          <p><strong>Reason:</strong> ${adminNotes}</p>
          <p><strong>Boost Details:</strong></p>
          <ul>
            <li><strong>Package:</strong> ${boost.packageType.charAt(0).toUpperCase() + boost.packageType.slice(1)}</li>
            <li><strong>Amount:</strong> PKR ${boost.amount}</li>
            <li><strong>Payment Reference:</strong> ${boost.paymentRefNumber}</li>
          </ul>
          <p>If you have any questions about this rejection, please feel free to reach out to our support team for more information.</p>
          <p>We hope to work with you on future boost requests!</p>
        `;
      }
      
      const emailResult = await sendNotificationEmail(
        notificationsEmail,
        emailSubject,
        message,
        boost.userId.firstName
      );
      
      if (emailResult.success) {
        console.log(`✅ ${isDeactivation ? 'Deactivation' : 'Rejection'} email sent successfully to ${notificationsEmail} | Message ID: ${emailResult.messageId}`);
      } else {
        console.warn(`⚠️ ${isDeactivation ? 'Deactivation' : 'Rejection'} email failed for ${notificationsEmail}: ${emailResult.error}`);
      }
    } catch (err) {
      console.error(`❌ Failed to send ${isDeactivation ? 'deactivation' : 'rejection'} email - Exception:`, err.message);
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
      boost: boost
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
    const { limit } = req.query; // Optional limit, no default
    
    console.log('🔍 Fetching active boosts...');
    console.log('📅 Current time:', new Date());
    
    // Find only active boosts that haven't ended yet
    // Note: Free boosts are 'active' immediately, paid boosts are 'pending' until admin approval
    let query = Boost.find({
      status: 'active',
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
      .sort({ startDate: -1 });
    
    // Apply limit only if provided
    if (limit) {
      query = query.limit(parseInt(limit));
    }
    
    const activeBoosts = await query;
    
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
  getBiddingVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getVehiclesBySeller,
  getMyVehicles,
  toggleSaveVehicle,
  getSavedVehicles,
  toggleBiddingStatus, 
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
