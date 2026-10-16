const { v4: uuid } = require('uuid');
const Deal = require('../models/Deal');
const Policy = require('../models/Policy');
const Payment = require('../models/Payment');
const AuditLog = require('../models/AuditLog');
const sellerAgents = require('../agents/sellerAgents');
const policyEngine = require('../services/policyEngine');
const paypalService = require('../services/paypalService');
const geminiService = require('../services/geminiService');

async function createDeal(req, res, next) {
  try {
    const { taskId, offerId, parsedTask } = req.body;

    if (!taskId || !offerId) {
      return res.status(400).json({
        success: false,
        error: { message: 'taskId and offerId are required', code: 'MISSING_FIELDS' }
      });
    }

    // Server-side offer verification — never trust browser price
    const verifiedOffer = sellerAgents.verifyOffer(offerId, taskId);
    if (!verifiedOffer) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid offer ID or task ID. Offer not found on server.', code: 'INVALID_OFFER' }
      });
    }

    // Get or create policy
    let policy = await Policy.findOne({ userId: 'demo-user' });
    if (!policy) {
      policy = await Policy.create({ userId: 'demo-user' });
    }

    const dealId = uuid();

    // Create deal with server-stored amount — never from request body
    const deal = await Deal.create({
      dealId,
      taskId,
      offerId,
      sellerAgent: verifiedOffer.sellerName,
      serviceType: verifiedOffer.serviceType,
      description: verifiedOffer.description,
      agreedAmount: verifiedOffer.price,
      currency: 'USD',
      terms: `Delivery: ${verifiedOffer.deliveryTime}`,
      status: 'proposed',
      geminiReasoning: parsedTask?.reasoning || ''
    });

    // Run policy checks
    const policyResult = await policyEngine.validateDeal(deal, policy);

    if (policyResult.requiresApproval) {
      deal.status = 'pending_approval';
      deal.blockedReason = policyResult.message;
      await deal.save();

      await AuditLog.create({
        dealId,
        eventType: 'approval_requested',
        actor: 'PolicyEngine',
        details: { amount: deal.agreedAmount, autoApproveLimit: policy.autoApproveLimit },
        outcome: 'pending'
      });
    } else if (!policyResult.allowed) {
      deal.status = 'blocked';
      deal.blockedReason = policyResult.message;
      await deal.save();
    } else {
      deal.status = 'accepted';
      await deal.save();
    }

    await AuditLog.create({
      dealId,
      eventType: 'deal_accepted',
      actor: 'SpendMesh Buyer Agent',
      details: {
        offerId,
        sellerAgent: verifiedOffer.sellerName,
        agreedAmount: verifiedOffer.price,
        status: deal.status
      },
      outcome: policyResult.allowed ? 'success' : (policyResult.requiresApproval ? 'pending' : 'blocked')
    });

    res.status(201).json({
      success: true,
      data: { deal, policyResult }
    });
  } catch (error) {
    next(error);
  }
}

async function getDeals(req, res, next) {
  try {
    const deals = await Deal.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: { deals }
    });
  } catch (error) {
    next(error);
  }
}

async function getDeal(req, res, next) {
  try {
    const deal = await Deal.findOne({ dealId: req.params.id });
    if (!deal) {
      return res.status(404).json({
        success: false,
        error: { message: 'Deal not found', code: 'NOT_FOUND' }
      });
    }
    res.json({
      success: true,
      data: { deal }
    });
  } catch (error) {
    next(error);
  }
}

async function approveDeal(req, res, next) {
  try {
    const { decision } = req.body;
    const dealId = req.params.id;

    if (!decision || !['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Decision must be "approved" or "rejected"', code: 'INVALID_DECISION' }
      });
    }

    const deal = await Deal.findOne({ dealId });
    if (!deal) {
      return res.status(404).json({
        success: false,
        error: { message: 'Deal not found', code: 'NOT_FOUND' }
      });
    }

    if (deal.status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        error: { message: `Deal is not pending approval. Current status: ${deal.status}`, code: 'INVALID_STATUS' }
      });
    }

    deal.status = decision;
    if (decision === 'rejected') {
      deal.blockedReason = 'Rejected by human reviewer';
    }
    await deal.save();

    await AuditLog.create({
      dealId,
      eventType: decision === 'approved' ? 'approval_granted' : 'approval_rejected',
      actor: 'Human Reviewer',
      details: { decision, amount: deal.agreedAmount },
      outcome: decision === 'approved' ? 'success' : 'blocked'
    });

    res.json({
      success: true,
      data: { deal }
    });
  } catch (error) {
    next(error);
  }
}

