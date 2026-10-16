const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
  userId: {
    type: String,
    default: 'demo-user',
    unique: true,
    index: true
  },
  totalBudget: {
    type: Number,
    default: 5000,
    min: 0
  },
  spentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  committedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  autoApproveLimit: {
    type: Number,
    default: 1000,
    min: 0
  },
  allowedServices: {
    type: [String],
    default: ['presentation', 'research', 'website', 'content', 'design']
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

policySchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

policySchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

module.exports = mongoose.model('Policy', policySchema);
