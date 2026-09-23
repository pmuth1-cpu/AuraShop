import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'aura-shop-secret-key-2026-change-in-production';

// POST /api/auth/register - Seller registration
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName, phone } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    const { User } = await import('../models/index.js');
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered.' });
    }
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      email: email.toLowerCase(),
      passwordHash,
      displayName: displayName || email.split('@')[0],
      phone: phone || '',
      role: 'seller',
    });
    res.status(201).json({
      message: 'Registration successful. Your account is pending admin approval.',
      user: { id: user._id, email: user.email, displayName: user.displayName, role: user.role },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// POST /api/auth/login - Login for both sellers and admin
router.post('/login', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const loginId = email || username;
    if (!loginId || !password) {
      return res.status(400).json({ message: 'Email/username and password are required.' });
    }
    const { User } = await import('../models/index.js');
    // Try finding by email first, then by displayName (for backward compat with admin username login)
    let user = await User.findOne({ email: loginId.toLowerCase() });
    if (!user) {
      user = await User.findOne({ displayName: loginId });
    }
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is disabled. Contact admin.' });
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    // Include shopId in token if seller has a shop
    let shopId = null;
    let shopSlug = null;
    let shopStatus = null;
    if (user.role === 'seller') {
      const { Shop } = await import('../models/index.js');
      const shop = await Shop.findOne({ owner: user._id });
      if (shop) {
        shopId = shop._id;
        shopSlug = shop.slug;
        shopStatus = shop.status;
      }
    }
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role, shopId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        phone: user.phone,
      },
      shop: shopId ? { id: shopId, slug: shopSlug, status: shopStatus } : null,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// GET /api/auth/verify - Verify token and return user info
router.get('/verify', verifyToken, async (req, res) => {
  try {
    const { User, Shop } = await import('../models/index.js');
    const user = await User.findById(req.user.id).lean();
    if (!user) return res.status(404).json({ message: 'User not found.' });
    let shop = null;
    if (user.role === 'seller') {
      shop = await Shop.findOne({ owner: user._id }).lean();
    }
    res.json({
      valid: true,
      admin: { id: user._id, username: user.displayName, role: user.role }, // backward compat
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        phone: user.phone,
      },
      shop: shop ? {
        id: shop._id,
        slug: shop.slug,
        name: shop.name,
        status: shop.status,
        subscriptionPaidUntil: shop.subscriptionPaidUntil,
      } : null,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
});

// POST /api/auth/reset-admin - Emergency admin reset (keep existing functionality)
router.post('/reset-admin', async (req, res) => {
  const ADMIN_SECRET = process.env.ADMIN_RESET_SECRET;
  if (!ADMIN_SECRET) {
    return res.status(500).json({ message: 'ADMIN_RESET_SECRET is not configured.' });
  }
  if (req.headers['x-reset-secret'] !== ADMIN_SECRET) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  try {
    const { User } = await import('../models/index.js');
    const passwordHash = await bcrypt.hash('kdmvtrovteroyban', 12);
    const existing = await User.findOne({ role: 'admin' });
    if (existing) {
      await User.updateOne({ _id: existing._id }, { $set: { email: 'admin@aurashop.com', displayName: 'aurashop369', passwordHash } });
      return res.json({ message: 'Admin updated', username: 'aurashop369', password: 'kdmvtrovteroyban' });
    }
    await User.create({ email: 'admin@aurashop.com', displayName: 'aurashop369', passwordHash, role: 'admin' });
    res.json({ message: 'Admin created', username: 'aurashop369', password: 'kdmvtrovteroyban' });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ message: 'Reset failed', error: err.message });
  }
});

export default router;
