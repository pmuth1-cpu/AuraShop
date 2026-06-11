import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineShoppingBag, HiOutlineMenu, HiSun, HiMoon, HiChevronDown } from 'react-icons/hi';
import { categoryAPI } from '../api';
import { useCart } from '../context/CartContext';

export default function Navbar({ onOpenCategories }) {
  const { totalItems, setIsOpen } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('aura_dark');
    return saved ? JSON.parse(saved) : false;
  });
  const [showCatMenu, setShowCatMenu] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    localStorage.setItem('aura_dark', JSON.stringify(darkMode));
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    categoryAPI.getAll().then(r => setCategories(r.data)).catch(() => {});
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">AURA</Link>
        <div className="navbar-links" style={{ position: 'relative' }}>
          <a href="#products">Shop</a>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowCatMenu(v => !v)}
              style={{ background: 'none', border: 'none', color: 'inherit', fontSize: '0.95rem', fontWeight: 500, cursor: 'pointer', fontFamily: 'var(--font-main)', display: 'flex', alignItems: 'center', gap: '4px' }}
              onBlur={() => setTimeout(() => setShowCatMenu(false), 150)}
            >
              Categories <HiChevronDown size={14} />
            </button>
            {showCatMenu && (
              <div style={{
                position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                marginTop: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
                borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-lg)', minWidth: '200px',
                zIndex: 200, overflow: 'hidden'
              }}>
                {categories.map(cat => (
                  <Link
                    key={cat._id}
                    to={`/category/${encodeURIComponent(cat.name.replace(/\s+/g, '-'))}`}
                    style={{ display: 'block', padding: '10px 20px', color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.9rem', textDecoration: 'none', transition: 'var(--transition)' }}
                    onMouseDown={() => setShowCatMenu(false)}
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="navbar-actions">
          <button className="btn-icon" onClick={() => setDarkMode(d => !d)} title={darkMode ? 'Light mode' : 'Dark mode'}>
            {darkMode ? <HiSun size={20} /> : <HiMoon size={20} />}
          </button>
          <button className="btn-icon cart-btn" onClick={() => setIsOpen(true)} id="cart-toggle">
            <HiOutlineShoppingBag size={20} />
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </button>
          <button className="mobile-categories-btn" onClick={onOpenCategories} id="mobile-categories-btn" title="Open categories">
            <HiOutlineMenu size={20} />
          </button>
          <button className="mobile-menu-btn"><HiOutlineMenu /></button>
        </div>
      </div>
    </nav>
  );
}
