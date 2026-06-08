import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const secret = process.env.JWT_SECRET || 'aura-shop-secret-key-2026-change-in-production';

  if (!secret) {
    return res.status(500).json({ message: 'Server auth not configured.' });
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, secret);
    console.log('Auth success - admin:', decoded.username);
    req.admin = decoded;
    next();
  } catch (error) {
    console.error('Auth failed - token error:', error.message);
    return res.status(403).json({ message: 'Invalid or expired token.' });
  }
};
