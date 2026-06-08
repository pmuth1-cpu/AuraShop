import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HiLockClosed, HiArrowLeft } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(username, password);
      toast.success('Welcome back, Admin!');
      navigate('/manage-aura-369');
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
      <div className="login-card glass">
        <h1>Admin Portal</h1>
        <p>Sign in to manage your store</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input type="text" id="username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter username" required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading} id="login-submit">
            <HiLockClosed /> {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
