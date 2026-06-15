import { Link, useLocation } from 'react-router-dom';
import { HiHome, HiCollection, HiPlus, HiLogout, HiArrowLeft, HiViewGrid, HiRefresh } from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

export default function AdminSidebar() {
  const { logout } = useAuth();
  const location = useLocation();
  const isActive = (path) => location.pathname === path ? 'admin-nav-item active' : 'admin-nav-item';

  return (
    <aside className="admin-sidebar">
      <Link to="/" className="admin-sidebar-logo">AURA</Link>
      <nav className="admin-sidebar-nav">
        <Link to="/manage-aura-369" className={isActive('/manage-aura-369')}><HiHome /> Dashboard</Link>
        <Link to="/manage-aura-369/products" className={isActive('/manage-aura-369/products')}><HiCollection /> Products</Link>
        <Link to="/manage-aura-369/categories" className={isActive('/manage-aura-369/categories')}><HiViewGrid /> Categories</Link>
        <Link to="/manage-aura-369/products/new" className={isActive('/manage-aura-369/products/new')}><HiPlus /> Add Product</Link>
        <Link to="/manage-aura-369/cj-sync" className={isActive('/manage-aura-369/cj-sync')}><HiRefresh /> CJ Sync</Link>
      </nav>
      <div className="admin-sidebar-footer">
        <Link to="/" className="admin-nav-item" style={{ width: '100%' }}><HiArrowLeft /> Return to Store</Link>
        <button className="admin-nav-item" onClick={logout} style={{ width: '100%' }}><HiLogout /> Logout</button>
      </div>
    </aside>
  );
}
