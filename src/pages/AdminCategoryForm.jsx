import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { categoryAPI } from '../api';
import AdminSidebar from '../components/AdminSidebar';

export default function AdminCategoryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [formData, setFormData] = useState({ name: '' });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEdit) {
      setLoading(true);
      categoryAPI.getById(id)
        .then(r => {
          setFormData({ name: r.data.name });
          if (r.data.image) setImagePreview(r.data.image);
        })
        .catch(() => {
          toast.error('Failed to load category');
          navigate('/manage-aura-369/categories');
        })
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, navigate]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData();
    fd.append('name', formData.name);
    if (imageFile) fd.append('image', imageFile);

    try {
      if (isEdit) {
        await categoryAPI.update(id, fd);
        toast.success('Category updated');
      } else {
        await categoryAPI.create(fd);
        toast.success('Category created');
      }
      navigate('/manage-aura-369/categories');
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
          <h1>{isEdit ? 'Edit Category' : 'New Category'}</h1>
        </div>
        
        {loading && isEdit ? <div className="spinner" /> : (
          <form className="admin-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Name</label>
              <input type="text" required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
            </div>

            <div className="form-group">
              <label>Category Image</label>
              <div className="image-upload" onClick={() => document.getElementById('cat-image').click()}>
                <input id="cat-image" type="file" accept="image/*" onChange={handleImageChange} />
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="preview" />
                ) : (
                  <div style={{ color: 'var(--text-muted)' }}>Click to upload image</div>
                )}
              </div>
            </div>

            <div style={{ marginTop: '32px', display: 'flex', gap: '12px' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Category'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => navigate('/manage-aura-369/categories')}>
                Cancel
              </button>
            </div>
          </form>
        )}
      </main>
    </div>
  );
}
