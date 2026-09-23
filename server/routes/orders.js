import express from 'express';
import { verifyToken, requireSeller, requireActiveShop } from '../middleware/auth.js';
import { generateCheckoutQR, verifyBakongTransaction, qrToImage } from '../services/bakong-khqr.js';
import { notifyNewOrder, createNotification } from '../services/notifications.js';

const router = express.Router();

// Helper to generate readable order number
function generateOrderNumber() {
  const dateStr = Date.now().toString().slice(-6);
  const rand = Math.floor(100 + Math.random() * 900);
  return `ORD-${dateStr}-${rand}`;
}

// POST /api/orders - Create a new order (buyer checkout)
router.post('/', async (req, res) => {
  try {
    const { Shop, Order } = await import('../models/index.js');
    const { shopId, shopSlug, items, customerInfo, transportCost = 0, paymentMethod = 'khqr', notes } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must include at least one item.' });
    }

    // Find the shop
    let shop = null;
    if (shopId) {
      shop = await Shop.findById(shopId);
    } else if (shopSlug) {
      shop = await Shop.findOne({ slug: shopSlug });
    }

    if (!shop) {
      return res.status(404).json({ message: 'Shop not found.' });
    }

    if (shop.status === 'suspended') {
      return res.status(403).json({ message: 'This shop is currently not accepting orders.' });
    }

    // Compute subtotal and grandTotal
    const subtotal = items.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
    const transport = Math.max(0, Number(transportCost) || 0);
    const grandTotal = Math.round((subtotal + transport) * 100) / 100;
    const orderNumber = generateOrderNumber();

    let khqrString = '';
    let khqrMd5 = '';
    let qrImage = null;

    if (paymentMethod === 'khqr') {
      const qrData = await generateCheckoutQR(
        shop.bakongAccount,
        shop.bakongName || shop.name,
        grandTotal,
        'USD',
        orderNumber
      );
      khqrString = qrData.qrString;
      khqrMd5 = qrData.md5;
      qrImage = qrData.qrImage;
    }

    const order = await Order.create({
      orderNumber,
      shop: shop._id,
      buyer: {
        phone: customerInfo?.phone || '',
        telegram: customerInfo?.telegram || '',
        province: customerInfo?.province || '',
        district: customerInfo?.district || '',
        commune: customerInfo?.commune || '',
        village: customerInfo?.village || '',
      },
      items: items.map(i => ({
        product: i._id || i.product,
        name: i.name || 'Product',
        price: Number(i.price) || 0,
        quantity: Number(i.quantity) || 1,
        variantInfo: i.variantInfo || '',
        image: i.image || '',
      })),
      subtotal,
      transportCost: transport,
      grandTotal,
      currency: 'USD',
      paymentMethod,
      paymentStatus: 'pending',
      khqrString,
      khqrMd5,
      orderStatus: 'pending',
      notes: notes || '',
    });

    // Notify seller
    const orderSummary = `Order #${orderNumber} for $${grandTotal.toFixed(2)} (${items.length} item(s)).`;
    await notifyNewOrder(shop.owner, shop.name, orderSummary);

    res.status(201).json({
      success: true,
      order,
      qrImage,
      qrString: khqrString,
      telegram: shop.telegram,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error creating order.', error: error.message });
  }
});

// GET /api/orders/seller/my-orders - Get orders for seller's shop
router.get('/seller/my-orders', verifyToken, requireSeller, requireActiveShop, async (req, res) => {
  try {
    const { Order } = await import('../models/index.js');
    const { status, paymentStatus, limit = 50, skip = 0 } = req.query;

    let query = { shop: req.shop._id };
    if (status && status !== 'all') query.orderStatus = status;
    if (paymentStatus && paymentStatus !== 'all') query.paymentStatus = paymentStatus;

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(skip) || 0)
      .limit(Math.min(Number(limit) || 50, 100))
      .lean();

    const total = await Order.countDocuments(query);
    const pendingCount = await Order.countDocuments({ shop: req.shop._id, orderStatus: 'pending' });

    res.json({ orders, total, pendingCount });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching orders.', error: error.message });
  }
});

// PUT /api/orders/seller/:id/status - Update order status (seller)
router.put('/seller/:id/status', verifyToken, requireSeller, requireActiveShop, async (req, res) => {
  try {
    const { Order } = await import('../models/index.js');
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    if (String(order.shop) !== String(req.shop._id)) {
      return res.status(403).json({ message: 'Not authorized for this shop.' });
    }

    if (req.body.orderStatus) order.orderStatus = req.body.orderStatus;
    if (req.body.paymentStatus) order.paymentStatus = req.body.paymentStatus;
    await order.save();

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating order status.', error: error.message });
  }
});

// GET /api/orders/:id - Get order details by ID or orderNumber (public tracking)
router.get('/:id', async (req, res) => {
  try {
    const { Order, Shop } = await import('../models/index.js');
    let order = await Order.findById(req.params.id).populate('shop', 'name slug logo telegram').lean();
    if (!order) {
      order = await Order.findOne({ orderNumber: req.params.id }).populate('shop', 'name slug logo telegram').lean();
    }
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    let qrImage = null;
    if (order.khqrString && order.paymentStatus === 'pending') {
      qrImage = await qrToImage(order.khqrString);
    }

    res.json({ order, qrImage });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching order.', error: error.message });
  }
});

// POST /api/orders/:id/verify-bakong - Verify buyer payment via NBC Bakong Open API
router.post('/:id/verify-bakong', async (req, res) => {
  try {
    const { Order, Shop } = await import('../models/index.js');
    let order = await Order.findById(req.params.id);
    if (!order) {
      order = await Order.findOne({ orderNumber: req.params.id });
    }
    if (!order) return res.status(404).json({ message: 'Order not found.' });

    if (order.paymentStatus === 'paid') {
      return res.json({ verified: true, message: 'Order is already marked as paid.', order });
    }

    if (!order.khqrMd5) {
      return res.status(400).json({ verified: false, message: 'This order does not have a Bakong KHQR MD5.' });
    }

    const bakongResult = await verifyBakongTransaction(order.khqrMd5);

    if (bakongResult.verified) {
      order.paymentStatus = 'paid';
      if (order.orderStatus === 'pending') {
        order.orderStatus = 'confirmed';
      }
      await order.save();

      // Notify seller
      const shop = await Shop.findById(order.shop);
      if (shop) {
        await createNotification({
          recipientId: shop.owner,
          type: 'new_order',
          title: '💰 Order Payment Received!',
          message: `Payment for Order #${order.orderNumber} ($${order.grandTotal.toFixed(2)}) has been verified via Bakong!`,
          link: '/dashboard/orders',
        });
      }

      return res.json({
        verified: true,
        message: 'Payment confirmed via Bakong Open API!',
        order,
      });
    }

    return res.json({
      verified: false,
      message: bakongResult.message || 'Payment not detected yet. Please scan the QR code to complete transfer.',
      requiresToken: bakongResult.requiresToken,
    });
  } catch (error) {
    console.error('Order Bakong verification error:', error);
    res.status(500).json({ message: 'Server error verifying order payment.', error: error.message });
  }
});

export default router;
