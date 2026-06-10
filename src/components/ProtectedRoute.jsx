import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading, login } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState('aurashop369');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      setShowLogin(true);
    }
  }, [loading, isAuthenticated]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      toast.error(msg);
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) return <div className="page-loader"><div className="spinner" /></div>;

  if (!isAuthenticated) {
    return (
      <div className="modal-overlay" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div className="login-card glass" onClick={e => e.stopPropagation()}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', marginBottom: '8px', textAlign: 'center' }}>Admin Portal</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '24px' }}>Authentication required</p>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input 
                type="text" 
                id="username" 
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                placeholder="Enter username" 
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
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loginLoading}>
              {loginLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return children;
}