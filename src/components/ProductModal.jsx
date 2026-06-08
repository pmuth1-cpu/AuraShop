import { useState, useEffect } from 'react';
import { HiX, HiMinus, HiPlus, HiShoppingCart } from 'react-icons/hi';
import { useCart } from '../context/CartContext';
import { productAPI } from '../api';

export default function ProductModal({ product, onClose, onSelectSimilar }) {
  const [qty, setQty] = useState(1);
  const [similar, setSimilar] = useState([]);
  const { addItem } = useCart();

  useEffect(() => {
    if (product) {
      setQty(1);
      const minPrice = product.price * 0.8;
      const maxPrice = product.price * 1.2;
      productAPI.getAll({ minPrice, maxPrice, excludeId: product._id })
        .then(r => setSimilar(r.data.slice(0, 3)))
        .catch(() => {});
    }
  }, [product]);

  if (!product) return null;

  const handleAdd = () => {
    addItem(product, qty);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>
        <button className="modal-close" onClick={onClose}><HiX /></button>
        <div className="modal-image">
          {product.image ? (
            <img src={product.image} alt={product.name} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '3rem' }}>📦</div>
          )}
        </div>
        <div className="modal-details">
          <span className="modal-category">{product.category}</span>
          <h2 className="modal-name">{product.name}</h2>
          <span className="modal-price">${product.price.toFixed(2)}</span>
          <p className="modal-desc">{product.description}</p>
          <div className="modal-stock">
            <span className={`dot ${product.inStock ? 'in' : 'out'}`} />
            <span>{product.inStock ? `In Stock (${product.stock})` : 'Out of Stock'}</span>
          </div>
          {product.inStock && (
            <>
              <div className="qty-control">
                <button onClick={() => setQty(q => Math.max(1, q - 1))}><HiMinus /></button>
                <span>{qty}</span>
                <button onClick={() => setQty(q => q + 1)}><HiPlus /></button>
              </div>
              <button className="btn btn-primary" onClick={handleAdd} id="modal-add-cart">
                <HiShoppingCart /> Add to Cart — ${(product.price * qty).toFixed(2)}
              </button>
            </>
          )}
        </div>
        {similar.length > 0 && (
          <div style={{ gridColumn: '1 / -1', padding: '32px', borderTop: '1px solid var(--border-glass)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', marginBottom: '16px' }}>Similar Price Options (±20%)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {similar.map(p => (
                <div key={p._id} className="product-card" onClick={() => onSelectSimilar && onSelectSimilar(p)} style={{ cursor: 'pointer', background: 'var(--bg-primary)' }}>
                  <div className="product-card-image" style={{ aspectRatio: '1/1' }}>
                    {p.image ? <img src={p.image} alt={p.name} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>📦</div>}
                  </div>
                  <div className="product-card-body" style={{ padding: '12px' }}>
                    <div style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '4px' }}>{p.name}</div>
                    <div style={{ color: 'var(--accent)', fontWeight: '700' }}>${p.price.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
