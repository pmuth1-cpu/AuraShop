export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <span className="footer-logo">AURA</span>
          <div className="footer-links">
            <a href="#products">Shop</a>
            <a href="#categories">Categories</a>
            <a href="https://t.me/aurashop369" target="_blank" rel="noreferrer">Contact</a>
          </div>
        </div>
        <p className="footer-copy">© {new Date().getFullYear()} Aura Shop. All rights reserved.</p>
      </div>
    </footer>
  );
}
