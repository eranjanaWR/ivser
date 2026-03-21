/**
 * Search Controller
 * Handles search logging and trending searches
 */

const Search = require('../models/Search');
const Vehicle = require('../models/Vehicle');

/**
 * @desc    Log a search query
 * @route   POST /api/search/log
 * @access  Public
 */
const logSearch = async (req, res) => {
  try {
    const { searchQuery, searchType, filters, resultsCount } = req.body;
    
    if (!searchQuery || searchQuery.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }
    
    // Determine search type for model searches
    const determinedSearchType = filters?.model ? 'model' : (filters?.brand ? 'brand' : searchType || 'general');
    
    const search = await Search.create({
      userId: req.user?._id || null,
      searchQuery: searchQuery.trim().toLowerCase(),
      searchType: determinedSearchType,
      filters: {
        search: filters?.search || '',
        brand: filters?.brand || '',
        model: filters?.model || '',
        fuelType: filters?.fuelType || '',
        transmission: filters?.transmission || '',
        condition: filters?.condition || '',
        minPrice: filters?.minPrice || 0,
        maxPrice: filters?.maxPrice || 50000000,
        priceRange: filters?.priceRange || [0, 50000000]
      },
      resultsCount: resultsCount || 0
    });
    
    console.log(`✓ Search logged: Type=${determinedSearchType}, Query="${searchQuery.toLowerCase()}", Model="${filters?.model?.toLowerCase() || 'N/A'}", Total count for this model will increase!`);
    
    res.status(201).json({
      success: true,
      message: 'Search logged successfully',
      data: search
    });
  } catch (error) {
    console.error('Log search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging search',
      error: error.message
    });
  }
};

/**
 * @desc    Log a vehicle view/search
 * @route   POST /api/search/log-vehicle
 * @access  Public
 */
const logVehicleSearch = async (req, res) => {
  try {
    const { vehicleId } = req.body;
    
    if (!vehicleId) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle ID is required'
      });
    }
    
    // Increment search count for this vehicle
    const vehicle = await Vehicle.findByIdAndUpdate(
      vehicleId,
      { $inc: { searchCount: 1 } },
      { new: true }
    );
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Vehicle search logged',
      data: { vehicleId, searchCount: vehicle.searchCount }
    });
  } catch (error) {
    console.error('Log vehicle search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging vehicle search',
      error: error.message
    });
  }
};

/**
 * @desc    Get trending vehicles (most searched)
 * @route   GET /api/search/trending
 * @access  Public
 */
