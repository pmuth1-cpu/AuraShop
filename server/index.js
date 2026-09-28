import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './db.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import categoryRoutes from './routes/categories.js';
import shopRoutes from './routes/shops.js';
import sellerRoutes from './routes/seller.js';
import paymentRoutes from './routes/payments.js';
import adminPlatformRoutes from './routes/admin-platform.js';
import buyerRoutes from './routes/buyer.js';
import notificationRoutes from './routes/notifications.js';
import orderRoutes from './routes/orders.js';
import { startSubscriptionChecker } from './services/subscription-checker.js';
import { startTelegramBotPolling } from './services/telegram-bot.js';

dotenv.config({ path: '.env.local' });
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const allowedOrigins = [
  'https://aurashopforcam.vercel.app',
  'https://aura-shop-six.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-reset-secret']
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminPlatformRoutes);
app.use('/api/buyer', buyerRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/orders', orderRoutes);

// Multer error handler
app.use((err, req, res, next) => {
  if (err.message === 'Only image files are allowed.') {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve frontend dist + public folder
app.use('/static', express.static(path.join(__dirname, '..', 'public')));
app.use(express.static(path.join(__dirname, '..', 'dist')));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

// SPA catch-all — Express 5 compatible (no bare `*` pattern)
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

async function start() {
  try {
    await connectDB();
    console.log('✅ Database connected');
    // Start subscription checker after DB connection
    startSubscriptionChecker();
    // Start Telegram bot worker for instant messenger login
    startTelegramBotPolling();
  } catch (err) {
    console.error('⚠️ Database connection failed (continuing anyway):', err.message);
  }
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
