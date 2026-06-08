import mongoose from 'mongoose';
import { Product, Category, Admin } from './models/index.js';

const MONGODB_URI = process.env.MONGODB_URI;

export async function connectDB() {
  if (!MONGODB_URI) {
    console.warn('⚠️  MONGODB_URI not set. Server will start without database.');
    return;
  }
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    console.log('⚠️  Server starting anyway. DB queries will fail until connection is fixed.');
  }
}

// PRODUCTS
export async function getAllProducts(filters = {}) {
  let query = {};
  if (filters.category && filters.category !== 'all') query.category = filters.category;
  if (filters.search) query.name = { $regex: filters.search, $options: 'i' };
  if (filters.featured === 'true') query.featured = true;
  if (filters.minPrice !== undefined) query.price = { $gte: Number(filters.minPrice) };
  if (filters.maxPrice !== undefined) query.price = { ...query.price, $lte: Number(filters.maxPrice) };
  if (filters.excludeId) query._id = { $ne: filters.excludeId };
  return Product.find(query).sort({ createdAt: -1 }).lean();
}

export async function getProductById(id) {
  return Product.findById(id).lean();
}

export async function createProduct(data) {
  return Product.create(data);
}

export async function updateProduct(id, data) {
  return Product.findByIdAndUpdate(id, data, { new: true }).lean();
}

export async function deleteProduct(id) {
  return Product.findByIdAndDelete(id).lean();
}

// CATEGORIES
export async function getCategories() {
  return Category.find({}).sort({ createdAt: 1 }).lean();
}

export async function getCategoryById(id) {
  return Category.findById(id).lean();
}

export async function createCategory(data) {
  return Category.create(data);
}

export async function updateCategory(id, data) {
  return Category.findByIdAndUpdate(id, data, { new: true }).lean();
}

export async function deleteCategory(id) {
  return Category.findByIdAndDelete(id).lean();
}

// ADMINS
export async function getAdminByUsername(username) {
  return Admin.findOne({ username }).lean();
}

export async function createAdmin(data) {
  return Admin.create(data);
}

export async function adminExists() {
  return Admin.countDocuments().then(c => c > 0);
}
