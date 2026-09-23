import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HiLockClosed, HiArrowLeft } from 'react-icons/hi';
import { useSeller } from '../context/SellerAuthContext';
import toast from 'react-hot-toast';

export default function SellerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useSeller();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome to Seller Dashboard');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Login failed');
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
        <h1>Seller Login</h1>
        <p>Sign in to manage your shop</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter email" required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
            <HiLockClosed /> {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <Link to="/seller/register" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Don't have an account? Register</Link>
        </div>
      </div>
    </div>
  );
}
