import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineShoppingBag, HiOutlineMenu, HiSun, HiMoon } from 'react-icons/hi';
import { useCart } from '../context/CartContext';

export default function Navbar({ onOpenCategories }) {
  const { totalItems, setIsOpen } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('aura_dark');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    localStorage.setItem('aura_dark', JSON.stringify(darkMode));
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">AURA</Link>
        <div className="navbar-links">
          <a href="#products">Shop</a>
          <button onClick={onOpenCategories} style={{background:'none', border:'none', color:'inherit', fontSize:'0.95rem', fontWeight:500, cursor:'pointer', fontFamily:'var(--font-main)'}}>Categories</button>
        </div>
        <div className="navbar-actions">
          <button className="btn-icon" onClick={() => setDarkMode(d => !d)} title={darkMode ? 'Light mode' : 'Dark mode'}>
            {darkMode ? <HiSun size={20} /> : <HiMoon size={20} />}
          </button>
          <button className="btn-icon cart-btn" onClick={() => setIsOpen(true)} id="cart-toggle">
            <HiOutlineShoppingBag size={20} />
            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
          </button>
          <button className="mobile-menu-btn"><HiOutlineMenu /></button>
        </div>
      </div>
    </nav>
  );
}
