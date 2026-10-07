import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSeller } from '../context/SellerAuthContext';
import SellerSidebar from '../components/SellerSidebar';
import API from '../api';
import toast from 'react-hot-toast';

export default function CreateShop() {
  const [form, setForm] = useState({ name: '', description: '', telegramUsername: '', contactPhone: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { refreshShop, setShop } = useSeller();

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.id]: e.target.value }));
  const slugPreview = form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('seller_token');
      const { data } = await API.post('/shops', form, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Shop created! Welcome to your dashboard.');
      if (data?.shop && setShop) {
        setShop(data.shop);
      }
      await refreshShop();
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create shop');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-layout">
      <SellerSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <h1>Create Your Shop</h1>
        </div>
        <form className="admin-form" onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
          <div className="form-group">
            <label htmlFor="name">Shop Name</label>
            <input type="text" id="name" value={form.name} onChange={handleChange} placeholder="My Awesome Shop" required />
            {slugPreview && <small style={{ color: 'var(--text-muted)' }}>Shop URL will be: /shop/{slugPreview}</small>}
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea id="description" value={form.description} onChange={handleChange} placeholder="What do you sell?" required />
          </div>
          <div className="form-group">
            <label htmlFor="telegramUsername">Telegram or Contact Handle (optional)</label>
            <input type="text" id="telegramUsername" value={form.telegramUsername} onChange={handleChange} placeholder="@username" />
          </div>
          <div className="form-group">
            <label htmlFor="contactPhone">Contact Phone</label>
            <input type="text" id="contactPhone" value={form.contactPhone} onChange={handleChange} placeholder="012345678" required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Shop'}
          </button>
        </form>
      </main>
    </div>
  );
}
