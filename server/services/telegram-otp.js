import axios from 'axios';

export async function sendTelegramOTP({ phone, otp, chatId }) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const targetChat = chatId || process.env.TELEGRAM_CHAT_ID;

  if (!token || !targetChat) {
    console.warn('⚠️ TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is not configured in environment variables.');
    return { success: false, reason: 'unconfigured' };
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
    return { success: true, messageId: res.data?.result?.message_id };
  } catch (error) {
    console.error('❌ [Telegram] Failed to send OTP:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.description || error.message };
  }
}
