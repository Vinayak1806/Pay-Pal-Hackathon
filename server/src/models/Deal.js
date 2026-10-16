const mongoose = require('mongoose');

const dealSchema = new mongoose.Schema({
  dealId: {
    type: String,
    unique: true,
    required: true,
    index: true
  },
  taskId: {
    type: String,
    required: true
  },
  offerId: {
    type: String,
    required: true
  },
  buyerAgent: {
    type: String,
    default: 'SpendMesh Buyer Agent'
  },
  sellerAgent: {
    type: String,
    required: true
  },
  serviceType: {
    type: String,
    required: true,
    enum: ['presentation', 'research', 'website', 'content', 'design']
  },
  description: {
    type: String,
    required: true
  },
  agreedAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  terms: {
    type: String
  },
  status: {
    type: String,
    default: 'proposed',
    enum: [
      'proposed',
      'accepted',
      'pending_approval',
      'approved',
      'rejected',
      'checkout_created',
      'payment_completed',
      'payment_failed',
      'blocked'
    ],
    index: true
  },
  geminiReasoning: {
    type: String
  },
  deliverable: {
    type: mongoose.Schema.Types.Mixed
  },
  blockedReason: {
    type: String
  },
  paypalOrderId: {
    type: String,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

dealSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

dealSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

module.exports = mongoose.model('Deal', dealSchema);
