import { useState, useEffect } from 'react';
import { HiCollection, HiCurrencyDollar, HiCheckCircle, HiExclamationCircle } from 'react-icons/hi';
import { productAPI } from '../api';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminDashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productAPI.getAll().then(r => setProducts(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const totalProducts = products.length;
  const totalValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);
  const inStock = products.filter(p => p.inStock).length;
  const outOfStock = products.filter(p => !p.inStock).length;

  const stats = [
    { icon: <HiCollection />, value: totalProducts, label: 'Total Products', color: '#8b5cf6' },
    { icon: <HiCurrencyDollar />, value: `$${totalValue.toFixed(0)}`, label: 'Inventory Value', color: '#06b6d4' },
    { icon: <HiCheckCircle />, value: inStock, label: 'In Stock', color: '#10b981' },
    { icon: <HiExclamationCircle />, value: outOfStock, label: 'Out of Stock', color: '#ef4444' },
  ];

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <h1>Dashboard</h1>
        </div>
        {loading ? <div className="spinner" /> : (
          <>
            <div className="stats-grid">
              {stats.map((s, i) => (
                <div className="stat-card" key={i}>
                  <div className="stat-icon" style={{ background: `${s.color}20`, color: s.color }}>{s.icon}</div>
                  <div className="stat-value">{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
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
