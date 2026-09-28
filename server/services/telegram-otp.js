import axios from 'axios';

const DEFAULT_BOT_TOKEN = '8847884731:AAE1c6SJn8Ct191KFTZ6V6XfkV2GKc3ijS0';
const DEFAULT_CHAT_ID = '6078962359';
const BOT_USERNAME = 'Aura_shopz_bot';

export async function sendTelegramOTP({ phone, otp, chatId }) {
  const token = process.env.TELEGRAM_BOT_TOKEN || DEFAULT_BOT_TOKEN;
  let targetChat = chatId || process.env.TELEGRAM_CHAT_ID || DEFAULT_CHAT_ID;

  if (!token) {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN is not configured.');
    return { success: false, reason: 'unconfigured' };
  }

  // Try to find recent chat ID from bot updates if target chat failed or to be dynamic
  try {
    const updatesRes = await axios.get(`https://api.telegram.org/bot${token}/getUpdates?limit=5`);
    const updates = updatesRes.data?.result || [];
    if (updates.length > 0) {
      // Get the latest chat ID who messaged or started the bot
      const latestUpdate = updates[updates.length - 1];
      const fromChat = latestUpdate?.message?.chat?.id;
      if (fromChat) {
        targetChat = fromChat;
      }
    }
  } catch {
    // ignore
  }

  const text = `🔐 *Aura Shop Verification Code*\n\n` +
    `Your verification code for *${phone}* is:\n\n` +
    `👉 \`${otp}\` 👈\n\n` +
    `⏱ _This code will expire in 10 minutes. Do not share it with anyone._`;

  try {
    const res = await axios.post(`https://api.telegram.org/bot${token}/sendMessage`, {
      chat_id: targetChat,
      text,
      parse_mode: 'Markdown',
    });
    console.log(`✅ [Telegram] OTP sent to chat ${targetChat} for ${phone}`);
    return { success: true, messageId: res.data?.result?.message_id, chatId: targetChat };
  } catch (error) {
    const desc = error.response?.data?.description || error.message;
    console.error('❌ [Telegram] Failed to send OTP:', desc);
    const isChatNotFound = desc.toLowerCase().includes('chat not found');
    return {
      success: false,
      reason: isChatNotFound ? 'chat_not_found' : 'error',
      botUsername: BOT_USERNAME,
      error: desc,
    };
  }
}
