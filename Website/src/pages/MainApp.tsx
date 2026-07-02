import { Link } from 'react-router-dom';
import EditorWidget from '../widgets/EditorWidget';
import SnippetWidget from '../widgets/SnippetWidget';
import WorkspaceWidget from '../widgets/WorkspaceWidget';
import ScreenshotGallery, { type GalleryCategory } from '../components/ScreenshotGallery';
import { useDownloadModal } from '../contexts/DownloadContext';

const GALLERY: GalleryCategory[] = [
  {
    id: 'editor',
    label: 'Editor',
    shots: [
      'Editor/Screenshot 2026-07-02 172146.png',
      'Editor/Screenshot 2026-07-02 172531.png',
      'Editor/Screenshot 2026-07-02 172855.png',
      'Editor/Screenshot 2026-07-02 173603.png',
      'Editor/Screenshot 2026-07-02 173834.png',
      'Editor/Screenshot 2026-07-02 173852.png',
      'Editor/Screenshot 2026-07-02 173919.png',
      'Editor/Screenshot 2026-07-02 175637.png',
    ],
  },
  {
    id: 'home',
    label: 'Home',
    shots: [
      'Home/HTMLedger Home Wideshot.png',
      'Home/Screenshot 2026-07-02 171957.png',
      'Home/Screenshot 2026-07-02 172004.png',
      'Home/Screenshot 2026-07-02 175534.png',
    ],
  },
  {
    id: 'settings',
    label: 'Settings',
    shots: [
      'Settings/Screenshot 2026-07-02 173011.png',
      'Settings/Screenshot 2026-07-02 173020.png',
      'Settings/Screenshot 2026-07-02 173031.png',
      'Settings/Screenshot 2026-07-02 173037.png',
      'Settings/Screenshot 2026-07-02 173152.png',
      'Settings/Screenshot 2026-07-02 173201.png',
      'Settings/Screenshot 2026-07-02 175605.png',
      'Settings/Screenshot 2026-07-02 175610.png',
      'Settings/Screenshot 2026-07-02 175615.png',
      'Settings/Screenshot 2026-07-02 175620.png',
    ],
  },
  {
    id: 'search',
    label: 'Search',
    shots: [
      'Search Tools/Screenshot 2026-07-02 173250.png',
      'Search Tools/Screenshot 2026-07-02 173643.png',
      'Search Tools/Screenshot 2026-07-02 174228.png',
    ],
  },
  {
    id: 'dmarc',
    label: 'DMARC',
    shots: [
      'DMARC/Screenshot 2026-07-02 173541.png',
      'DMARC/Screenshot 2026-07-02 173548.png',
      'DMARC/Screenshot 2026-07-02 174209.png',
    ],
  },
  {
    id: 'snippets',
    label: 'Snippets',
    shots: [
      'Snippet Lib/Screenshot 2026-07-02 174014.png',
      'Snippet Lib/Screenshot 2026-07-02 174020.png',
    ],
  },
  {
    id: 'more',
    label: 'More',
    shots: [
      'Console/Screenshot 2026-07-02 173001.png',
      'New File/Screenshot 2026-07-02 173217.png',
      'New Workspace/Screenshot 2026-07-02 174253.png',
      'Supported File Types/Screenshot 2026-07-02 173952.png',
      'Workspace Backup/Screenshot 2026-07-02 174034.png',
      'Editor Sidebar/Screenshot 2026-07-02 172923.png',
      'Editor Top Menu/Screenshot 2026-07-02 172952.png',
    ],
  },
];

const FAQS = [
  {
    q: 'Is HTMLedger really free?',
    a: 'Yes — 100% free for personal and commercial use. No license key, no trial period, no subscription. Ever.',
  },
  {
    q: 'Does it collect any data?',
    a: 'Zero. HTMLedger never connects to any server, never uploads your files, and collects absolutely no telemetry of any kind. What you build stays on your machine.',
  },
  {
    q: 'Why does Windows show a SmartScreen warning?',
    a: `Windows flags new apps that haven't built a reputation with Microsoft yet. Click "More info" → "Run anyway" to proceed. The full source is on GitHub if you'd like to verify.`,
  },
  {
    q: 'Will HTMLedger auto-update?',
    a: 'Yes. HTMLedger checks for updates on startup and notifies you when a new version is available — no manual re-downloading needed.',
  },
  {
    q: 'Does it work offline?',
    a: 'Completely. The app runs entirely on your machine. No internet required to edit, preview, or save files.',
  },
  {
    q: 'What file types does it support?',
    a: 'HTML, CSS, JS, JSX, TS, TSX, JSON, XML, SVG, Markdown, and DMARC aggregate reports — 11 types with full syntax highlighting.',
  },
];

