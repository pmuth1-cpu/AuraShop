/**
 * Subscription checker service.
 * Runs daily to check for expired subscriptions and upcoming expirations.
 * Does NOT auto-suspend — only admin can do that.
 */

import { notifyPaymentOverdue, notifySubscriptionExpiring } from './notifications.js';

const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // Check once per day

export function startSubscriptionChecker() {
  // Run immediately on first start (slight delay to allow DB connection)
  setTimeout(checkSubscriptions, 10000);

  // Then run daily
  setInterval(checkSubscriptions, CHECK_INTERVAL_MS);
  console.log('📅 Subscription checker started (daily check)');
}

async function checkSubscriptions() {
  try {
    const { Shop, Notification } = await import('../models/index.js');
    const now = new Date();

    // 1. Find active shops with expired subscriptions → mark as payment_overdue
    const expiredShops = await Shop.find({
      status: 'active',
      subscriptionPaidUntil: { $lt: now },
    });

    for (const shop of expiredShops) {
      shop.status = 'payment_overdue';
      await shop.save();
      console.log(`⚠️  ${shop.name} (${shop.slug}) marked as payment_overdue`);

      // Check if we already notified recently (within 24h)
      const recentNotif = await Notification.findOne({
        recipient: shop.owner,
        type: 'payment_overdue',
        createdAt: { $gte: new Date(now - 24 * 60 * 60 * 1000) },
      });
      if (!recentNotif) {
        await notifyPaymentOverdue(shop.owner, shop.name);
      }
    }

    // 2. Find active shops expiring within 5 days → send warning
    const fiveDaysFromNow = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const expiringShops = await Shop.find({
      status: 'active',
      subscriptionPaidUntil: { $gte: now, $lte: fiveDaysFromNow },
    });

    for (const shop of expiringShops) {
      const daysLeft = Math.ceil((shop.subscriptionPaidUntil - now) / (24 * 60 * 60 * 1000));

      // Don't spam — only notify once per day per shop
      const recentWarning = await Notification.findOne({
        recipient: shop.owner,
        type: 'subscription_expiring',
        createdAt: { $gte: new Date(now - 24 * 60 * 60 * 1000) },
      });
      if (!recentWarning) {
        await notifySubscriptionExpiring(shop.owner, shop.name, daysLeft);
        console.log(`📅 ${shop.name} subscription expiring in ${daysLeft} days — seller notified`);
      }
    }

    if (expiredShops.length > 0 || expiringShops.length > 0) {
      console.log(`📊 Subscription check: ${expiredShops.length} expired, ${expiringShops.length} expiring soon`);
    }
  } catch (error) {
    console.error('Subscription check error:', error.message);
  }
}
