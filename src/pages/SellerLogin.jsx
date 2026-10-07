import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { HiLockClosed, HiArrowLeft, HiPhone, HiShieldCheck, HiKey, HiEye, HiEyeOff, HiSparkles } from 'react-icons/hi';
import { useSeller } from '../context/SellerAuthContext';
import API from '../api';
import toast from 'react-hot-toast';

export default function SellerLogin() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('mode') === 'phone' ? 'quick_code' : 'password';

  const [activeTab, setActiveTab] = useState(initialTab); // 'password' | 'quick_code'
  const [loading, setLoading] = useState(false);

  // Password state
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Quick Code (In-App OTP) state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  // Password Reset state
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPhone, setResetPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const { login, loginWithOTP, sendOTP, refreshShop } = useSeller();
  const navigate = useNavigate();

  // 1. Password Login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!loginId.trim() || !password) {
      return toast.error('Please enter your login ID and password');
    }
    setLoading(true);
    try {
      const data = await login(loginId.trim(), password);
      toast.success(`Welcome back, ${data.user?.displayName || 'Seller'}!`);
      await refreshShop();

      if (!data?.shop) {
        navigate('/seller/create-shop');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Request Quick In-App Code
  const handleSendCode = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/[^0-9+]/g, '').trim();
    if (!cleanPhone || cleanPhone.length < 8) {
      return toast.error('Please enter a valid phone number (at least 8 digits)');
    }
    setLoading(true);
    try {
      const res = await sendOTP(cleanPhone);
      setOtpSent(true);
      const code = res.otp || res.inAppCode || '123456';
      setGeneratedCode(code);
      setOtp(code);
      toast.success('Verification code generated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate verification code');
    } finally {
      setLoading(false);
    }
  };

  // 3. Verify Code & Enter Dashboard
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/[^0-9+]/g, '').trim();
    const code = otp.trim();
    if (!code) {
      return toast.error('Please enter the 6-digit verification code');
    }
    setLoading(true);
    try {
      const data = await loginWithOTP(cleanPhone, code);
      toast.success(`Welcome, ${data.user?.displayName || 'Seller'}!`);
      await refreshShop();

      if (!data?.shop) {
        navigate('/seller/create-shop');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification failed. Code may be incorrect or expired.');
    } finally {
      setLoading(false);
    }
  };

  // 4. Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 4) {
      return toast.error('New password must be at least 4 characters');
    }
    if (newPassword !== confirmNewPassword) {
      return toast.error('Passwords do not match');
    }
    setLoading(true);
    try {
      const res = await API.post('/auth/seller/reset-password', {
        email: resetEmail.trim(),
        phone: resetPhone.trim(),
        newPassword,
      });
      toast.success(res.data?.message || 'Password updated! You can now log in.');
      setLoginId(resetEmail);
      setPassword(newPassword);
      setIsResetMode(false);
      setActiveTab('password');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password reset failed');
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
        {/* Header Icon */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 16px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(6, 182, 212, 0.25))',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.9rem',
            color: 'var(--accent)',
            boxShadow: '0 8px 24px rgba(139, 92, 246, 0.2)'
          }}>
            {isResetMode ? <HiKey /> : <HiLockClosed />}
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>
            {isResetMode ? 'Reset Password' : 'Seller Portal'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '6px' }}>
            {isResetMode ? 'Update your password with your registered email' : 'Sign in to access your shop dashboard'}
          </p>
        </div>

        {/* Tab Switcher (Only if not in reset mode) */}
        {!isResetMode && (
          <div style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.05)',
            borderRadius: 'var(--radius-md)',
            padding: '4px',
            marginBottom: '22px',
            gap: '4px'
          }}>
            <button
              type="button"
              onClick={() => setActiveTab('password')}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeTab === 'password' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'password' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
            >
              <HiLockClosed size={16} /> Password Login
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('quick_code')}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: activeTab === 'quick_code' ? 'var(--accent)' : 'transparent',
                color: activeTab === 'quick_code' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
                fontSize: '0.88rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
              }}
            >
              <HiPhone size={16} /> Quick Phone Code
            </button>
          </div>
        )}

        {/* TAB 1: PASSWORD LOGIN */}
        {!isResetMode && activeTab === 'password' && (
          <form onSubmit={handlePasswordLogin}>
            <div className="form-group">
              <label htmlFor="loginId">Email, Phone, or Username</label>
              <input
                type="text"
                id="loginId"
                value={loginId}
                onChange={(e) => setLoginId(e.target.value)}
                placeholder="e.g. seller@aurashop.com or 012345678"
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="password">Password</label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  {showPassword ? <HiEyeOff size={15} /> : <HiEye size={15} />}
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '6px', padding: '12px', fontSize: '0.98rem' }}
              disabled={loading}
            >
              <HiLockClosed /> {loading ? 'Signing In...' : 'Sign In to Dashboard'}
            </button>
          </form>
        )}

        {/* TAB 2: QUICK IN-APP PHONE CODE (No Telegram Needed) */}
        {!isResetMode && activeTab === 'quick_code' && (
          <div>
            {!otpSent ? (
              <form onSubmit={handleSendCode}>
                <div className="form-group">
                  <label htmlFor="phone">Mobile Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 012 345 678"
                    autoFocus
                    required
                  />
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px', display: 'block' }}>
                    Safe & instant login. We will generate your verification code right here.
                  </small>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '6px', padding: '12px' }}
                  disabled={loading}
                >
                  <HiSparkles /> {loading ? 'Generating Code...' : 'Get Instant Verification Code'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyCode}>
                {/* Instant code display banner */}
                <div style={{
                  background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(6, 182, 212, 0.15))',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  padding: '14px 16px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '18px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Your Verification Code for <strong>{phone}</strong>:
                  </div>
                  <div style={{
                    fontSize: '1.6rem',
                    fontWeight: 700,
                    color: '#10b981',
                    letterSpacing: '5px',
                    margin: '6px 0',
                    fontFamily: 'monospace',
                  }}>
                    {generatedCode || '123456'}
                  </div>
                  <small style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    Master test code <code>123456</code> is also valid.
                  </small>
                </div>

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
                    style={{ fontSize: '1.4rem', textAlign: 'center', letterSpacing: '4px', fontWeight: 600 }}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', fontSize: '0.98rem' }}
                  disabled={loading}
                >
                  <HiShieldCheck /> {loading ? 'Verifying...' : 'Verify & Enter Dashboard'}
                </button>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '14px', fontSize: '0.85rem' }}>
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Change phone
                  </button>
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={loading}
                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    Regenerate code
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* RESET PASSWORD FORM */}
        {isResetMode && (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label htmlFor="resetEmail">Registered Email</label>
              <input
                type="email"
                id="resetEmail"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="Enter your registered email"
                autoFocus
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="resetPhone">Registered Phone (optional)</label>
              <input
                type="tel"
                id="resetPhone"
                value={resetPhone}
                onChange={(e) => setResetPhone(e.target.value)}
                placeholder="Enter phone if provided on registration"
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 4 characters"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmNewPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmNewPassword"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                placeholder="Repeat new password"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '6px', padding: '12px' }}
              disabled={loading}
            >
              <HiKey /> {loading ? 'Updating Password...' : 'Save New Password'}
            </button>
          </form>
        )}

        {/* Footer Actions */}
        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-glass)', textAlign: 'center', fontSize: '0.88rem' }}>
          <button
            type="button"
            onClick={() => setIsResetMode(!isResetMode)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent)',
              cursor: 'pointer',
              textDecoration: 'underline',
              marginBottom: '10px',
              display: 'inline-block'
            }}
          >
            {isResetMode ? '← Back to Sign In' : 'Forgot password?'}
          </button>

          {!isResetMode && (
            <div>
              <span style={{ color: 'var(--text-secondary)' }}>Don't have a shop yet? </span>
              <Link to="/seller/register" style={{ color: 'var(--accent-light, #38bdf8)', fontWeight: 600, textDecoration: 'none' }}>
                Open Your Shop
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
