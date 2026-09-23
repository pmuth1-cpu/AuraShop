import { useState, useEffect } from 'react';
import { orderAPI } from '../../api';
import SellerSidebar from '../../components/SellerSidebar';
import toast from 'react-hot-toast';
import { HiCheck, HiX, HiTruck, HiSearch, HiRefresh, HiCheckCircle } from 'react-icons/hi';
import { SiTelegram } from 'react-icons/si';

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [verifyingId, setVerifyingId] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await orderAPI.getSellerOrders({
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setOrders(data.orders || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await orderAPI.updateStatus(orderId, { orderStatus: newStatus });
      toast.success(`Order marked as ${newStatus}`);
      fetchOrders();
    } catch {
      toast.error('Failed to update order status');
    }
  };

  const handleVerifyBakong = async (orderId) => {
    setVerifyingId(orderId);
    try {
      const res = await orderAPI.verifyBakong(orderId);
      if (res.data?.verified) {
        toast.success('Order payment confirmed via Bakong! 🎉');
        fetchOrders();
      } else {
        toast(res.data?.message || 'Payment not detected yet in Bakong network.', { icon: '⏳' });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Verification check failed');
    } finally {
      setVerifyingId(null);
    }
  };

  const filteredOrders = orders.filter(o => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      o.orderNumber?.toLowerCase().includes(q) ||
      o.buyer?.phone?.toLowerCase().includes(q) ||
      o.buyer?.telegram?.toLowerCase().includes(q) ||
      o.items?.some(i => i.name?.toLowerCase().includes(q))
    );
  });

  return (
    <div className="admin-layout">
      <SellerSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <div>
            <h1>Customer Orders</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Manage incoming customer orders and verify payments
            </p>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchOrders}>
            <HiRefresh /> Refresh
          </button>
        </div>

        {/* Filters and search */}
        <div style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          marginBottom: '24px',
        }}>
          <div className="filter-bar" style={{ margin: 0 }}>
            {['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(st => (
              <button
                key={st}
                className={`filter-chip ${statusFilter === st ? 'active' : ''}`}
                onClick={() => setStatusFilter(st)}
              >
                {st.charAt(0).toUpperCase() + st.slice(1)}
              </button>
            ))}
          </div>

          <div className="search-box" style={{ maxWidth: '280px' }}>
            <HiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by order#, phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="stat-card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <h3>No orders found</h3>
            <p style={{ marginTop: '8px' }}>When buyers place orders in your storefront, they will show up here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {filteredOrders.map(order => (
              <div
                key={order._id}
                className="stat-card"
                style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}
              >
                {/* Header row */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  flexWrap: 'wrap',
                  gap: '12px',
                  borderBottom: '1px solid var(--border-glass)',
                  paddingBottom: '12px',
                }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                        {order.orderNumber}
                      </span>
                      <span className={`badge ${
                        order.orderStatus === 'delivered' ? 'in-stock' :
                        order.orderStatus === 'cancelled' ? 'out-of-stock' : ''
                      }`} style={{ textTransform: 'capitalize' }}>
                        {order.orderStatus}
                      </span>
                      <span className={`badge ${order.paymentStatus === 'paid' ? 'in-stock' : 'out-of-stock'}`}>
                        {order.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Placed on {new Date(order.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      ${order.grandTotal.toFixed(2)}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {order.paymentMethod === 'khqr' ? 'Bakong KHQR' : order.paymentMethod === 'cod' ? 'Cash On Delivery' : 'Telegram'}
                    </div>
                  </div>
                </div>

                {/* Items and Customer details */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '20px',
                }}>
                  {/* Items */}
                  <div>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Items ({order.items.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {order.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem' }}>
                          {item.image ? (
                            <img src={item.image} alt={item.name} style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: '36px', height: '36px', borderRadius: '6px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>📦</div>
                          )}
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600 }}>{item.name} {item.variantInfo && `(${item.variantInfo})`}</div>
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                              {item.quantity} × ${item.price.toFixed(2)}
                            </div>
                          </div>
                          <div style={{ fontWeight: 600 }}>
                            ${(item.quantity * item.price).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                    {order.transportCost > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginTop: '8px', color: 'var(--text-muted)' }}>
                        <span>Transport Cost:</span>
                        <span>${order.transportCost.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {/* Customer details */}
                  <div style={{ background: 'var(--bg-secondary)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
                    <h4 style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                      Buyer Info
                    </h4>
                    <div style={{ fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {order.buyer?.phone && (
                        <div>📞 <strong>Phone:</strong> <a href={`tel:${order.buyer.phone}`}>{order.buyer.phone}</a></div>
                      )}
                      {order.buyer?.telegram && (
                        <div>
                          <SiTelegram style={{ verticalAlign: 'middle', marginRight: '4px', color: '#0088cc' }} />
                          <strong>Telegram:</strong> <a href={`https://t.me/${order.buyer.telegram.replace('@', '')}`} target="_blank" rel="noreferrer">@{order.buyer.telegram.replace('@', '')}</a>
                        </div>
                      )}
                      <div>
                        📍 <strong>Delivery:</strong> {[order.buyer?.village, order.buyer?.commune, order.buyer?.district, order.buyer?.province].filter(Boolean).join(', ') || 'No address provided'}
                      </div>
                      {order.notes && (
                        <div style={{ marginTop: '4px', fontStyle: 'italic', color: 'var(--text-muted)' }}>
                          Note: "{order.notes}"
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions row */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  borderTop: '1px solid var(--border-glass)',
                  paddingTop: '12px',
                }}>
                  {/* Bakong KHQR verification button if pending */}
                  {order.paymentMethod === 'khqr' && order.paymentStatus === 'pending' && (
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleVerifyBakong(order._id)}
                      disabled={verifyingId === order._id}
                    >
                      <HiRefresh className={verifyingId === order._id ? 'animate-spin' : ''} />
                      {verifyingId === order._id ? 'Checking Bakong...' : 'Verify Bakong Payment'}
                    </button>
                  )}

                  {order.paymentStatus === 'paid' && (
                    <span style={{ fontSize: '0.85rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <HiCheckCircle size={16} /> Paid via {order.paymentMethod.toUpperCase()}
                    </span>
                  )}

                  <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                    {order.orderStatus === 'pending' && (
                      <button className="btn btn-sm btn-primary" onClick={() => handleUpdateStatus(order._id, 'confirmed')}>
                        <HiCheck /> Confirm
                      </button>
                    )}
                    {order.orderStatus === 'confirmed' && (
                      <button className="btn btn-sm btn-primary" onClick={() => handleUpdateStatus(order._id, 'shipped')}>
                        <HiTruck /> Mark Shipped
                      </button>
                    )}
                    {order.orderStatus === 'shipped' && (
                      <button className="btn btn-sm btn-primary" onClick={() => handleUpdateStatus(order._id, 'delivered')}>
                        <HiCheckCircle /> Mark Delivered
                      </button>
                    )}
                    {order.orderStatus !== 'cancelled' && order.orderStatus !== 'delivered' && (
                      <button className="btn btn-sm btn-danger" onClick={() => handleUpdateStatus(order._id, 'cancelled')}>
                        <HiX /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
