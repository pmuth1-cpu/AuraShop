import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { HiArrowLeft, HiShoppingCart } from 'react-icons/hi';
import { productAPI, categoryAPI } from '../../api';
import { useCart } from '../../context/CartContext';
import Navbar from '../../components/Navbar';
import CartSidebar from '../../components/CartSidebar';
import ProductModal from '../../components/ProductModal';
import Footer from '../../components/Footer';

export default function CategoryPage() {
  const { categoryName } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const { addItem } = useCart();

  const decodedName = decodeURIComponent(categoryName.replace(/-/g, ' '));

  useEffect(() => {
    setLoading(true);
    Promise.all([
      productAPI.getAll({ category: decodedName }).then(r => setProducts(r.data)).catch(() => setProducts([])),
      categoryAPI.getAll().catch(() => [])
    ]).finally(() => setLoading(false));
  }, [decodedName]);

  return (
    <>
      <Navbar onOpenCategories={() => {}} />
      <CartSidebar />

      <div className="container" style={{ paddingTop: '24px' }}>
        <button className="category-back" onClick={() => window.history.back()}>
          <HiArrowLeft /> Back to Shop
        </button>

        <div className="category-page-hero">
          <h1 className="category-page-title">{decodedName}</h1>
          <p className="category-page-sub">Browse our full {decodedName.toLowerCase()} collection</p>
        </div>

        <div className="category-count">
          {loading ? <span>Loading...</span> : <><strong>{products.length}</strong> product{products.length !== 1 ? 's' : ''} in {decodedName}</>}
        </div>

        {loading ? (
          <div className="page-loader"><div className="spinner" /></div>
        ) : products.length === 0 ? (
          <div className="category-empty">
            <span>📦</span>
            <p style={{ fontSize: '1.1rem' }}>No products found in this category yet.</p>
          </div>
        ) : (
          <div className="products-grid" style={{ marginBottom: '60px' }}>
            {products.map(product => {
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
        )}
      </div>

      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} onSelectSimilar={setSelectedProduct} />
      <Footer />
    </>
  );
}