export default function MainApp() {
  const { open } = useDownloadModal();
  return (
    <>
      {/* ===== Hero ===== */}
      <section className="hero">
        <div className="hero-bg-glow" />
        <div className="hero-bg-grid" />
        <div className="hero-inner" style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-tag">&lt;HTMLedger /&gt;</div>
          <h1 className="hero-title">
            HTML Editing,<br />Reimagined
          </h1>
          <p className="hero-sub">
            A free, powerful desktop editor for HTML, CSS, JavaScript, and more —
            built on Monaco, the same engine powering VS Code.
          </p>

          <div className="trust-pills">
            <span className="trust-pill">🔓 Always free</span>
            <span className="trust-pill">🔒 Zero telemetry</span>
            <span className="trust-pill">✈️ Offline-first</span>
          </div>

          <div className="hero-btns">
            <button className="btn btn-primary btn-lg" onClick={() => open('main')}>
              ↓&nbsp;&nbsp;Download Free
            </button>
            <a href="#features" className="btn btn-ghost btn-lg">
              See Features
            </a>
          </div>

          <div className="hero-oss">
            Open source &middot;{' '}
            <a href="https://github.com/localhost-314/HTMLedger" target="_blank" rel="noopener noreferrer">
              View on GitHub ↗
            </a>
          </div>

          {/* Dispatchy-style stats */}
          <div className="hsd-stats">
            <div className="hsd-stat">
              <div className="hsd-key">Monaco</div>
              <div className="hsd-desc">VS Code's editor engine</div>
            </div>
            <div className="hsd-divider" />
            <div className="hsd-stat">
              <div className="hsd-key">16 snippets</div>
              <div className="hsd-desc">built-in, ready to insert</div>
            </div>
            <div className="hsd-divider" />
            <div className="hsd-stat">
              <div className="hsd-key">11 types</div>
              <div className="hsd-desc">of files supported</div>
            </div>
            <div className="hsd-divider" />
            <div className="hsd-stat">
              <div className="hsd-key">0 bytes</div>
              <div className="hsd-desc">ever sent to anyone</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section id="features" className="section">
        <div className="container">

          {/* Monaco Editor */}
          <div className="feature-row">
            <div className="feature-text">
              <span className="section-label">Monaco Editor</span>
              <h2 className="section-title">Pro-Grade Editing,<br />Right on Your Desktop</h2>
              <p className="section-body">
                Built on the same engine as VS Code, HTMLedger brings Emmet abbreviations,
                instant Ctrl+Z, multi-tab support, and format-on-command to every file you open.
              </p>
              <ul className="feature-list">
                <li>Syntax highlighting for HTML, CSS, JS, TS, JSX &amp; more</li>
                <li>Emmet abbreviations — tab to expand</li>
                <li>Multi-tab editing with unsaved-change tracking</li>
                <li>Format, save, and live-preview in one window</li>
              </ul>
            </div>
            <div className="feature-widget-wrap">
              <EditorWidget />
            </div>
          </div>

          <div className="feature-divider" />

          {/* Snippet Library */}
          <div className="feature-row flip">
            <div className="feature-text">
              <span className="section-label">Snippet Library</span>
              <h2 className="section-title">16 Ready-to-Use Blocks,<br />One Click Away</h2>
              <p className="section-body">
                Stop rewriting boilerplate. HTMLedger ships with 16 built-in snippets across
                HTML, CSS, and JS — plus add your own. Click once to insert, move on.
              </p>
              <ul className="feature-list">
                <li>HTML5 boilerplate, nav bars, forms, article cards</li>
                <li>CSS resets, flexbox, grid, custom properties</li>
                <li>JS fetch, ES6 class, arrow functions, DOM ready</li>
                <li>Save and reuse your own custom snippets</li>
              </ul>
            </div>
            <div className="feature-widget-wrap">
              <SnippetWidget />
            </div>
          </div>

          <div className="feature-divider" />

          {/* Workspace */}
          <div className="feature-row">
            <div className="feature-text">
              <span className="section-label">Workspace Manager</span>
              <h2 className="section-title">Your Files,<br />Organized Like a Pro</h2>
              <p className="section-body">
                Open a folder as a workspace and get an instant card grid of every file —
                HTML, CSS, TS, TSX, JSON, Markdown, XML, and more.
                Search, sort, and right-click for full control.
              </p>
              <ul className="feature-list">
                <li>Color-coded badges for 11 file types</li>
                <li>Instant search &amp; multi-column sort</li>
                <li>Right-click context menu — rename, delete, explore</li>
                <li>Create new files with the built-in type picker</li>
              </ul>
            </div>
            <div className="feature-widget-wrap">
              <WorkspaceWidget />
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '4rem' }}>
            <Link to="/main/features" className="view-all-link">
              View all features →
            </Link>
          </div>

        </div>
      </section>

      {/* ===== Screenshot Gallery ===== */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <span className="section-label">Screenshots</span>
            <h2 className="section-title">See It in Action</h2>
            <p className="section-body" style={{ maxWidth: 540, margin: '0 auto' }}>
              Real screenshots from the app — no mockups, no marketing renders.
            </p>
          </div>
          <ScreenshotGallery categories={GALLERY} />
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="section faq-section">
        <div className="container">
          <div className="faq-header">
            <span className="section-label">FAQ</span>
            <h2 className="section-title" style={{ textAlign: 'center' }}>Common Questions</h2>
          </div>
          <div className="faq-grid">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="faq-card">
                <h3 className="faq-q">{q}</h3>
                <p className="faq-a">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="cta-strip">
        <div className="container">
          <h2>Ready to edit faster?</h2>
          <p>
            Download HTMLedger free for Windows 10/11.<br />
            No subscription. No signup. No telemetry. No catch.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => open('main')}>
              ↓&nbsp;&nbsp;Download Free
            </button>
            <Link to="/lite" className="btn btn-ghost btn-lg">
              Try HTMLedger Lite →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
