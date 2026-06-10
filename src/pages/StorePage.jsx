import { useState, useEffect } from 'react';
import { HiSearch, HiShoppingCart, HiX } from 'react-icons/hi';
import { SiTelegram } from 'react-icons/si';
import { productAPI, categoryAPI } from '../api';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import CartSidebar from '../components/CartSidebar';
import CategoryModal from '../components/CategoryModal';
import ProductModal from '../components/ProductModal';
import Footer from '../components/Footer';

export default function StorePage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    Promise.all([
      categoryAPI.getAll().then(r => setCategories(r.data)).catch(() => {}),
      productAPI.getAll({}).then(r => setProducts(r.data)).catch(() => {})
    ]).finally(() => setLoading(false));
  }, []);

  const filteredProducts = products.filter(product => {
    if (search && !product.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (minPrice && product.price < Number(minPrice)) return false;
    if (maxPrice && product.price > Number(maxPrice)) return false;
    return true;
  });

  const productsByCategory = categories.reduce((acc, cat) => {
    acc[cat.name] = filteredProducts.filter(p => p.category === cat.name);
    return acc;
  }, {});

  return (
    <>
      <Navbar onOpenCategories={() => setIsCategoryModalOpen(true)} />
      <CartSidebar />

      <section className="hero">
        <div className="container">
          <h1>Discover Your <span>Aura</span></h1>
          <p>Premium streetwear and lifestyle essentials curated for those who dare to stand out.</p>
          <div className="hero-actions">
            <a href="#products" className="btn btn-primary">Shop Now</a>
            <a href="https://t.me/aurashop369" className="btn btn-secondary" target="_blank" rel="noreferrer">
              <SiTelegram /> Contact Us
            </a>
          </div>
        </div>
      </section>

      <section id="products" style={{ padding: '40px 0 80px' }}>
        <div className="container">
          <div className="section-header" style={{ marginBottom: '24px' }}>
            <h2 className="section-title">Our <span>Collection</span></h2>
            
            <div className="search-box">
              <HiSearch className="search-icon" />
              <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} id="search-input" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '32px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Max Price:</span>
            <input type="range" min="0" max="500" step="1" value={maxPrice || 500} onChange={e => setMaxPrice(e.target.value === '500' ? '' : e.target.value)} style={{ width: '140px', accentColor: 'var(--accent)' }} />
            <span style={{ fontWeight: 600, color: 'var(--accent)', minWidth: '60px' }}>${maxPrice ? Number(maxPrice).toFixed(0) : 'Any'}</span>
            {maxPrice && <button onClick={() => setMaxPrice('')} style={{ background: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'underline', cursor: 'pointer' }}>Clear</button>}
          </div>

          {loading ? (
            <div className="page-loader"><div className="spinner" /></div>
          ) : (
            categories.map(cat => {
              const catProducts = productsByCategory[cat.name] || [];
              if (catProducts.length === 0) return null;
              return (
                <div key={cat.name} style={{ marginBottom: '48px' }}>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
                    {cat.name}
                  </h3>
                  <div className="products-grid">
                    {catProducts.map(product => {
                      const img = (product.images && product.images.length > 0 ? product.images[product.imagePrimaryIndex || 0] : product.image) || '';
                      return (
                        <div className="product-card" key={product._id} onClick={() => setSelectedProduct(product)}>
                          <div className="product-card-image">
                            {img ? (
                              <img src={img} alt={product.name} />
                            ) : (
                              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', background: 'var(--bg-secondary)' }}>📦</div>
                            )}
                            {product.featured && <span className="badge">Featured</span>}
                            {!product.inStock && <span className="badge out-of-stock">Sold Out</span>}
                          </div>
                          <div className="product-card-body">
                            <div className="product-card-category">{product.category}</div>
                            <h3 className="product-card-name">{product.name}</h3>
                            <p className="product-card-desc">{product.description}</p>
                            <div className="product-card-footer">
                              <span className="product-card-price"><span className="currency">$</span>{product.price.toFixed(2)}</span>
                              {product.inStock && (
                                <button className="btn-icon" onClick={e => { e.stopPropagation(); addItem(product); }} title="Add to cart">
                                  <HiShoppingCart size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          {!loading && filteredProducts.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '1.2rem' }}>No products found</p>
            </div>
          )}
        </div>
      </section>

      {isCategoryModalOpen && (
        <CategoryModal categories={categories} onClose={() => setIsCategoryModalOpen(false)} onSelect={() => {}} />
      )}
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onSelectSimilar={setSelectedProduct} />
      <Footer />
    </>
  );
}
