import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiPlus, HiPencil, HiTrash } from 'react-icons/hi';
import { productAPI, categoryAPI } from '../api';
import AdminSidebar from '../components/AdminSidebar';
import toast from 'react-hot-toast';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedIds, setSelectedIds] = useState(new Set());

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([productAPI.getAll(), categoryAPI.getAll()]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

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
    setSelectedIds(new Set());
  }, [selectedCategory, products.length]);

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?\n\nThis action cannot be undone.`)) return;
    try {
      await productAPI.delete(id);
      toast.success('Product deleted');
      setProducts(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const toggleProduct = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} selected product${ids.length === 1 ? '' : 's'}?\n\nThis action cannot be undone.`)) return;
    try {
      await Promise.all(ids.map(id => productAPI.delete(id)));
      setProducts(prev => prev.filter(product => !ids.includes(product._id)));
      setSelectedIds(new Set());
      toast.success('Selected products deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete selected products');
    }
  };

  const productMatchesCategory = (product, categoryName) => (product.categories || [product.category]).includes(categoryName);

  const filtered = selectedCategory === 'all' ? products : products.filter(product => productMatchesCategory(product, selectedCategory));
  const grouped = categories.reduce((acc, cat) => {
    acc[cat.name] = filtered.filter(product => productMatchesCategory(product, cat.name));
    return acc;
  }, {});

  const visibleCategories = selectedCategory === 'all' ? categories : categories.filter(c => c.name === selectedCategory);
  const visibleProducts = selectedCategory === 'all' ? products : filtered;

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <h1>Products</h1>
          <Link to="/manage-aura-369/products/new" className="btn btn-primary btn-sm"><HiPlus /> Add Product</Link>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '28px' }}>
          <button
            onClick={() => setSelectedCategory('all')}
            className="filter-chip"
            style={selectedCategory === 'all' ? { background: 'rgba(139,92,246,0.12)', color: 'var(--accent-light)', borderColor: 'var(--accent)' } : {}}
          >
            All
          </button>
          {categories.map(c => (
            <button
              key={c._id}
              onClick={() => setSelectedCategory(c.name)}
              className="filter-chip"
              style={selectedCategory === c.name ? { background: 'rgba(139,92,246,0.12)', color: 'var(--accent-light)', borderColor: 'var(--accent)' } : {}}
            >
              {c.name}
            </button>
          ))}
        </div>

        {visibleProducts.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '18px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setSelectedIds(new Set(visibleProducts.map(product => product._id)))}
            >
              Select Visible
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => setSelectedIds(new Set())}>
              Clear
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={handleDeleteSelected}
              disabled={selectedIds.size === 0}
              style={{ opacity: selectedIds.size === 0 ? 0.6 : 1 }}
            >
              Delete Selected
            </button>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{selectedIds.size} selected</span>
          </div>
        )}

        {loading ? <div className="spinner" /> : (
          <>
            {visibleProducts.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', padding: '40px 0', textAlign: 'center' }}>
                No products found.
              </div>
            ) : (
              visibleCategories.map(cat => {
                const catProducts = grouped[cat.name] || [];
                if (selectedCategory !== 'all' && catProducts.length === 0) return null;
                if (catProducts.length === 0) return null;
                return (
                  <div key={cat.name} style={{ marginBottom: '40px' }}>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>{cat.name}</h3>
                    <div className="products-grid">
                      {catProducts.map(product => {
                        const img = (product.images && product.images.length > 0 ? product.images[product.imagePrimaryIndex || 0] : product.image) || '';
                        return (
                          <div key={product._id} style={cardWrap}>
                            <div style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden', background: 'var(--bg-secondary)', cursor: 'pointer' }} onClick={() => window.location.href = `/manage-aura-369/products/edit/${product._id}`}>
                              <label
                                onClick={e => e.stopPropagation()}
                                style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 2, width: '28px', height: '28px', borderRadius: '8px', background: selectedIds.has(product._id) ? 'var(--accent)' : 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: selectedIds.has(product._id) ? '2px solid #fff' : '2px solid rgba(255,255,255,0.5)', cursor: 'pointer' }}
                              >
                                <input
                                  type="checkbox"
                                  checked={selectedIds.has(product._id)}
                                  onChange={() => toggleProduct(product._id)}
                                  style={{ width: '16px', height: '16px', accentColor: '#fff', cursor: 'pointer' }}
                                />
                              </label>
                              {img ? (
                                <img src={img} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                              ) : (
                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>📦</div>
                              )}
                              {!product.inStock && <span className="badge out-of-stock" style={{ position: 'absolute', top: '10px', left: '10px' }}>Pre-order</span>}
                            </div>
                            <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.25 }}>{product.name}</div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 700 }}>${product.price.toFixed(2)}</div>
                              <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
                                <Link to={`/manage-aura-369/products/edit/${product._id}`} className="btn-icon" title="Edit" style={{ width: '32px', height: '32px', fontSize: '0.9rem' }}><HiPencil /></Link>
                                <button className="btn-icon" onClick={() => handleDelete(product._id, product.name)} title="Delete" style={{ width: '32px', height: '32px', fontSize: '0.9rem', color: 'var(--danger)' }}><HiTrash /></button>
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
          </>
        )}
      </main>
    </div>
  );
}

const cardWrap = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-glass)',
  borderRadius: 'var(--radius-lg)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  width: '220px'
};
