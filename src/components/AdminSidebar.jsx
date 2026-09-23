import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HiHome,
  HiCollection,
  HiPlus,
  HiLogout,
  HiArrowLeft,
  HiViewGrid,
  HiUserGroup,
  HiClipboardCheck,
  HiCurrencyDollar,
  HiMenu,
  HiX,
} from 'react-icons/hi';
import { useAuth } from '../context/AuthContext';

export default function AdminSidebar() {
  const { logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => location.pathname === path ? 'admin-nav-item active' : 'admin-nav-item';
  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile Top Header Bar */}
      <header className="mobile-admin-bar">
        <button
          className="menu-btn"
          onClick={() => setMobileOpen(true)}
          aria-label="Open admin navigation"
        >
          <HiMenu />
        </button>
        <span className="logo">AURA ADMIN</span>
        <div style={{ width: '28px' }}></div>
      </header>

      {/* Backdrop overlay on mobile */}
      {mobileOpen && (
        <div className="admin-sidebar-overlay" onClick={closeMobile} />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '16px' }}>
          <Link to="/" className="admin-sidebar-logo" style={{ flex: 1, borderBottom: 'none' }} onClick={closeMobile}>
            AURA
          </Link>
          <button
            onClick={closeMobile}
            className="mobile-categories-btn"
            style={{ display: mobileOpen ? 'block' : 'none', border: 'none', background: 'transparent', cursor: 'pointer' }}
          >
            <HiX size={20} />
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          <Link to="/manage-aura-369" className={isActive('/manage-aura-369')} onClick={closeMobile}>
            <HiHome /> Dashboard
          </Link>
          <Link to="/manage-aura-369/products" className={isActive('/manage-aura-369/products')} onClick={closeMobile}>
            <HiCollection /> Products
          </Link>
          <Link to="/manage-aura-369/categories" className={isActive('/manage-aura-369/categories')} onClick={closeMobile}>
            <HiViewGrid /> Categories
          </Link>
          <Link to="/manage-aura-369/products/new" className={isActive('/manage-aura-369/products/new')} onClick={closeMobile}>
            <HiPlus /> Add Product
          </Link>
          <Link to="/manage-aura-369/sellers" className={isActive('/manage-aura-369/sellers')} onClick={closeMobile}>
            <HiUserGroup /> Manage Sellers
          </Link>
          <Link to="/manage-aura-369/approvals" className={isActive('/manage-aura-369/approvals')} onClick={closeMobile}>
            <HiClipboardCheck /> Pending Approvals
          </Link>
          <Link to="/manage-aura-369/revenue" className={isActive('/manage-aura-369/revenue')} onClick={closeMobile}>
            <HiCurrencyDollar /> Revenue
          </Link>
        </nav>

        <div className="admin-sidebar-footer">
          <Link to="/" className="admin-nav-item" style={{ width: '100%' }} onClick={closeMobile}>
            <HiArrowLeft /> Return to Store
          </Link>
          <button
            className="admin-nav-item"
            onClick={logout}
            style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'left', cursor: 'pointer' }}
          >
            <HiLogout /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}
