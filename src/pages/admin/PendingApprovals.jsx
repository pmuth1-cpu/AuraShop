import { useState, useEffect } from 'react';
import API from '../../api';
import AdminSidebar from '../../components/AdminSidebar';
import toast from 'react-hot-toast';

export default function PendingApprovals() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = () => {
    API.get('/admin/shops/pending')
      .then(res => setShops(res.data))
      .catch(err => toast.error('Failed to load pending shops'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id) => {
    try {
      await API.put(`/admin/shops/${id}/approve`);
      toast.success('Shop approved successfully');
      fetchPending();
    } catch (err) {
      toast.error('Failed to approve shop');
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <h1>Pending Approvals</h1>
        </div>
        {loading ? <div className="spinner" /> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Shop Name</th>
                  <th>Seller Info</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {shops.map(shop => (
                  <tr key={shop._id}>
                    <td><strong>{shop.name}</strong></td>
                    <td>
                      <div>{shop.sellerEmail}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{shop.sellerPhone}</div>
                    </td>
                    <td>{new Date(shop.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-primary" style={{ padding: '6px 16px' }} onClick={() => handleApprove(shop._id)}>
                        Approve
                      </button>
                    </td>
                  </tr>
                ))}
                {shops.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center' }}>No pending approvals</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
