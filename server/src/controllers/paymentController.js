const Payment = require('../models/Payment');
const Deal = require('../models/Deal');
const Policy = require('../models/Policy');
const AuditLog = require('../models/AuditLog');
const paypalService = require('../services/paypalService');
const geminiService = require('../services/geminiService');

async function capturePayment(req, res, next) {
  try {
    const { orderId } = req.params;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        error: { message: 'Order ID is required', code: 'MISSING_ORDER_ID' }
      });
    }

    // Atomic lock: prevent concurrent captures
    const payment = await Payment.findOneAndUpdate(
      {
        paypalOrderId: orderId,
        status: { $nin: ['completed', 'processing'] }
      },
      { $set: { status: 'processing' } },
      { new: true }
    );

    if (!payment) {
      const existingPayment = await Payment.findOne({ paypalOrderId: orderId });
      if (existingPayment && (existingPayment.status === 'completed' || existingPayment.status === 'processing')) {
        const deal = await Deal.findOne({ dealId: existingPayment.dealId });
        return res.status(200).json({
          success: true,
          data: {
            captureStatus: existingPayment.captureStatus || 'COMPLETED',
            captureId: existingPayment.paypalCaptureId || existingPayment.paypalOrderId,
            dealStatus: deal?.status || 'payment_completed',
            amount: existingPayment.amount || deal?.agreedAmount,
            currency: existingPayment.currency || 'USD',
            deliverable: deal?.deliverable,
            serviceType: deal?.serviceType,
            sellerAgent: deal?.sellerAgent,
            alreadyCaptured: true
          }
        });
      }
      return res.status(404).json({
        success: false,
        error: { message: 'Payment not found', code: 'NOT_FOUND' }
      });
    }

    const deal = await Deal.findOne({ dealId: payment.dealId });
    if (!deal) {
      // Revert processing status
      await Payment.findOneAndUpdate(
        { paypalOrderId: orderId },
        { $set: { status: 'created' } }
      );
      return res.status(404).json({
        success: false,
        error: { message: 'Associated deal not found', code: 'DEAL_NOT_FOUND' }
      });
    }

    let captureResult;
    try {
      captureResult = await paypalService.captureOrder(orderId);
    } catch (paypalError) {
      // Capture failed — update records and release budget
      await Payment.findOneAndUpdate(
        { paypalOrderId: orderId },
        { $set: { status: 'failed', captureStatus: 'FAILED' } }
      );

      deal.status = 'payment_failed';
      await deal.save();

      // Release committedAmount
      await Policy.findOneAndUpdate(
        { userId: 'demo-user' },
        { $inc: { committedAmount: -deal.agreedAmount } }
      );

      await AuditLog.create({
        dealId: deal.dealId,
        eventType: 'payment_failed',
        actor: 'PaymentService',
        details: { orderId, error: paypalError.message },
        outcome: 'failed'
      });

      return res.status(502).json({
        success: false,
        error: { message: 'Payment capture failed', code: 'CAPTURE_FAILED' },
        data: {
          captureStatus: 'FAILED',
          dealStatus: 'payment_failed'
        }
      });
    }

    if (captureResult.captureStatus === 'COMPLETED') {
      // Update Payment record
      await Payment.findOneAndUpdate(
        { paypalOrderId: orderId },
        {
          $set: {
            status: 'completed',
            captureId: captureResult.captureId,
            captureStatus: captureResult.captureStatus,
            amount: parseFloat(captureResult.amount),
            currency: captureResult.currency,
            verifiedAt: new Date()
          }
        }
      );

      // Update Deal status
      deal.status = 'payment_completed';
      await deal.save();

      // Atomic: move from committed to spent
      await Policy.findOneAndUpdate(
        { userId: 'demo-user' },
        {
          $inc: {
            spentAmount: deal.agreedAmount,
            committedAmount: -deal.agreedAmount
          }
        }
      );

      // Generate deliverable with Gemini
      let deliverable = null;
      let deliverableSource = 'none';
      try {
        const deliverableResult = await geminiService.generateDeliverable(
          deal.serviceType,
          deal.description
        );
        deliverable = deliverableResult.data;
        deliverableSource = deliverableResult.source;
        deal.deliverable = deliverable;
        await deal.save();
      } catch (deliverableError) {
        console.error('Failed to generate deliverable:', deliverableError.message);
      }

      await AuditLog.create({
        dealId: deal.dealId,
        eventType: 'payment_captured',
        actor: 'PaymentService',
        details: {
          orderId,
          captureId: captureResult.captureId,
          amount: captureResult.amount,
          currency: captureResult.currency,
          deliverableSource
        },
        outcome: 'success'
      });

      return res.json({
        success: true,
        data: {
          captureStatus: captureResult.captureStatus,
          captureId: captureResult.captureId,
          dealStatus: deal.status,
          amount: captureResult.amount,
          currency: captureResult.currency,
          deliverable,
          deliverableSource
        }
      });
    } else {
      // Non-COMPLETED capture status
      await Payment.findOneAndUpdate(
        { paypalOrderId: orderId },
        {
          $set: {
            status: 'failed',
            captureStatus: captureResult.captureStatus
          }
        }
      );

      deal.status = 'payment_failed';
      await deal.save();

      // Release committedAmount
      await Policy.findOneAndUpdate(
        { userId: 'demo-user' },
        { $inc: { committedAmount: -deal.agreedAmount } }
      );

      await AuditLog.create({
        dealId: deal.dealId,
        eventType: 'payment_failed',
        actor: 'PaymentService',
        details: {
          orderId,
          captureStatus: captureResult.captureStatus
        },
        outcome: 'failed'
      });

      return res.json({
        success: false,
        data: {
          captureStatus: captureResult.captureStatus,
          dealStatus: deal.status
        }
      });
    }
  } catch (error) {
    next(error);
  }
}

async function getPaymentStatus(req, res, next) {
  try {
    const { orderId } = req.params;
    const payment = await Payment.findOne({ paypalOrderId: orderId });

    if (!payment) {
      return res.status(404).json({
        success: false,
        error: { message: 'Payment not found', code: 'NOT_FOUND' }
      });
    }

    res.json({
      success: true,
      data: {
        status: payment.status,
        captureStatus: payment.captureStatus,
        dealId: payment.dealId,
        verifiedAt: payment.verifiedAt
      }
    });
  } catch (error) {
    next(error);
  }
}

async function handleCancelStatus(req, res, next) {
  try {
    const token = req.query.token;
    if (token) {
      const payment = await Payment.findOne({ paypalOrderId: token });
      if (payment) {
        const deal = await Deal.findOne({ dealId: payment.dealId });
        if (deal && deal.status === 'checkout_created') {
          deal.status = 'accepted';
          await deal.save();

          // Release committedAmount
          await Policy.findOneAndUpdate(
            { userId: 'demo-user' },
            { $inc: { committedAmount: -deal.agreedAmount } }
          );

          await Payment.findOneAndUpdate(
            { paypalOrderId: token },
            { $set: { status: 'failed' } }
          );
        }
        return res.json({
          success: true,
          data: {
            dealId: payment.dealId,
            status: deal ? deal.status : 'unknown'
          }
        });
      }
    }
    res.json({ success: true, data: { message: 'Cancel acknowledged' } });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  capturePayment,
  getPaymentStatus,
  handleCancelStatus
};
