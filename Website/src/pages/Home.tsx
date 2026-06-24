import { Link } from 'react-router-dom';
import EditorWidget from '../widgets/EditorWidget';
import DMARCWidget from '../widgets/DMARCWidget';
import WorkspaceWidget from '../widgets/WorkspaceWidget';

export default function Home() {
  return (
    <>
      {/* ===== Hero ===== */}
      <section className="hero">
        <div className="hero-bg-glow" />
        <div className="hero-bg-grid" />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-tag">&lt;HTMLedger /&gt;</div>
          <h1 className="hero-title">
            HTML Editing,<br />Reimagined
          </h1>
          <p className="hero-sub">
            A free, powerful desktop editor for HTML, CSS, JavaScript, and XML —
            built on Monaco, the engine behind VS Code.
          </p>
          <div className="hero-btns">
            <Link to="/download" className="btn btn-primary btn-lg">
              ↓ &nbsp;Download Free
            </Link>
            <a href="#features" className="btn btn-ghost btn-lg">
              See Features
            </a>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-num">100%</div>
              <div className="hero-stat-label">Free Forever</div>
            </div>
            <div className="hero-stat" style={{ borderLeft: '1px solid var(--border)', paddingLeft: '2.5rem' }}>
              <div className="hero-stat-num">5+</div>
              <div className="hero-stat-label">File Types</div>
            </div>
            <div className="hero-stat" style={{ borderLeft: '1px solid var(--border)', paddingLeft: '2.5rem' }}>
              <div className="hero-stat-num">Win</div>
              <div className="hero-stat-label">10 &amp; 11</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Features ===== */}
      <section id="features" className="section">
        <div className="container">

          {/* Feature 1: Editor */}
          <div className="feature-row">
            <div className="feature-text">
              <span className="section-label">Monaco Editor</span>
              <h2 className="section-title">Pro-Grade Editing,<br />Right on Your Desktop</h2>
              <p className="section-body">
                Built on the same engine as VS Code, HTMLedger brings Emmet abbreviations,
                instant Ctrl+Z, multi-tab support, and format-on-command to every file you open.
              </p>
              <ul className="feature-list">
                <li>Syntax highlighting for HTML, CSS, JS &amp; XML</li>
                <li>Emmet abbreviations — tab to expand</li>
                <li>Multi-tab with unsaved-change tracking</li>
                <li>Format, save, and live-preview in one window</li>
              </ul>
            </div>
            <div className="feature-widget-wrap">
              <EditorWidget />
            </div>
          </div>

          <div className="feature-divider" />

          {/* Feature 2: DMARC — flipped */}
          <div className="feature-row flip">
            <div className="feature-text">
              <span className="section-label">DMARC Analyzer</span>
              <h2 className="section-title">Turn DMARC XML Into<br />Instant Clarity</h2>
              <p className="section-body">
                Stop squinting at raw XML. HTMLedger auto-detects DMARC aggregate reports
                and renders them as clean, color-coded cards — policy, source IPs, pass/fail at a glance.
              </p>
              <ul className="feature-list">
                <li>Auto-detected from XML file content</li>
                <li>Visual pass / fail color coding</li>
                <li>Policy, SPF, DKIM results per source IP</li>
                <li>Try it live — paste your own XML in the widget →</li>
              </ul>
            </div>
            <div className="feature-widget-wrap">
              <DMARCWidget />
            </div>
          </div>

          <div className="feature-divider" />

          {/* Feature 3: Workspace */}
          <div className="feature-row">
            <div className="feature-text">
              <span className="section-label">Workspace Manager</span>
              <h2 className="section-title">Your Files,<br />Organized Like a Pro</h2>
              <p className="section-body">
                Open a folder as a workspace and get an instant card grid of every file —
                with search, sort, rename, duplicate, drag-and-drop, and right-click context menus.
              </p>
              <ul className="feature-list">
                <li>Color-coded file type badges</li>
                <li>Instant search &amp; multi-column sort</li>
                <li>Right-click context menu (rename, delete, explore)</li>
                <li>Recent files shown on the home screen</li>
              </ul>
            </div>
            <div className="feature-widget-wrap">
              <WorkspaceWidget />
            </div>
          </div>

        </div>
      </section>

      {/* ===== Download CTA ===== */}
      <section className="cta-strip">
        <div className="container">
          <h2>Ready to edit faster?</h2>
          <p>
            Download HTMLedger free for Windows 10/11.<br />
            No subscription. No signup. No catch.
          </p>
          <Link to="/download" className="btn btn-primary btn-lg">
            ↓ &nbsp;Download Free
          </Link>
        </div>
      </section>
    </>
  );
}
