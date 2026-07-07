import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDownloadModal } from '../contexts/DownloadContext';

const GITHUB_ISSUES = 'https://github.com/localhost-314/HTMLedger/issues';

function DropMenu({ children, open }: { children: React.ReactNode; open: boolean }) {
  return (
    <div className={`nav-drop-menu ${open ? 'open' : ''}`}>
      {children}
    </div>
  );
}

type MobileLevel = 'main' | 'htmledger' | 'lite' | 'contact';

export default function Navbar() {
  const [scrolled, setScrolled]       = useState(false);
  const [mainOpen, setMainOpen]       = useState(false);
  const [liteOpen, setLiteOpen]       = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [mobileOpen, setMobileOpen]   = useState(false);
  const [mobileLevel, setMobileLevel] = useState<MobileLevel>('main');
  const { pathname }                  = useLocation();
  const { open: openDl }              = useDownloadModal();
  const mainRef                       = useRef<HTMLDivElement>(null);
  const liteRef                       = useRef<HTMLDivElement>(null);
  const contactRef                    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (mainRef.current && !mainRef.current.contains(e.target as Node)) setMainOpen(false);
      if (liteRef.current && !liteRef.current.contains(e.target as Node)) setLiteOpen(false);
      if (contactRef.current && !contactRef.current.contains(e.target as Node)) setContactOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  useEffect(() => {
    setMainOpen(false);
    setLiteOpen(false);
    setContactOpen(false);
    setMobileOpen(false);
    setMobileLevel('main');
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  function closeMobile() {
    setMobileOpen(false);
    setMobileLevel('main');
  }

  const isMain    = pathname.startsWith('/main');
  const isLite    = pathname.startsWith('/lite');
  const isContact = pathname === '/contact';
  const isAbout   = pathname === '/about';

  const subTitles: Record<MobileLevel, string> = {
    main: '',
    htmledger: 'HTMLedger',
    lite: 'Lite',
    contact: 'Contact',
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <Link to="/" className="nav-logo">
            <img
              src={isLite ? '/Logos/White Wordmark Ledger Lite.png' : '/Logos/White Wordmark Ledger.png'}
              alt={isLite ? 'HTMLedger Lite' : 'HTMLedger'}
            />
            <span className="nav-logo-byline">A <a href="https://localhost314.com" target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>localhost:314</a> app</span>
          </Link>

          {/* Desktop nav */}
          <div className="nav-links">
            <div className="nav-drop" ref={mainRef}>
              <button
                className={`nav-link nav-drop-trigger ${isMain ? 'active' : ''}`}
                onClick={() => { setMainOpen(v => !v); setLiteOpen(false); setContactOpen(false); }}
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

            <div className="nav-drop" ref={liteRef}>
              <button
                className={`nav-link nav-drop-trigger ${isLite ? 'active' : ''}`}
                onClick={() => { setLiteOpen(v => !v); setMainOpen(false); setContactOpen(false); }}
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

            <Link to="/about" className={`nav-link ${isAbout ? 'active' : ''}`}>About</Link>

            <div className="nav-drop" ref={contactRef}>
              <button
                className={`nav-link nav-drop-trigger ${isContact ? 'active' : ''}`}
                onClick={() => { setContactOpen(v => !v); setMainOpen(false); setLiteOpen(false); }}
              >
                Contact <span className="nav-caret">{contactOpen ? '▴' : '▾'}</span>
              </button>
              <DropMenu open={contactOpen}>
                <Link to="/contact" className="nav-drop-item">
                  <span className="nav-drop-label">Contact Form</span>
                  <span className="nav-drop-desc">Send us a message</span>
                </Link>
                <a href={GITHUB_ISSUES + '/new'} target="_blank" rel="noopener noreferrer" className="nav-drop-item">
                  <span className="nav-drop-label">Report an Issue</span>
                  <span className="nav-drop-desc">Open a bug report on GitHub</span>
                </a>
                <a href={GITHUB_ISSUES} target="_blank" rel="noopener noreferrer" className="nav-drop-item">
                  <span className="nav-drop-label">View Known Issues</span>
                  <span className="nav-drop-desc">Browse open GitHub issues</span>
                </a>
              </DropMenu>
            </div>

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

          {/* Hamburger (mobile only) */}
          <button
            className={`nav-hamburger ${mobileOpen ? 'open' : ''}`}
            onClick={() => { setMobileOpen(v => !v); setMobileLevel('main'); }}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </nav>

      {/* Mobile overlay */}
      {mobileOpen && <div className="mobile-menu-overlay" onClick={closeMobile} />}

      {/* Mobile menu panel */}
      <div className={`mobile-menu ${mobileOpen ? 'open' : ''}`}>

        {/* Header */}
        <div className="mobile-menu-header">
          {mobileLevel !== 'main' ? (
            <button className="mobile-menu-back" onClick={() => setMobileLevel('main')}>
              ← {subTitles[mobileLevel]}
            </button>
          ) : (
            <span className="mobile-menu-title">Menu</span>
          )}
          <button className="mobile-menu-close" onClick={closeMobile} aria-label="Close menu">✕</button>
        </div>

        {/* Main level */}
        <div className={`mobile-menu-level ${mobileLevel === 'main' ? 'active' : 'slide-out'}`}>
          <Link to="/" className="mobile-menu-row" onClick={closeMobile}>Home</Link>
          <button className="mobile-menu-row mobile-menu-row--sub" onClick={() => setMobileLevel('htmledger')}>
            HTMLedger <span>›</span>
          </button>
          <button className="mobile-menu-row mobile-menu-row--sub" onClick={() => setMobileLevel('lite')}>
            Lite <span>›</span>
          </button>
          <Link to="/about" className="mobile-menu-row" onClick={closeMobile}>About</Link>
          <button className="mobile-menu-row mobile-menu-row--sub" onClick={() => setMobileLevel('contact')}>
            Contact <span>›</span>
          </button>
          <div className="mobile-menu-cta">
            {isLite ? (
              <Link to="/lite/download" className="btn btn-sm" style={{ background: '#818cf8', color: '#fff', width: '100%', textAlign: 'center', display: 'block' }} onClick={closeMobile}>
                Get Lite Free
              </Link>
            ) : (
              <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => { closeMobile(); openDl(); }}>
                Download Free
              </button>
            )}
          </div>
        </div>

        {/* HTMLedger sub-level */}
        <div className={`mobile-menu-level ${mobileLevel === 'htmledger' ? 'active' : 'slide-out'}`}>
          <Link to="/main" className="mobile-menu-row" onClick={closeMobile}>Features</Link>
          <Link to="/main/download" className="mobile-menu-row" onClick={closeMobile}>Download</Link>
          <Link to="/main/features" className="mobile-menu-row" onClick={closeMobile}>All Features</Link>
        </div>

        {/* Lite sub-level */}
        <div className={`mobile-menu-level ${mobileLevel === 'lite' ? 'active' : 'slide-out'}`}>
          <Link to="/lite" className="mobile-menu-row" onClick={closeMobile}>Features</Link>
          <Link to="/lite/download" className="mobile-menu-row" onClick={closeMobile}>Download</Link>
        </div>

        {/* Contact sub-level */}
        <div className={`mobile-menu-level ${mobileLevel === 'contact' ? 'active' : 'slide-out'}`}>
          <Link to="/contact" className="mobile-menu-row" onClick={closeMobile}>Contact Form</Link>
          <a href={GITHUB_ISSUES + '/new'} target="_blank" rel="noopener noreferrer" className="mobile-menu-row" onClick={closeMobile}>Report an Issue</a>
          <a href={GITHUB_ISSUES} target="_blank" rel="noopener noreferrer" className="mobile-menu-row" onClick={closeMobile}>View Known Issues</a>
        </div>

      </div>
    </>
  );
}
