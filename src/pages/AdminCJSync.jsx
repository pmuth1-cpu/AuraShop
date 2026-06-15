import { useState } from 'react';
import API from '../api';
import toast from 'react-hot-toast';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminCJSync() {
  const [keyword, setKeyword] = useState('');
  const [pageSize, setPageSize] = useState(50);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [cjProducts, setCjProducts] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [importResult, setImportResult] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [randomize, setRandomize] = useState(true);

  const token = localStorage.getItem('aura_token');

  // Step 1: Browse CJ catalog (no DB writes)
  const handleBrowse = async () => {
    setLoading(true);
    setCjProducts([]);
    setSelectedIds(new Set());
    setImportResult(null);
    setExpandedId(null);
    try {
      const res = await API.post(
        '/cj-sync/browse',
        { keyword: keyword || undefined, pageSize, random: randomize },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCjProducts(res.data.products || []);
      if (res.data.products.length === 0) {
        toast('No products found. Try a different keyword.');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Browse failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelect = (cjId) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(cjId)) next.delete(cjId);
      else next.add(cjId);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === cjProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(cjProducts.map(p => p.cjId)));
    }
  };

  // Step 2: Import ONLY selected products
  const handleImportSelected = async () => {
    if (selectedIds.size === 0) return toast.error('Select at least one product');
    setImporting(true);
    setImportResult(null);
    try {
      const res = await API.post(
        '/cj-sync/import-selected',
        { selectedCjIds: Array.from(selectedIds) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setImportResult(res.data);
      toast.success(`Imported ${res.data.imported} products!`);
      setSelectedIds(new Set());
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const selectedCount = selectedIds.size;

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <h1>CJ Dropshipping — Select Products</h1>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search CJ catalog (e.g. hoodie, phone case, jewelry)"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleBrowse()}
            style={{ padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', minWidth: '300px' }}
          />
          <select
            value={pageSize}
            onChange={e => setPageSize(Number(e.target.value))}
            style={{ padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
          >
            <option value="25">25 per page</option>
            <option value="50" selected>50 per page</option>
            <option value="100">100 per page</option>
          </select>
          <button
            type="button"
            onClick={() => setRandomize(v => !v)}
            style={{ padding: '10px 14px', background: randomize ? 'rgba(139,92,246,0.12)' : 'var(--bg-card)', border: randomize ? '1px solid var(--accent)' : '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
          >
            {randomize ? 'Random On' : 'Random Off'}
          </button>
          <button className="btn btn-primary" onClick={handleBrowse} disabled={loading}>
            {loading ? 'Browsing CJ...' : 'Browse Catalog'}
          </button>
        </div>

        {cjProducts.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary btn-sm" onClick={toggleAll}>
              {selectedIds.size === cjProducts.length ? 'Deselect All' : 'Select All'}
            </button>
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              {selectedCount} of {cjProducts.length} selected
            </span>
            <button
              className="btn btn-primary"
              onClick={handleImportSelected}
              disabled={importing || selectedCount === 0}
              style={{ marginLeft: 'auto' }}
            >
              {importing ? `Importing ${selectedCount}...` : `Import ${selectedCount} Selected → Store`}
            </button>
          </div>
        )}

        {importResult && (
          <div style={{
            padding: '16px', background: 'rgba(16,185,129,0.1)', border: '1px solid var(--success)',
            borderRadius: 'var(--radius-md)', marginBottom: '24px', color: 'var(--success)'
          }}>
            Imported {importResult.imported} products to your store.
            {importResult.skipped > 0 && ` ${importResult.skipped} already existed (skipped).`}
            {importResult.products.map(p => (
              <div key={p.auraId} style={{ marginTop: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                → {p.name}
              </div>
            ))}
          </div>
        )}

        {cjProducts.length > 0 ? (
          <div className="products-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
            {cjProducts.map(product => {
              const isSelected = selectedIds.has(product.cjId);
              const isExpanded = expandedId === product.cjId;
              const img = product.images?.[0] || '';

              return (
                <div
                  key={product.cjId}
                  onClick={() => setExpandedId(isExpanded ? null : product.cjId)}
                  style={{
                    background: 'var(--bg-card)',
                    border: isSelected ? '2px solid var(--accent)' : '1px solid var(--border-glass)',
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <div
                    onClick={(e) => { e.stopPropagation(); toggleSelect(product.cjId); }}
                    style={{
                      position: 'absolute', top: '10px', left: '10px', zIndex: 5,
                      width: '28px', height: '28px', borderRadius: '6px',
                      background: isSelected ? 'var(--accent)' : 'rgba(0,0,0,0.5)',
                      border: isSelected ? '2px solid var(--accent)' : '2px solid rgba(255,255,255,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    {isSelected && <span style={{ color: '#fff', fontWeight: 700 }}>✓</span>}
                  </div>

                  <div style={{ aspectRatio: '1/1', background: 'var(--bg-secondary)', overflow: 'hidden' }}>
                    {img ? (
                      <img src={img} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>📦</div>
                    )}
                  </div>

                  <div style={{ padding: '12px' }}>
                    <div style={{
                      fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)',
                      lineHeight: 1.3, marginBottom: '6px',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {product.name}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--accent)', fontWeight: 700 }}>
                      ${product.price}
                    </div>
                    {!product.inStock && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>Out of stock</span>
                    )}

                    {isExpanded && (
                      <div style={{
                        marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-glass)',
                        fontSize: '0.8rem', color: 'var(--text-secondary)',
                      }}>
                        <p><strong>Category:</strong> {product.category}</p>
                        <p><strong>Warehouse:</strong> {product.warehouse || 'CN'}</p>
                        {product.variants?.length > 0 && (
                          <div style={{ marginTop: '8px' }}>
                            <strong>Variants:</strong>
                            {product.variants.map((v, i) => (
                              <div key={i} style={{ marginLeft: '8px' }}>
                                {v.color && <span>Color: {v.color} </span>}
                                {v.size && <span>Size: {v.size} </span>}
                                <span style={{ color: 'var(--accent)' }}>${v.price}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <a
                          href={product.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          style={{ display: 'inline-block', marginTop: '8px', color: 'var(--accent-light)', fontSize: '0.75rem' }}
                        >
                          View on CJ →
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          !loading && (
            <div style={{ color: 'var(--text-muted)', marginTop: '40px', textAlign: 'center', lineHeight: 1.8 }}>
              <p style={{ fontSize: '2rem' }}>🛒</p>
              <p>Browse the CJ Dropshipping catalog above.</p>
              <p style={{ fontSize: '0.85rem' }}>
                Search for products → preview them → select the ones you want → import to your store.
              </p>
            </div>
          )
        )}
      </main>
    </div>
  );
}
