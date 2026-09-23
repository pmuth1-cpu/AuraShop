import express from 'express';

const router = express.Router();

// Simple OTP store (in-memory for now, should use Redis in production)
const otpStore = new Map();
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
const VERIFIED_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// POST /api/buyer/request-otp - Request OTP for phone verification
router.post('/request-otp', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone number is required.' });

    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const otp = generateOTP();

    otpStore.set(cleanPhone, {
      otp,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
      attempts: 0,
    });

    // In production, send via SMS or Telegram bot
    // For now, log it and return in dev mode
    console.log(`📱 OTP for ${cleanPhone}: ${otp}`);

    const isDev = process.env.NODE_ENV !== 'production';
    res.json({
      message: 'OTP sent to your phone.',
      ...(isDev ? { otp } : {}), // Only return OTP in development
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// POST /api/buyer/verify-otp - Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) {
      return res.status(400).json({ message: 'Phone and OTP are required.' });
    }

    const cleanPhone = phone.replace(/[^0-9+]/g, '');
    const stored = otpStore.get(cleanPhone);

    if (!stored) {
      return res.status(400).json({ message: 'No OTP found. Please request a new one.' });
    }

    if (Date.now() > stored.expiresAt) {
      otpStore.delete(cleanPhone);
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' });
    }

    stored.attempts++;
    if (stored.attempts > 5) {
      otpStore.delete(cleanPhone);
      return res.status(429).json({ message: 'Too many attempts. Please request a new OTP.' });
    }

    if (stored.otp !== otp) {
      return res.status(400).json({ message: 'Invalid OTP.' });
    }

    // OTP verified — clean up
    otpStore.delete(cleanPhone);

    // Return a simple buyer verification token (just phone + timestamp, base64 encoded)
    const buyerToken = Buffer.from(JSON.stringify({
      phone: cleanPhone,
      verifiedAt: Date.now(),
      expiresAt: Date.now() + VERIFIED_EXPIRY_MS,
    })).toString('base64');

    res.json({
      verified: true,
      phone: cleanPhone,
      buyerToken,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message });
  }
});

// POST /api/buyer/check-token - Check if buyer token is still valid
router.post('/check-token', (req, res) => {
  try {
    const { buyerToken } = req.body;
    if (!buyerToken) return res.json({ valid: false });

    const data = JSON.parse(Buffer.from(buyerToken, 'base64').toString());
    if (Date.now() > data.expiresAt) {
      return res.json({ valid: false, message: 'Token expired.' });
    }
    res.json({ valid: true, phone: data.phone });
  } catch {
    res.json({ valid: false });
  }
});

// Clean up expired OTPs periodically
setInterval(() => {
  const now = Date.now();
  for (const [phone, data] of otpStore.entries()) {
    if (now > data.expiresAt) otpStore.delete(phone);
  }
}, 60 * 1000);

export default router;
