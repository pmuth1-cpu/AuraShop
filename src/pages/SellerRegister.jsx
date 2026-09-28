import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HiPhone, HiArrowLeft, HiShieldCheck, HiRefresh } from 'react-icons/hi';
import { SiTelegram } from 'react-icons/si';
import { useSeller } from '../context/SellerAuthContext';
import toast from 'react-hot-toast';

export default function SellerRegister() {
  const [phone, setPhone] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [otp, setOtp] = useState('');
  const [receivedOtp, setReceivedOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [telegramSent, setTelegramSent] = useState(false);
  const [chatNotFound, setChatNotFound] = useState(false);
  const [loading, setLoading] = useState(false);

  const { loginWithOTP, sendOTP } = useSeller();
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/[^0-9+]/g, '').trim();
    if (!cleanPhone || cleanPhone.length < 8) {
      return toast.error('Please enter a valid mobile phone number');
    }
    setLoading(true);
    try {
      const data = await sendOTP(cleanPhone);
      setOtpSent(true);
      if (data.telegramSent) {
        setTelegramSent(true);
        toast.success('Verification code sent to your Telegram!');
      }
      if (data.chatNotFound) {
        setChatNotFound(true);
      }
      if (data.otp) {
        setReceivedOtp(data.otp);
        setOtp(data.otp);
        if (!data.telegramSent) {
          toast.success(`Verification code: ${data.otp}`, { duration: 8000 });
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 4) {
      return toast.error('Please enter the 6-digit OTP code');
    }
    setLoading(true);
    try {
      const data = await loginWithOTP(phone, otp.trim(), displayName.trim());
      toast.success('Account verified! Welcome to Aura Shop.');
      if (!data?.shop) {
        navigate('/seller/create-shop');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div style={{ position: 'absolute', top: '24px', left: '24px' }}>
        <Link to="/" className="btn btn-secondary btn-sm" style={{ border: 'none', background: 'var(--bg-card)' }}>
          <HiArrowLeft /> Return to Store
        </Link>
      </div>

      <div className="login-card glass" style={{ maxWidth: '440px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '60px',
            height: '60px',
            margin: '0 auto 16px',
            background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(6,182,212,0.2))',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.8rem',
            color: 'var(--accent)'
          }}>
            <HiPhone />
          </div>
          <h1>Open Your Shop</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '6px' }}>
            {!otpSent ? 'Sign up instantly with your mobile phone' : `Enter the verification code sent to ${phone}`}
          </p>
        </div>

        {/* Telegram Bot Connector Badge */}
        <a
          href="https://t.me/Aura_shopz_bot"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: 'rgba(0, 136, 204, 0.12)',
            border: '1px solid rgba(0, 136, 204, 0.35)',
            color: '#0088cc',
            textDecoration: 'none',
            fontSize: '0.88rem',
            fontWeight: 500,
            marginBottom: '18px',
          }}
        >
          <SiTelegram size={18} />
          <span>Open @Aura_shopz_bot to receive OTP</span>
        </a>

        {!otpSent ? (
          <form onSubmit={handleSendOTP}>
            <div className="form-group">
              <label htmlFor="displayName">Your Name or Shop Name</label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Sokha Boutique"
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Mobile Phone Number</label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 012 345 678"
                required
                style={{ fontSize: '1.05rem', letterSpacing: '0.5px' }}
              />
              <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                No email or password needed. We'll send an OTP code to verify your phone.
              </small>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '8px', padding: '12px' }}
              disabled={loading}
            >
              <HiShieldCheck size={18} /> {loading ? 'Sending OTP...' : 'Send Verification Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP}>
            {receivedOtp && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                padding: '12px 16px',
                borderRadius: 'var(--radius-md)',
                marginBottom: '18px',
                textAlign: 'center',
              }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Verification Code: </span>
                <strong style={{ fontSize: '1.25rem', color: '#10b981', letterSpacing: '3px', marginLeft: '6px' }}>
                  {receivedOtp}
                </strong>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="otp">Enter 6-Digit Code</label>
              <input
                type="text"
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                maxLength={6}
                autoFocus
                required
                style={{
                  fontSize: '1.5rem',
                  textAlign: 'center',
                  letterSpacing: '6px',
                  fontWeight: 600,
                }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '8px', padding: '12px' }}
              disabled={loading}
            >
              <HiShieldCheck size={18} /> {loading ? 'Verifying...' : 'Verify & Open Shop'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '0.85rem' }}>
              <button
                type="button"
                onClick={() => setOtpSent(false)}
                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}
              >
                Change phone number
              </button>
              <button
                type="button"
                onClick={handleSendOTP}
                disabled={loading}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <HiRefresh size={14} /> Resend Code
              </button>
            </div>
          </form>
        )}

        <div style={{ marginTop: '24px', textAlign: 'center', paddingTop: '16px', borderTop: '1px solid var(--border-glass)', fontSize: '0.85rem' }}>
          <Link to="/seller/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Already have a shop? Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
