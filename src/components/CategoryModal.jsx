import { HiX } from 'react-icons/hi';

export default function CategoryModal({ categories, onClose, onSelect }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ display: 'block', padding: '32px', maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}><HiX /></button>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginBottom: '24px', textAlign: 'center' }}>Shop by Category</h2>
        <div className="category-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
          
          <div className="category-card" onClick={() => { onSelect('all'); onClose(); }} style={{ cursor: 'pointer', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', transition: 'var(--transition)' }}>
            <div style={{ aspectRatio: '1/1', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🌟</div>
            <div style={{ padding: '16px', textAlign: 'center', fontWeight: '600' }}>All Products</div>
          </div>

          {categories.map(cat => (
            <div key={cat._id} className="category-card" onClick={() => { onSelect(cat.name); onClose(); }} style={{ cursor: 'pointer', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', transition: 'var(--transition)' }}>
              <div style={{ aspectRatio: '1/1', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {cat.image ? (
                  <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ fontSize: '3rem' }}>📁</div>
                )}
              </div>
              <div style={{ padding: '16px', textAlign: 'center', fontWeight: '600' }}>{cat.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
