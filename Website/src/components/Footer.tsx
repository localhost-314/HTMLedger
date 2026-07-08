import { Link } from 'react-router-dom';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-inner">
          <div className="footer-brand">
            <img src="/Logos/White Graphic Ledger.png" alt="HTMLedger logo" />
            <span className="footer-brand-name">&lt;HTMLedger /&gt;</span>
          </div>
          <div className="footer-links">
            <Link to="/download" className="footer-link">Download</Link>
            <Link to="/about" className="footer-link">About</Link>
            <Link to="/articles" className="footer-link">Articles</Link>
            <Link to="/contact" className="footer-link">Contact</Link>
            <Link to="/tos" className="footer-link">Terms of Service</Link>
            <Link to="/privacy" className="footer-link">Privacy Policy</Link>
            <Link to="/license" className="footer-link">License</Link>
          </div>
        </div>
        <div className="footer-bottom">
          <span className="footer-copy">© {year} HTMLedger. All rights reserved.</span>
          <div className="footer-by">
            <span>By</span>
            <img src="/localhost314 Logo.png" alt="localhost314" />
            <span style={{ color: 'var(--text-secondary)' }}>localhost314.com</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
