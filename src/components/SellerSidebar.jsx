import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HiHome,
  HiCollection,
  HiPlus,
  HiLogout,
  HiArrowLeft,
  HiCog,
  HiCreditCard,
  HiShoppingBag,
  HiMenu,
  HiX,
} from 'react-icons/hi';
import { useSeller } from '../context/SellerAuthContext';
import NotificationBell from './NotificationBell';

export default function SellerSidebar() {
  const { logout, shop } = useSeller();
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
          aria-label="Open seller navigation"
        >
          <HiMenu />
        </button>
        <span className="logo">{shop?.name || 'SELLER PORTAL'}</span>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <NotificationBell />
        </div>
      </header>

      {/* Backdrop overlay on mobile */}
      {mobileOpen && (
        <div className="admin-sidebar-overlay" onClick={closeMobile} />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingRight: '16px' }}>
          <Link
            to={shop?.slug ? `/shop/${shop.slug}` : '/dashboard'}
            className="admin-sidebar-logo"
            style={{ flex: 1, borderBottom: 'none' }}
            onClick={closeMobile}
          >
            {shop?.name || 'MY SHOP'}
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
          <Link to="/dashboard" className={isActive('/dashboard')} onClick={closeMobile}>
            <HiHome /> Dashboard
          </Link>
          <Link to="/dashboard/orders" className={isActive('/dashboard/orders')} onClick={closeMobile}>
            <HiShoppingBag /> Orders
          </Link>
          <Link to="/dashboard/products" className={isActive('/dashboard/products')} onClick={closeMobile}>
            <HiCollection /> Products
          </Link>
          <Link to="/dashboard/products/new" className={isActive('/dashboard/products/new')} onClick={closeMobile}>
            <HiPlus /> Add Product
          </Link>
          <Link to="/dashboard/settings" className={isActive('/dashboard/settings')} onClick={closeMobile}>
            <HiCog /> Shop Settings
          </Link>
          <Link to="/dashboard/subscription" className={isActive('/dashboard/subscription')} onClick={closeMobile}>
            <HiCreditCard /> Subscription
          </Link>
        </nav>

        <div className="admin-sidebar-footer">
          <div style={{ display: 'none' }} className="desktop-bell">
            <NotificationBell />
          </div>
          <div style={{ marginBottom: '8px' }}>
            <NotificationBell />
          </div>
          {shop?.slug && (
            <Link
              to={`/shop/${shop.slug}`}
              className="admin-nav-item"
              style={{ width: '100%' }}
              onClick={closeMobile}
            >
              <HiArrowLeft /> View My Shop
            </Link>
          )}
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
