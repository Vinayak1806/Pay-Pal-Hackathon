const { v4: uuid } = require('uuid');
const geminiService = require('../services/geminiService');
const AuditLog = require('../models/AuditLog');

async function interpretRequest(userInput) {
  if (!userInput || typeof userInput !== 'string') {
    throw new Error('User input must be a non-empty string');
  }
  if (userInput.length > 500) {
    throw new Error('User input must be under 500 characters');
  }

  const { data: parsedTask, source } = await geminiService.parseTask(userInput);
  const taskId = uuid();
  parsedTask.taskId = taskId;

  try {
    await AuditLog.create({
      dealId: null,
      eventType: 'task_received',
      actor: 'SpendMesh Buyer Agent',
      details: {
        taskId,
        serviceType: parsedTask.serviceType,
        maxBudget: parsedTask.maxBudget,
        source,
        requirementCount: parsedTask.requirements.length
      },
      outcome: 'success'
    });
  } catch (error) {
    console.error('Failed to log task_received:', error.message);
  }

  return { taskId, parsedTask, source };
}

async function selectOffer(taskId, parsedTask, offers) {
  const { data: recommendation, source } = await geminiService.compareOffers(parsedTask, offers);

  try {
    await AuditLog.create({
      dealId: null,
      eventType: 'offers_generated',
      actor: 'SpendMesh Buyer Agent',
      details: {
        taskId,
        offerCount: offers.length,
        recommendedOfferId: recommendation.recommendedOfferId,
        source,
        prices: offers.map(o => o.price)
      },
      outcome: 'success'
    });
  } catch (error) {
    console.error('Failed to log offers_generated:', error.message);
  }

  return {
    recommendedOfferId: recommendation.recommendedOfferId,
    reasoning: recommendation.reasoning,
    tradeoffs: recommendation.tradeoffs,
    source
  };
}

module.exports = {
  interpretRequest,
  selectOffer
};
