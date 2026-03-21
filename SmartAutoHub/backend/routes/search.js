/**
 * Search Routes
 * Handles search logging and trending searches
 */

const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { protect } = require('../middlewares/auth');

// Log a search (public, but protect middleware will add user ID if authenticated)
// Using a wrapper to make protect optional
const optionalAuth = (req, res, next) => {
  if (req.headers.authorization) {
    protect(req, res, next);
  } else {
    next();
  }
};

router.post('/log', optionalAuth, searchController.logSearch);

// Log a vehicle search/view
router.post('/log-vehicle', searchController.logVehicleSearch);

// Get trending searches (public)
router.get('/trending', searchController.getTrendingSearches);

// Get most searched vehicle models
router.get('/models/trending', searchController.getTrendingModels);

// Get search statistics (public)
router.get('/stats', searchController.getSearchStats);

module.exports = router;
