import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'aura-shop-secret-key-2026-change-in-production';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role, shopId? }
    // Backward compat: also set req.admin for existing admin routes
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Authentication required.' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions.' });
    }
    next();
  };
}

export const requireSeller = requireRole('seller');
export const requireAdmin = requireRole('admin');

// Middleware to check seller has an active (non-suspended) shop
export const requireActiveShop = async (req, res, next) => {
  try {
    const { Shop } = await import('../models/index.js');
    const shop = await Shop.findOne({ owner: req.user.id });
    if (!shop) return res.status(404).json({ message: 'No shop found. Please create a shop first.' });
    if (shop.status === 'suspended') return res.status(403).json({ message: 'Your shop has been suspended. Contact admin.' });
    req.shop = shop;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Server error.', error: err.message });
  }
};
