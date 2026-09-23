import express from 'express';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// GET /api/notifications - Get current user's notifications
router.get('/', verifyToken, async (req, res) => {
  try {
    const { Notification } = await import('../models/index.js');
    const { unreadOnly, limit, skip } = req.query;

    let query = { recipient: req.user.id };
    if (unreadOnly === 'true') query.read = false;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(Number(skip) || 0)
      .limit(Math.min(Number(limit) || 20, 50))
      .lean();

    const unreadCount = await Notification.countDocuments({ recipient: req.user.id, read: false });
    const total = await Notification.countDocuments({ recipient: req.user.id });

    res.json({ notifications, unreadCount, total });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// GET /api/notifications/unread-count - Quick count of unread notifications
router.get('/unread-count', verifyToken, async (req, res) => {
  try {
    const { Notification } = await import('../models/index.js');
    const count = await Notification.countDocuments({ recipient: req.user.id, read: false });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// PUT /api/notifications/:id/read - Mark a notification as read
router.put('/:id/read', verifyToken, async (req, res) => {
  try {
    const { Notification } = await import('../models/index.js');
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found.' });
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// PUT /api/notifications/read-all - Mark all notifications as read
router.put('/read-all', verifyToken, async (req, res) => {
  try {
    const { Notification } = await import('../models/index.js');
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true }
    );
    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { Notification } = await import('../models/index.js');
    await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user.id });
    res.json({ message: 'Notification deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

export default router;
