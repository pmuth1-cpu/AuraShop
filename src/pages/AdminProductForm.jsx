import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HiSave, HiUpload, HiX, HiPlus, HiTrash } from 'react-icons/hi';
import { productAPI } from '../api';
import AdminSidebar from '../components/AdminSidebar';
import toast from 'react-hot-toast';

const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState({ name: '', description: '', price: '', oldPrice: '', category: '', stock: '', inStock: true, featured: false });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [variants, setVariants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);

  useEffect(() => {
    if (isEdit) {
      productAPI.getById(id).then(r => {
        const p = r.data;
        setForm({ name: p.name, description: p.description, price: p.price, oldPrice: p.oldPrice || '', category: p.category, stock: p.stock, inStock: p.inStock, featured: p.featured });
        const imgs = p.images && p.images.length > 0 ? p.images : (p.image ? [p.image] : []);
        setImagePreviews(imgs);
        setImageFiles([]);
        setVariants(p.variants || []);
      }).catch(() => toast.error('Product not found'));
    }
  }, [id, isEdit]);

  useEffect(() => {
    categoryAPI.getAll().then(r => setCategories(r.data)).catch(() => {});
  }, []);

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

  const addVariant = () => setVariants(v => [...v, { size: '', color: '', stock: 0 }]);
  const updateVariant = (idx, field, value) => setVariants(v => v.map((x, i) => i === idx ? { ...x, [field]: value } : x));
  const removeVariant = (idx) => setVariants(v => v.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description);
      fd.append('price', Number(form.price) || 0);
      if (form.oldPrice) fd.append('oldPrice', form.oldPrice);
      fd.append('category', form.category);
      fd.append('stock', Number(form.stock) || 0);
      fd.append('inStock', form.inStock);
      fd.append('featured', form.featured);
      if (variants.length > 0) fd.append('variants', JSON.stringify(variants));
      imageFiles.forEach((file) => {
        fd.append('images', file);
      });
      if (imagePreviews.length > 0 && imageFiles.length === 0) {
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
              <input type="number" id="price" name="price" value={form.price} onChange={handleChange} required min="0" step="0.01" placeholder="0.00" />
            </div>
            <div className="form-group">
              <label htmlFor="oldPrice">Old Price ($)</label>
              <input type="number" id="oldPrice" name="oldPrice" value={form.oldPrice} onChange={handleChange} min="0" step="0.01" placeholder="0.00" />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                id="category"
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                style={{ flex: 1, padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.95rem', cursor: 'pointer' }}
              >
                <option value="">Select category</option>
                {categories.map(c => (
                  <option key={c._id} value={c.name}>{c.name}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowNewCat(v => !v)}
                className="btn btn-secondary btn-sm"
                title="Add new category"
              >
                +
              </button>
            </div>
            {showNewCat && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={e => setNewCategoryName(e.target.value)}
                  placeholder="New category name"
                  style={{ flex: 1, padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!newCategoryName.trim()) return;
                    try {
                      const fd = new FormData();
                      fd.append('name', newCategoryName.trim());
                      const r = await categoryAPI.create(fd);
                      setCategories([...categories, r.data]);
                      setForm(f => ({ ...f, category: r.data.name }));
                      setNewCategoryName('');
                      setShowNewCat(false);
                      toast.success('Category added');
                    } catch {
                      toast.error('Failed to add category');
                    }
                  }}
                  className="btn btn-primary btn-sm"
                >
                  Add
                </button>
              </div>
            )}
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
          <div className="form-group">
            <label>Variants (Size/Color - optional)</label>
            {variants.length > 0 && (
              <div style={{ display: 'grid', gap: '8px', marginBottom: '8px' }}>
                {variants.map((v, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '8px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                    <select value={v.size} onChange={e => updateVariant(idx, 'size', e.target.value)} style={{ flex: 1, padding: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '6px' }}>
                      <option value="">Size</option>
                      {SIZE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input type="text" placeholder="Color" value={v.color} onChange={e => updateVariant(idx, 'color', e.target.value)} style={{ flex: 1, padding: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '6px' }} />
                    <input type="number" placeholder="Stock" value={v.stock} onChange={e => updateVariant(idx, 'stock', Number(e.target.value))} style={{ width: '80px', padding: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '6px' }} min="0" />
                    <button type="button" onClick={() => removeVariant(idx)} className="btn-icon" style={{ width: '32px', height: '32px' }}><HiTrash /></button>
                  </div>
                ))}
              </div>
            )}
            <button type="button" onClick={addVariant} className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <HiPlus /> Add Variant
            </button>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} id="product-submit">
            <HiSave /> {loading ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}
          </button>
        </form>
        </main>
      </div>
    );
}
