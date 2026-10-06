/**
 * Prediction Controller
 * Handles vehicle price prediction using a simple ML-like algorithm
 * In production, this would connect to a trained ML model
 */

const Vehicle = require('../models/Vehicle');

/**
 * Base prices for different brands (simplified model)
 */
const BRAND_BASE_PRICES = {
  'toyota': 25000,
  'honda': 24000,
  'ford': 28000,
  'chevrolet': 27000,
  'nissan': 23000,
  'bmw': 45000,
  'mercedes': 50000,
  'audi': 42000,
  'volkswagen': 28000,
  'hyundai': 22000,
  'kia': 21000,
  'mazda': 26000,
  'subaru': 27000,
  'lexus': 40000,
  'jeep': 32000,
  'tesla': 55000,
  'porsche': 80000,
  'default': 25000
};

/**
 * Body type multipliers
 */
const BODY_TYPE_MULTIPLIERS = {
  'sedan': 1.0,
  'suv': 1.2,
  'truck': 1.3,
  'hatchback': 0.9,
  'coupe': 1.1,
  'convertible': 1.25,
  'van': 1.15,
  'wagon': 1.05,
  'other': 1.0
};

/**
 * Condition multipliers
 */
const CONDITION_MULTIPLIERS = {
  'new': 1.0,
  'excellent': 0.85,
  'good': 0.70,
  'fair': 0.55,
  'poor': 0.40
};

/**
 * @desc    Predict vehicle price
 * @route   POST /api/prediction/predict
 * @access  Public
 */
const predictPrice = async (req, res) => {
  try {
    const {
      brand,
      model,
      year,
      mileage,
      fuelType,
      transmission,
      bodyType,
      condition
    } = req.body;
    
    // Validate required fields
    if (!brand || !year || !mileage) {
      return res.status(400).json({
        success: false,
        message: 'Brand, year, and mileage are required for prediction'
      });
    }
    
    // Calculate base price from brand
    const brandLower = brand.toLowerCase();
    let basePrice = BRAND_BASE_PRICES[brandLower] || BRAND_BASE_PRICES['default'];
    
    // Adjust for body type
    const bodyMultiplier = BODY_TYPE_MULTIPLIERS[bodyType] || 1.0;
    basePrice *= bodyMultiplier;
    
    // Calculate depreciation based on age
    const currentYear = new Date().getFullYear();
    const age = currentYear - parseInt(year);
    
    // Depreciation: ~15% first year, ~10% subsequent years
    let depreciationFactor = 1.0;
    if (age > 0) {
      depreciationFactor = Math.pow(0.90, age - 1) * 0.85; // First year 15%, then 10% each year
    }
    
    // Adjust for mileage (average 12,000 miles/year)
    const expectedMileage = age * 12000;
    const mileageNum = parseInt(mileage);
    let mileageAdjustment = 1.0;
    
    if (mileageNum > expectedMileage) {
      // Higher than average mileage - reduce price
      const excessMiles = mileageNum - expectedMileage;
      mileageAdjustment = Math.max(0.7, 1 - (excessMiles / 100000) * 0.2);
    } else if (mileageNum < expectedMileage) {
      // Lower than average mileage - increase price
      const savedMiles = expectedMileage - mileageNum;
      mileageAdjustment = Math.min(1.15, 1 + (savedMiles / 100000) * 0.1);
    }
    
    // Adjust for condition
    const conditionMultiplier = CONDITION_MULTIPLIERS[condition] || 0.70;
    
    // Adjust for fuel type
    let fuelMultiplier = 1.0;
    if (fuelType === 'electric') {
      fuelMultiplier = 1.15; // Electric premium
    } else if (fuelType === 'hybrid') {
      fuelMultiplier = 1.10; // Hybrid premium
    } else if (fuelType === 'diesel') {
      fuelMultiplier = 1.05; // Diesel slight premium
    }
    
    // Adjust for transmission
    let transmissionMultiplier = 1.0;
    if (transmission === 'manual') {
      transmissionMultiplier = 0.95; // Manual slightly lower
    }
    
    // Calculate final predicted price
    let predictedPrice = basePrice * 
      depreciationFactor * 
      mileageAdjustment * 
      conditionMultiplier * 
      fuelMultiplier * 
      transmissionMultiplier;
    
    // Round to nearest 100
    predictedPrice = Math.round(predictedPrice / 100) * 100;
    
    // Calculate price range (±10%)
    const minPrice = Math.round(predictedPrice * 0.9 / 100) * 100;
    const maxPrice = Math.round(predictedPrice * 1.1 / 100) * 100;
    
    // Get similar vehicles from database for comparison
    const similarVehicles = await Vehicle.find({
      brand: new RegExp(brand, 'i'),
      year: { $gte: parseInt(year) - 2, $lte: parseInt(year) + 2 },
      status: 'available'
    })
    .select('brand model year mileage price')
    .limit(5);
    
    // Calculate average market price from similar vehicles
    let marketAverage = null;
    if (similarVehicles.length > 0) {
      const totalPrice = similarVehicles.reduce((sum, v) => sum + v.price, 0);
      marketAverage = Math.round(totalPrice / similarVehicles.length / 100) * 100;
    }
    
    res.json({
      success: true,
      data: {
        predictedPrice,
        priceRange: {
          min: minPrice,
          max: maxPrice
        },
        factors: {
          basePrice,
          depreciation: `${Math.round((1 - depreciationFactor) * 100)}%`,
          mileageImpact: `${Math.round((mileageAdjustment - 1) * 100)}%`,
          condition: condition || 'good',
          bodyType: bodyType || 'sedan'
        },
        marketComparison: {
          similarVehiclesCount: similarVehicles.length,
          marketAverage,
          similarVehicles: similarVehicles.map(v => ({
            name: `${v.year} ${v.brand} ${v.model}`,
            mileage: v.mileage,
            price: v.price
          }))
        },
        disclaimer: 'This is an estimated price based on market analysis. Actual prices may vary based on location, specific features, and market conditions.'
      }
    });
  } catch (error) {
    console.error('Prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error predicting price',
      error: error.message
    });
  }
};

