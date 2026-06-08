import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HiSave, HiUpload } from 'react-icons/hi';
import { productAPI } from '../api';
import AdminSidebar from '../components/AdminSidebar';
import toast from 'react-hot-toast';

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({ name: '', description: '', price: '', category: '', stock: '', inStock: true, featured: false });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      productAPI.getById(id).then(r => {
        const p = r.data;
        setForm({ name: p.name, description: p.description, price: p.price, category: p.category, stock: p.stock, inStock: p.inStock, featured: p.featured });
        if (p.image) setPreview(p.image);
      }).catch(() => toast.error('Product not found'));
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (imageFile) fd.append('image', imageFile);

      if (isEdit) {
        await productAPI.update(id, fd);
        toast.success('Product updated');
      } else {
        await productAPI.create(fd);
        toast.success('Product created');
      }
      navigate('/manage-aura-369/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <h1>{isEdit ? 'Edit Product' : 'Add Product'}</h1>
        </div>
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Product Image</label>
            <div className="image-upload">
              {preview ? <img src={preview} alt="Preview" className="preview" /> : <><HiUpload size={32} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} /><p style={{ color: 'var(--text-muted)' }}>Click or drag to upload</p></>}
              <input type="file" accept="image/*" onChange={handleImage} />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input type="text" id="name" name="name" value={form.name} onChange={handleChange} required placeholder="Product name" />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" value={form.description} onChange={handleChange} required placeholder="Product description" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Price ($)</label>
              <input type="number" id="price" name="price" value={form.price} onChange={handleChange} required min="0" step="0.01" placeholder="0.00" />
            </div>
            <div className="form-group">
              <label htmlFor="stock">Stock</label>
              <input type="number" id="stock" name="stock" value={form.stock} onChange={handleChange} min="0" placeholder="0" />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <input type="text" id="category" name="category" value={form.category} onChange={handleChange} required placeholder="e.g. Hoodies, Footwear" />
          </div>
          <div className="form-row" style={{ marginBottom: '24px' }}>
            <label className="form-check"><input type="checkbox" name="inStock" checked={form.inStock} onChange={handleChange} /> In Stock</label>
            <label className="form-check"><input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} /> Featured</label>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} id="product-submit">
            <HiSave /> {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
        </form>
      </main>
    </div>
  );
}
