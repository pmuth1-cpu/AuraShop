import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HiSave, HiUpload, HiX } from 'react-icons/hi';
import API, { categoryAPI } from '../../api';
import SellerSidebar from '../../components/SellerSidebar';
import toast from 'react-hot-toast';

const MAX_IMAGES = 10;
const isImageUrl = (value) => /^https?:\/\/[^\s)]+\.(?:jpe?g|png|gif|webp)(?:\?[^\s)]*)?$/i.test(value) || /^data:image\/(?:png|jpe?g|gif|webp);base64,/i.test(value);

export default function SellerProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const imageUploadRef = useRef(null);

  const [form, setForm] = useState({ 
    name: '', description: '', price: '', category: '', categories: [],
    inStock: true, availabilityStatus: 'instock', sizes: [], colors: []
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    categoryAPI.getAll().then(r => setCategories(r.data)).catch(() => {});
    if (isEdit) {
      const token = localStorage.getItem('seller_token');
      API.get(`/seller/products/${id}`, { headers: { Authorization: `Bearer ${token}` } }).then(r => {
        const p = r.data;
        setForm({ 
          name: p.name, description: p.description, price: p.price, 
          category: p.category, categories: p.categories?.length ? p.categories : (p.category ? [p.category] : []),
          inStock: p.inStock, availabilityStatus: p.availabilityStatus || (p.inStock ? 'instock' : 'preorder'),
          sizes: p.sizes || [], colors: p.colors || []
        });
        setImagePreviews(p.images?.length ? p.images : (p.image ? [p.image] : []));
      }).catch(() => toast.error('Product not found'));
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImage = (e) => {
    const files = Array.from(e.target.files || []).slice(0, MAX_IMAGES - imagePreviews.length);
    const urls = files.map(f => URL.createObjectURL(f));
    setImageFiles(prev => [...prev, ...files]);
    setImagePreviews(prev => [...prev, ...urls]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      Object.keys(form).forEach(key => {
        if (Array.isArray(form[key])) fd.append(key, JSON.stringify(form[key]));
        else fd.append(key, form[key]);
      });
      imageFiles.forEach(file => fd.append('images', file));
      const existingUrls = imagePreviews.filter(src => !src.startsWith('blob:'));
      if (existingUrls.length) fd.append('images', JSON.stringify(existingUrls));

      const token = localStorage.getItem('seller_token');
      const headers = { Authorization: `Bearer ${token}` };

      if (isEdit) await API.put(`/seller/products/${id}`, fd, { headers });
      else await API.post('/seller/products', fd, { headers });
      
      toast.success(`Product ${isEdit ? 'updated' : 'created'}`);
      navigate('/dashboard/products');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-layout">
      <SellerSidebar />
      <main className="admin-main">
        <div className="admin-header">
          <h1>{isEdit ? 'Edit Product' : 'Add Product'}</h1>
        </div>
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Product Images</label>
            <input type="file" multiple accept="image/*" onChange={handleImage} />
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
              {imagePreviews.map((url, i) => (
                <img key={i} src={url} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }} />
              ))}
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input type="text" id="name" name="name" value={form.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label htmlFor="price">Price ($)</label>
            <input type="number" id="price" name="price" value={form.price} onChange={handleChange} required min="0" step="0.01" />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea id="description" name="description" value={form.description} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Availability Status</label>
            <select name="availabilityStatus" value={form.availabilityStatus} onChange={handleChange} style={{ width: '100%', padding: '10px' }}>
              <option value="instock">In Stock</option>
              <option value="preorder">Pre-order</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <HiSave /> {loading ? 'Saving...' : 'Save Product'}
          </button>
        </form>
      </main>
    </div>
  );
}
