import express from 'express';
import multer from 'multer';
import { uploadToCloudinary } from '../uploads.js';
import { verifyToken, requireSeller, requireActiveShop } from '../middleware/auth.js';
import { normalizeProduct } from '../db.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(file.originalname.toLowerCase().split('.').pop());
    const mime = allowed.test(file.mimetype.replace('image/', '').split('+')[0]);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files are allowed.'));
  },
});

function parseCategories(value) {
  if (!value) return [];
  const parsed = Array.isArray(value) ? value : String(value).split(',');
  return [...new Set(parsed.map(c => String(c).trim()).filter(Boolean))];
}

// GET /api/seller/dashboard - Seller dashboard stats
router.get('/dashboard', verifyToken, requireSeller, requireActiveShop, async (req, res) => {
  try {
    const { Product, Payment } = await import('../models/index.js');
    const shop = req.shop;

    const productCount = await Product.countDocuments({ shop: shop._id });
    const inStockCount = await Product.countDocuments({ shop: shop._id, inStock: true });
    const outOfStockCount = await Product.countDocuments({ shop: shop._id, inStock: false });
    const products = await Product.find({ shop: shop._id }).select('price').lean();
    const inventoryValue = products.reduce((sum, p) => sum + (p.price || 0), 0);

    const payments = await Payment.find({ shop: shop._id, status: 'verified' }).lean();
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

    res.json({
      shop: {
        id: shop._id,
        name: shop.name,
        slug: shop.slug,
        status: shop.status,
        subscriptionPaidUntil: shop.subscriptionPaidUntil,
        logo: shop.logo,
      },
      stats: {
        productCount,
        inStockCount,
        outOfStockCount,
        inventoryValue: Math.round(inventoryValue * 100) / 100,
        totalPaid: Math.round(totalPaid * 100) / 100,
      },
    });
  } catch (error) {
    console.error('Seller dashboard error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// GET /api/seller/products - List seller's own products
router.get('/products', verifyToken, requireSeller, requireActiveShop, async (req, res) => {
  try {
    const { Product } = await import('../models/index.js');
    const { category, search, limit, skip } = req.query;

    let query = { shop: req.shop._id };
    if (category && category !== 'all') {
      query.$or = [{ category }, { categories: category }];
    }
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [{ name: searchRegex }, { description: searchRegex }];
    }

    const limitNum = Math.min(Number(limit) || 50, 50);
    const skipNum = Number(skip) || 0;

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skipNum)
      .limit(limitNum)
      .lean();

    const total = await Product.countDocuments(query);
    res.json({ products: products.map(normalizeProduct), total });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// POST /api/seller/products - Create product (auto-attached to seller's shop)
router.post('/products', verifyToken, requireSeller, requireActiveShop, upload.array('images', 10), async (req, res) => {
  try {
    const { Product } = await import('../models/index.js');

    const uploadedImages = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        uploadedImages.push(await uploadToCloudinary(file.buffer, 'products'));
      }
    }

    const existingImages = req.body.images ? JSON.parse(req.body.images) : [];
    const images = [...uploadedImages, ...existingImages];
    const imageUrl = images[0] || req.body.image || '';

    const price = Number(req.body.price);
    if (isNaN(price) || price < 0) {
      return res.status(400).json({ message: 'Valid price is required.' });
    }

    const variants = req.body.variants ? JSON.parse(req.body.variants) : [];
    const categories = parseCategories(req.body.categories || req.body.category);

    const product = await Product.create({
      name: req.body.name,
      description: req.body.description || '',
      category: categories[0] || 'Uncategorized',
      categories,
      price,
      stock: Number(req.body.stock) || 0,
      inStock: req.body.inStock === 'true' || req.body.inStock === true,
      featured: req.body.featured === 'true' || req.body.featured === true,
      image: imageUrl,
      images,
      variants,
      sizes: req.body.sizes ? JSON.parse(req.body.sizes) : [],
      colors: req.body.colors ? JSON.parse(req.body.colors) : [],
      imagePrimaryIndex: 0,
      shop: req.shop._id,
      owner: req.user.id,
    });

    res.status(201).json(product);
  } catch (error) {
    console.error('Seller create product error:', error);
    res.status(400).json({ message: 'Error creating product.', error: error.message });
  }
});

// POST /api/seller/products/upload-image - Upload product images
router.post('/products/upload-image', verifyToken, requireSeller, requireActiveShop, upload.array('images'), async (req, res) => {
  try {
    const urls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        urls.push(await uploadToCloudinary(file.buffer, 'products'));
      }
    } else if (req.body.url) {
      urls.push(req.body.url);
    }
    res.status(201).json({ urls });
  } catch (error) {
    res.status(400).json({ message: 'Error uploading images.', error: error.message });
  }
});

// PUT /api/seller/products/:id - Update own product
router.put('/products/:id', verifyToken, requireSeller, requireActiveShop, upload.array('images', 10), async (req, res) => {
  try {
    const { Product } = await import('../models/index.js');
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    if (String(product.shop) !== String(req.shop._id)) {
      return res.status(403).json({ message: 'Not your product.' });
    }

    const data = { ...req.body };
    if (data.price !== undefined) data.price = Number(data.price);
    if (data.stock !== undefined) data.stock = Number(data.stock) || 0;
    if (data.inStock !== undefined) data.inStock = data.inStock === 'true' || data.inStock === true;
    if (data.featured !== undefined) data.featured = data.featured === 'true' || data.featured === true;
    if (data.variants !== undefined) data.variants = JSON.parse(data.variants);
    if (data.sizes !== undefined) data.sizes = Array.isArray(data.sizes) ? data.sizes : JSON.parse(data.sizes || '[]');
    if (data.colors !== undefined) data.colors = Array.isArray(data.colors) ? data.colors : JSON.parse(data.colors || '[]');

    const categories = parseCategories(data.categories || data.category);
    if (categories.length > 0) {
      data.category = categories[0];
      data.categories = categories;
    }

    let images = data.images ? (Array.isArray(data.images) ? data.images : JSON.parse(data.images)) : [];
    if (req.files && req.files.length > 0) {
      const uploadedImages = [];
      for (const file of req.files) {
        uploadedImages.push(await uploadToCloudinary(file.buffer, 'products'));
      }
      images = [...uploadedImages, ...images];
    }
    if (images.length > 0) {
      data.image = images[0];
      data.images = images;
      data.imagePrimaryIndex = 0;
    }

    // Prevent changing shop/owner
    delete data.shop;
    delete data.owner;

    const updated = await Product.findByIdAndUpdate(req.params.id, data, { new: true }).lean();
    res.json(normalizeProduct(updated));
  } catch (error) {
    console.error('Seller update product error:', error);
    res.status(400).json({ message: 'Error updating product.', error: error.message });
  }
});

// DELETE /api/seller/products/:id - Delete own product
router.delete('/products/:id', verifyToken, requireSeller, requireActiveShop, async (req, res) => {
  try {
    const { Product } = await import('../models/index.js');
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found.' });
    if (String(product.shop) !== String(req.shop._id)) {
      return res.status(403).json({ message: 'Not your product.' });
    }
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

export default router;
