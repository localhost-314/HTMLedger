import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDownloadModal } from '../contexts/DownloadContext';

function DropMenu({ children, open }: { children: React.ReactNode; open: boolean }) {
  return (
    <div className={`nav-drop-menu ${open ? 'open' : ''}`}>
      {children}
    </div>
  );
}

export default function Navbar() {
  const [scrolled, setScrolled]       = useState(false);
  const [mainOpen, setMainOpen]       = useState(false);
  const [liteOpen, setLiteOpen]       = useState(false);
  const { pathname }                  = useLocation();
  const { open: openDl }              = useDownloadModal();
  const mainRef                       = useRef<HTMLDivElement>(null);
  const liteRef                       = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (mainRef.current && !mainRef.current.contains(e.target as Node)) setMainOpen(false);
      if (liteRef.current && !liteRef.current.contains(e.target as Node)) setLiteOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  // Close dropdowns on navigation
  useEffect(() => { setMainOpen(false); setLiteOpen(false); }, [pathname]);

  const isMain = pathname.startsWith('/main');
  const isLite = pathname.startsWith('/lite');

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <Link to="/" className="nav-logo">
          <img src="/Logos/White Wordmark Ledger.png" alt="HTMLedger" />
          <span className="nav-logo-byline">A <a href="https://localhost314.com" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>localhost:314</a> app</span>
        </Link>

        <div className="nav-links">
          {/* HTMLedger dropdown */}
          <div className="nav-drop" ref={mainRef}>
            <button
              className={`nav-link nav-drop-trigger ${isMain ? 'active' : ''}`}
              onClick={() => { setMainOpen(v => !v); setLiteOpen(false); }}
            >
              HTMLedger <span className="nav-caret">{mainOpen ? '▴' : '▾'}</span>
            </button>
            <DropMenu open={mainOpen}>
              <Link to="/main" className="nav-drop-item">
                <span className="nav-drop-label">Features</span>
                <span className="nav-drop-desc">Monaco editor, snippets, workspace</span>
              </Link>
              <Link to="/main/download" className="nav-drop-item">
                <span className="nav-drop-label">Download</span>
                <span className="nav-drop-desc">Free for Windows 10 &amp; 11</span>
              </Link>
              <Link to="/main/features" className="nav-drop-item">
                <span className="nav-drop-label">All Features</span>
                <span className="nav-drop-desc">Full feature list by category</span>
              </Link>
            </DropMenu>
          </div>

          {/* Lite dropdown */}
          <div className="nav-drop" ref={liteRef}>
            <button
              className={`nav-link nav-drop-trigger ${isLite ? 'active' : ''}`}
              onClick={() => { setLiteOpen(v => !v); setMainOpen(false); }}
            >
              Lite <span className="nav-caret">{liteOpen ? '▴' : '▾'}</span>
            </button>
            <DropMenu open={liteOpen}>
              <Link to="/lite" className="nav-drop-item">
                <span className="nav-drop-label">Features</span>
                <span className="nav-drop-desc">CodeMirror 6, ultralight, fast</span>
              </Link>
              <Link to="/lite/download" className="nav-drop-item">
                <span className="nav-drop-label">Download</span>
                <span className="nav-drop-desc">~25 MB, free for Windows</span>
              </Link>
            </DropMenu>
          </div>

          <Link to="/contact" className="nav-link">Contact</Link>

          {/* Context-aware CTA */}
          {isLite ? (
            <Link to="/lite/download" className="btn btn-sm nav-cta" style={{ background: '#818cf8', color: '#fff' }}>
              Get Lite
            </Link>
          ) : isMain ? (
            <Link to="/main/download" className="btn btn-primary btn-sm nav-cta">
              Download Free
            </Link>
          ) : (
            <button className="btn btn-primary btn-sm nav-cta" onClick={() => openDl()}>
              Download Free
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
