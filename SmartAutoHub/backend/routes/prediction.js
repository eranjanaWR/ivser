/**
 * Prediction Routes
 * Handles vehicle price prediction
 */

const express = require('express');
const router = express.Router();
const predictionController = require('../controllers/predictionController');

// Get prediction factors info
router.get('/factors', predictionController.getPredictionFactors);

// Predict single vehicle price
router.post('/predict', predictionController.predictPrice);

// Bulk predict prices
router.post('/bulk', predictionController.bulkPredict);

module.exports = router;
