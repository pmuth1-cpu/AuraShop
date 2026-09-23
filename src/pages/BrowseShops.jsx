import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function BrowseShops() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    API.get('/shops')
      .then((res) => setShops(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredShops = shops.filter(shop => shop.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <>
      <Navbar />
      <section style={{ padding: '40px 20px', minHeight: '80vh' }}>
        <div className="container">
          <div style={{ marginBottom: '40px', textAlign: 'center' }}>
            <h1 style={{ marginBottom: '20px' }}>Browse Shops</h1>
            <input 
              type="text" 
              placeholder="Search shops by name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ padding: '12px 20px', width: '100%', maxWidth: '400px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
            />
          </div>

          {loading ? (
            <div className="spinner" style={{ margin: '0 auto' }}></div>
          ) : (
            <div className="products-grid">
              {filteredShops.map(shop => (
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
              {filteredShops.length === 0 && (
                <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)' }}>No shops found.</p>
              )}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}
