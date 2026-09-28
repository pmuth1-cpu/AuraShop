import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'aura-shop-secret-key-2026-change-in-production';

// OTP store for mobile phone login
const otpStore = new Map();
const OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

setInterval(() => {
  const now = Date.now();
  for (const [phone, data] of otpStore.entries()) {
    if (now > data.expiresAt) otpStore.delete(phone);
  }
}, 60 * 1000);

// POST /api/auth/otp/send - Send OTP to mobile phone
router.post('/otp/send', async (req, res) => {
  try {
    const { phone, chatId } = req.body;
    if (!phone) {
      return res.status(400).json({ message: 'Phone number is required.' });
    }

    const cleanPhone = String(phone).replace(/[^0-9+]/g, '').trim();
    if (cleanPhone.length < 8) {
      return res.status(400).json({ message: 'Please enter a valid mobile phone number.' });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    otpStore.set(cleanPhone, {
      otp,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
      attempts: 0,
    });

    console.log(`📱 [Aura Shop] OTP for ${cleanPhone}: ${otp}`);

    // Send OTP directly to Telegram via bot
    const { sendTelegramOTP } = await import('../services/telegram-otp.js');
    const tgResult = await sendTelegramOTP({ phone: cleanPhone, otp, chatId });

    res.json({
      message: tgResult.success
        ? `OTP code sent to your Telegram!`
        : tgResult.reason === 'chat_not_found'
          ? `Please click Start in @${tgResult.botUsername || 'Aura_shopz_bot'} on Telegram to receive codes.`
          : `OTP code generated for ${cleanPhone}`,
      phone: cleanPhone,
      telegramSent: tgResult.success,
      chatNotFound: tgResult.reason === 'chat_not_found',
      botUsername: tgResult.botUsername || 'Aura_shopz_bot',
      otp, // Included so you can sign in directly
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({ message: 'Failed to send OTP.', error: error.message });
  }
});

// POST /api/auth/otp/verify - Verify OTP and login or auto-register seller
router.post('/otp/verify', async (req, res) => {
  try {
    const { phone, otp, displayName } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone number and OTP are required.' });
    }

    const cleanPhone = String(phone).replace(/[^0-9+]/g, '').trim();
    const stored = otpStore.get(cleanPhone);
    const inputOtp = String(otp).trim();

    // Verify against stored OTP or master test code 123456
    const isValid = (stored && stored.otp === inputOtp) || inputOtp === '123456';

    if (!isValid) {
      if (!stored) {
        return res.status(400).json({ message: 'OTP expired or not requested yet. Click Send OTP.' });
      }
      stored.attempts = (stored.attempts || 0) + 1;
      if (stored.attempts > 5) {
        otpStore.delete(cleanPhone);
        return res.status(429).json({ message: 'Too many incorrect attempts. Please request a new OTP.' });
      }
      return res.status(400).json({ message: 'Invalid OTP code. Please check and try again.' });
    }

    // Clear used OTP
    otpStore.delete(cleanPhone);

    const { User, Shop } = await import('../models/index.js');

    // Find existing user by phone (exact or variants with/without 0 or +855)
    let user = await User.findOne({
      $or: [
        { phone: cleanPhone },
        { phone: cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone },
        { phone: cleanPhone.startsWith('+855') ? '0' + cleanPhone.slice(4) : cleanPhone },
      ]
    });

    if (!user) {
      // Auto-register new seller by phone number
      const userName = displayName || `Seller ${cleanPhone.slice(-4)}`;
      user = await User.create({
        phone: cleanPhone,
        email: `${cleanPhone.replace(/[^0-9]/g, '')}@phone.aurashop.com`,
        displayName: userName,
        role: 'seller',
        isActive: true,
      });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account is disabled. Contact admin.' });
    }

    // Check if seller has a shop
    let shopId = null;
    let shopSlug = null;
    let shopStatus = null;
    const shop = await Shop.findOne({ owner: user._id });
    if (shop) {
      shopId = shop._id;
      shopSlug = shop.slug;
      shopStatus = shop.status;
    }

    const token = jwt.sign(
      { id: user._id, phone: user.phone, role: user.role, shopId },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        phone: user.phone,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
      shop: shopId ? { id: shopId, slug: shopSlug, status: shopStatus } : null,
      isNewUser: !shop,
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Login failed.', error: error.message });
  }
});

// POST /api/auth/telegram/login - Direct login with Telegram username or ID
router.post('/telegram/login', async (req, res) => {
  try {
    const { username, telegramId } = req.body;
    const { loginByTelegram } = await import('../services/telegram-bot.js');
    const result = await loginByTelegram({ username, telegramId });
    if (!result) {
      return res.status(404).json({ message: 'No Telegram account found. Please open @Aura_shopz_bot and tap Start first.' });
    }
    res.json(result);
  } catch (error) {
    console.error('Telegram login error:', error);
    res.status(500).json({ message: 'Login failed.', error: error.message });
  }
});

// GET /api/auth/telegram/check-session - Check if user started bot with session code
router.get('/telegram/check-session', async (req, res) => {
  try {
    const { sessionCode } = req.query;
    if (!sessionCode) return res.json({ verified: false });

    const { telegramSessions } = await import('../services/telegram-bot.js');
    const session = telegramSessions.get(sessionCode);
    if (session) {
      telegramSessions.delete(sessionCode);
      return res.json({ verified: true, ...session });
    }
    res.json({ verified: false });
  } catch (error) {
    res.json({ verified: false });
  }
});

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
    const loginId = String(email || username || '').trim();
    if (!loginId || !password) {
      return res.status(400).json({ message: 'Email/username and password are required.' });
    }
    const { User } = await import('../models/index.js');
    // Try finding by email first, then displayName, then phone
    let user = await User.findOne({ email: loginId.toLowerCase() });
    if (!user) {
      user = await User.findOne({ displayName: loginId });
    }
    if (!user) {
      user = await User.findOne({ phone: loginId });
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
      admin: { id: user._id, username: user.displayName, role: user.role }, // backward compat for AuthContext
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

// POST /api/auth/seller/reset-password - Reset seller password with email and phone verification
router.post('/seller/reset-password', async (req, res) => {
  try {
    const { email, phone, newPassword } = req.body;
    if (!email || !newPassword) {
      return res.status(400).json({ message: 'Email and new password are required.' });
    }
    if (newPassword.length < 4) {
      return res.status(400).json({ message: 'Password must be at least 4 characters.' });
    }
    const { User } = await import('../models/index.js');
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email.' });
    }
    if (user.role !== 'seller') {
      return res.status(403).json({ message: 'Only seller accounts can reset via this portal.' });
    }
    if (user.phone && phone) {
      const cleanInput = phone.replace(/[^0-9]/g, '');
      const cleanUserPhone = user.phone.replace(/[^0-9]/g, '');
      if (cleanInput && cleanUserPhone && cleanInput !== cleanUserPhone && !cleanUserPhone.endsWith(cleanInput) && !cleanInput.endsWith(cleanUserPhone)) {
        return res.status(400).json({ message: 'Phone number does not match registered phone.' });
      }
    }
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    res.json({ message: 'Password reset successfully! You can now log in.' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// POST /api/auth/reset-admin - Emergency admin reset (keep existing functionality)
router.post('/reset-admin', async (req, res) => {
  const ADMIN_SECRET = process.env.ADMIN_RESET_SECRET || 'ZsDQ0StqpU8zXegoiWx2bGYAPhTkOVRdc7LwuJ13E64INjFM5lCy9avHnrBfKm';
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
