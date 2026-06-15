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
  if (filters.category && filters.category !== 'all') {
    query.$or = [
      { category: filters.category },
      { categories: filters.category },
    ];
  }
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

  if (!Number.isNaN(skip) && skip > 0 && filters.random !== 'true') productQuery = productQuery.skip(skip);
  if (!Number.isNaN(limit) && limit > 0) productQuery = productQuery.limit(Math.min(limit, 50));

  if (filters.random === 'true' && !Number.isNaN(limit) && limit > 0) {
    const count = await Product.countDocuments(query);
    if (count > 0) {
      const maxSkip = Math.max(count - Math.min(limit, 50), 0);
      const randomSkip = Math.floor(Math.random() * (maxSkip + 1));
      productQuery = Product.find(query).skip(randomSkip).limit(Math.min(limit, 50));
    }
  }

  const items = await productQuery.lean();
  return items.map(normalizeProduct);
}

export async function getProductById(id) {
  const item = await Product.findById(id).lean();
  if (!item) return null;
  return normalizeProduct(item);
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

function sanitizeProductDescription(value) {
  if (!value) return '';
  let text = String(value);
  text = text.replace(/<br\s*\/?\s*>/gi, '\n');
  text = text.replace(/<\/(p|div|li|h1|h2|h3|h4|h5|h6|tr)>/gi, '\n');
  text = text.replace(/<img\b[^>]*>/gi, '');
  text = text.replace(/<[^>]+>/g, ' ');
  text = decodeHtmlEntities(text);
  return text
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+/g, ' ')
    .replace(/\n /g, '\n')
    .trim();
}

function extractDescriptionImages(value) {
  if (!value) return [];
  return [...new Set(
    String(value)
      .match(/https?:\/\/[^\s"'<>]+?\.(?:jpe?g|png|gif|webp)(?:\?[^\s"'<>]*)?/gi) || []
  )].slice(0, 10);
}

export function normalizeProduct(item) {
  const descriptionImages = extractDescriptionImages(item.description);
  const categories = Array.isArray(item.categories) && item.categories.length > 0
    ? item.categories.map(category => String(category).trim()).filter(Boolean)
    : (item.category ? [String(item.category).trim()] : []);
  const images = (item.images && item.images.length > 0)
    ? item.images
    : (item.image ? [item.image] : []);
  const mergedImages = [...new Set([...images, ...descriptionImages])].slice(0, 10);
  const maxIdx = mergedImages.length > 0 ? mergedImages.length - 1 : 0;
  const rawIdx = typeof item.imagePrimaryIndex === 'number' ? item.imagePrimaryIndex : 0;
  const primaryIdx = rawIdx < 0 || rawIdx > maxIdx ? 0 : rawIdx;
  return {
    ...item,
    category: categories[0] || item.category || '',
    categories,
    description: sanitizeProductDescription(item.description),
    images: mergedImages,
    imagePrimaryIndex: primaryIdx,
    image: item.image || mergedImages[0] || '',
    price: item.price != null ? Number(item.price) : 0,
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