async function checkoutDeal(req, res, next) {
  try {
    const dealId = req.params.id;
    const deal = await Deal.findOne({ dealId });

    if (!deal) {
      return res.status(404).json({
        success: false,
        error: { message: 'Deal not found', code: 'NOT_FOUND' }
      });
    }

    if (!['accepted', 'approved'].includes(deal.status)) {
      return res.status(400).json({
        success: false,
        error: { message: `Deal cannot be checked out. Current status: ${deal.status}`, code: 'INVALID_STATUS' }
      });
    }

    // TAMPER DETECTION: if request body contains amount/price, log and ignore
    if (req.body.amount !== undefined || req.body.price !== undefined) {
      const submittedAmount = req.body.amount || req.body.price;
      if (submittedAmount !== deal.agreedAmount) {
        await AuditLog.create({
          dealId,
          eventType: 'tamper_detected',
          actor: 'SecurityEngine',
          details: {
            submittedAmount,
            storedAmount: deal.agreedAmount,
            action: 'Ignored submitted amount, using stored agreedAmount'
          },
          outcome: 'blocked'
        });
      }
    }

    // Fresh policy check
    const policy = await Policy.findOne({ userId: 'demo-user' });
    if (!policy) {
      return res.status(500).json({
        success: false,
        error: { message: 'Policy not found', code: 'POLICY_MISSING' }
      });
    }

    const policyResult = await policyEngine.validateDeal(deal, policy);
    if (!policyResult.allowed && !policyResult.requiresApproval) {
      return res.status(400).json({
        success: false,
        error: {
          message: policyResult.message,
          code: policyResult.reason,
          policyResult
        }
      });
    }

    // Atomic budget reservation
    const reserveResult = await Policy.findOneAndUpdate(
      {
        userId: 'demo-user',
        $expr: {
          $lte: [
            { $add: ['$spentAmount', '$committedAmount', deal.agreedAmount] },
            '$totalBudget'
          ]
        }
      },
      { $inc: { committedAmount: deal.agreedAmount } },
      { new: true }
    );

    if (!reserveResult) {
      return res.status(400).json({
        success: false,
        error: { message: 'Insufficient budget — concurrent reservation failed', code: 'BUDGET_EXCEEDED' }
      });
    }

    // Create PayPal order using ONLY stored deal.agreedAmount
    let paypalOrder;
    try {
      paypalOrder = await paypalService.createOrder(deal);
    } catch (paypalError) {
      // Release committed amount on PayPal failure
      await Policy.findOneAndUpdate(
        { userId: 'demo-user' },
        { $inc: { committedAmount: -deal.agreedAmount } }
      );
      return res.status(502).json({
        success: false,
        error: { message: 'Failed to create PayPal order', code: 'PAYPAL_ERROR' }
      });
    }

    // Create Payment record
    await Payment.create({
      dealId,
      paypalOrderId: paypalOrder.orderId,
      amount: deal.agreedAmount,
      currency: deal.currency,
      status: 'created'
    });

    // Update deal
    deal.paypalOrderId = paypalOrder.orderId;
    deal.status = 'checkout_created';
    await deal.save();

    await AuditLog.create({
      dealId,
      eventType: 'checkout_created',
      actor: 'PaymentService',
      details: {
        paypalOrderId: paypalOrder.orderId,
        amount: deal.agreedAmount,
        currency: deal.currency
      },
      outcome: 'success'
    });

    res.json({
      success: true,
      data: {
        orderId: paypalOrder.orderId,
        approvalUrl: paypalOrder.approvalUrl
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createDeal,
  getDeals,
  getDeal,
  approveDeal,
  checkoutDeal
};
