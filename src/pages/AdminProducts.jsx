import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiPlus, HiPencil, HiTrash } from 'react-icons/hi';
import { productAPI } from '../api';
import AdminSidebar from '../components/AdminSidebar';
import toast from 'react-hot-toast';
import { sortData, getSortIcon } from '../utils/sorting';

const PAGE_SIZE = 20;

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchProducts = () => {
    setLoading(true);
    productAPI.getAll().then(r => setProducts(r.data)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(fetchProducts, []);
  useEffect(() => setCurrentPage(1), [sortBy, sortOrder]); // Reset to page 1 when sorting changes

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"?`)) return;
    try {
      await productAPI.delete(id);
      toast.success('Product deleted');
      fetchProducts();
    } catch { toast.error('Failed to delete'); }
  };

  // Sort and paginate
  const sortedProducts = sortData(products, sortBy, sortOrder);
  const totalPages = Math.ceil(sortedProducts.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedProducts = sortedProducts.slice(startIndex, startIndex + PAGE_SIZE);

  // Sort column helper
  const SortHeader = ({ column, label }) => (
    <th onClick={() => handleSort(column)} style={{ cursor: 'pointer', userSelect: 'none' }}>
      {label}
      {getSortIcon(column, sortBy, sortOrder)}
    </th>
  );

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <h1>Products</h1>
          <Link to="/manage-aura-369/products/new" className="btn btn-primary btn-sm"><HiPlus /> Add Product</Link>
        </div>
        {loading ? <div className="spinner" /> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr>
                <SortHeader column="name" label="Product" />
                <SortHeader column="category" label="Category" />
                <SortHeader column="price" label="Price" />
                <SortHeader column="stock" label="Stock" />
                <SortHeader column="featured" label="Featured" />
                <th>Status</th>
                <th>Actions</th>
              </tr></thead>
              <tbody>
                {paginatedProducts.map(p => (
                  <tr key={p._id}>
                    <td><div className="product-cell"><div className="product-thumb">{p.image && <img src={p.image} alt="" />}</div><span>{p.name}</span></div></td>
                    <td>{p.category}</td>
                    <td>${p.price.toFixed(2)}</td>
                    <td>{p.stock}</td>
                    <td>{p.featured ? '⭐' : '○'}</td>
                    <td><span className={`stock-badge ${p.inStock ? 'in' : 'out'}`}>{p.inStock ? 'In Stock' : 'Out'}</span></td>
                    <td>
                      <div className="actions">
                        <Link to={`/manage-aura-369/products/edit/${p._id}`} className="btn-icon" title="Edit"><HiPencil /></Link>
                        <button className="btn-icon" onClick={() => handleDelete(p._id, p.name)} title="Delete" style={{ color: 'var(--danger)' }}><HiTrash /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sortedProducts.length === 0 && (
              <div className="empty-state">
                <p>No products found. <Link to="/manage-aura-369/products/new">Create one</Link></p>
              </div>
            )}
          </div>
        )}
        {!loading && sortedProducts.length > 0 && (
          <div className="pagination">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1}
              className="btn btn-secondary btn-sm"
            >
              ← Previous
            </button>
            <div className="pagination-info">
              Page {currentPage} of {totalPages} ({sortedProducts.length} items)
            </div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage === totalPages}
              className="btn btn-secondary btn-sm"
            >
              Next →
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
