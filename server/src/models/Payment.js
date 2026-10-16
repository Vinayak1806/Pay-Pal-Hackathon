const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  dealId: {
    type: String,
    required: true,
    index: true
  },
  paypalOrderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  captureId: {
    type: String
  },
  amount: {
    type: Number
  },
  currency: {
    type: String
  },
  status: {
    type: String,
    default: 'created',
    enum: ['created', 'approved', 'completed', 'failed', 'pending', 'processing'],
    index: true
  },
  captureStatus: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  verifiedAt: {
    type: Date
  }
});

module.exports = mongoose.model('Payment', paymentSchema);
