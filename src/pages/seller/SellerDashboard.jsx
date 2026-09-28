import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiCollection,
  HiCurrencyDollar,
  HiCheckCircle,
  HiExclamationCircle,
  HiPlus,
  HiCog,
  HiCreditCard,
  HiShoppingBag,
  HiExternalLink,
} from 'react-icons/hi';
import API from '../../api';
import { useSeller } from '../../context/SellerAuthContext';
import SellerSidebar from '../../components/SellerSidebar';

export default function SellerDashboard() {
  const { shop } = useSeller();
  const [stats, setStats] = useState({
    productCount: 0,
    inventoryValue: 0,
    inStockCount: 0,
    outOfStockCount: 0,
  });
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const token = localStorage.getItem('seller_token');
        const [dashRes, ordersRes] = await Promise.all([
          API.get('/seller/dashboard', { headers: { Authorization: `Bearer ${token}` } }),
          API.get('/orders/seller/my-orders?limit=1', { headers: { Authorization: `Bearer ${token}` } }).catch(() => ({ data: { total: 0 } })),
        ]);
        setStats(dashRes.data?.stats || {});
        setOrderCount(ordersRes.data?.total || 0);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const statCards = [
    { icon: <HiShoppingBag />, value: orderCount, label: 'Customer Orders', color: '#ec4899', link: '/dashboard/orders' },
    { icon: <HiCollection />, value: stats.productCount || 0, label: 'Total Products', color: '#8b5cf6', link: '/dashboard/products' },
    { icon: <HiCurrencyDollar />, value: `$${(stats.inventoryValue || 0).toFixed(2)}`, label: 'Inventory Value', color: '#06b6d4' },
    { icon: <HiCheckCircle />, value: stats.inStockCount || 0, label: 'In Stock', color: '#10b981' },
    { icon: <HiExclamationCircle />, value: stats.outOfStockCount || 0, label: 'Out of Stock', color: '#ef4444' },
  ];

  return (
    <div className="admin-layout">
      <SellerSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <div>
            <h1>Seller Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Welcome back to your shop manager
            </p>
          </div>
        </div>

        {shop?.status === 'payment_overdue' && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid var(--danger, #ef4444)',
            padding: '16px 20px',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '24px',
            color: 'var(--text-primary)',
          }}>
            <strong style={{ color: 'var(--danger, #ef4444)' }}>Subscription Overdue:</strong> Your subscription has expired.
            Please <Link to="/dashboard/subscription" style={{ color: 'var(--accent-light)', textDecoration: 'underline', marginLeft: '6px' }}>pay now via KHQR</Link> to keep your shop active.
          </div>
        )}

        {shop?.status === 'pending_approval' && (
          <div style={{
            background: 'rgba(245,158,11,0.1)',
            border: '1px solid #f59e0b',
            padding: '16px 20px',
            borderRadius: 'var(--radius-lg)',
            marginBottom: '24px',
            color: 'var(--text-primary)',
          }}>
            <strong style={{ color: '#f59e0b' }}>Pending Admin Approval:</strong> Your shop is currently being reviewed by administrators. You can still set up your products and logo while waiting.
          </div>
        )}

        {/* Shop Live URL Card */}
        {shop?.slug && (
          <div className="stat-card" style={{
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            padding: '16px 20px',
          }}>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                Your Shop URL
              </span>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '2px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{typeof window !== 'undefined' ? window.location.host : 'aura-shop-six.vercel.app'}/shop/</span>
                <span style={{ color: 'var(--accent-light)' }}>{shop.slug}</span>
              </div>
            </div>
            <Link
              to={`/shop/${shop.slug}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              Visit Storefront <HiExternalLink />
            </Link>
          </div>
        )}

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap' }}>
          <Link to="/dashboard/orders" className="btn btn-primary">
            <HiShoppingBag /> Orders {orderCount > 0 && `(${orderCount})`}
          </Link>
          <Link to="/dashboard/products/new" className="btn btn-secondary">
            <HiPlus /> Add Product
          </Link>
          <Link to="/dashboard/settings" className="btn btn-secondary">
            <HiCog /> Shop Branding
          </Link>
          <Link to="/dashboard/subscription" className="btn btn-secondary">
            <HiCreditCard /> Subscription
          </Link>
        </div>

        {/* Stats Grid */}
        {loading ? (
          <div className="spinner" />
        ) : (
          <div className="stats-grid">
            {statCards.map((s, i) => (
              <div
                className="stat-card"
                key={i}
                style={{ cursor: s.link ? 'pointer' : 'default' }}
                onClick={() => {
                  if (s.link) window.location.href = s.link;
                }}
              >
                <div className="stat-icon" style={{ background: `${s.color}20`, color: s.color }}>
                  {s.icon}
                </div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
