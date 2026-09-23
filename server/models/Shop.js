import mongoose from 'mongoose';

const shopSchema = new mongoose.Schema({
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    unique: true,
    required: true,
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  logo: {
    type: String,
    default: '',
  },
  cover: {
    type: String,
    default: '',
  },
  profileImage: {
    type: String,
    default: '',
  },
  theme: {
    primaryColor: {
      type: String,
      default: '#8b5cf6',
    },
  },
  contactPhone: {
    type: String,
    default: '',
  },
  telegram: {
    type: String,
    default: '',
  },
  socialLinks: {
    facebook: { type: String, default: '' },
    instagram: { type: String, default: '' },
    telegram: { type: String, default: '' },
  },
  bakongAccount: {
    type: String,
    default: '',
  },
  bakongName: {
    type: String,
    default: '',
  },
  bakongCity: {
    type: String,
    default: 'Phnom Penh',
  },
  status: {
    type: String,
    enum: ['pending_approval', 'active', 'payment_overdue', 'suspended'],
    default: 'pending_approval',
  },
  activatedAt: Date,
  subscriptionPaidUntil: Date,
}, {
  timestamps: true,
});

export default mongoose.model('Shop', shopSchema);
