import { useState, useEffect } from 'react';
import { HiSearch, HiShoppingCart } from 'react-icons/hi';
import { SiTelegram } from 'react-icons/si';
import { productAPI, categoryAPI } from '../api';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import CartSidebar from '../components/CartSidebar';
import CategoryModal from '../components/CategoryModal';
import ProductModal from '../components/ProductModal';
import Footer from '../components/Footer';

const PAGE_SIZE = 12;

const categorySlug = (category) => encodeURIComponent(category.replace(/\s+/g, '-'));

const shuffleArray = (items) => {
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

function ProductCard({ product, index, onSelect, onAdd }) {
  const img = (product.images && product.images.length > 0 ? product.images[product.imagePrimaryIndex || 0] : product.image) || '';

  return (
    <div className="product-card" onClick={() => onSelect(product)}>
      <div className="product-card-image">
        {img ? (
          <img
            src={img}
            alt={product.name}
            loading={index < 4 ? 'eager' : 'lazy'}
            decoding="async"
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', background: 'var(--bg-secondary)' }}>📦</div>
        )}
        {product.featured && <span className="badge">Featured</span>}
        {!product.inStock && <span className="badge out-of-stock">Pre-order</span>}
      </div>
      <div className="product-card-body">
        <div className="product-card-category">{product.category}</div>
        <h3 className="product-card-name">{product.name}</h3>
        <p className="product-card-desc">{product.description}</p>
        <div className="product-card-footer">
          <span className="product-card-price"><span className="currency">$</span>{product.price.toFixed(2)}</span>
          {product.inStock && (
            <button className="btn-icon" onClick={e => { e.stopPropagation(); onAdd(product); }} title="Add to cart">
              <HiShoppingCart size={16} />
            </button>
          )}
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
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [activeCategory, setActiveCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryState, setCategoryState] = useState({});
  const [loadingCategories, setLoadingCategories] = useState(true);
  const { addItem } = useCart();

  const fetchCategoryPage = (categoryName, targetPage, reset = false) => {
    const params = {
      category: categoryName,
      limit: PAGE_SIZE,
      skip: (targetPage - 1) * PAGE_SIZE,
    };

    if (search.trim()) params.search = search.trim();
    if (minPrice.trim()) params.minPrice = minPrice;
    if (maxPrice.trim()) params.maxPrice = maxPrice;

    if (reset) setLoadingCategories(true);
    else {
      setCategoryState(prev => ({
        ...prev,
        [categoryName]: { ...(prev[categoryName] || {}), loadingMore: true }
      }));
    }

    productAPI.getAll(params)
      .then(r => {
        const data = shuffleArray(r.data || []);
        setCategoryState(prev => {
          const current = prev[categoryName] || {};
          return {
            ...prev,
            [categoryName]: {
              products: reset ? data : shuffleArray([...(current.products || []), ...data]),
              page: targetPage,
              hasMore: data.length === PAGE_SIZE,
              loading: false,
              loadingMore: false,
            }
          };
        });
      })
      .catch(() => {
        setCategoryState(prev => ({
          ...prev,
          [categoryName]: { ...(prev[categoryName] || {}), products: reset ? [] : (prev[categoryName]?.products || []), loading: false, loadingMore: false }
        }));
      })
      .finally(() => {
        if (reset) setLoadingCategories(false);
      });
  };

  useEffect(() => {
    categoryAPI.getAll().then(r => setCategories(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoadingCategories(true);
    setCategoryState({});
    categories.forEach(cat => fetchCategoryPage(cat.name, 1, true));
  }, [search, minPrice, maxPrice, categories]);

  useEffect(() => {
    if (!activeCategory) return;
    const timer = setTimeout(() => {
      document.getElementById(`category-${categorySlug(activeCategory)}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 0);
    return () => clearTimeout(timer);
  }, [activeCategory]);

  const handleCategorySelect = (category) => {
    setActiveCategory(category === 'all' ? '' : category);
    setIsCategoryModalOpen(false);
  };

  const totalVisibleProducts = Object.values(categoryState).reduce((sum, state) => sum + (state.products?.length || 0), 0);
  const hasAnyCategoryProducts = categories.some(cat => (categoryState[cat.name]?.products || []).length > 0);

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
            {activeCategory && (
              <button className="filter-chip active" onClick={() => setActiveCategory('')}>
                Showing: {activeCategory}
              </button>
            )}
          </div>

          {categories.map(cat => {
            const state = categoryState[cat.name] || { products: [], hasMore: false, loading: loadingCategories };
            const products = state.products || [];
            if (!loadingCategories && products.length === 0) return null;

            return (
              <div id={`category-${categorySlug(cat.name)}`} key={cat.name} className={`category-section ${activeCategory === cat.name ? 'active' : ''}`} style={{ marginBottom: '48px' }}>
                <div className="category-section-header">
                  <h3>{cat.name}</h3>
                  {products.length > 0 && (
                    <button
                      className="view-more-btn"
                      disabled={state.loadingMore || !state.hasMore}
                      onClick={() => fetchCategoryPage(cat.name, (state.page || 1) + 1, false)}
                    >
                      {state.loadingMore ? 'Loading...' : state.hasMore ? 'View More' : 'No More'}
                    </button>
                  )}
                </div>
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
                  {state.loadingMore && Array.from({ length: 4 }).map((_, index) => (
                    <ProductSkeleton key={`loading-${index}`} />
                  ))}
                </div>
              </div>
            );
          })}

          {!loadingCategories && !hasAnyCategoryProducts && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '1.2rem' }}>No products found</p>
            </div>
          )}

          {loadingCategories && totalVisibleProducts === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
              <p style={{ fontSize: '1.2rem' }}>Loading products...</p>
            </div>
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