const getTrendingSearches = async (req, res) => {
  try {
    const { limit = 6, status = 'available' } = req.query;
    const parsedLimit = parseInt(limit);
    
    // Step 1: Get all unique models and their search counts from Search collection
    const modelSearchCounts = await Search.aggregate([
      {
        $facet: {
          // Count by searchQuery (direct searches)
          bySearchQuery: [
            { $match: { searchQuery: { $exists: true, $ne: '' } } },
            { $group: { _id: '$searchQuery', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ],
          // Count by model field if available
          byModel: [
            { $match: { 'filters.model': { $exists: true, $ne: '' } } },
            { $group: { _id: { $toLower: '$filters.model' }, count: { $sum: 1 } } },
            { $sort: { count: -1 } }
          ]
        }
      },
      {
        $project: {
          merged: {
            $concatArrays: ['$bySearchQuery', '$byModel']
          }
        }
      },
      { $unwind: '$merged' },
      {
        $group: {
          _id: '$merged._id',
          totalCount: { $sum: '$merged.count' }
        }
      },
      { $sort: { totalCount: -1 } }
    ]);

    console.log(`📊 Raw aggregation results (search counts in DB):`);
    modelSearchCounts.slice(0, 10).forEach(m => {
      console.log(`   - "${m._id}": ${m.totalCount} searches`);
    });

    // Step 2: For each trending model, find a representative vehicle
    const trendingVehicles = [];
    const seenModels = new Set();

    for (const modelData of modelSearchCounts) {
      if (seenModels.size >= parsedLimit) break;

      const modelName = modelData._id;

      // Find a vehicle matching this model
      const vehicle = await Vehicle.findOne({ model: { $regex: modelName, $options: 'i' } })
        .select('_id brand model year price images condition fuelType status')
        .lean();

      if (vehicle && !seenModels.has(vehicle.model)) {
        seenModels.add(vehicle.model);

        // Check if there's an available variant of this model
        const availableVehicle = await Vehicle.findOne({
          status: 'available',
          model: { $regex: modelName, $options: 'i' }
        }).lean();

        // Use available vehicle if exists, otherwise use found vehicle
        const vehicleToDisplay = availableVehicle || vehicle;

        trendingVehicles.push({
          ...vehicleToDisplay,
          searchCount: modelData.totalCount,
          isAvailable: !!availableVehicle
        });
      }
    }

    // Step 3: If not enough vehicles, fill with highest searchCount vehicles
    if (trendingVehicles.length < parsedLimit) {
      const topVehicles = await Vehicle.find({ searchCount: { $gt: 0 } })
        .select('_id brand model year price images condition fuelType status searchCount')
        .sort({ searchCount: -1 })
        .limit(parsedLimit * 2)
        .lean();

      for (const vehicle of topVehicles) {
        if (seenModels.size >= parsedLimit) break;
        if (!seenModels.has(vehicle.model)) {
          seenModels.add(vehicle.model);

          const availableVehicle = await Vehicle.findOne({
            status: 'available',
            model: vehicle.model
          }).lean();

          trendingVehicles.push({
            ...vehicle,
            isAvailable: !!availableVehicle
          });
        }
      }
    }

    // Step 4: Sort by search count (descending - most searched first)
    const sorted = trendingVehicles
      .sort((a, b) => (b.searchCount || 0) - (a.searchCount || 0))
      .slice(0, parsedLimit);

    console.log(`🚗 Returning ${sorted.length} trending vehicles in order:`, sorted.map((v, i) => `${i + 1}. ${v.brand} ${v.model} (${v.searchCount} searches)`));

    res.json({
      success: true,
      data: sorted.map(vehicle => ({
        _id: vehicle._id,
        searchQuery: `${vehicle.brand} ${vehicle.model}`,
        brand: vehicle.brand,
        model: vehicle.model,
        year: vehicle.year,
        price: vehicle.price,
        count: vehicle.searchCount || 0,
        image: vehicle.images?.[0] || null,
        condition: vehicle.condition,
        fuelType: vehicle.fuelType,
        status: vehicle.isAvailable ? 'available' : 'out-of-stock'
      }))
    });
  } catch (error) {
    console.error('❌ Get trending searches error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trending searches',
      error: error.message
    });
  }
};

/**
 * @desc    Get search statistics
 * @route   GET /api/search/stats
 * @access  Public
 */
const getSearchStats = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    
    const dateFilter = new Date();
    dateFilter.setDate(dateFilter.getDate() - parseInt(days));
    
    const stats = await Search.aggregate([
      {
        $match: {
          createdAt: { $gte: dateFilter }
        }
      },
      {
        $group: {
          _id: null,
          totalSearches: { $sum: 1 },
          uniqueQueries: { $addToSet: '$searchQuery' },
          averageResultsCount: { $avg: '$resultsCount' }
        }
      },
      {
        $project: {
          _id: 0,
          totalSearches: 1,
          uniqueQueries: { $size: '$uniqueQueries' },
          averageResultsCount: { $round: ['$averageResultsCount', 0] }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: stats[0] || {
        totalSearches: 0,
        uniqueQueries: 0,
        averageResultsCount: 0
      }
    });
  } catch (error) {
    console.error('Get search stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching search statistics',
      error: error.message
    });
  }
};

/**
 * @desc    Get most searched vehicle models
 * @route   GET /api/search/models/trending
 * @access  Public
 */
const getTrendingModels = async (req, res) => {
  try {
    const { limit = 10, timeframe = 7 } = req.query; // timeframe in days
    const parsedLimit = Math.min(parseInt(limit), 50);
    
    // Calculate date from timeframe
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - parseInt(timeframe));
    
    // Aggregate searches by model to find most searched models
    const trendingModels = await Search.aggregate([
      {
        $match: {
          createdAt: { $gte: fromDate },
          'filters.model': { $ne: '', $ne: null }
        }
      },
      {
        $group: {
          _id: '$filters.model',
          searchCount: { $sum: 1 },
          avgResults: { $avg: '$resultsCount' },
          lastSearched: { $max: '$createdAt' }
        }
      },
      {
        $sort: { searchCount: -1 }
      },
      {
        $limit: parsedLimit
      },
      {
        $project: {
          model: '$_id',
          searchCount: 1,
          avgResults: { $round: ['$avgResults', 0] },
          lastSearched: 1,
          _id: 0
        }
      }
    ]);
    
    console.log(`📊 Top ${parsedLimit} searched models (last ${timeframe} days): ${trendingModels.map(m => `${m.model}(${m.searchCount})`).join(', ')}`);
    
    res.json({
      success: true,
      timeframe: `${timeframe} days`,
      total: trendingModels.length,
      data: trendingModels
    });
  } catch (error) {
    console.error('Get trending models error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trending models',
      error: error.message
    });
  }
};

module.exports = {
  logSearch,
  logVehicleSearch,
  getTrendingSearches,
  getSearchStats,
  getTrendingModels
};
