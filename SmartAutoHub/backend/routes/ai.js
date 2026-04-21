/**
 * AI Routes
 * Shared endpoint for Takgaala-AI chat bots.
 */

const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/chat', aiController.chatWithTakgaalaAI);

module.exports = router;
