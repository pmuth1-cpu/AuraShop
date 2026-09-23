import { useState, useEffect } from 'react';
import API from '../../api';
import AdminSidebar from '../../components/AdminSidebar';
import toast from 'react-hot-toast';

export default function ManageSellers() {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchSellers = () => {
    API.get('/admin/sellers')
      .then(res => setSellers(res.data))
      .catch(err => toast.error('Failed to load sellers'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchSellers();
  }, []);

  const handleAction = async (id, action) => {
    try {
      await API.put(`/admin/shops/${id}/${action}`);
      toast.success(`Shop ${action}d successfully`);
      fetchSellers();
    } catch (err) {
      toast.error(`Failed to ${action} shop`);
    }
  };

  const filtered = sellers.filter(s => s.shopName?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase()));

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'var(--success)';
      case 'payment_overdue': return 'var(--warning)';
      case 'pending_approval': return 'var(--accent)';
      case 'suspended': return 'var(--danger)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <h1>Manage Sellers</h1>
          <input 
            type="text" 
            placeholder="Search sellers..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: '8px 16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
          />
        </div>
        {loading ? <div className="spinner" /> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Shop Name</th>
                  <th>Seller Email</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s._id}>
                    <td>{s.shopName || 'N/A'}</td>
                    <td>{s.email}</td>
                    <td>
                      <span style={{ color: getStatusColor(s.shopStatus), fontWeight: 600 }}>
                        {s.shopStatus?.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {s.shopStatus === 'pending_approval' && (
                          <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => handleAction(s._id, 'approve')}>Approve</button>
                        )}
                        {(s.shopStatus === 'active' || s.shopStatus === 'payment_overdue') && (
                          <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem', color: 'var(--danger)' }} onClick={() => handleAction(s._id, 'suspend')}>Suspend</button>
                        )}
                        {s.shopStatus === 'suspended' && (
                          <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => handleAction(s._id, 'reactivate')}>Reactivate</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center' }}>No sellers found</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
