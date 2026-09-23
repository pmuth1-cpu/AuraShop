import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['subscription'],
    default: 'subscription',
  },
  amount: {
    type: Number,
    default: 2.50,
  },
  currency: {
    type: String,
    enum: ['USD', 'KHR'],
    default: 'USD',
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'failed'],
    default: 'pending',
  },
  khqrString: {
    type: String,
    default: '',
  },
  khqrMd5: {
    type: String,
    default: '',
  },
  verifiedAt: Date,
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  periodStart: Date,
  periodEnd: Date,
}, {
  timestamps: true,
});

export default mongoose.model('Payment', paymentSchema);
