/**
 * Image Routes
 * Handles image retrieval from database
 */

const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { validateObjectId } = require('../middlewares/validation');

// Get single image by ID
router.get('/:imageId', validateObjectId('imageId'), vehicleController.getImageById);

module.exports = router;
