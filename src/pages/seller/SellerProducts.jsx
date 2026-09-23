import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiPlus, HiPencil, HiTrash } from 'react-icons/hi';
import API from '../../api';
import SellerSidebar from '../../components/SellerSidebar';
import toast from 'react-hot-toast';

export default function SellerProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [search, setSearch] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('seller_token');
      const { data } = await API.get('/seller/products', { headers: { Authorization: `Bearer ${token}` } });
      setProducts(data);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      const token = localStorage.getItem('seller_token');
      await API.delete(`/seller/products/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Product deleted');
      setProducts(prev => prev.filter(p => p._id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete');
    }
  };

  const handleDeleteSelected = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) return;
    if (!confirm(`Delete ${ids.length} products?`)) return;
    try {
      const token = localStorage.getItem('seller_token');
      await Promise.all(ids.map(id => API.delete(`/seller/products/${id}`, { headers: { Authorization: `Bearer ${token}` } })));
      setProducts(prev => prev.filter(p => !ids.includes(p._id)));
      setSelectedIds(new Set());
      toast.success('Selected products deleted');
    } catch {
      toast.error('Failed to delete some products');
    }
  };

  const toggleProduct = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="admin-layout">
      <SellerSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <h1>My Products</h1>
          <Link to="/dashboard/products/new" className="btn btn-primary btn-sm"><HiPlus /> Add Product</Link>
        </div>

        <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-primary)' }}
          />
          {selectedIds.size > 0 && (
            <button className="btn btn-danger btn-sm" onClick={handleDeleteSelected}>Delete Selected ({selectedIds.size})</button>
          )}
        </div>

        {loading ? <div className="spinner" /> : (
          <div className="products-grid">
            {filteredProducts.map(product => {
              const img = (product.images && product.images.length > 0 ? product.images[0] : product.image) || '';
              return (
                <div key={product._id} style={cardWrap}>
                  <div style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden', background: 'var(--bg-secondary)', cursor: 'pointer' }}>
                    <label onClick={e => e.stopPropagation()} style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 2, background: 'rgba(0,0,0,0.5)', padding: '4px', borderRadius: '4px' }}>
                      <input type="checkbox" checked={selectedIds.has(product._id)} onChange={() => toggleProduct(product._id)} />
                    </label>
                    {img ? <img src={img} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>📦</div>}
                    {!product.inStock && <span className="badge out-of-stock" style={{ position: 'absolute', top: '10px', left: '10px' }}>Out of Stock</span>}
                  </div>
                  <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{product.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 700 }}>${product.price.toFixed(2)}</div>
                    <div style={{ marginTop: 'auto', display: 'flex', gap: '8px' }}>
                      <Link to={`/dashboard/products/edit/${product._id}`} className="btn-icon" style={{ width: '32px', height: '32px' }}><HiPencil /></Link>
                      <button className="btn-icon" onClick={() => handleDelete(product._id, product.name)} style={{ width: '32px', height: '32px', color: 'var(--danger)' }}><HiTrash /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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
