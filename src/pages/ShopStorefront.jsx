import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { HiShoppingCart, HiShieldCheck } from 'react-icons/hi';
import { SiTelegram } from 'react-icons/si';
import API from '../api';
import { useCart } from '../context/CartContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CartSidebar from '../components/CartSidebar';
import ProductModal from '../components/ProductModal';
import toast from 'react-hot-toast';

function ProductCard({ product, onSelect, onAdd }) {
  const img = (product.images && product.images.length > 0 ? product.images[product.imagePrimaryIndex || 0] : product.image) || '';
  const categories = product.categories?.length ? product.categories : [product.category].filter(Boolean);

  return (
    <div className="product-card" onClick={() => onSelect(product)}>
      <div className="product-card-image">
        {img ? (
          <img src={img} alt={product.name} loading="lazy" decoding="async" />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', background: 'var(--bg-secondary)' }}>📦</div>
        )}
        {product.featured && <span className="badge">Featured</span>}
        {!product.inStock && <span className="badge out-of-stock">Pre-order</span>}
      </div>
      <div className="product-card-body">
        <div className="product-card-category">{categories.join(' / ') || 'General'}</div>
        <h3 className="product-card-name">{product.name}</h3>
        <p className="product-card-desc">{product.description}</p>
        <div className="product-card-footer">
          <span className="product-card-price"><span className="currency">$</span>{Number(product.price).toFixed(2)}</span>
          <button
            className="btn-icon"
            onClick={e => {
              e.stopPropagation();
              onAdd(product);
            }}
            title="Add to cart"
            aria-label="Add to cart"
          >
            <HiShoppingCart size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ShopStorefront() {
  const { slug } = useParams();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const { addItem } = useCart();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      API.get(`/shops/${slug}`),
      API.get(`/shops/${slug}/products`)
    ])
    .then(([shopRes, prodRes]) => {
      setShop(shopRes.data);
      const prods = Array.isArray(prodRes.data)
        ? prodRes.data
        : (prodRes.data?.products || []);
      setProducts(prods);
    })
    .catch((err) => {
      console.error('Failed to load shop:', err);
      toast.error('Failed to load shop details');
    })
    .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="page-loader">
          <div className="spinner"></div>
        </div>
        <Footer />
      </>
    );
  }

  if (!shop) {
    return (
      <>
        <Navbar />
        <div style={{ textAlign: 'center', padding: '100px 20px' }}>
          <h2>Shop Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginTop: '8px' }}>
            The shop you are looking for does not exist or has been removed.
          </p>
        </div>
        <Footer />
      </>
    );
  }

  const categories = [...new Set(products.flatMap(p => p.categories?.length ? p.categories : [p.category]).filter(Boolean))];

  const filteredProducts = products.filter(p => {
    if (selectedCategory && !p.categories?.includes(selectedCategory) && p.category !== selectedCategory) return false;
    if (search && !p.name?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <>
      <Navbar />
      <CartSidebar shop={shop} />

      {/* Hero Cover Banner */}
      <div style={{
        position: 'relative',
        width: '100%',
        minHeight: '220px',
        maxHeight: '300px',
        height: '35vw',
        background: shop.cover 
          ? `url(${shop.cover}) center/cover no-repeat`
          : `linear-gradient(135deg, ${shop.theme?.primaryColor || '#8b5cf6'}, #06b6d4)`,
        borderBottom: '1px solid var(--border-glass)',
      }}>
        <div className="container" style={{ position: 'relative', height: '100%' }}>
          <div style={{
            position: 'absolute',
            bottom: '-45px',
            left: '16px',
            right: '16px',
            display: 'flex',
            alignItems: 'flex-end',
            gap: '16px',
            flexWrap: 'wrap',
          }}>
            {/* Shop Logo */}
            <div style={{
              width: '88px',
              height: '88px',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-card)',
              border: '3px solid var(--bg-primary)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-md)',
              flexShrink: 0,
            }}>
              {shop.logo ? (
                <img src={shop.logo} alt={shop.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '2.4rem' }}>🏪</span>
              )}
            </div>

            {/* Shop Title & Description */}
            <div style={{ marginBottom: '6px', minWidth: '200px', flex: 1 }}>
              <h1 style={{
                fontSize: 'clamp(1.2rem, 3vw, 1.8rem)',
                fontWeight: 800,
                color: '#fff',
                textShadow: '0 2px 10px rgba(0,0,0,0.7)',
                lineHeight: 1.2,
                margin: 0,
              }}>
                {shop.name}
              </h1>
              {shop.description && (
                <p style={{
                  color: 'rgba(255,255,255,0.9)',
                  textShadow: '0 1px 6px rgba(0,0,0,0.7)',
                  fontSize: '0.88rem',
                  marginTop: '4px',
                  maxWidth: '600px',
                }}>
                  {shop.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="container" style={{ marginTop: '64px', paddingBottom: '80px' }}>
        {/* Contact & Payment Badges */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap', alignItems: 'center' }}>
          {shop.telegram && (
            <a
              href={`https://t.me/${shop.telegram.replace('@', '')}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <SiTelegram color="#0088cc" /> @{shop.telegram.replace('@', '')}
            </a>
          )}
          {shop.contactPhone && (
            <a
              href={`tel:${shop.contactPhone}`}
              className="btn btn-secondary btn-sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              📞 {shop.contactPhone}
            </a>
          )}
          {shop.bakongAccount && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              fontSize: '0.82rem',
              fontWeight: 600,
              background: 'rgba(139,92,246,0.1)',
              border: '1px solid var(--border-glass)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--accent-light)',
            }}>
              <HiShieldCheck size={16} /> Bakong KHQR Accepted
            </span>
          )}
        </div>

        {/* Filter and Search Bar */}
        <div className="section-header" style={{ marginBottom: '24px', gap: '12px' }}>
          <div className="filter-bar" style={{ margin: 0, overflowX: 'auto', paddingBottom: '4px', flex: 1 }}>
            <button
              className={`filter-chip ${!selectedCategory ? 'active' : ''}`}
              onClick={() => setSelectedCategory('')}
            >
              All Products ({products.length})
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="search-box" style={{ maxWidth: '280px' }}>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="products-grid">
          {filteredProducts.map(product => (
            <ProductCard
              key={product._id}
              product={product}
              onSelect={setSelectedProduct}
              onAdd={addItem}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: '1.1rem' }}>No products found matching your search.</p>
          </div>
        )}
      </div>

      <ProductModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onSelectSimilar={setSelectedProduct}
      />
      <Footer />
    </>
  );
}
