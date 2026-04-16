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
    const { limit = 6 } = req.query;
    const parsedLimit = parseInt(limit);
    
    console.log(`📊 Fetching ${parsedLimit} trending vehicles from system...`);

    // Simply get the most viewed vehicles grouped by model
    const trendingVehicles = await Vehicle.aggregate([
      {
        $sort: { views: -1 } // Sort by most viewed first
      },
      {
        $group: {
          _id: '$model', // Group by model name
          brand: { $first: '$brand' },
          model: { $first: '$model' },
          year: { $first: '$year' },
          price: { $first: '$price' },
          images: { $first: '$images' },
          condition: { $first: '$condition' },
          fuelType: { $first: '$fuelType' },
          status: { $first: '$status' },
          totalViews: { $sum: '$views' }
        }
      },
      {
        $sort: { totalViews: -1 } // Sort by total views descending
      },
      {
        $limit: parsedLimit // Limit to requested count
      }
    ]);

    console.log(`🚗 Database returned ${trendingVehicles.length} trending vehicles:`, trendingVehicles.map((v, i) => `${i + 1}. ${v.brand} ${v.model} (${v.totalViews} views, status: ${v.status})`));

    const responseData = trendingVehicles.map(vehicle => ({
      _id: vehicle._id,
      searchQuery: `${vehicle.brand} ${vehicle.model}`,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      price: vehicle.price,
      count: vehicle.totalViews || 0,
      image: vehicle.images?.[0] || null,
      condition: vehicle.condition,
      fuelType: vehicle.fuelType,
      status: 'available' // If it's in the system, it's available
    }));

    console.log(`✅ Returning ${responseData.length} vehicles to frontend:`, responseData.map((v, i) => `${i + 1}. ${v.brand} ${v.model}`));

    res.json({
      success: true,
      data: responseData
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
