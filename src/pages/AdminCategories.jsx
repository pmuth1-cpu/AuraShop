import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiPlus, HiPencil, HiTrash, HiViewGrid } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { categoryAPI, productAPI } from '../api';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminCategories() {
  const [categories, setCategories] = useState([]);
  const [productCounts, setProductCounts] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const catRes = await categoryAPI.getAll();
      const prods = await productAPI.getAll();
      setCategories(catRes.data);
      
      // Count products per category
      const counts = {};
      catRes.data.forEach(c => {
        counts[c.name] = prods.data.filter(p => p.category === c.name).length;
      });
      setProductCounts(counts);
    } catch {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    try {
      await categoryAPI.delete(id);
      toast.success('Category deleted');
      fetchCategories();
    } catch (err) {
      toast.error('Failed to delete');
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <h1>Categories</h1>
          <Link to="/manage-aura-369/categories/new" className="btn btn-primary btn-sm"><HiPlus /> Add Category</Link>
        </div>
        {loading ? <div className="spinner" /> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Products</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c._id}>
                    <td>
                      <div className="product-cell">
                        <div className="product-thumb">
                          {c.image ? <img src={c.image} alt={c.name} /> : <div style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.5rem'}}>📁</div>}
                        </div>
                        <div>
                          <strong>{c.name}</strong>
                        </div>
                      </div>
                    </td>
                    <td>{productCounts[c.name] || 0} products</td>
                    <td>
                      <div className="actions">
                        <Link to={`/manage-aura-369/categories/edit/${c._id}`} className="btn-icon" title="Edit"><HiPencil /></Link>
                        <button className="btn-icon" onClick={() => handleDelete(c._id, c.name)} title="Delete" style={{ color: 'var(--danger)' }}><HiTrash /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
