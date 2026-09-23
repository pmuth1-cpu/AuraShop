import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HiUserAdd, HiArrowLeft } from 'react-icons/hi';
import API from '../api';
import toast from 'react-hot-toast';

export default function SellerRegister() {
  const [form, setForm] = useState({
    email: '', password: '', confirmPassword: '', displayName: '', phone: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.id]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }
    setLoading(true);
    try {
      await API.post('/auth/register', { ...form, role: 'seller' });
      toast.success('Registration successful! Your account is pending admin approval.');
      navigate('/seller/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
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
        <h1>Seller Registration</h1>
        <p>Create an account to open your shop</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" value={form.email} onChange={handleChange} placeholder="Email address" required />
          </div>
          <div className="form-group">
            <label htmlFor="displayName">Display Name</label>
            <input type="text" id="displayName" value={form.displayName} onChange={handleChange} placeholder="Your name" required />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input type="text" id="phone" value={form.phone} onChange={handleChange} placeholder="Phone number" required />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" value={form.password} onChange={handleChange} placeholder="Password" required />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input type="password" id="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Confirm password" required />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '8px' }} disabled={loading}>
            <HiUserAdd /> {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <div style={{ marginTop: '16px', textAlign: 'center' }}>
          <Link to="/seller/login" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Already have an account? Sign in</Link>
        </div>
      </div>
    </div>
  );
}
