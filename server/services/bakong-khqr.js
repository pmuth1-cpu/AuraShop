import QRCode from 'qrcode';
import { BakongKHQR, khqrData, IndividualInfo } from 'bakong-khqr';

const ADMIN_BAKONG_ACCOUNT = process.env.BAKONG_ACCOUNT || 'admin@bakong';
const ADMIN_BAKONG_NAME = process.env.BAKONG_NAME || 'Aura Shop Platform';
const ADMIN_BAKONG_CITY = process.env.BAKONG_CITY || 'Phnom Penh';
const BAKONG_API_URL = process.env.BAKONG_API_URL || 'https://api-bakong.nbc.gov.kh';
const BAKONG_API_TOKEN = process.env.BAKONG_API_TOKEN || '';

/**
 * Convert a QR string to a base64 PNG data URL.
 */
export async function qrToImage(qrString) {
  try {
    return await QRCode.toDataURL(qrString, {
      width: 400,
      margin: 2,
      color: { dark: '#000000', light: '#ffffff' },
    });
  } catch (err) {
    console.error('QR image generation error:', err);
    return null;
  }
}

/**
 * Generate a subscription payment QR code for the admin's Bakong account.
 * Sellers scan this to pay their monthly $2.50 fee.
 */
export async function generateSubscriptionQR(amount = 2.50, currency = 'USD') {
  try {
    const currencyCode = currency === 'KHR' ? khqrData.currency.khr : khqrData.currency.usd;

    const info = new IndividualInfo(
      ADMIN_BAKONG_ACCOUNT,
      ADMIN_BAKONG_NAME,
      ADMIN_BAKONG_CITY,
      'Aura Subscription',
      currencyCode,
      Number(amount)
    );

    const khqr = new BakongKHQR();
    const result = khqr.generateIndividual(info);
    const qrString = result?.data?.qr || result?.qr || '';
    const md5 = result?.data?.md5 || '';
    const qrImage = qrString ? await qrToImage(qrString) : null;

    return {
      qrString,
      md5,
      qrImage,
      amount,
      currency,
    };
  } catch (err) {
    console.warn('BakongKHQR generation error, using fallback QR:', err.message);
    const fallbackData = JSON.stringify({
      to: ADMIN_BAKONG_ACCOUNT,
      name: ADMIN_BAKONG_NAME,
      amount,
      currency,
      ref: `SUB-${Date.now()}`,
    });

    const qrImage = await qrToImage(fallbackData);
    return {
      qrString: fallbackData,
      md5: `mock-md5-${Date.now()}`,
      qrImage,
      amount,
      currency,
    };
  }
}

/**
 * Generate a checkout payment QR code for a seller's Bakong account.
 * Buyers scan this to pay for their order.
 */
export async function generateCheckoutQR(sellerBakongAccount, sellerName, amount, currency = 'USD', billNumber = '') {
  try {
    const targetAccount = sellerBakongAccount || ADMIN_BAKONG_ACCOUNT;
    const targetName = sellerName || ADMIN_BAKONG_NAME;
    const currencyCode = currency === 'KHR' ? khqrData.currency.khr : khqrData.currency.usd;

    const info = new IndividualInfo(
      targetAccount,
      targetName,
      'Phnom Penh',
      billNumber || 'Aura Order',
      currencyCode,
      Number(amount)
    );

    const khqr = new BakongKHQR();
    const result = khqr.generateIndividual(info);
    const qrString = result?.data?.qr || result?.qr || '';
    const md5 = result?.data?.md5 || '';
    const qrImage = qrString ? await qrToImage(qrString) : null;

    return {
      qrString,
      md5,
      qrImage,
      amount,
      currency,
    };
  } catch (err) {
    console.warn('Bakong checkout QR generation error:', err.message);
    const fallbackData = JSON.stringify({
      to: sellerBakongAccount || ADMIN_BAKONG_ACCOUNT,
      name: sellerName || ADMIN_BAKONG_NAME,
      amount,
      currency,
      bill: billNumber,
    });

    const qrImage = await qrToImage(fallbackData);
    return {
      qrString: fallbackData,
      md5: `mock-order-md5-${Date.now()}`,
      qrImage,
      amount,
      currency,
    };
  }
}

/**
 * Verify a KHQR transaction using the NBC Bakong Open API.
 * Calls POST /v1/check_transaction_by_md5 with MD5 hash.
 */
export async function verifyBakongTransaction(md5) {
  if (!md5) {
    return { verified: false, message: 'Missing MD5 hash for verification.' };
  }

  // If in development/sandbox and no API token is configured, allow simulated test verification
  if (!BAKONG_API_TOKEN) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('⚠️ BAKONG_API_TOKEN is not configured in .env. Checking simulated/sandbox fallback.');
      return {
        verified: false,
        requiresToken: true,
        message: 'Bakong API token not configured. Please add BAKONG_API_TOKEN to .env to verify with NBC Bakong.',
      };
    }
    return {
      verified: false,
      message: 'Bakong API verification is not configured on the server.',
    };
  }

  try {
    const url = `${BAKONG_API_URL.replace(/\/+$/, '')}/v1/check_transaction_by_md5`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${BAKONG_API_TOKEN}`,
      },
      body: JSON.stringify({ md5 }),
    });

    const data = await response.json();

    // NBC Bakong API convention: responseCode === 0 indicates transaction found and verified
    if (data && (data.responseCode === 0 || data.code === 0)) {
      return {
        verified: true,
        transaction: data.data || data,
        message: 'Transaction successfully verified via Bakong Open API.',
      };
    }

    return {
      verified: false,
      responseCode: data?.responseCode,
      message: data?.responseMessage || 'Payment not detected yet. Please scan the QR and complete the transfer.',
    };
  } catch (error) {
    console.error('Bakong API verification request failed:', error.message);
    return {
      verified: false,
      error: error.message,
      message: 'Failed to connect to Bakong Open API. Please try again.',
    };
  }
}
