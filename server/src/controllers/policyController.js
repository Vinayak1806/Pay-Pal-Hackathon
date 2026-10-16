const Policy = require('../models/Policy');

async function getPolicy(req, res, next) {
  try {
    let policy = await Policy.findOne({ userId: 'demo-user' });
    if (!policy) {
      policy = await Policy.create({ userId: 'demo-user' });
    }

    const remainingBudget = policy.totalBudget - policy.spentAmount - policy.committedAmount;

    res.json({
      success: true,
      data: {
        policy: {
          userId: policy.userId,
          totalBudget: policy.totalBudget,
          spentAmount: policy.spentAmount,
          committedAmount: policy.committedAmount,
          autoApproveLimit: policy.autoApproveLimit,
          allowedServices: policy.allowedServices,
          updatedAt: policy.updatedAt
        },
        remainingBudget
      }
    });
  } catch (error) {
    next(error);
  }
}

async function updatePolicy(req, res, next) {
  try {
    const allowedUpdates = {};
    const { totalBudget, autoApproveLimit, allowedServices } = req.body;

    if (totalBudget !== undefined) {
      if (typeof totalBudget !== 'number' || totalBudget < 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'totalBudget must be a non-negative number', code: 'INVALID_BUDGET' }
        });
      }
      allowedUpdates.totalBudget = totalBudget;
    }

    if (autoApproveLimit !== undefined) {
      if (typeof autoApproveLimit !== 'number' || autoApproveLimit < 0) {
        return res.status(400).json({
          success: false,
          error: { message: 'autoApproveLimit must be a non-negative number', code: 'INVALID_LIMIT' }
        });
      }
      allowedUpdates.autoApproveLimit = autoApproveLimit;
    }

    if (allowedServices !== undefined) {
      const validServices = ['presentation', 'research', 'website', 'content', 'design'];
      if (!Array.isArray(allowedServices) || !allowedServices.every(s => validServices.includes(s))) {
        return res.status(400).json({
          success: false,
          error: { message: 'allowedServices must contain only valid service types', code: 'INVALID_SERVICES' }
        });
      }
      allowedUpdates.allowedServices = allowedServices;
    }

    if (Object.keys(allowedUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'No valid fields to update', code: 'NO_UPDATES' }
      });
    }

    // Never allow client to set spentAmount or committedAmount
    const policy = await Policy.findOneAndUpdate(
      { userId: 'demo-user' },
      { $set: allowedUpdates },
      { new: true, upsert: true }
    );

    const remainingBudget = policy.totalBudget - policy.spentAmount - policy.committedAmount;

    res.json({
      success: true,
      data: { policy, remainingBudget }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getPolicy,
  updatePolicy
};
