import { useState, useEffect } from 'react';
import { HiX, HiMinus, HiPlus, HiShoppingCart, HiChevronLeft, HiChevronRight } from 'react-icons/hi';
import { useCart } from '../context/CartContext';
import { productAPI } from '../api';

export default function ProductModal({ product, onClose, onSelectSimilar }) {
  const [qty, setQty] = useState(1);
  const [similar, setSimilar] = useState([]);
  const [imageIndex, setImageIndex] = useState(0);
  const { addItem } = useCart();

  const images = product?.images && product.images.length > 0 ? product.images : (product?.image ? [product.image] : []);
  const currentImage = images.length > 0 ? images[imageIndex] : '';
  const imagePrimaryIndex = typeof product?.imagePrimaryIndex === 'number' && product?.imagePrimaryIndex >= 0 && product?.imagePrimaryIndex < images.length ? product.imagePrimaryIndex : 0;
  const oldPrice = product?.oldPrice && Number(product.oldPrice) > Number(product.price || 0) ? Number(product.oldPrice) : null;

  useEffect(() => {
    setImageIndex(imagePrimaryIndex);
  }, [imagePrimaryIndex]);

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

  const nextImage = (e) => {
    e.stopPropagation();
    setImageIndex(i => (i + 1) % images.length);
  };
  const prevImage = (e) => {
    e.stopPropagation();
    setImageIndex(i => (i - 1 + images.length) % images.length);
  };

  const handleAdd = () => {
    addItem(product, qty);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ position: 'relative' }}>
        <button className="modal-close" onClick={onClose}><HiX /></button>
        <div className="modal-image" style={{ position: 'relative' }}>
          {currentImage ? (
            <img src={currentImage} alt={product.name} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '3rem' }}>📦</div>
          )}
          {images.length > 1 && (
            <>
              <button onClick={prevImage} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2, boxShadow: 'var(--shadow-sm)' }}><HiChevronLeft /></button>
              <button onClick={nextImage} style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', zIndex: 2, boxShadow: 'var(--shadow-sm)' }}><HiChevronRight /></button>
              <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '6px', zIndex: 2 }}>
                {images.map((_, idx) => (
                  <button key={idx} onClick={(e) => { e.stopPropagation(); setImageIndex(idx); }} style={{ width: idx === imageIndex ? '24px' : '8px', height: '8px', borderRadius: '4px', background: idx === imageIndex ? 'var(--accent)' : 'rgba(255,255,255,0.5)', border: 'none', cursor: 'pointer', transition: 'var(--transition)', padding: 0 }} />
                ))}
              </div>
            </>
          )}
        </div>
        <div className="modal-details">
          <span className="modal-category">{product.category}</span>
          <h2 className="modal-name">{product.name}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="modal-price">${Number(product.price).toFixed(2)}</span>
            {oldPrice && <span style={{ fontSize: '1rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>${oldPrice.toFixed(2)}</span>}
          </div>
          <p className="modal-desc">{product.description}</p>
          <div className="modal-stock">
            <span className={`dot ${product.inStock ? 'in' : 'out'}`} />
            <span>{product.inStock ? `In Stock (${product.stock})` : 'Out of Stock'}</span>
          </div>
          {images.length > 1 && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>{imageIndex + 1} / {images.length} images</p>
          )}
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
                    <img src={p.image} alt={p.name} />
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
