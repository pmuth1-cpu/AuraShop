import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiCollection, HiCurrencyDollar, HiCheckCircle, HiExclamationCircle, HiUserGroup, HiClipboardCheck } from 'react-icons/hi';
import { productAPI } from '../api';
import API from '../api';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminDashboard() {
  const [statsData, setStatsData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get('/admin/dashboard').catch(() => ({ data: { totalSellers: 0, activeShops: 0, pendingApprovals: 0, monthlyRevenue: 0 } })),
      productAPI.getAll().catch(() => ({ data: [] }))
    ]).then(([dashboardRes, productsRes]) => {
      setStatsData(dashboardRes.data);
      setProducts(productsRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const totalProducts = products.length;
  const inStock = products.filter(p => p.inStock).length;

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <h1>Dashboard</h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Link to="/manage-aura-369/sellers" className="btn btn-secondary">Manage Sellers</Link>
            <Link to="/manage-aura-369/approvals" className="btn btn-primary">Pending Approvals</Link>
          </div>
        </div>
        {loading || !statsData ? <div className="spinner" /> : (
          <>
            <div className="stats-grid" style={{ marginBottom: '32px' }}>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#8b5cf620', color: '#8b5cf6' }}><HiUserGroup /></div>
                <div className="stat-value">{statsData.totalSellers}</div>
                <div className="stat-label">Total Sellers</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#10b98120', color: '#10b981' }}><HiCheckCircle /></div>
                <div className="stat-value">{statsData.activeShops}</div>
                <div className="stat-label">Active Shops</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#f59e0b20', color: '#f59e0b' }}><HiClipboardCheck /></div>
                <div className="stat-value">{statsData.pendingApprovals}</div>
                <div className="stat-label">Pending Approvals</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon" style={{ background: '#06b6d420', color: '#06b6d4' }}><HiCurrencyDollar /></div>
                <div className="stat-value">${statsData.monthlyRevenue?.toFixed(2) || '0.00'}</div>
                <div className="stat-label">Monthly Revenue</div>
              </div>
            </div>
            
            <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px' }}>Platform Products Overview</h2>
            <div className="stats-grid" style={{ marginBottom: '32px', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              <div className="stat-card">
                <div className="stat-label">Total Products</div>
                <div className="stat-value">{totalProducts}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">In Stock</div>
                <div className="stat-value" style={{ color: 'var(--success)' }}>{inStock}</div>
              </div>
            </div>

            <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: '16px' }}>Recent Products</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th></tr></thead>
                <tbody>
                  {products.slice(0, 5).map(p => (
                    <tr key={p._id}>
                      <td><div className="product-cell"><div className="product-thumb">{p.image && <img src={p.image} alt="" />}</div><span>{p.name}</span></div></td>
                      <td>{p.category}</td>
                      <td>${p.price.toFixed(2)}</td>
                      <td>{p.stock}</td>
                      <td><span className={`stock-badge ${p.inStock ? 'in' : 'out'}`}>{p.inStock ? 'In Stock' : 'Out'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
