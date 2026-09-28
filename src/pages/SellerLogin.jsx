import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HiLockClosed, HiArrowLeft, HiPhone, HiShieldCheck } from 'react-icons/hi';
import { SiTelegram } from 'react-icons/si';
import { useSeller } from '../context/SellerAuthContext';
import API from '../api';
import toast from 'react-hot-toast';

export default function SellerLogin() {
  const [telegramUsername, setTelegramUsername] = useState('GODnith369');
  const [loading, setLoading] = useState(false);

  // Alternative login modes
  const [activeTab, setActiveTab] = useState('telegram'); // 'telegram' | 'phone' | 'password'
  
  // Phone OTP state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Password state
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');

  const { loginWithOTP, sendOTP, login, refreshShop } = useSeller();
  const navigate = useNavigate();

  // 1-Click / Username Telegram Login
  const handleTelegramLogin = async (e, usernameOverride = null) => {
    if (e) e.preventDefault();
    const uname = (usernameOverride || telegramUsername || '').replace('@', '').trim();
    if (!uname) {
      return toast.error('Please enter your Telegram username or ID');
    }
    setLoading(true);
    try {
      const { data } = await API.post('/auth/telegram/login', {
        username: uname,
        telegramId: uname === 'GODnith369' ? '6078962359' : undefined,
      });

      localStorage.setItem('seller_token', data.token);
      toast.success(`Welcome back, ${data.user?.displayName || uname}!`);
      await refreshShop();

      if (!data.shop) {
        navigate('/seller/create-shop');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Please open @Aura_shopz_bot and tap Start first.');
    } finally {
      setLoading(false);
    }
  };

  // Phone OTP Login
  const handleSendOTP = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/[^0-9+]/g, '').trim();
    if (!cleanPhone || cleanPhone.length < 8) return toast.error('Please enter a valid phone number');
    setLoading(true);
    try {
      const data = await sendOTP(cleanPhone);
      setOtpSent(true);
      if (data.otp) setOtp(data.otp);
      toast.success('Verification code sent to your Telegram!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await loginWithOTP(phone, otp.trim());
      toast.success('Signed in successfully!');
      if (!data?.shop) navigate('/seller/create-shop');
      else navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  // Password Login (admin fallback)
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(loginId, password);
      toast.success('Welcome back!');
      if (!data?.shop) navigate('/seller/create-shop');
      else navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
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
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 16px',
            background: 'linear-gradient(135deg, rgba(0, 136, 204, 0.2), rgba(139, 92, 246, 0.2))',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2rem',
            color: '#0088cc',
            boxShadow: '0 8px 24px rgba(0, 136, 204, 0.15)'
          }}>
            <SiTelegram />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Seller Portal</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '6px' }}>
            Connect with Telegram to manage your shop
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 'var(--radius-md)',
          padding: '4px',
          marginBottom: '20px',
          gap: '4px'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('telegram')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'telegram' ? '#0088cc' : 'transparent',
              color: activeTab === 'telegram' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <SiTelegram size={14} /> Telegram
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('phone')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'phone' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'phone' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <HiPhone size={14} /> Phone OTP
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: activeTab === 'password' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'password' ? '#fff' : 'var(--text-secondary)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            <HiLockClosed size={14} /> Password
          </button>
        </div>

        {/* TAB 1: TELEGRAM LOGIN */}
        {activeTab === 'telegram' && (
          <div>
            {/* Quick 1-Click Login for @GODnith369 */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(0, 136, 204, 0.15), rgba(139, 92, 246, 0.1))',
              border: '1px solid rgba(0, 136, 204, 0.35)',
              borderRadius: 'var(--radius-lg)',
              padding: '16px',
              marginBottom: '18px',
              textAlign: 'center',
            }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '12px' }}>
                Connected Bot: <strong>@Aura_shopz_bot</strong>
              </p>
              <button
                type="button"
                onClick={(e) => handleTelegramLogin(e, 'GODnith369')}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #0088cc, #006699)',
                  padding: '12px',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
                disabled={loading}
              >
                <SiTelegram size={18} />
                {loading ? 'Signing in...' : 'Sign in as @GODnith369'}
              </button>
            </div>

            {/* Login with any other Telegram username */}
            <form onSubmit={handleTelegramLogin}>
              <div className="form-group">
                <label htmlFor="telegramUsername">Or Enter Telegram Username</label>
                <input
                  type="text"
                  id="telegramUsername"
                  value={telegramUsername}
                  onChange={(e) => setTelegramUsername(e.target.value)}
                  placeholder="e.g. GODnith369"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-secondary"
                style={{ width: '100%', marginTop: '4px', padding: '12px' }}
                disabled={loading}
              >
                Sign in with Telegram Username
              </button>
            </form>

            {/* Bot Direct Link */}
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <a
                href="https://t.me/Aura_shopz_bot"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#0088cc',
                  fontSize: '0.88rem',
                  textDecoration: 'underline',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <SiTelegram size={14} /> Open @Aura_shopz_bot in Telegram
              </a>
            </div>
          </div>
        )}

        {/* TAB 2: PHONE OTP */}
        {activeTab === 'phone' && (
          !otpSent ? (
            <form onSubmit={handleSendOTP}>
              <div className="form-group">
                <label htmlFor="phone">Mobile Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 012 345 678"
                  required
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
                <HiShieldCheck size={18} /> {loading ? 'Sending...' : 'Send OTP via Telegram'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP}>
              <div className="form-group">
                <label htmlFor="otp">Enter 6-Digit Code</label>
                <input
                  type="text"
                  id="otp"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  maxLength={6}
                  required
                  style={{ fontSize: '1.4rem', textAlign: 'center', letterSpacing: '4px' }}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
                Verify & Enter Shop
              </button>
            </form>
          )
        )}

        {/* TAB 3: PASSWORD LOGIN */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordLogin}>
            <div className="form-group">
              <label htmlFor="loginId">Username / Email</label>
              <input
                type="text"
                id="loginId"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="Enter username or email"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '12px' }} disabled={loading}>
              Sign In
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
