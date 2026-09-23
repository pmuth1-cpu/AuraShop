import { useState, useEffect } from 'react';
import API from '../../api';
import { useSeller } from '../../context/SellerAuthContext';
import SellerSidebar from '../../components/SellerSidebar';
import toast from 'react-hot-toast';

export default function ShopSettings() {
  const { shop, refreshShop } = useSeller();
  const [form, setForm] = useState({ 
    name: '', description: '', telegramUsername: '', contactPhone: '', 
    facebook: '', instagram: '', primaryColor: '#8b5cf6',
    bakongAccount: '', bakongName: '', bakongCity: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (shop) {
      setForm({
        name: shop.name || '', description: shop.description || '',
        telegramUsername: shop.telegramUsername || '', contactPhone: shop.contactPhone || '',
        facebook: shop.socialLinks?.facebook || '', instagram: shop.socialLinks?.instagram || '',
        primaryColor: shop.theme?.primaryColor || '#8b5cf6',
        bakongAccount: shop.bakongSettings?.bakongAccount || '',
        bakongName: shop.bakongSettings?.bakongName || '',
        bakongCity: shop.bakongSettings?.bakongCity || ''
      });
    }
  }, [shop]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const token = localStorage.getItem('seller_token');
      const payload = { ...form, socialLinks: { facebook: form.facebook, instagram: form.instagram, telegram: form.telegramUsername }, theme: { primaryColor: form.primaryColor }, bakongSettings: { bakongAccount: form.bakongAccount, bakongName: form.bakongName, bakongCity: form.bakongCity } };
      await API.put(`/shops/${shop._id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Shop settings updated');
      refreshShop();
    } catch {
      toast.error('Failed to update shop');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('image', file);
    try {
      const token = localStorage.getItem('seller_token');
      await API.post(`/shops/${shop._id}/${type}`, fd, { headers: { Authorization: `Bearer ${token}` } });
      toast.success(`${type} updated`);
      refreshShop();
    } catch {
      toast.error(`Failed to update ${type}`);
    }
  };

  return (
    <div className="admin-layout">
      <SellerSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <h1>Shop Settings</h1>
        </div>
        
        <div style={{ display: 'flex', gap: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div>
            <label>Logo</label>
            <div>
              {shop?.logo && <img src={shop.logo} alt="Logo" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />}
              <input type="file" onChange={e => handleImageUpload(e, 'logo')} />
            </div>
          </div>
          <div>
            <label>Cover Image</label>
            <div>
              {shop?.coverImage && <img src={shop.coverImage} alt="Cover" style={{ width: '200px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />}
              <input type="file" onChange={e => handleImageUpload(e, 'cover')} />
            </div>
          </div>
        </div>

        <form className="admin-form" onSubmit={handleSubmit} style={{ maxWidth: '600px' }}>
          <div className="form-group">
            <label>Shop Name</label>
            <input type="text" name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Telegram Username</label>
            <input type="text" name="telegramUsername" value={form.telegramUsername} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Theme Primary Color</label>
            <input type="color" name="primaryColor" value={form.primaryColor} onChange={handleChange} style={{ width: '100%', height: '40px' }} />
          </div>
          <h3>Bakong KHQR Details</h3>
          <div className="form-group">
            <label>Account (e.g. 012345678@wing)</label>
            <input type="text" name="bakongAccount" value={form.bakongAccount} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Account Name</label>
            <input type="text" name="bakongName" value={form.bakongName} onChange={handleChange} />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </main>
    </div>
  );
}
