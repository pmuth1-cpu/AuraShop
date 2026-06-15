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
  if (filters.search) {
    const searchRegex = { $regex: filters.search, $options: 'i' };
    query.$or = [
      { name: searchRegex },
      { description: searchRegex },
    ];
  }
  if (filters.featured === 'true') query.featured = true;
  if (filters.merchantId) query.merchant = filters.merchantId;
  if (filters.sourceId && filters.platform) {
    query.source = { sourceId: filters.sourceId, platform: filters.platform };
  }
  if (filters.minPrice !== undefined) query.price = { $gte: Number(filters.minPrice) };
  if (filters.maxPrice !== undefined) query.price = { ...query.price, $lte: Number(filters.maxPrice) };
  if (filters.excludeId) query._id = { $ne: filters.excludeId };

  const skip = Number(filters.skip);
  const limit = Number(filters.limit);
  let productQuery = Product.find(query).sort({ createdAt: -1, _id: -1 });

  if (!Number.isNaN(skip) && skip > 0) productQuery = productQuery.skip(skip);
  if (!Number.isNaN(limit) && limit > 0) productQuery = productQuery.limit(Math.min(limit, 50));

  const items = await productQuery.lean();
  return items.map(normalizeProduct);
}

export async function getProductById(id) {
  const item = await Product.findById(id).lean();
  if (!item) return null;
  return normalizeProduct(item);
}

export function normalizeProduct(item) {
  const images = (item.images && item.images.length > 0)
    ? item.images
    : (item.image ? [item.image] : []);
  const maxIdx = images.length > 0 ? images.length - 1 : 0;
  const rawIdx = typeof item.imagePrimaryIndex === 'number' ? item.imagePrimaryIndex : 0;
  const primaryIdx = rawIdx < 0 || rawIdx > maxIdx ? 0 : rawIdx;
  return {
    ...item,
    images,
    imagePrimaryIndex: primaryIdx,
    image: item.image || images[0] || '',
  };
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

// MERCHANTS
export async function getMerchantByUsername(username) {
  const Merchant = (await import('./models/Merchant.js')).default;
  return Merchant.findOne({ username }).lean();
}

export async function createMerchant(data) {
  const Merchant = (await import('./models/Merchant.js')).default;
  return Merchant.create(data);
}

export async function getMerchantById(id) {
  const Merchant = (await import('./models/Merchant.js')).default;
  return Merchant.findById(id).lean();
}
