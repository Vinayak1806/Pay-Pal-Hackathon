const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');

async function validateDeal(deal, policy) {
  // CHECK 1 — Amount validation
  if (typeof deal.agreedAmount !== 'number' || deal.agreedAmount <= 0 || deal.currency !== 'USD') {
    const result = {
      allowed: false,
      reason: 'INVALID_AMOUNT',
      message: 'Amount must be a positive USD value'
    };
    await logPolicyCheck(deal, result);
    return result;
  }

  // CHECK 2 — Service type
  if (!policy.allowedServices.includes(deal.serviceType)) {
    const result = {
      allowed: false,
      reason: 'SERVICE_NOT_ALLOWED',
      message: 'This service type is not permitted'
    };
    await logPolicyCheck(deal, result);
    return result;
  }

  // CHECK 3 — Budget availability
  const totalRequired = policy.spentAmount + policy.committedAmount + deal.agreedAmount;
  if (totalRequired > policy.totalBudget) {
    const result = {
      allowed: false,
      reason: 'BUDGET_EXCEEDED',
      message: 'Insufficient budget remaining'
    };
    await logPolicyCheck(deal, result);
    return result;
  }

  // CHECK 4 — Duplicate payment
  const existingPayment = await Payment.findOne({
    dealId: deal.dealId,
    status: 'completed'
  });
  if (existingPayment) {
    const result = {
      allowed: false,
      reason: 'DUPLICATE_PAYMENT',
      message: 'This deal has already been paid'
    };
    await logPolicyCheck(deal, result);
    return result;
  }

  // CHECK 5 — Auto-approve threshold
  if (deal.agreedAmount > policy.autoApproveLimit) {
    const result = {
      allowed: false,
      requiresApproval: true,
      reason: 'APPROVAL_REQUIRED',
      message: 'Amount exceeds auto-approve limit'
    };
    await logPolicyCheck(deal, result);
    return result;
  }

  // CHECK 6 — All passed
  const result = {
    allowed: true,
    reason: 'APPROVED',
    message: 'All policy checks passed'
  };
  await logPolicyCheck(deal, result);
  return result;
}

async function logPolicyCheck(deal, result) {
  try {
    await AuditLog.create({
      dealId: deal.dealId,
      eventType: result.allowed ? 'policy_check_passed' : 'policy_check_failed',
      actor: 'PolicyEngine',
      details: {
        amount: deal.agreedAmount,
        serviceType: deal.serviceType,
        reason: result.reason,
        message: result.message,
        requiresApproval: result.requiresApproval || false
      },
      outcome: result.allowed ? 'success' : (result.requiresApproval ? 'pending' : 'blocked')
    });
  } catch (error) {
    console.error('Failed to log policy check:', error.message);
  }
}

module.exports = {
  validateDeal
};
