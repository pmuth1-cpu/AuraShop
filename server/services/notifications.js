/**
 * Notification service — creates and sends notifications to sellers.
 * Can be called from any route or service to alert sellers about events.
 */

export async function createNotification({ recipientId, type, title, message, link = '', metadata = {} }) {
  try {
    const { Notification } = await import('../models/index.js');
    return await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      link,
      metadata,
    });
  } catch (err) {
    console.error('Failed to create notification:', err.message);
    return null;
  }
}

// Pre-built notification templates

export async function notifyShopApproved(sellerId, shopName, shopSlug) {
  return createNotification({
    recipientId: sellerId,
    type: 'shop_approved',
    title: '🎉 Shop Approved!',
    message: `Your shop "${shopName}" has been approved and is now live! Customers can find you at /shop/${shopSlug}`,
    link: `/shop/${shopSlug}`,
  });
}

export async function notifyShopSuspended(sellerId, shopName) {
  return createNotification({
    recipientId: sellerId,
    type: 'shop_suspended',
    title: '⚠️ Shop Suspended',
    message: `Your shop "${shopName}" has been suspended by the admin. Please contact support for more information.`,
    link: '/dashboard',
  });
}

export async function notifyShopReactivated(sellerId, shopName) {
  return createNotification({
    recipientId: sellerId,
    type: 'shop_reactivated',
    title: '✅ Shop Reactivated',
    message: `Your shop "${shopName}" has been reactivated! You're back in business.`,
    link: '/dashboard',
  });
}

export async function notifyPaymentVerified(sellerId, shopName, periodEnd) {
  const endDate = new Date(periodEnd).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  return createNotification({
    recipientId: sellerId,
    type: 'payment_verified',
    title: '💰 Payment Verified',
    message: `Your subscription payment for "${shopName}" has been verified. Your shop is active until ${endDate}.`,
    link: '/dashboard/subscription',
  });
}

export async function notifyPaymentOverdue(sellerId, shopName) {
  return createNotification({
    recipientId: sellerId,
    type: 'payment_overdue',
    title: '⏰ Subscription Expired',
    message: `Your subscription for "${shopName}" has expired. Please renew to keep your shop active. Your shop is still visible but may be suspended if not renewed.`,
    link: '/dashboard/subscription',
  });
}

export async function notifySubscriptionExpiring(sellerId, shopName, daysLeft) {
  return createNotification({
    recipientId: sellerId,
    type: 'subscription_expiring',
    title: `📅 Subscription Expiring in ${daysLeft} Days`,
    message: `Your subscription for "${shopName}" will expire in ${daysLeft} days. Renew now to avoid any interruption.`,
    link: '/dashboard/subscription',
  });
}

export async function notifyNewOrder(sellerId, shopName, orderSummary) {
  return createNotification({
    recipientId: sellerId,
    type: 'new_order',
    title: '🛒 New Order Received!',
    message: `A new order has been placed in "${shopName}". ${orderSummary}`,
    link: '/dashboard',
  });
}

export async function notifySystem(sellerId, title, message, link = '') {
  return createNotification({
    recipientId: sellerId,
    type: 'system',
    title,
    message,
    link,
  });
}
