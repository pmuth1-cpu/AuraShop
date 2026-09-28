import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HiLockClosed, HiArrowLeft, HiKey } from 'react-icons/hi';
import { useSeller } from '../context/SellerAuthContext';
import { authAPI } from '../api';
import toast from 'react-hot-toast';

export default function SellerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetPhone, setResetPhone] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const { login } = useSeller();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await login(email, password);
      toast.success('Welcome to Seller Dashboard');
      if (!data?.shop) {
        navigate('/seller/create-shop');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      return toast.error('Passwords do not match');
    }
    if (newPassword.length < 4) {
      return toast.error('Password must be at least 4 characters');
    }
    setLoading(true);
    try {
      const res = await authAPI.resetSellerPassword({
        email,
        phone: resetPhone,
        newPassword,
      });
      toast.success(res.data.message || 'Password reset successful! Please sign in.');
      setPassword(newPassword);
      setIsResetMode(false);
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
      <div className="login-card glass">
        <h1>{isResetMode ? 'Reset Seller Password' : 'Seller Login'}</h1>
        <p>{isResetMode ? 'Enter your registered email to update your password' : 'Sign in to manage your shop'}</p>

        {!isResetMode ? (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="email">Email or Phone</label>
              <input
                type="text"
                id="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter email or registered phone"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
              <HiLockClosed /> {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label htmlFor="reset-email">Registered Email</label>
              <input
                type="email"
                id="reset-email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="reset-phone">Registered Phone (optional)</label>
              <input
                type="text"
                id="reset-phone"
                value={resetPhone}
                onChange={e => setResetPhone(e.target.value)}
                placeholder="Enter phone if provided on registration"
              />
            </div>
            <div className="form-group">
              <label htmlFor="new-password">New Password</label>
              <input
                type="password"
                id="new-password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirm-new-password">Confirm New Password</label>
              <input
                type="password"
                id="confirm-new-password"
                value={confirmNewPassword}
                onChange={e => setConfirmNewPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
              <HiKey /> {loading ? 'Resetting Password...' : 'Reset Password'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center', fontSize: '0.9rem' }}>
          <button
            type="button"
            onClick={() => setIsResetMode(!isResetMode)}
            style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isResetMode ? '← Back to Sign In' : 'Forgot / Reset Password?'}
          </button>
          {!isResetMode && (
            <Link to="/seller/register" style={{ color: 'var(--accent)', textDecoration: 'none' }}>
              Don't have an account? Register
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
