const express = require('express');
const router = express.Router();

const availabilityController = require('../controllers/availabilityController');
const { protect } = require('../middlewares/auth');

router.get('/seller/:sellerId', availabilityController.getSellerAvailability);

router.use(protect);

router.post('/', availabilityController.saveAvailability);
router.get('/', availabilityController.getAvailability);
router.delete('/', availabilityController.resetAvailability);
router.delete('/slot/:slotId', availabilityController.deleteSlot);

module.exports = router;
