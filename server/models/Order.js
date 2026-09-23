import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  variantInfo: {
    type: String,
    default: '',
  },
  image: {
    type: String,
    default: '',
  },
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Shop',
    required: true,
    index: true,
  },
  buyer: {
    phone: { type: String, default: '' },
    telegram: { type: String, default: '' },
    province: { type: String, default: '' },
    district: { type: String, default: '' },
    commune: { type: String, default: '' },
    village: { type: String, default: '' },
  },
  items: {
    type: [orderItemSchema],
    required: true,
    validate: [v => Array.isArray(v) && v.length > 0, 'Order must contain at least one item.'],
  },
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  transportCost: {
    type: Number,
    default: 0,
    min: 0,
  },
  grandTotal: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: 'USD',
  },
  paymentMethod: {
    type: String,
    enum: ['khqr', 'telegram', 'cod'],
    default: 'khqr',
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending',
    index: true,
  },
  khqrString: {
    type: String,
    default: '',
  },
  khqrMd5: {
    type: String,
    default: '',
    index: true,
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'],
    default: 'pending',
    index: true,
  },
  notes: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

export default mongoose.model('Order', orderSchema);
