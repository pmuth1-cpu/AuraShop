import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HiSave, HiUpload, HiX } from 'react-icons/hi';
import { productAPI, categoryAPI } from '../api';
import AdminSidebar from '../components/AdminSidebar';
import toast from 'react-hot-toast';

const MAX_IMAGES = 10;

const isImageUrl = (value) => /^https?:\/\/[^\s)]+\.(?:jpe?g|png|gif|webp)(?:\?[^\s)]*)?$/i.test(value) || /^data:image\/(?:png|jpe?g|gif|webp);base64,/i.test(value);

export default function AdminProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const imageUploadRef = useRef(null);

  const [form, setForm] = useState({ 
    name: '', 
    description: '', 
    price: '', 
    category: '',
    categories: [],
    inStock: true, 
    featured: false, 
    availabilityStatus: 'instock',
    sizes: [],
    colors: []
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCat, setShowNewCat] = useState(false);

  useEffect(() => {
    if (isEdit) {
      productAPI.getById(id).then(r => {
        const p = r.data;
        setForm({ 
          name: p.name, 
          description: p.description, 
          price: p.price, 
          category: p.category,
          categories: p.categories?.length ? p.categories : (p.category ? [p.category] : []),
          inStock: p.inStock, 
          featured: p.featured, 
          availabilityStatus: p.availabilityStatus || (p.inStock ? 'instock' : 'preorder'),
          sizes: p.sizes || [],
          colors: p.colors || []
        });
        const imgs = p.images && p.images.length > 0 ? p.images : (p.image ? [p.image] : []);
        setImagePreviews(imgs);
        setImageFiles([]);
      }).catch(() => toast.error('Product not found'));
    }
  }, [id, isEdit]);

  useEffect(() => {
    categoryAPI.getAll().then(r => setCategories(r.data)).catch(() => {});
  }, []);

  const addCategory = (categoryName) => {
    const name = categoryName.trim();
    if (!name) return;
    setForm(f => ({ ...f, categories: [...new Set([...(f.categories || []), name])] }));
  };

  const removeCategory = (categoryName) => {
    setForm(f => ({ ...f, categories: (f.categories || []).filter(category => category !== categoryName) }));
  };

  useEffect(() => {
    return () => {
      imagePreviews.forEach(src => {
        if (src.startsWith('blob:')) URL.revokeObjectURL(src);
      });
    };
  }, [imagePreviews]);

  const addImageFiles = (files) => {
    const remaining = MAX_IMAGES - imagePreviews.length;
    if (remaining <= 0) {
      toast.error(`You can add up to ${MAX_IMAGES} images`);
      return;
    }

    const imageFilesToAdd = Array.from(files).filter(file => file.type.startsWith('image/')).slice(0, remaining);
    if (imageFilesToAdd.length === 0) {
      toast.error('Only image files are allowed');
      return;
    }

    if (imageFilesToAdd.length < files.length) {
      toast.error(`Only the first ${remaining} images were added`);
    }

    const urls = imageFilesToAdd.map(f => URL.createObjectURL(f));
    setImageFiles(prev => [...prev, ...imageFilesToAdd]);
    setImagePreviews(prev => [...prev, ...urls]);
  };

  const handleImage = (e) => {
    addImageFiles(e.target.files || []);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    addImageFiles(e.dataTransfer.files || []);
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const clipboard = e.clipboardData;
    const items = Array.from(clipboard?.items || []);
    const imageItems = items.filter(item => item.kind === 'file' && item.type.startsWith('image/'));

    if (imageItems.length > 0) {
      addImageFiles(imageItems.map(item => item.getAsFile()).filter(Boolean));
      return;
    }

    const remaining = MAX_IMAGES - imagePreviews.length;
    if (remaining <= 0) {
      toast.error(`You can add up to ${MAX_IMAGES} images`);
      return;
    }

    const html = clipboard?.getData('text/html') || '';
    const htmlUrls = Array.from(html.matchAll(/src=["']([^"']+)["']/gi)).map(match => match[1]).filter(isImageUrl);
    const text = htmlUrls.length > 0 ? htmlUrls.join(' ') : (clipboard?.getData('text/plain') || clipboard?.getData('text/uri-list') || '');
    const pastedUrls = text.split(/\s+/).map(value => value.trim()).filter(isImageUrl).slice(0, remaining);

    if (pastedUrls.length > 0) {
      setImagePreviews(prev => [...prev, ...pastedUrls]);
      return;
    }

    toast.error('Paste an image file or image URL');
  };

  const removeImage = (index) => {
    const removed = imagePreviews[index];
    if (removed?.startsWith('blob:')) {
      URL.revokeObjectURL(removed);
      setImageFiles(prev => prev.filter((_, i) => i !== index));
    }
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'radio') {
      setForm(f => ({ ...f, [name]: value }));
    } else {
      setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('description', form.description);
      fd.append('price', Number(form.price) || 0);
      fd.append('availabilityStatus', form.availabilityStatus);
      fd.append('category', form.categories[0] || form.category);
      fd.append('categories', JSON.stringify(form.categories));
      fd.append('inStock', form.availabilityStatus === 'instock');
      fd.append('featured', form.featured);
      fd.append('sizes', JSON.stringify(form.sizes));
      fd.append('colors', JSON.stringify(form.colors));
      imageFiles.forEach((file) => {
        fd.append('images', file);
      });

      const existingImageUrls = imagePreviews.filter(src => !src.startsWith('blob:'));
      if (existingImageUrls.length > 0) {
        fd.append('images', JSON.stringify(existingImageUrls));
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
            <div
              ref={imageUploadRef}
              className="image-upload"
              tabIndex={0}
              onPaste={handlePaste}
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              style={{ padding: '24px' }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <HiUpload size={32} style={{ color: 'var(--text-muted)' }} />
                <p style={{ color: 'var(--text-muted)', margin: 0 }}>Click, drag, or paste images</p>
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
          <div className="form-group">
            <label htmlFor="category">Categories</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
              {(form.categories?.length ? form.categories : [form.category]).filter(Boolean).map(category => (
                <span key={category} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '999px', background: 'rgba(139,92,246,0.12)', color: 'var(--accent-light)', border: '1px solid var(--accent)', fontSize: '0.85rem' }}>
                  {category}
                  <button type="button" onClick={() => removeCategory(category)} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}><HiX size={14} /></button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                id="category"
                value=""
                onChange={e => {
                  addCategory(e.target.value);
                  e.target.value = '';
                }}
                style={{ flex: 1, padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.95rem', cursor: 'pointer' }}
              >
                <option value="">Add existing category</option>
                {categories.filter(c => !form.categories?.includes(c.name)).map(c => (
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
                      setCategories(prev => [...prev, r.data]);
                      addCategory(r.data.name);
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
          <div className="form-group">
            <label>Availability</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <label className="form-check">
                <input type="radio" name="availabilityStatus" value="instock" checked={form.availabilityStatus === 'instock'} onChange={handleChange} />
                In Stock
              </label>
              <label className="form-check">
                <input type="radio" name="availabilityStatus" value="preorder" checked={form.availabilityStatus === 'preorder'} onChange={handleChange} />
                Pre-order
              </label>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Price ($)</label>
              <input type="number" id="price" name="price" value={form.price} onChange={handleChange} required min="0" step="0.01" placeholder="0.00" />
            </div>
            <div className="form-group">
              <label>&nbsp;</label>
              <div style={{ display: 'flex', gap: '16px' }}>
                <label className="form-check"><input type="checkbox" name="featured" checked={form.featured} onChange={handleChange} /> Featured</label>
              </div>
            </div>
          </div>
          <div className="form-group">
            <label>Size & Color Options</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Sizes (comma separated)</label>
                <input
                  type="text"
                  value={form.sizes?.join(', ') || ''}
                  onChange={e => {
                    const sizes = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                    setForm(f => ({ ...f, sizes }));
                  }}
                  placeholder="XS, S, M, L, XL"
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px', display: 'block' }}>Colors (comma separated)</label>
                <input
                  type="text"
                  value={form.colors?.join(', ') || ''}
                  onChange={e => {
                    const colors = e.target.value.split(',').map(c => c.trim()).filter(Boolean);
                    setForm(f => ({ ...f, colors }));
                  }}
                  placeholder="Black, White, Red"
                  style={{ width: '100%', padding: '10px 14px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 'var(--radius-md)', color: 'var(--text-primary)', fontSize: '0.9rem' }}
                />
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
