import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HiUserAdd, HiArrowLeft, HiEye, HiEyeOff, HiShoppingBag, HiCheckCircle } from 'react-icons/hi';
import { useSeller } from '../context/SellerAuthContext';
import toast from 'react-hot-toast';

export default function SellerRegister() {
  const [form, setForm] = useState({
    displayName: '',
    shopName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register } = useSeller();
  const navigate = useNavigate();

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.id]: e.target.value }));

  const slugPreview = form.shopName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.displayName.trim()) {
      return toast.error('Please enter your name');
    }
    if (!form.email.trim() && !form.phone.trim()) {
      return toast.error('Please enter at least an email or mobile phone');
    }
    if (form.password.length < 4) {
      return toast.error('Password must be at least 4 characters');
    }
    if (form.password !== form.confirmPassword) {
      return toast.error('Passwords do not match');
    }

    setLoading(true);
    try {
      const data = await register({
        displayName: form.displayName.trim(),
        shopName: form.shopName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
      });

      toast.success(`Welcome to Aura Shop, ${data.user?.displayName || 'Seller'}!`);

      if (data?.shop) {
        navigate('/dashboard');
      } else {
        navigate('/seller/create-shop');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Registration failed');
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

      <div className="login-card glass" style={{ maxWidth: '460px', width: '100%' }}>
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
            <HiShoppingBag />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Open Your Shop</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '6px' }}>
            Register your seller account and start managing your store
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Your Name */}
          <div className="form-group">
            <label htmlFor="displayName">Your Full Name</label>
            <input
              type="text"
              id="displayName"
              value={form.displayName}
              onChange={handleChange}
              placeholder="e.g. John Doe or Sokha"
              autoFocus
              required
            />
          </div>

          {/* Shop Name */}
          <div className="form-group">
            <label htmlFor="shopName">Shop Name (optional)</label>
            <input
              type="text"
              id="shopName"
              value={form.shopName}
              onChange={handleChange}
              placeholder="e.g. Sokha Boutique"
            />
            {slugPreview && (
              <small style={{ color: 'var(--accent-light, #38bdf8)', fontSize: '0.82rem', marginTop: '4px', display: 'block' }}>
                Your shop URL will be: <code>/shop/{slugPreview}</code>
              </small>
            )}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={form.email}
              onChange={handleChange}
              placeholder="e.g. seller@aurashop.com"
            />
          </div>

          {/* Phone */}
          <div className="form-group">
            <label htmlFor="phone">Mobile Phone</label>
            <input
              type="tel"
              id="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="e.g. 012 345 678"
            />
          </div>

          {/* Password */}
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
              value={form.password}
              onChange={handleChange}
              placeholder="At least 4 characters"
              required
            />
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px', padding: '12px', fontSize: '0.98rem' }}
            disabled={loading}
          >
            <HiCheckCircle /> {loading ? 'Creating Your Account...' : 'Register & Open Shop'}
          </button>
        </form>

        <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-glass)', textAlign: 'center', fontSize: '0.88rem' }}>
          <span style={{ color: 'var(--text-secondary)' }}>Already have a shop? </span>
          <Link to="/seller/login" style={{ color: 'var(--accent-light, #38bdf8)', fontWeight: 600, textDecoration: 'none' }}>
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
