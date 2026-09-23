import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function PlatformHome() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get('/shops')
      .then((res) => setShops(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Navbar />
      <section style={{
        textAlign: 'center',
        padding: '80px 20px 60px',
        background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(6,182,212,0.1))',
        borderBottom: '1px solid var(--border-glass)',
      }}>
        <h1 style={{ fontSize: '3rem', marginBottom: '20px' }}>Welcome to Aura</h1>
        <p style={{ fontSize: '1.2rem', marginBottom: '40px', color: 'var(--text-secondary)' }}>
          Create your own shop and start selling today
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <Link to="/seller/register" className="btn btn-primary">Open Your Shop</Link>
          <Link to="/shops" className="btn btn-secondary">Browse Shops</Link>
        </div>
      </section>

      <section style={{ padding: '60px 20px' }}>
        <div className="container">
          <h2 style={{ marginBottom: '30px', textAlign: 'center' }}>Featured Shops</h2>
          {loading ? (
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          ) : (
            <div className="products-grid">
              {shops.slice(0, 8).map(shop => (
                <Link to={`/shop/${shop.slug}`} key={shop._id} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div className="product-card" style={{ padding: '20px', textAlign: 'center' }}>
                    <div style={{
                      width: '80px', height: '80px', margin: '0 auto 15px',
                      borderRadius: 'var(--radius-lg)', background: 'var(--bg-secondary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
                    }}>
                      {shop.logo ? <img src={shop.logo} alt={shop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '2rem' }}>🏪</span>}
                    </div>
                    <h3>{shop.name}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '10px' }}>{shop.description?.substring(0, 60)}...</p>
                    <div style={{ marginTop: '15px', fontSize: '0.8rem', color: 'var(--text-primary)' }}>
                      {shop.productCount || 0} Products
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}
