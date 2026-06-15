import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { HiSearch, HiShoppingCart } from 'react-icons/hi';
import { SiTelegram } from 'react-icons/si';
import { productAPI, categoryAPI } from '../api';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import CartSidebar from '../components/CartSidebar';
import CategoryModal from '../components/CategoryModal';
import ProductModal from '../components/ProductModal';
import Footer from '../components/Footer';
import DemoOne from '../components/ui/demo';

const PAGE_SIZE = 8;

function ProductCard({ product, index, onSelect, onAdd }) {
  const img = (product.images && product.images.length > 0 ? product.images[product.imagePrimaryIndex || 0] : product.image) || '';
  const categories = product.categories?.length ? product.categories : [product.category].filter(Boolean);

  return (
    <div className="product-card" onClick={() => onSelect(product)}>
      <div className="product-card-image">
        {img ? (
          <img
            src={img}
            alt={product.name}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', background: 'var(--bg-secondary)' }}>📦</div>
        )}
        {product.featured && <span className="badge">Featured</span>}
        {!product.inStock && <span className="badge out-of-stock">Pre-order</span>}
      </div>
      <div className="product-card-body">
        <div className="product-card-category">{categories.join(' / ')}</div>
        <h3 className="product-card-name">{product.name}</h3>
        <p className="product-card-desc">{product.description}</p>
        <div className="product-card-footer">
          <span className="product-card-price"><span className="currency">$</span>{product.price.toFixed(2)}</span>
          <button className="btn-icon" onClick={e => { e.stopPropagation(); onAdd(product); }} title="Add to cart">
            <HiShoppingCart size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function ProductSkeleton() {
  return (
    <div className="product-card skeleton-card">
      <div className="skeleton skeleton-image" />
      <div className="product-card-body skeleton-body">
        <div className="skeleton skeleton-text short" />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text wide" />
        <div className="skeleton skeleton-text short" />
      </div>
    </div>
  );
}

export default function StorePage() {
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [randomize, setRandomize] = useState(false);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const { addItem } = useCart();
  const loaderRef = useRef(null);
  const navigate = useNavigate();

  const categorySlug = (category) => encodeURIComponent(category.replace(/\s+/g, '-'));

  const fetchProducts = useCallback(async (pageNum, reset = false) => {
    if (reset) setLoading(true);
    else setLoadingMore(true);

    const params = {
      limit: PAGE_SIZE,
      skip: (pageNum - 1) * PAGE_SIZE,
    };
    if (selectedCategory) params.category = selectedCategory;
    if (randomize) params.random = 'true';
    if (search.trim()) params.search = search.trim();
    if (maxPrice.trim()) params.maxPrice = maxPrice;

    try {
      const res = await productAPI.getAll(params);
      const data = res.data || [];
      setProducts(prev => reset ? data : [...prev, ...data]);
      setHasMore(data.length === PAGE_SIZE);
      setPage(pageNum);
    } catch {
      if (reset) setProducts([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, maxPrice, selectedCategory, randomize]);

  useEffect(() => {
    setProducts([]);
    setPage(1);
    fetchProducts(1, true);
  }, [search, maxPrice, selectedCategory, randomize, fetchProducts]);

  useEffect(() => {
    if (!loaderRef.current || !hasMore || loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchProducts(page + 1);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, page, fetchProducts]);

  useEffect(() => {
    const productCategories = [...new Set(products.flatMap(product => product.categories?.length ? product.categories : [product.category]).filter(Boolean))];
    if (productCategories.length === 0) return;

    setCategories(prev => {
      const existing = new Map(prev.map(category => [category.name, category]));
      productCategories.forEach(name => {
        if (!existing.has(name)) existing.set(name, { _id: name, name, image: '' });
      });
      return [...existing.values()];
    });
  }, [products]);

  useEffect(() => {
    categoryAPI.getAll().then(r => setCategories(r.data)).catch(() => {});
  }, []);

  const handleCategorySelect = (category) => {
    setIsCategoryModalOpen(false);
    if (category === 'all') {
      setSelectedCategory('');
      navigate('/');
      return;
    }
    setSelectedCategory(category);
    navigate(`/category/${categorySlug(category)}`);
  };

  const handleChipSelect = (category) => {
    setSelectedCategory(category);
    setPage(1);
    document.getElementById('products')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const visibleCategories = showAllCategories ? categories : categories.slice(0, 6);
  const canViewMoreCategories = categories.length > 6;

  return (
    <>
      <Navbar onOpenCategories={() => setIsCategoryModalOpen(true)} />
      <CartSidebar />

      <section className="hero" style={{ position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.7, pointerEvents: 'none' }}>
          <DemoOne />
        </div>
        <div className="container" style={{ position: 'relative', zIndex: 10 }}>
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

          {categories.length > 0 ? (
            <div className="category-section" style={{ marginBottom: '32px' }}>
              <div className="category-section-header">
                <h3>{selectedCategory ? selectedCategory : 'Shop by Category'}</h3>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button className="view-more-btn" onClick={() => setRandomize(v => !v)} style={{ borderColor: randomize ? 'var(--accent)' : 'var(--border-glass)' }}>
                    {randomize ? 'Random On' : 'Random'}
                  </button>
                  {canViewMoreCategories && (
                    <button className="view-more-btn" onClick={() => setShowAllCategories(v => !v)}>
                      {showAllCategories ? 'Show Less' : 'View More'}
                    </button>
                  )}
                </div>
              </div>
              <div className="filter-bar">
                <button
                  className={`filter-chip ${!selectedCategory ? 'active' : ''}`}
                  onClick={() => setSelectedCategory('')}
                >
                  All Products
                </button>
                {visibleCategories.map(cat => (
                  <button
                    key={cat._id}
                    className={`filter-chip ${selectedCategory === cat.name ? 'active' : ''}`}
                    onClick={() => handleChipSelect(cat.name)}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '32px' }}>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>Max Price:</span>
            <input type="range" min="0" max="500" step="1" value={maxPrice || 500} onChange={e => setMaxPrice(e.target.value === '500' ? '' : e.target.value)} style={{ width: '140px', accentColor: 'var(--accent)' }} />
            <span style={{ fontWeight: 600, color: 'var(--accent)', minWidth: '60px' }}>${maxPrice ? Number(maxPrice).toFixed(0) : 'Any'}</span>
            {maxPrice && <button onClick={() => setMaxPrice('')} style={{ background: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'underline', cursor: 'pointer' }}>Clear</button>}
          </div>

          {loading ? (
            <div className="products-grid">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <ProductSkeleton key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '1.2rem' }}>No products found</p>
              {selectedCategory && <Link to="/" className="btn btn-secondary">View All Products</Link>}
            </div>
          ) : (
            <div className="products-grid">
              {products.map((product, index) => (
                <ProductCard
                  key={product._id}
                  product={product}
                  index={index}
                  onSelect={setSelectedProduct}
                  onAdd={addItem}
                />
              ))}
              {loadingMore && Array.from({ length: 4 }).map((_, i) => (
                <ProductSkeleton key={`loading-${i}`} />
              ))}
            </div>
          )}

          {!loading && hasMore && (
            <div style={{ textAlign: 'center', marginTop: '40px' }}>
              <button
                ref={loaderRef}
                className="btn btn-secondary"
                onClick={() => fetchProducts(page + 1)}
                disabled={loadingMore}
                style={{ minWidth: '200px' }}
              >
                {loadingMore ? 'Loading...' : 'Load More Products'}
              </button>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '12px' }}>
                Showing {products.length} products
              </p>
            </div>
          )}

          {!hasMore && products.length > 0 && (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '32px', fontSize: '0.9rem' }}>
              — All products loaded —
            </p>
          )}
        </div>
      </section>

      {isCategoryModalOpen && (
        <CategoryModal categories={categories} onClose={() => setIsCategoryModalOpen(false)} onSelect={handleCategorySelect} />
      )}
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onSelectSimilar={setSelectedProduct} />
      <Footer />
    </>
  );
}
