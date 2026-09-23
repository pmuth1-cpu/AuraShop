import express from 'express';
import { verifyToken, requireAdmin } from '../middleware/auth.js';
import { notifyShopApproved, notifyShopSuspended, notifyShopReactivated } from '../services/notifications.js';

const router = express.Router();

// GET /api/admin/dashboard - Platform-wide stats
router.get('/dashboard', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { User, Shop, Product, Payment } = await import('../models/index.js');

    const totalSellers = await User.countDocuments({ role: 'seller' });
    const totalShops = await Shop.countDocuments();
    const activeShops = await Shop.countDocuments({ status: 'active' });
    const pendingApprovals = await Shop.countDocuments({ status: 'pending_approval' });
    const overdueShops = await Shop.countDocuments({ status: 'payment_overdue' });
    const suspendedShops = await Shop.countDocuments({ status: 'suspended' });
    const totalProducts = await Product.countDocuments();

    const revenueResult = await Payment.aggregate([
      { $match: { status: 'verified' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    const pendingPayments = await Payment.countDocuments({ status: 'pending' });

    res.json({
      totalSellers,
      totalShops,
      activeShops,
      pendingApprovals,
      overdueShops,
      suspendedShops,
      totalProducts,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      pendingPayments,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// GET /api/admin/sellers - List all sellers with shop info
router.get('/sellers', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { User, Shop } = await import('../models/index.js');
    const { status, search, limit, skip } = req.query;

    const sellers = await User.find({ role: 'seller' })
      .sort({ createdAt: -1 })
      .skip(Number(skip) || 0)
      .limit(Math.min(Number(limit) || 50, 100))
      .lean();

    // Attach shop info to each seller
    const sellersWithShops = await Promise.all(
      sellers.map(async (seller) => {
        const shop = await Shop.findOne({ owner: seller._id }).lean();
        return {
          ...seller,
          passwordHash: undefined,
          shop: shop ? {
            id: shop._id,
            name: shop.name,
            slug: shop.slug,
            status: shop.status,
            subscriptionPaidUntil: shop.subscriptionPaidUntil,
            activatedAt: shop.activatedAt,
            logo: shop.logo,
          } : null,
        };
      })
    );

    // Filter by shop status if specified
    let filtered = sellersWithShops;
    if (status) {
      filtered = sellersWithShops.filter(s => s.shop?.status === status);
    }
    if (search) {
      const regex = new RegExp(search, 'i');
      filtered = filtered.filter(s =>
        regex.test(s.email) || regex.test(s.displayName) || regex.test(s.shop?.name || '')
      );
    }

    const total = await User.countDocuments({ role: 'seller' });
    res.json({ sellers: filtered, total });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// GET /api/admin/shops/pending - List shops awaiting approval
router.get('/shops/pending', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { Shop } = await import('../models/index.js');
    const shops = await Shop.find({ status: 'pending_approval' })
      .populate('owner', 'email displayName phone')
      .sort({ createdAt: -1 })
      .lean();
    res.json(shops);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// PUT /api/admin/shops/:id/approve - Approve a shop
router.put('/shops/:id/approve', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { Shop } = await import('../models/index.js');
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ message: 'Shop not found.' });

    shop.status = 'active';
    shop.activatedAt = shop.activatedAt || new Date();
    // Give 30 days free to start
    if (!shop.subscriptionPaidUntil) {
      const freeUntil = new Date();
      freeUntil.setDate(freeUntil.getDate() + 30);
      shop.subscriptionPaidUntil = freeUntil;
    }
    await shop.save();

    // Notify seller
    await notifyShopApproved(shop.owner, shop.name, shop.slug);

    res.json({ message: 'Shop approved and activated.', shop });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// PUT /api/admin/shops/:id/suspend - Suspend a shop
router.put('/shops/:id/suspend', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { Shop } = await import('../models/index.js');
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ message: 'Shop not found.' });

    shop.status = 'suspended';
    await shop.save();

    // Notify seller
    await notifyShopSuspended(shop.owner, shop.name);

    res.json({ message: 'Shop suspended.', shop });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// PUT /api/admin/shops/:id/reactivate - Reactivate a suspended shop
router.put('/shops/:id/reactivate', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { Shop } = await import('../models/index.js');
    const shop = await Shop.findById(req.params.id);
    if (!shop) return res.status(404).json({ message: 'Shop not found.' });

    // Check if subscription is still valid
    const now = new Date();
    if (shop.subscriptionPaidUntil && shop.subscriptionPaidUntil > now) {
      shop.status = 'active';
    } else {
      shop.status = 'payment_overdue';
    }
    await shop.save();

    // Notify seller
    await notifyShopReactivated(shop.owner, shop.name);

    res.json({ message: `Shop reactivated with status: ${shop.status}`, shop });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

export default router;
