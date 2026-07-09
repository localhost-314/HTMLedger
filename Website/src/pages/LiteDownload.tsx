import { Link } from 'react-router-dom';

const GITHUB_URL = 'https://github.com/localhost-314/HTMLedger/tree/main/HTMLedger%20Lite';
const VERSION = '2.0.2';
const ACCENT = '#818cf8';

export default function LiteDownload() {
  return (
      <div className="dl-page">
      <div className="container">
        <div className="dl-hero">
          <div className="dl-version-chip" style={{ borderColor: ACCENT + '55', color: ACCENT }}>
            <span className="dl-version-dot" style={{ background: ACCENT }} />
            Latest Release — v{VERSION}
          </div>
          <h1 className="dl-title">Download HTMLedger Lite</h1>
          <p className="dl-sub">
            Free for Windows 10 and Windows 11. Ultralight, fast startup, no subscription.
          </p>

          <div className="dl-main-btns">
            <a
              href="https://apps.microsoft.com/detail/9NFD2K13FB56?referrer=appbadge&mode=full"
              target="_blank"
              rel="noopener noreferrer"
              className="dl-main-btn-store"
            >
              <img src="https://get.microsoft.com/images/en-us%20dark.svg" alt="Get it from Microsoft" />
            </a>
            <a href={GITHUB_URL} className="dl-main-btn-github" target="_blank" rel="noopener noreferrer">
              <img src="/GitHub_Invertocat_White.png" alt="GitHub" className="dl-github-logo" />
              View source code on GitHub
            </a>
          </div>

          <div className="dl-meta">
            Windows 10 &amp; 11 Compatible
          </div>

          <div className="dl-direct-link">
            <Link to="/lite/download/direct">Download directly from HTMLedger</Link>
          </div>
        </div>

        <div className="dl-cards">
          <div className="dl-card">
            <div className="dl-card-icon">⚡</div>
            <h3>System Requirements</h3>
            <p>Windows 10 or 11 (64-bit). No additional runtimes required — everything is bundled.</p>
          </div>
          <div className="dl-card">
            <div className="dl-card-icon">🔓</div>
            <h3>Always Free</h3>
            <p>HTMLedger Lite is 100% free for personal and commercial use. No license key, no trial, no catch.</p>
          </div>
          <div className="dl-card">
            <div className="dl-card-icon">🔒</div>
            <h3>Your Files Stay Local</h3>
            <p>Everything runs on your machine. No files uploaded, no accounts created, no data collected.</p>
          </div>
          <div className="dl-card">
            <div className="dl-card-icon">🛠️</div>
            <h3>What's Included</h3>
            <p>CodeMirror 6 · 11 file types · Multi-tab · Workspace Manager · File Search · Live Preview</p>
          </div>
          <div className="dl-card">
            <div className="dl-card-icon">🔄</div>
            <h3>Installation</h3>
            <p>Run the installer and follow the prompts. Choose your install directory. Launch from the desktop shortcut.</p>
          </div>
          <div className="dl-card">
            <div className="dl-card-icon">💬</div>
            <h3>Need Help?</h3>
            <p>Questions or issues? <Link to="/contact" style={{ color: ACCENT }}>Contact us</Link> and we'll get back to you.</p>
          </div>
        </div>

        <div style={{ marginTop: '3.5rem', maxWidth: '640px', margin: '3.5rem auto 0' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>
            Release Notes — v{VERSION}
          </h2>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {[
              'CodeMirror 6 editor with syntax highlighting for 11 file types',
              'Multi-tab file editing with unsaved-change indicators',
              'Workspace manager — open, save, and switch projects',
              'File search within a workspace',
              'Live preview panel for HTML files',
              'Settings panel (font size, tab size, theme)',
              'Recent files on the home screen',
              'Drag & drop files onto the editor to open them',
              'Fast startup — significantly lighter than the full edition',
            ].map((note, i) => (
              <li key={i} style={{ display: 'flex', gap: '0.65rem', fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                <span style={{ color: ACCENT }}>✓</span>
                {note}
              </li>
            ))}
          </ul>
        </div>

        <div className="dl-also-lite">
          <span>Need more power?</span>
          <Link to="/main/download" className="dl-also-lite-link" style={{ color: '#60a5fa' }}>
            Check out HTMLedger Full →
          </Link>
        </div>
      </div>
    </div>
  );
}
