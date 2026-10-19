const { v4: uuid } = require('uuid');
const buyerAgent = require('../agents/buyerAgent');
const sellerAgents = require('../agents/sellerAgents');

async function handleRequest(req, res, next) {
  try {
    const { userInput, parsedTask: customParsedTask, taskId: existingTaskId } = req.body;

    let taskId;
    let parsedTask;
    let parseSource;

    if (customParsedTask && typeof customParsedTask === 'object') {
      taskId = existingTaskId || customParsedTask.taskId || uuid();
      parsedTask = {
        taskId,
        serviceType: customParsedTask.serviceType || 'presentation',
        maxBudget: Number(customParsedTask.maxBudget) || 100,
        requirements: Array.isArray(customParsedTask.requirements) ? customParsedTask.requirements : [],
        urgency: customParsedTask.urgency || 'normal',
        reasoning: customParsedTask.reasoning || customParsedTask.description || 'User-modified requirements'
      };
      parseSource = 'user-customized';
    } else {
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

      const interpreted = await buyerAgent.interpretRequest(userInput.trim());
      taskId = interpreted.taskId;
      parsedTask = interpreted.parsedTask;
      parseSource = interpreted.source;
    }

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
