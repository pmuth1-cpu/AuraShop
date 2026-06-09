import { useState, useEffect, useRef } from 'react';
import { HiSearch, HiShoppingCart, HiX, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
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
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollRef = useRef(null);
  const { addItem } = useCart();

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };

  const scroll = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.7;
    el.scrollBy({ left: dir === 'left' ? -amount : amount, behavior: 'smooth' });
  };

  useEffect(() => {
    categoryAPI.getAll().then(r => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (activeCategory !== 'all') params.category = activeCategory;
    if (search) params.search = search;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    productAPI.getAll(params)
      .then(r => setProducts(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeCategory, search, minPrice, maxPrice]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener('scroll', updateScrollButtons, { passive: true });
    const ro = new ResizeObserver(updateScrollButtons);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateScrollButtons);
      ro.disconnect();
    };
  }, [loading, products]);

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
          <div className="section-header">
            <h2 className="section-title">Our <span>Collection</span></h2>
            <div className="search-box">
              <HiSearch className="search-icon" />
              <input type="text" placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} id="search-input" />
            </div>
          </div>

          <div className="filter-bar" style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '32px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Price:</span>
              <input type="number" placeholder="Min" value={minPrice} onChange={e => setMinPrice(e.target.value)} style={{ width: '80px', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
              <span style={{ color: 'var(--text-muted)' }}>-</span>
              <input type="number" placeholder="Max" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} style={{ width: '80px', padding: '6px 12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-glass)', background: 'var(--bg-card)', color: 'var(--text-primary)' }} />
            </div>

            {activeCategory !== 'all' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 16px', background: 'rgba(139,92,246,0.12)', color: 'var(--accent)', borderRadius: '50px', fontSize: '0.9rem', fontWeight: 600 }}>
                Category: {activeCategory}
                <button onClick={() => setActiveCategory('all')} style={{ background: 'none', color: 'inherit', display: 'flex', alignItems: 'center' }}><HiX size={14}/></button>
              </div>
            )}
          </div>

          {loading ? (
            <div className="page-loader"><div className="spinner" /></div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '1.2rem' }}>No products found</p>
            </div>
          ) : (
            <>
              <div style={{ position: 'relative' }}>
                {canScrollLeft && (
                  <button
                    onClick={() => scroll('left')}
                    style={{
                      position: 'absolute', left: '4px', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
                      width: '38px', height: '38px', borderRadius: '50%', background: 'var(--bg-card)',
                      border: '1px solid var(--border-glass)', color: 'var(--text-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: 'var(--shadow-md)', cursor: 'pointer', transition: 'var(--transition)'
                    }}
                    aria-label="Scroll left"
                  >
                    <HiChevronLeft size={20} />
                  </button>
                )}
                {canScrollRight && (
                  <button
                    onClick={() => scroll('right')}
                    style={{
                      position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', zIndex: 10,
                      width: '38px', height: '38px', borderRadius: '50%', background: 'var(--bg-card)',
                      border: '1px solid var(--border-glass)', color: 'var(--text-primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: 'var(--shadow-md)', cursor: 'pointer', transition: 'var(--transition)'
                    }}
                    aria-label="Scroll right"
                  >
                    <HiChevronRight size={20} />
                  </button>
                )}
                <div className="products-scroll" ref={scrollRef}>
                  {products.map(product => (
                    <div className="product-card" key={product._id} onClick={() => setSelectedProduct(product)}>
                      <div className="product-card-image">
                        {product.image ? (
                          <img src={product.image} alt={product.name} />
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
                  ))}
                </div>
                <div className="products-grid">
                  {products.map(product => (
                    <div className="product-card" key={product._id} onClick={() => setSelectedProduct(product)}>
                      <div className="product-card-image">
                        {product.image ? (
                          <img src={product.image} alt={product.name} />
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
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {isCategoryModalOpen && (
        <CategoryModal categories={categories} onClose={() => setIsCategoryModalOpen(false)} onSelect={setActiveCategory} />
      )}
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onSelectSimilar={setSelectedProduct} />
      <Footer />
    </>
  );
}
