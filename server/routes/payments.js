import express from 'express';
import { verifyToken, requireSeller, requireAdmin } from '../middleware/auth.js';
import { generateSubscriptionQR, verifyBakongTransaction, qrToImage } from '../services/bakong-khqr.js';
import { notifyPaymentVerified } from '../services/notifications.js';

const router = express.Router();

// POST /api/payments/subscribe - Generate KHQR for monthly subscription
router.post('/subscribe', verifyToken, requireSeller, async (req, res) => {
  try {
    const { Shop, Payment } = await import('../models/index.js');
    const shop = await Shop.findOne({ owner: req.user.id });
    if (!shop) return res.status(404).json({ message: 'No shop found.' });

    // Check if there's already a pending payment
    const pendingPayment = await Payment.findOne({
      shop: shop._id,
      status: 'pending',
      type: 'subscription',
    });

    if (pendingPayment) {
      // Re-generate QR image if needed
      let qrImage = null;
      if (pendingPayment.khqrString) {
        qrImage = await qrToImage(pendingPayment.khqrString);
      }
      return res.json({
        message: 'You have a pending subscription payment. Please scan and verify.',
        payment: pendingPayment,
        qrImage,
        qrString: pendingPayment.khqrString,
        md5: pendingPayment.khqrMd5,
      });
    }

    // Generate KHQR QR code
    const amount = 2.50;
    const currency = 'USD';
    const qrData = await generateSubscriptionQR(amount, currency);

    // Calculate subscription period
    const now = new Date();
    const periodStart = shop.subscriptionPaidUntil && shop.subscriptionPaidUntil > now
      ? new Date(shop.subscriptionPaidUntil)
      : now;
    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + 30);

    const payment = await Payment.create({
      shop: shop._id,
      user: req.user.id,
      type: 'subscription',
      amount,
      currency,
      status: 'pending',
      khqrString: qrData.qrString,
      khqrMd5: qrData.md5 || '',
      periodStart,
      periodEnd,
    });

    res.status(201).json({
      payment,
      qrImage: qrData.qrImage,
      qrString: qrData.qrString,
      md5: qrData.md5,
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// GET /api/payments/my - List seller's own payment history
router.get('/my', verifyToken, requireSeller, async (req, res) => {
  try {
    const { Shop, Payment } = await import('../models/index.js');
    const shop = await Shop.findOne({ owner: req.user.id });
    if (!shop) return res.status(404).json({ message: 'No shop found.' });

    const payments = await Payment.find({ shop: shop._id })
      .sort({ createdAt: -1 })
      .lean();

    res.json({ payments, subscriptionPaidUntil: shop.subscriptionPaidUntil });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// POST /api/payments/:id/verify-bakong - Verify payment directly with NBC Bakong Open API
router.post('/:id/verify-bakong', verifyToken, async (req, res) => {
  try {
    const { Payment, Shop } = await import('../models/index.js');
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });

    if (payment.status === 'verified') {
      return res.json({ verified: true, message: 'Payment is already verified.', payment });
    }

    // Call Bakong Open API
    const bakongResult = await verifyBakongTransaction(payment.khqrMd5);

    if (bakongResult.verified) {
      payment.status = 'verified';
      payment.verifiedAt = new Date();
      payment.metadata = { bakongTransaction: bakongResult.transaction };
      await payment.save();

      // Extend shop subscription
      const shop = await Shop.findById(payment.shop);
      if (shop) {
        shop.subscriptionPaidUntil = payment.periodEnd;
        if (shop.status === 'pending_approval' || shop.status === 'payment_overdue') {
          shop.status = 'active';
          if (!shop.activatedAt) shop.activatedAt = new Date();
        }
        await shop.save();

        // Notify seller
        await notifyPaymentVerified(shop.owner, shop.name, payment.periodEnd);
      }

      return res.json({
        verified: true,
        message: 'Payment successfully verified via Bakong!',
        payment,
        subscriptionPaidUntil: shop?.subscriptionPaidUntil,
        shopStatus: shop?.status,
      });
    }

    return res.json({
      verified: false,
      message: bakongResult.message || 'Payment not detected yet in Bakong network.',
      requiresToken: bakongResult.requiresToken,
    });
  } catch (error) {
    console.error('Bakong verification error:', error);
    res.status(500).json({ message: 'Server error during Bakong verification.', error: error.message });
  }
});

// GET /api/payments/:id/status - Check payment status (also attempts Bakong API if pending)
router.get('/:id/status', verifyToken, async (req, res) => {
  try {
    const { Payment, Shop } = await import('../models/index.js');
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });

    // If pending and has md5, attempt auto verification with Bakong
    if (payment.status === 'pending' && payment.khqrMd5) {
      const bakongResult = await verifyBakongTransaction(payment.khqrMd5);
      if (bakongResult.verified) {
        payment.status = 'verified';
        payment.verifiedAt = new Date();
        payment.metadata = { bakongTransaction: bakongResult.transaction };
        await payment.save();

        const shop = await Shop.findById(payment.shop);
        if (shop) {
          shop.subscriptionPaidUntil = payment.periodEnd;
          if (shop.status === 'pending_approval' || shop.status === 'payment_overdue') {
            shop.status = 'active';
            if (!shop.activatedAt) shop.activatedAt = new Date();
          }
          await shop.save();
          await notifyPaymentVerified(shop.owner, shop.name, payment.periodEnd);
        }
      }
    }

    res.json({
      status: payment.status,
      verifiedAt: payment.verifiedAt,
      khqrMd5: payment.khqrMd5,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// POST /api/payments/:id/verify - Admin manually verifies a payment
router.post('/:id/verify', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { Payment, Shop } = await import('../models/index.js');
    const payment = await Payment.findById(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Payment not found.' });
    if (payment.status === 'verified') {
      return res.status(400).json({ message: 'Payment already verified.' });
    }

    payment.status = 'verified';
    payment.verifiedAt = new Date();
    payment.verifiedBy = req.user.id;
    await payment.save();

    // Extend shop subscription
    const shop = await Shop.findById(payment.shop);
    if (shop) {
      shop.subscriptionPaidUntil = payment.periodEnd;
      if (shop.status === 'pending_approval' || shop.status === 'payment_overdue') {
        shop.status = 'active';
        if (!shop.activatedAt) shop.activatedAt = new Date();
      }
      await shop.save();

      // Notify seller
      await notifyPaymentVerified(shop.owner, shop.name, payment.periodEnd);
    }

    res.json({
      message: 'Payment verified. Subscription extended.',
      payment,
      shopStatus: shop?.status,
      subscriptionPaidUntil: shop?.subscriptionPaidUntil,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// GET /api/payments - Admin: list all payments
router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { Payment } = await import('../models/index.js');
    const { status, limit, skip } = req.query;

    let query = {};
    if (status) query.status = status;

    const payments = await Payment.find(query)
      .populate('shop', 'name slug')
      .populate('user', 'email displayName')
      .sort({ createdAt: -1 })
      .skip(Number(skip) || 0)
      .limit(Math.min(Number(limit) || 50, 100))
      .lean();

    const total = await Payment.countDocuments(query);
    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'verified' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({
      payments,
      total,
      totalRevenue: totalRevenue[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

export default router;
