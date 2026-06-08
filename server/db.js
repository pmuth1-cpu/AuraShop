import mongoose from 'mongoose';
import { Product, Category, Admin } from './models/index.js';

const MONGODB_URI = process.env.MONGODB_URI;
let isConnected = false;

export async function connectDB() {
  if (isConnected) return;
  if (!MONGODB_URI) {
    console.warn('⚠️  MONGODB_URI not set. Retrying in 3s...');
    await new Promise(r => setTimeout(r, 3000));
    return connectDB();
  }
  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    await new Promise(r => setTimeout(r, 3000));
    return connectDB();
  }
}

function ensureConnected() {
  if (!isConnected) {
    throw new Error('Database not connected. Request queued until connection is ready.');
  }
}

// PRODUCTS
export async function getAllProducts(filters = {}) {
  ensureConnected();
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
  ensureConnected();
  return Product.findById(id).lean();
}

export async function createProduct(data) {
  ensureConnected();
  return Product.create(data);
}

export async function updateProduct(id, data) {
  ensureConnected();
  return Product.findByIdAndUpdate(id, data, { new: true }).lean();
}

export async function deleteProduct(id) {
  ensureConnected();
  return Product.findByIdAndDelete(id).lean();
}

// CATEGORIES
export async function getCategories() {
  ensureConnected();
  return Category.find({}).sort({ createdAt: 1 }).lean();
}

export async function getCategoryById(id) {
  ensureConnected();
  return Category.findById(id).lean();
}

export async function createCategory(data) {
  ensureConnected();
  return Category.create(data);
}

export async function updateCategory(id, data) {
  ensureConnected();
  return Category.findByIdAndUpdate(id, data, { new: true }).lean();
}

export async function deleteCategory(id) {
  ensureConnected();
  return Category.findByIdAndDelete(id).lean();
}

// ADMINS
export async function getAdminByUsername(username) {
  ensureConnected();
  return Admin.findOne({ username }).lean();
}

export async function createAdmin(data) {
  ensureConnected();
  return Admin.create(data);
}

export async function adminExists() {
  ensureConnected();
  return Admin.countDocuments().then(c => c > 0);
}
