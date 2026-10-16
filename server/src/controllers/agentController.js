const buyerAgent = require('../agents/buyerAgent');
const sellerAgents = require('../agents/sellerAgents');

async function handleRequest(req, res, next) {
  try {
    const { userInput } = req.body;

    if (!userInput || typeof userInput !== 'string' || userInput.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'userInput is required and must be a non-empty string', code: 'INVALID_INPUT' }
      });
    }

    if (userInput.length > 500) {
      return res.status(400).json({
        success: false,
        error: { message: 'userInput must be under 500 characters', code: 'INPUT_TOO_LONG' }
      });
    }

    const { taskId, parsedTask, source: parseSource } = await buyerAgent.interpretRequest(userInput.trim());
    const offers = sellerAgents.getSellerOffers(parsedTask);
    const recommendation = await buyerAgent.selectOffer(taskId, parsedTask, offers);

    res.json({
      success: true,
      data: {
        taskId,
        parsedTask,
        offers,
        recommendation,
        aiSource: {
          parser: parseSource,
          recommender: recommendation.source
        }
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  handleRequest
};
