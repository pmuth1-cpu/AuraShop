import { useState, useEffect } from 'react';
import API from '../../api';
import AdminSidebar from '../../components/AdminSidebar';
import toast from 'react-hot-toast';

export default function PlatformRevenue() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = () => {
    API.get('/payments')
      .then(res => setPayments(res.data))
      .catch(err => toast.error('Failed to load payments'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handleVerify = async (id) => {
    try {
      await API.post(`/payments/${id}/verify`);
      toast.success('Payment verified');
      fetchPayments();
    } catch (err) {
      toast.error('Failed to verify payment');
    }
  };

  const totalRevenue = payments.filter(p => p.status === 'verified').reduce((sum, p) => sum + p.amount, 0);
  const pendingCount = payments.filter(p => p.status === 'pending').length;

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <h1>Platform Revenue</h1>
        </div>
        
        {loading ? <div className="spinner" /> : (
          <>
            <div className="stats-grid" style={{ marginBottom: '30px' }}>
              <div className="stat-card">
                <div className="stat-label">Total Revenue</div>
                <div className="stat-value" style={{ color: 'var(--success)' }}>${totalRevenue.toFixed(2)}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Pending Verifications</div>
                <div className="stat-value" style={{ color: 'var(--warning)' }}>{pendingCount}</div>
              </div>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Shop</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map(payment => (
                    <tr key={payment._id}>
                      <td>{payment.shopName}</td>
                      <td>${payment.amount.toFixed(2)}</td>
                      <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span style={{ 
                          color: payment.status === 'verified' ? 'var(--success)' : 'var(--warning)',
                          fontWeight: 600,
                          textTransform: 'capitalize'
                        }}>
                          {payment.status}
                        </span>
                      </td>
                      <td>
                        {payment.status === 'pending' && (
                          <button className="btn btn-primary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => handleVerify(payment._id)}>
                            Verify
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {payments.length === 0 && <tr><td colSpan="5" style={{ textAlign: 'center' }}>No payments found</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
