import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HiSave, HiUpload, HiX, HiPlus } from 'react-icons/hi';
import { productAPI } from '../api';
import AdminSidebar from '../components/AdminSidebar';
import toast from 'react-hot-toast';

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({ name: '', description: '', price: '', oldPrice: '', category: '', stock: '', inStock: true, featured: false });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      productAPI.getById(id).then(r => {
        const p = r.data;
        setForm({ name: p.name, description: p.description, price: p.price, oldPrice: p.oldPrice || '', category: p.category, stock: p.stock, inStock: p.inStock, featured: p.featured });
        const imgs = p.images && p.images.length > 0 ? p.images : (p.image ? [p.image] : []);
        setImagePreviews(imgs);
        setImageFiles([]);
      }).catch(() => toast.error('Product not found'));
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImage = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const urls = files.map(f => URL.createObjectURL(f));
      setImageFiles(prev => [...prev, ...files]);
      setImagePreviews(prev => [...prev, ...urls]);
    }
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (v !== '' && v !== undefined && v !== null) fd.append(k, v);
        else if (k === 'oldPrice' && v === '') fd.append(k, '');
      });
      if (imageFiles.length > 0) {
        imageFiles.forEach((file, idx) => {
          fd.append('images', file);
        });
      }
      if (imagePreviews.length > 0 && imageFiles.length === 0) {
        fd.append('images', JSON.stringify(imagePreviews));
      }
      if (!fd.has('images') && imagePreviews.length > 0) {
        fd.append('images', JSON.stringify(imagePreviews));
      }

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
            <label>Product Images (up to 10)</label>
            {imagePreviews.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                {imagePreviews.map((url, idx) => (
                  <div key={idx} style={{ position: 'relative', aspectRatio: '2/3', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-glass)' }}>
                    <img src={url} alt={`Preview ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => removeImage(idx)} style={{ position: 'absolute', top: '4px', right: '4px', width: '24px', height: '24px', borderRadius: '50%', background: 'var(--danger)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}><HiX /></button>
                    {idx === 0 && <span style={{ position: 'absolute', bottom: '4px', left: '4px', background: 'var(--accent)', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 600 }}>Primary</span>}
                  </div>
                ))}
              </div>
            )}
            <div className="image-upload" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <HiUpload size={32} style={{ color: 'var(--text-muted)' }} />
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Click or drag to upload images</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>First image = primary (shown on cards)</p>
              </div>
              <input type="file" accept="image/*" multiple onChange={handleImage} />
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
              <input type="range" id="price" name="price" min="0" max="500" step="1" value={form.price} onChange={handleChange} required />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                <span>$0</span>
                <span style={{ fontWeight: 600, color: 'var(--accent)' }}>${Number(form.price).toFixed(2)}</span>
                <span>$500</span>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="oldPrice">Old Price ($)</label>
              <input type="number" id="oldPrice" name="oldPrice" value={form.oldPrice} onChange={handleChange} min="0" step="0.01" placeholder="0.00" />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <input type="text" id="category" name="category" value={form.category} onChange={handleChange} required placeholder="e.g. Hoodies, Footwear" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="stock">Stock</label>
              <input type="number" id="stock" name="stock" value={form.stock} onChange={handleChange} min="0" placeholder="0" />
            </div>
            <div className="form-group">
              <label>&nbsp;</label>
              <div style={{ display: 'flex', gap: '16px' }}>
                <label className="form-check"><input type="checkbox" name="inStock" checked={form.inStock} onChange={handleChange} /> In Stock</label>
                <label className="form-check"><input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} /> Featured</label>
              </div>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} id="product-submit">
            <HiSave /> {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
        </form>
      </main>
    </div>
  );
}
