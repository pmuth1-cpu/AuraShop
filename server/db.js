import mongoose from 'mongoose';
import { Product, Category, Admin } from './models/index.js';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.warn('⚠️  MONGODB_URI not set. Database operations will fail.');
}

export async function connectDB() {
  if (!MONGODB_URI) return;
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
}

// PRODUCTS
export function getAllProducts(filters = {}) {
  let query = {};
  if (filters.category && filters.category !== 'all') query.category = filters.category;
  if (filters.search) query.name = { $regex: filters.search, $options: 'i' };
  if (filters.featured === 'true') query.featured = true;
  if (filters.minPrice !== undefined) query.price = { $gte: Number(filters.minPrice) };
  if (filters.maxPrice !== undefined) query.price = { ...query.price, $lte: Number(filters.maxPrice) };
  if (filters.excludeId) query._id = { $ne: filters.excludeId };

  return Product.find(query).sort({ createdAt: -1 }).lean();
}

export function getProductById(id) {
  return Product.findById(id).lean();
}

export function createProduct(data) {
  return Product.create(data);
}

export function updateProduct(id, data) {
  return Product.findByIdAndUpdate(id, data, { new: true }).lean();
}

export function deleteProduct(id) {
  return Product.findByIdAndDelete(id).lean();
}

// CATEGORIES
export function getCategories() {
  return Category.find({}).sort({ createdAt: 1 }).lean();
}

export function getCategoryById(id) {
  return Category.findById(id).lean();
}

export function createCategory(data) {
  return Category.create(data);
}

export function updateCategory(id, data) {
  return Category.findByIdAndUpdate(id, data, { new: true }).lean();
}

export function deleteCategory(id) {
  return Category.findByIdAndDelete(id).lean();
}

// ADMINS
export function getAdminByUsername(username) {
  return Admin.findOne({ username }).lean();
}

export function createAdmin(data) {
  return Admin.create(data);
}

export function adminExists() {
  return Admin.countDocuments().then(c => c > 0);
}
