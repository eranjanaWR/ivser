/**
 * Search Controller
 * Handles search logging and trending searches
 */

const Search = require('../models/Search');
const Vehicle = require('../models/Vehicle');
const ViewHistory = require('../models/ViewHistory');

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
    
    console.log(`📊 Fetching ${parsedLimit} trending vehicles using searchCount...`);

    // Step 1: Get all models from Search collection with their total searches
    const searchModels = await Search.aggregate([
      {
        $match: {
          'filters.model': { $exists: true, $ne: '', $ne: null }
        }
      },
      {
        $group: {
          _id: '$filters.model', // Keep original case
          searchBrand: { $first: '$filters.brand' },
          searchCount: { $sum: 1 }
        }
      },
      {
        $sort: { searchCount: -1 }
      }
    ]);

    console.log(`📚 Found ${searchModels.length} models from searches`);

    // Step 2: Get vehicle counts per model (active vehicles only)
    const vehicleModels = await Vehicle.aggregate([
      {
        $match: { status: 'active' }
      },
      {
        $group: {
          _id: '$model', // Keep original case
          vehicleBrand: { $first: '$brand' },
          vehicleCount: { $sum: 1 },
          year: { $first: '$year' },
          price: { $first: '$price' },
          images: { $first: '$images' },
          condition: { $first: '$condition' },
          fuelType: { $first: '$fuelType' }
        }
      }
    ]);

    console.log(`🚙 Found ${vehicleModels.length} available vehicle models`);

    // Step 3: Create maps (case-sensitive, preserve original)
    const searchMap = {};
    searchModels.forEach(s => {
      searchMap[s._id] = {
        searchCount: s.searchCount,
        brand: s.searchBrand,
        model: s._id
      };
    });

    const vehicleMap = {};
    vehicleModels.forEach(v => {
      vehicleMap[v._id] = v;
    });

    // Step 4: Get unique model names from both sources
    const allModelNames = new Set([
      ...Object.keys(searchMap),
      ...Object.keys(vehicleMap)
    ]);

    console.log(`🔍 Total unique models: ${allModelNames.size}`);

    // Step 5: Build trending list using searchCount + vehicleCount
    const trendingList = Array.from(allModelNames).map(modelName => {
      const searchData = searchMap[modelName] || { searchCount: 0, brand: null, model: modelName };
      const vehicleData = vehicleMap[modelName] || null;
      
      const searchCount = searchData.searchCount || 0;
      const vehicleCount = vehicleData?.vehicleCount || 0;
      const score = searchCount + vehicleCount;
      
      const brand = vehicleData?.vehicleBrand || searchData.brand || modelName.split(' ')[0] || 'Unknown';
      
      return {
        model: modelName,
        brand: brand,
        year: vehicleData?.year || null,
        price: vehicleData?.price || null,
        images: vehicleData?.images || [],
        condition: vehicleData?.condition || null,
        fuelType: vehicleData?.fuelType || null,
        status: vehicleData ? 'active' : 'inactive',
        searchCount,
        vehicleCount,
        score
      };
    });

    // Step 6: Filter to ONLY show models that have actual active vehicles
    // Must have vehicleCount > 0 AND status must be 'active'
    const withVehicles = trendingList.filter(m => m.vehicleCount > 0 && m.status === 'active');

    console.log(`✅ Models with actual active vehicles: ${withVehicles.length}`);

    // Step 7: Sort by score (searchCount + vehicleCount)
    withVehicles.sort((a, b) => b.score - a.score);

    // Step 8: Limit
    const trending = withVehicles.slice(0, parsedLimit);

    // Step 9: Log details
    console.log(`🏆 Top ${trending.length} trending:`,
      trending.map((m, i) => `${i + 1}. ${m.brand} ${m.model} (${m.vehicleCount} vehicles available, ${m.searchCount} searches)`));;

    // Step 10: Response
    const response = trending.map(m => ({
      _id: m.model,
      searchQuery: `${m.brand} ${m.model}`,
      brand: m.brand,
      model: m.model,
      year: m.year,
      price: m.price,
      count: m.score,
      searches: m.searchCount,
      vehicleCount: m.vehicleCount,
      image: m.images?.[0] || null,
      condition: m.condition,
      fuelType: m.fuelType,
      status: m.status
    }));

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('❌ Error:', error);
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
