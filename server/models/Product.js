import mongoose from 'mongoose';

const variantSchema = new mongoose.Schema({
  size: { type: String, trim: true },
  color: { type: String, trim: true },
  stock: { type: Number, default: 0, min: 0 },
}, { _id: false });

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
  },
  categories: {
    type: [String],
    default: [],
  },
  image: {
    type: String,
    default: '',
  },
  images: {
    type: [String],
    default: [],
  },
  imagePrimaryIndex: {
    type: Number,
    default: 0,
    min: [0, 'Invalid image index'],
  },
  stock: {
    type: Number,
    default: 0,
    min: [0, 'Stock cannot be negative'],
  },
  inStock: {
    type: Boolean,
    default: true,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  variants: {
    type: [variantSchema],
    default: [],
  },
  sizes: {
    type: [String],
    default: [],
  },
  colors: {
    type: [String],
    default: [],
  },
  merchant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Merchant',
    index: true,
    default: null,
  },
  source: {
    platform: { type: String, enum: ['manual', 'aliexpress', 'cjdropshipping', '1688', 'taobao', 'spocket'], default: 'manual' },
    sourceId: { type: String, index: true, default: '' },
    sourceUrl: { type: String, default: '' },
    supplierInfo: { type: mongoose.Schema.Types.Mixed, default: {} },
    lastSynced: { type: Date },
    markupPercent: { type: Number, default: 60 },
  },
}, {
  timestamps: true,
});

export default mongoose.model('Product', productSchema);
