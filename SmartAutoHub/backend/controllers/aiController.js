/**
 * Takgaala-AI Controller
 * Shared endpoint for specialized chatbot behaviors using system prompts.
 */

const { callAI } = require('../services/azureOpenAIService');

const VEHICLE_DETAILS_SYSTEM_PROMPT = `You are a Vehicle Details AI assistant.

Hard rules:
1. Accept only one vehicle at a time.
2. If the user gives multiple vehicles, ask them to provide only one vehicle.
3. If the vehicle name is unclear, ask for model/year/variant.
4. Always return full structured vehicle details.
5. Never compare vehicles.
6. Never ask for a second vehicle.
7. If a specific fact is unknown, say it is unavailable instead of inventing data.

Output structure (strictly use these section titles in this exact order):
1. Vehicle Overview
2. Engine and Performance
3. Fuel Efficiency
4. Dimensions and Capacity
5. Features
6. Pros
7. Cons
8. Best For
9. Final Summary

Restrictions:
- Do not compare vehicles.
- Do not output side-by-side data.
- Do not ask for a second vehicle.`;

const VEHICLE_COMPARISON_SYSTEM_PROMPT = `You are a Vehicle Comparison AI assistant.

Hard rules:
1. You must collect two vehicles before answering.
2. If only one vehicle is provided, ask for the second vehicle.
3. Always compare both vehicles.
4. You must provide a final recommendation.
5. You must include pros and cons for both vehicles.
6. If specific facts are unknown, say they are unavailable instead of inventing data.

Output structure (strictly use these section titles in this exact order):
1. Comparison Overview
2. Quick Summary
3. Specification Comparison Table
4. Vehicle 1 Pros
5. Vehicle 1 Cons
6. Vehicle 2 Pros
7. Vehicle 2 Cons
8. Best Choice By Use Case
9. Final Recommendation

Restrictions:
- Do not answer with only one vehicle.
- Do not behave like a details bot.
- Do not skip the recommendation.`;

const SYSTEM_PROMPTS = {
  details: VEHICLE_DETAILS_SYSTEM_PROMPT,
  comparison: VEHICLE_COMPARISON_SYSTEM_PROMPT,
};

/**
 * @desc    Chat with Takgaala-AI bot
 * @route   POST /api/ai/chat
 * @access  Public
 */
const chatWithTakgaalaAI = async (req, res) => {
  try {
    const { botType, message, history } = req.body;

    if (!botType || !SYSTEM_PROMPTS[botType]) {
      return res.status(400).json({
        success: false,
        message: 'botType must be either "details" or "comparison"',
      });
    }

    if (typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'message is required',
      });
    }

    if (message.trim().length > 1200) {
      return res.status(400).json({
        success: false,
        message: 'message is too long. Maximum length is 1200 characters.',
      });
    }

    if (history !== undefined && !Array.isArray(history)) {
      return res.status(400).json({
        success: false,
        message: 'history must be an array when provided',
      });
    }

    const reply = await callAI(message.trim(), SYSTEM_PROMPTS[botType], history || []);

    return res.status(200).json({
      success: true,
      data: {
        botType,
        reply,
      },
    });
  } catch (error) {
    console.error('Takgaala-AI chat error:', error.message);

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode && error.statusCode < 500
        ? error.message
        : 'Takgaala-AI is currently unavailable. Please try again shortly.',
    });
  }
};

module.exports = {
  chatWithTakgaalaAI,
};
