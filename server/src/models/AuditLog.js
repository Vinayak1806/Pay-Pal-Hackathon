const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  dealId: {
    type: String,
    index: true
  },
  eventType: {
    type: String,
    required: true,
    enum: [
      'task_received',
      'offers_generated',
      'deal_accepted',
      'policy_check_passed',
      'policy_check_failed',
      'approval_requested',
      'approval_granted',
      'approval_rejected',
      'checkout_created',
      'payment_captured',
      'payment_failed',
      'duplicate_blocked',
      'tamper_detected'
    ]
  },
  actor: {
    type: String,
    required: true
  },
  details: {
    type: mongoose.Schema.Types.Mixed
  },
  outcome: {
    type: String,
    required: true,
    enum: ['success', 'blocked', 'pending', 'failed']
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
