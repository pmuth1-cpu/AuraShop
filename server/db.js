import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DB_DIR, 'products.json');
const ADMINS_FILE = path.join(DB_DIR, 'admins.json');
const CATEGORIES_FILE = path.join(DB_DIR, 'categories.json');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

function readJSON(file) {
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf-8');
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

// ===== PRODUCTS =====

export function getAllProducts(filters = {}) {
  let products = readJSON(PRODUCTS_FILE);
  if (filters.category && filters.category !== 'all') {
    products = products.filter(p => p.category === filters.category);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    products = products.filter(p => p.name.toLowerCase().includes(q));
  }
  if (filters.featured === 'true') {
    products = products.filter(p => p.featured);
  }
  if (filters.minPrice !== undefined) {
    products = products.filter(p => p.price >= Number(filters.minPrice));
  }
  if (filters.maxPrice !== undefined) {
    products = products.filter(p => p.price <= Number(filters.maxPrice));
  }
  if (filters.excludeId !== undefined) {
    products = products.filter(p => p._id !== filters.excludeId);
  }
  return products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getProductById(id) {
  const products = readJSON(PRODUCTS_FILE);
  return products.find(p => p._id === id) || null;
}

// ===== CATEGORIES =====

export function getCategories() {
  const categories = readJSON(CATEGORIES_FILE);
  if (categories.length === 0) {
    // Fallback: extract from products if categories file is empty
    const products = readJSON(PRODUCTS_FILE);
    const uniqueNames = [...new Set(products.map(p => p.category))];
    return uniqueNames.map(name => ({ _id: name, name, image: '' }));
  }
  return categories;
}

export function getCategoryById(id) {
  return readJSON(CATEGORIES_FILE).find(c => c._id === id) || null;
}

export function createCategory(data) {
  const categories = readJSON(CATEGORIES_FILE);
  const cat = {
    _id: generateId(),
    name: data.name,
    image: data.image || '',
    createdAt: new Date().toISOString()
  };
  categories.push(cat);
  writeJSON(CATEGORIES_FILE, categories);
  return cat;
}

export function updateCategory(id, data) {
  const categories = readJSON(CATEGORIES_FILE);
  const idx = categories.findIndex(c => c._id === id);
  if (idx === -1) return null;
  categories[idx] = {
    ...categories[idx],
    name: data.name ?? categories[idx].name,
    image: data.image ?? categories[idx].image
  };
  writeJSON(CATEGORIES_FILE, categories);
  return categories[idx];
}

export function deleteCategory(id) {
  const categories = readJSON(CATEGORIES_FILE);
  const idx = categories.findIndex(c => c._id === id);
  if (idx === -1) return null;
  const [deleted] = categories.splice(idx, 1);
  writeJSON(CATEGORIES_FILE, categories);
  return deleted;
}

export function createProduct(data) {
  const products = readJSON(PRODUCTS_FILE);
  const product = {
    _id: generateId(),
    name: data.name,
    description: data.description,
    price: Number(data.price),
    category: data.category,
    stock: Number(data.stock) || 0,
    inStock: data.inStock === 'true' || data.inStock === true,
    featured: data.featured === 'true' || data.featured === true,
    image: data.image || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  products.push(product);
  writeJSON(PRODUCTS_FILE, products);
  return product;
}

export function updateProduct(id, data) {
  const products = readJSON(PRODUCTS_FILE);
  const idx = products.findIndex(p => p._id === id);
  if (idx === -1) return null;

  products[idx] = {
    ...products[idx],
    name: data.name ?? products[idx].name,
    description: data.description ?? products[idx].description,
    price: data.price !== undefined ? Number(data.price) : products[idx].price,
    category: data.category ?? products[idx].category,
    stock: data.stock !== undefined ? Number(data.stock) : products[idx].stock,
    inStock: data.inStock !== undefined ? (data.inStock === 'true' || data.inStock === true) : products[idx].inStock,
    featured: data.featured !== undefined ? (data.featured === 'true' || data.featured === true) : products[idx].featured,
    image: data.image ?? products[idx].image,
    updatedAt: new Date().toISOString(),
  };

  writeJSON(PRODUCTS_FILE, products);
  return products[idx];
}

export function deleteProduct(id) {
  const products = readJSON(PRODUCTS_FILE);
  const idx = products.findIndex(p => p._id === id);
  if (idx === -1) return null;
  const [deleted] = products.splice(idx, 1);
  writeJSON(PRODUCTS_FILE, products);
  return deleted;
}

// ===== ADMINS =====

export function getAdminByUsername(username) {
  const admins = readJSON(ADMINS_FILE);
  return admins.find(a => a.username === username) || null;
}

export function createAdmin(data) {
  const admins = readJSON(ADMINS_FILE);
  const admin = {
    _id: generateId(),
    username: data.username,
    password: data.password, // already hashed
    createdAt: new Date().toISOString(),
  };
  admins.push(admin);
  writeJSON(ADMINS_FILE, admins);
  return admin;
}

export function adminExists() {
  const admins = readJSON(ADMINS_FILE);
  return admins.length > 0;
}
