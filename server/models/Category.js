import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
  },
  image: {
    type: String,
    default: '',
  },
  shop: { type: mongoose.Schema.Types.ObjectId, ref: 'Shop', default: null, index: true },
}, {
  timestamps: true,
});

export default mongoose.model('Category', categorySchema);