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
}, {
  timestamps: true,
});

export default mongoose.model('Category', categorySchema);