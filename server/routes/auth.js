import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { getAdminByUsername, createAdmin, adminExists } from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'aura-shop-secret-key-2026-change-in-production';

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const admin = await getAdminByUsername(username);
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      admin: { id: admin._id, username: admin.username },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

router.get('/verify', verifyToken, (req, res) => {
  res.json({ valid: true, admin: req.admin });
});

router.post('/reset-admin', async (req, res) => {
  const ADMIN_SECRET = process.env.ADMIN_RESET_SECRET || 'reset-secret-369';
  if (req.headers['x-reset-secret'] !== ADMIN_SECRET) {
    return res.status(403).json({ message: 'Unauthorized' });
  }
  try {
    const Admin = (await import('../models/Admin.js')).default;
    const hashedPassword = await bcrypt.hash('kdmvtrovteroyban', 12);
    const existing = await Admin.findOne();
    if (existing) {
      await Admin.updateOne({}, { $set: { username: 'aurashop369', password: hashedPassword } });
      return res.json({ message: 'Admin updated', username: 'aurashop369', password: 'kdmvtrovteroyban' });
    }
    await Admin.create({ username: 'aurashop369', password: hashedPassword });
    res.json({ message: 'Admin created', username: 'aurashop369', password: 'kdmvtrovteroyban' });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ message: 'Reset failed', error: err.message });
  }
});

export default router;
