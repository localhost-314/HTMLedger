import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <Link to="/" className="nav-logo">
          <img src="/Logos/White Wordmark Ledger.png" alt="HTMLedger" />
        </Link>
        <div className="nav-links">
          <a href={pathname === '/' ? '#features' : '/#features'} className="nav-link">
            Features
          </a>
          <Link to="/download" className="nav-link">Download</Link>
          <Link to="/contact" className="nav-link">Contact</Link>
          <Link to="/download" className="btn btn-primary btn-sm nav-cta">
            Download Free
          </Link>
        </div>
      </div>
    </nav>
  );
}
