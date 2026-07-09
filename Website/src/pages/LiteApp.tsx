import { Link } from 'react-router-dom';
import DummyEditorWidget from '../widgets/DummyEditorWidget';
import ScreenshotGallery, { type GalleryCategory } from '../components/ScreenshotGallery';

const GALLERY: GalleryCategory[] = [
  {
    id: 'editor',
    label: 'Editor',
    shots: [
      'HTMLedger Lite/Editor/Screenshot 2026-07-02 175416.png',
      'HTMLedger Lite/Editor/Screenshot 2026-07-02 175436.png',
      'HTMLedger Lite/Editor/Screenshot 2026-07-02 175859.png',
      'HTMLedger Lite/Editor/Screenshot 2026-07-02 175910.png',
      'HTMLedger Lite/Editor/Screenshot 2026-07-02 175919.png',
      'HTMLedger Lite/Editor/Screenshot 2026-07-02 180037.png',
    ],
  },
  {
    id: 'home',
    label: 'Home',
    shots: [
      'HTMLedger Lite/Home/Screenshot 2026-07-02 175244.png',
      'HTMLedger Lite/Home/Screenshot 2026-07-02 175313.png',
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    shots: [
      'HTMLedger Lite/Settings/Screenshot 2026-07-02 175444.png',
      'HTMLedger Lite/Settings/Screenshot 2026-07-02 175512.png',
    ],
  },
  {
    id: 'new-file',
    label: 'New File',
    shots: [
      'HTMLedger Lite/New File/Screenshot 2026-07-02 175708.png',
    ],
  },
];

const LITE_FEATURES = [
  { icon: '⚡', title: 'Instant startup', body: 'CodeMirror 6 loads in a fraction of the time. No large runtime to spin up — open and edit immediately.' },
  { icon: '📁', title: 'Workspace manager', body: 'Open any folder as a workspace. Card grid, search, sort, rename, and the built-in file type picker.' },
  { icon: '🎨', title: '11 file types', body: 'HTML, CSS, JS, JSX, TS, TSX, JSON, XML, SVG, Markdown, and plain text — all with syntax highlighting.' },
  { icon: '🔌', title: 'No install required*', body: 'The portable build runs directly — no system dependencies, no admin rights needed. *Installer also available.' },
  { icon: '🔒', title: 'Zero telemetry', body: 'Nothing is uploaded, nothing is tracked. Your files stay on your machine, period.' },
  { icon: '🆓', title: 'Completely free', body: 'No license key, no subscription, no trial timer. Free now, free forever.' },
];

const LITE_FAQS = [
  {
    q: 'What\'s the difference between HTMLedger and Lite?',
    a: 'Lite is a stripped-down, ultralight build focused on fast editing and workspace management. It drops Monaco (VS Code\'s engine) in favour of CodeMirror 6, and removes heavy features like the DMARC analyzer, snippet library, and deploy tools — giving you a much smaller, faster app.',
  },
  {
    q: 'How much smaller is Lite?',
    a: 'HTMLedger Lite installs at roughly ~260 MB vs ~690 MB for the full app. Both bundle Electron and Chromium — Monaco editor accounts for most of the remaining difference.',
  },
  {
    q: 'Does Lite support TypeScript / JSX?',
    a: 'Yes — syntax highlighting for TS, TSX, JSX, and all 11 supported file types is built in via CodeMirror 6\'s language packages.',
  },
  {
    q: 'Is Lite also free and private?',
    a: 'Identical guarantees — 100% free, zero telemetry, completely offline. Nothing leaves your machine.',
  },
];

export default function LiteApp() {
  return (
    <>
      {/* ===== Hero ===== */}
      <section className="hero">
        <div className="hero-bg-glow" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(129,140,248,0.18) 0%, transparent 70%)' }} />
        <div className="hero-bg-grid" />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-tag" style={{ color: '#818cf8', background: 'rgba(129,140,248,0.12)', borderColor: 'rgba(129,140,248,0.3)' }}>
            &lt;HTMLedger Lite /&gt;
          </div>
          <h1 className="hero-title">
            The Editor,<br />Without the Weight
          </h1>
          <p className="hero-sub">
            HTMLedger Lite is a fast, focused HTML editor powered by CodeMirror 6.
            All the essentials. None of the overhead.
          </p>

          <div className="trust-pills">
            <span className="trust-pill">🔓 Always free</span>
            <span className="trust-pill">🔒 Zero telemetry</span>
            <span className="trust-pill">✈️ Offline-first</span>
          </div>

          <div className="hero-btns">
            <Link to="/lite/download" className="btn btn-lg" style={{ background: '#818cf8', color: '#fff' }}>
              ↓&nbsp;&nbsp;Download Lite
            </Link>
            <Link to="/main" className="btn btn-ghost btn-lg">
              Compare to Full →
            </Link>
          </div>

          <div className="hero-oss">
            Open source &middot;{' '}
            <a href="https://github.com/localhost-314/HTMLedger/tree/main/HTMLedger%20Lite" target="_blank" rel="noopener noreferrer">
              View on GitHub ↗
            </a>
          </div>

          {/* Dispatchy-style stats */}
          <div className="hsd-stats">
            <div className="hsd-stat">
              <div className="hsd-key" style={{ color: '#a5b4fc' }}>~260 MB</div>
              <div className="hsd-desc">installed size</div>
            </div>
            <div className="hsd-divider" />
            <div className="hsd-stat">
              <div className="hsd-key" style={{ color: '#a5b4fc' }}>11 types</div>
              <div className="hsd-desc">of files supported</div>
            </div>
            <div className="hsd-divider" />
            <div className="hsd-stat">
              <div className="hsd-key" style={{ color: '#a5b4fc' }}>0 bytes</div>
              <div className="hsd-desc">ever sent to anyone</div>
            </div>
            <div className="hsd-divider" />
            <div className="hsd-stat">
              <div className="hsd-key" style={{ color: '#a5b4fc' }}>Free</div>
              <div className="hsd-desc">always, no catch</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Editor feature ===== */}
      <section id="features" className="section">
        <div className="container">
          <div className="feature-row">
            <div className="feature-text">
              <span className="section-label" style={{ color: '#818cf8' }}>CodeMirror 6</span>
              <h2 className="section-title">Fast, Clean Editing —<br />Nothing Wasted</h2>
              <p className="section-body">
                Lite swaps Monaco for CodeMirror 6 — a modern, modular editor that's
                a fraction of the weight. You get syntax highlighting, multi-tab support,
                and a full workspace manager without the overhead.
              </p>
              <ul className="feature-list">
                <li>Syntax highlighting for all 11 file types</li>
                <li>Multi-tab editing with unsaved-change tracking</li>
                <li>Workspace manager with search, sort &amp; context menu</li>
                <li>New file modal with file type picker</li>
              </ul>
            </div>
            <div className="feature-widget-wrap">
              <DummyEditorWidget />
            </div>
          </div>
        </div>
      </section>

      {/* ===== Feature grid ===== */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="section-label">What's Included</span>
            <h2 className="section-title">Everything You Need,<br />Nothing You Don't</h2>
          </div>
          <div className="lite-feature-grid">
            {LITE_FEATURES.map(f => (
              <div key={f.title} className="lite-feature-card">
                <div className="lite-feature-icon">{f.icon}</div>
                <h3 className="lite-feature-title">{f.title}</h3>
                <p className="lite-feature-body">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== Screenshot Gallery ===== */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="section-label" style={{ color: '#818cf8' }}>Screenshots</span>
            <h2 className="section-title">See It in Action</h2>
            <p className="section-body" style={{ maxWidth: 540, margin: '0 auto' }}>
              Real screenshots from HTMLedger Lite — no mockups, no marketing renders.
            </p>
          </div>
          <ScreenshotGallery categories={GALLERY} accentColor="#818cf8" />
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="section faq-section">
        <div className="container">
          <div className="faq-header">
            <span className="section-label">FAQ</span>
            <h2 className="section-title" style={{ textAlign: 'center' }}>Lite Questions</h2>
          </div>
          <div className="faq-grid">
            {LITE_FAQS.map(({ q, a }) => (
              <div key={q} className="faq-card">
                <h3 className="faq-q">{q}</h3>
                <p className="faq-a">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="cta-strip" style={{ borderColor: 'rgba(129,140,248,0.3)', background: 'linear-gradient(135deg, rgba(129,140,248,0.1) 0%, rgba(99,102,241,0.04) 100%)' }}>
        <div className="container">
          <h2>Light enough to love.</h2>
          <p>
            Download HTMLedger Lite free for Windows 10/11.<br />
            No subscription. No telemetry. No catch.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/lite/download" className="btn btn-lg" style={{ background: '#818cf8', color: '#fff' }}>
              ↓&nbsp;&nbsp;Download Lite Free
            </Link>
            <Link to="/main" className="btn btn-ghost btn-lg">
              See Full HTMLedger →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
