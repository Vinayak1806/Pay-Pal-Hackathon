const mongoose = require('mongoose');
const crypto = require('crypto');

function computeHash(doc, previousHash = '0'.repeat(64)) {
  const timestampStr = doc.timestamp ? new Date(doc.timestamp).toISOString() : new Date().toISOString();
  const payload = [
    previousHash,
    doc.blockNumber || 0,
    timestampStr,
    doc.dealId || '',
    doc.eventType || '',
    doc.actor || '',
    doc.outcome || '',
    JSON.stringify(doc.details || {})
  ].join('|');
  return crypto.createHash('sha256').update(payload).digest('hex');
}

const auditLogSchema = new mongoose.Schema({
  blockNumber: {
    type: Number,
    default: 1
  },
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
  previousHash: {
    type: String,
    default: '0'.repeat(64)
  },
  currentHash: {
    type: String
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Auto-chain SHA-256 block hash on creation
auditLogSchema.pre('save', async function (next) {
  if (!this.currentHash) {
    try {
      const lastLog = await this.constructor.findOne({ _id: { $ne: this._id } }).sort({ timestamp: -1, _id: -1 });
      this.previousHash = (lastLog && lastLog.currentHash) ? lastLog.currentHash : '0'.repeat(64);
      this.blockNumber = (lastLog && lastLog.blockNumber) ? lastLog.blockNumber + 1 : 1;
      this.currentHash = computeHash(this, this.previousHash);
    } catch (err) {
      // Fallback hash if query fails
      this.previousHash = '0'.repeat(64);
      this.currentHash = computeHash(this, this.previousHash);
    }
  }
  next();
});

auditLogSchema.statics.computeHash = computeHash;

module.exports = mongoose.model('AuditLog', auditLogSchema);
