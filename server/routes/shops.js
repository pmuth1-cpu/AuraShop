import express from 'express';
import slugify from 'slugify';
import multer from 'multer';
import { uploadToCloudinary } from '../uploads.js';
import { verifyToken, requireSeller, requireActiveShop } from '../middleware/auth.js';

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/;
    const ext = allowed.test(file.originalname.toLowerCase().split('.').pop());
    const mime = allowed.test(file.mimetype.replace('image/', '').split('+')[0]);
    if (ext && mime) return cb(null, true);
    cb(new Error('Only image files are allowed.'));
  },
});

// POST /api/shops - Create a new shop
router.post('/', verifyToken, requireSeller, async (req, res) => {
  try {
    const { Shop } = await import('../models/index.js');
    const existing = await Shop.findOne({ owner: req.user.id });
    if (existing) {
      return res.status(409).json({ message: 'You already have a shop.', shop: existing });
    }

    const { name, description, telegram, contactPhone } = req.body;
    if (!name) return res.status(400).json({ message: 'Shop name is required.' });

    let slug = slugify(name, { lower: true, strict: true });
    // Ensure slug uniqueness
    let slugExists = await Shop.findOne({ slug });
    let suffix = 1;
    while (slugExists) {
      slug = `${slugify(name, { lower: true, strict: true })}-${suffix}`;
      slugExists = await Shop.findOne({ slug });
      suffix++;
    }

    const shop = await Shop.create({
      owner: req.user.id,
      slug,
      name,
      description: description || '',
      telegram: telegram || '',
      contactPhone: contactPhone || '',
      status: 'pending_approval',
    });

    res.status(201).json({
      message: 'Shop created! Waiting for admin approval.',
      shop,
    });
  } catch (error) {
    console.error('Create shop error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// GET /api/shops/my - Get current seller's shop
router.get('/my', verifyToken, requireSeller, async (req, res) => {
  try {
    const { Shop } = await import('../models/index.js');
    const shop = await Shop.findOne({ owner: req.user.id }).lean();
    if (!shop) return res.status(404).json({ message: 'No shop found.' });
    res.json(shop);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// GET /api/shops - Browse all active shops (public)
router.get('/', async (req, res) => {
  try {
    const { Shop, Product } = await import('../models/index.js');
    const shops = await Shop.find({ status: 'active' })
      .select('slug name description logo cover profileImage theme')
      .sort({ activatedAt: -1 })
      .lean();

    // Attach product count to each shop
    const shopsWithCounts = await Promise.all(
      shops.map(async (shop) => {
        const productCount = await Product.countDocuments({ shop: shop._id });
        return { ...shop, productCount };
      })
    );

    res.json(shopsWithCounts);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// GET /api/shops/:slug - Get shop by slug (public storefront)
router.get('/:slug', async (req, res) => {
  try {
    const { Shop, Product } = await import('../models/index.js');
    const shop = await Shop.findOne({ slug: req.params.slug }).lean();
    if (!shop) return res.status(404).json({ message: 'Shop not found.' });
    if (shop.status === 'suspended') {
      return res.status(403).json({ message: 'This shop is temporarily unavailable.' });
    }
    const productCount = await Product.countDocuments({ shop: shop._id });
    res.json({ ...shop, productCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// GET /api/shops/:slug/products - List products for a shop (public)
router.get('/:slug/products', async (req, res) => {
  try {
    const { Shop, Product } = await import('../models/index.js');
    const shop = await Shop.findOne({ slug: req.params.slug });
    if (!shop) return res.status(404).json({ message: 'Shop not found.' });
    if (shop.status === 'suspended') {
      return res.status(403).json({ message: 'This shop is temporarily unavailable.' });
    }

    let query = { shop: shop._id };
    const { category, search, minPrice, maxPrice, limit, skip } = req.query;
    if (category && category !== 'all') {
      query.$or = [{ category }, { categories: category }];
    }
    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [{ name: searchRegex }, { description: searchRegex }];
    }
    if (minPrice !== undefined) query.price = { $gte: Number(minPrice) };
    if (maxPrice !== undefined) query.price = { ...query.price, $lte: Number(maxPrice) };

    const limitNum = Math.min(Number(limit) || 50, 50);
    const skipNum = Number(skip) || 0;

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skipNum)
      .limit(limitNum)
      .lean();

    const total = await Product.countDocuments(query);
    res.json({ products, total });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// PUT /api/shops/:id - Update shop settings
router.put('/:id', verifyToken, requireSeller, async (req, res) => {
  try {
    const { Shop } = await import('../models/index.js');
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ message: 'Shop not found.' });
    if (String(shop.owner) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not your shop.' });
    }

    const allowedFields = [
      'name', 'description', 'telegram', 'contactPhone',
      'socialLinks', 'bakongAccount', 'bakongName', 'bakongCity',
      'theme',
    ];

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        shop[field] = req.body[field];
      }
    }

    // Update slug if name changed
    if (req.body.name && req.body.name !== shop.name) {
      let newSlug = slugify(req.body.name, { lower: true, strict: true });
      const slugExists = await Shop.findOne({ slug: newSlug, _id: { $ne: shop._id } });
      if (slugExists) newSlug = `${newSlug}-${Date.now()}`;
      shop.slug = newSlug;
    }

    await shop.save();
    res.json(shop);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// POST /api/shops/:id/logo - Upload shop logo
router.post('/:id/logo', verifyToken, requireSeller, upload.single('logo'), async (req, res) => {
  try {
    const { Shop } = await import('../models/index.js');
    const shop = await Shop.findById(req.params.id);
    if (!shop || String(shop.owner) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    const url = await uploadToCloudinary(req.file.buffer, 'shop-logos');
    shop.logo = url;
    await shop.save();
    res.json({ logo: url });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed.', error: error.message });
  }
});

// POST /api/shops/:id/cover - Upload shop cover
router.post('/:id/cover', verifyToken, requireSeller, upload.single('cover'), async (req, res) => {
  try {
    const { Shop } = await import('../models/index.js');
    const shop = await Shop.findById(req.params.id);
    if (!shop || String(shop.owner) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    const url = await uploadToCloudinary(req.file.buffer, 'shop-covers');
    shop.cover = url;
    await shop.save();
    res.json({ cover: url });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed.', error: error.message });
  }
});

// POST /api/shops/:id/profile-image - Upload seller profile image
router.post('/:id/profile-image', verifyToken, requireSeller, upload.single('profileImage'), async (req, res) => {
  try {
    const { Shop } = await import('../models/index.js');
    const shop = await Shop.findById(req.params.id);
    if (!shop || String(shop.owner) !== String(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized.' });
    }
    if (!req.file) return res.status(400).json({ message: 'No file uploaded.' });
    const url = await uploadToCloudinary(req.file.buffer, 'shop-profiles');
    shop.profileImage = url;
    await shop.save();
    res.json({ profileImage: url });
  } catch (error) {
    res.status(500).json({ message: 'Upload failed.', error: error.message });
  }
});

export default router;