/**
 * @desc    Get prediction factors info
 * @route   GET /api/prediction/factors
 * @access  Public
 */
const getPredictionFactors = async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        brands: Object.keys(BRAND_BASE_PRICES).filter(b => b !== 'default'),
        bodyTypes: Object.keys(BODY_TYPE_MULTIPLIERS),
        conditions: Object.keys(CONDITION_MULTIPLIERS),
        fuelTypes: ['petrol', 'diesel', 'electric', 'hybrid', 'other'],
        transmissions: ['automatic', 'manual', 'cvt', 'other'],
        description: 'Price prediction is based on brand, age, mileage, condition, and other factors.'
      }
    });
  } catch (error) {
    console.error('Get factors error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching prediction factors',
      error: error.message
    });
  }
};

/**
 * @desc    Bulk predict prices for comparison
 * @route   POST /api/prediction/bulk
 * @access  Public
 */
const bulkPredict = async (req, res) => {
  try {
    const { vehicles } = req.body;
    
    if (!Array.isArray(vehicles) || vehicles.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vehicles array is required'
      });
    }
    
    if (vehicles.length > 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 10 vehicles per bulk prediction'
      });
    }
    
    const predictions = vehicles.map(vehicle => {
      const { brand, year, mileage, bodyType, condition, fuelType, transmission } = vehicle;
      
      // Simplified prediction calculation
      const brandLower = (brand || '').toLowerCase();
      let basePrice = BRAND_BASE_PRICES[brandLower] || BRAND_BASE_PRICES['default'];
      
      const bodyMultiplier = BODY_TYPE_MULTIPLIERS[bodyType] || 1.0;
      const conditionMultiplier = CONDITION_MULTIPLIERS[condition] || 0.70;
      
      const currentYear = new Date().getFullYear();
      const age = currentYear - parseInt(year || currentYear);
      const depreciationFactor = age > 0 ? Math.pow(0.90, age - 1) * 0.85 : 1.0;
      
      const mileageNum = parseInt(mileage || 0);
      const expectedMileage = age * 12000;
      let mileageAdjustment = 1.0;
      if (mileageNum > expectedMileage) {
        mileageAdjustment = Math.max(0.7, 1 - ((mileageNum - expectedMileage) / 100000) * 0.2);
      }
      
      let predictedPrice = basePrice * depreciationFactor * bodyMultiplier * conditionMultiplier * mileageAdjustment;
      predictedPrice = Math.round(predictedPrice / 100) * 100;
      
      return {
        input: vehicle,
        predictedPrice,
        priceRange: {
          min: Math.round(predictedPrice * 0.9 / 100) * 100,
          max: Math.round(predictedPrice * 1.1 / 100) * 100
        }
      };
    });
    
    res.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    console.error('Bulk prediction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error in bulk prediction',
      error: error.message
    });
  }
};

module.exports = {
  predictPrice,
  getPredictionFactors,
  bulkPredict
};
