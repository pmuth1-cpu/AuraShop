import axios from 'axios';
import jwt from 'jsonwebtoken';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8847884731:AAE1c6SJn8Ct191KFTZ6V6XfkV2GKc3ijS0';
const JWT_SECRET = process.env.JWT_SECRET || 'aura-shop-secret-key-2026-change-in-production';
const CLIENT_URL = process.env.CLIENT_URL || 'https://aurashopforcam.vercel.app';

let lastUpdateId = 0;
let isPolling = false;

// In-memory session store for web-to-bot linking
export const telegramSessions = new Map();

/**
 * Handle incoming Telegram message/command
 */
export async function handleTelegramMessage(message) {
  if (!message || !message.from) return null;

  const telegramId = String(message.from.id);
  const username = (message.from.username || '').toLowerCase();
  const firstName = message.from.first_name || '';
  const lastName = message.from.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim() || username || `User ${telegramId.slice(-4)}`;
  const text = (message.text || '').trim();

  try {
    const { User, Shop } = await import('../models/index.js');

    // Find or create user
    let user = await User.findOne({
      $or: [
        { telegramId },
        ...(username ? [{ telegramUsername: username }] : []),
      ],
    });

    if (!user) {
      user = await User.create({
        telegramId,
        telegramUsername: username,
        displayName: fullName,
        role: 'seller',
        isActive: true,
      });
      console.log(`👤 [Telegram Bot] Created new user: ${fullName} (@${username}, ID: ${telegramId})`);
    } else {
      user.telegramId = telegramId;
      if (username) user.telegramUsername = username;
      if (!user.displayName) user.displayName = fullName;
      await user.save();
    }

    // Check if seller has a shop
    const shop = await Shop.findOne({ owner: user._id });
    const shopId = shop ? shop._id : null;

    // Generate JWT token (30 days)
    const token = jwt.sign(
      { id: user._id, role: user.role, shopId, telegramId: user.telegramId },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    // If message starts with /start <sessionCode>
    if (text.startsWith('/start')) {
      const parts = text.split(' ');
      if (parts.length > 1) {
        const sessionCode = parts[1].trim();
        telegramSessions.set(sessionCode, {
          token,
          user: {
            id: user._id,
            displayName: user.displayName,
            telegramUsername: user.telegramUsername,
            role: user.role,
          },
          shop: shop ? { id: shop._id, slug: shop.slug, name: shop.name } : null,
          verifiedAt: Date.now(),
        });
      }
    }

    const loginUrl = `${CLIENT_URL}/seller/telegram-auth?token=${token}`;

    // Send welcome reply with direct login button
    const replyText = `👋 *Welcome to Aura Shop, ${firstName || 'Seller'}!*\n\n` +
      `Your Telegram account *(@${username || firstName})* is connected.\n\n` +
      `Tap the button below to access your Shop Manager:`;

    await axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      chat_id: telegramId,
      text: replyText,
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [
            {
              text: '🏪 Open Shop Dashboard',
              url: loginUrl,
            },
          ],
        ],
      },
    });

    return { user, token, shop };
  } catch (err) {
    console.error('❌ [Telegram Bot] Error handling message:', err.message);
    return null;
  }
}

/**
 * Start Telegram bot background polling for updates
 */
export async function startTelegramBotPolling() {
  if (isPolling) return;
  isPolling = true;

  console.log('🤖 [Telegram Bot] Starting polling worker...');

  const poll = async () => {
    try {
      const res = await axios.get(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`, {
        params: {
          offset: lastUpdateId + 1,
          timeout: 20,
        },
      });

      const updates = res.data?.result || [];
      for (const update of updates) {
        lastUpdateId = Math.max(lastUpdateId, update.update_id);
        if (update.message) {
          await handleTelegramMessage(update.message);
        }
      }
    } catch (err) {
      // Ignore network timeouts during polling
      if (!err.message?.includes('timeout') && err.code !== 'ECONNABORTED') {
        console.warn('⚠️ [Telegram Bot] Polling warning:', err.response?.data?.description || err.message);
      }
    } finally {
      setTimeout(poll, 1500);
    }
  };

  poll();
}

/**
 * Direct login by Telegram username or chat ID
 */
export async function loginByTelegram({ username, telegramId }) {
  const { User, Shop } = await import('../models/index.js');
  const cleanUsername = (username || '').replace('@', '').trim().toLowerCase();
  const cleanId = String(telegramId || '').trim();

  let user = await User.findOne({
    $or: [
      ...(cleanId ? [{ telegramId: cleanId }] : []),
      ...(cleanUsername ? [{ telegramUsername: cleanUsername }] : []),
      ...(cleanUsername ? [{ displayName: new RegExp(`^${cleanUsername}$`, 'i') }] : []),
    ],
  });

  if (!user && (cleanUsername || cleanId)) {
    // Auto-create user for Telegram account
    user = await User.create({
      telegramId: cleanId || undefined,
      telegramUsername: cleanUsername || undefined,
      displayName: cleanUsername || `Telegram User`,
      role: 'seller',
      isActive: true,
    });
  }

  if (!user) return null;

  const shop = await Shop.findOne({ owner: user._id });
  const token = jwt.sign(
    { id: user._id, role: user.role, shopId: shop?._id, telegramId: user.telegramId },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  return {
    token,
    user: {
      id: user._id,
      displayName: user.displayName,
      telegramUsername: user.telegramUsername,
      role: user.role,
    },
    shop: shop ? { id: shop._id, slug: shop.slug, name: shop.name } : null,
  };
}
