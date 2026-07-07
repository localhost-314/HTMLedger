import { Link } from 'react-router-dom';

const GITHUB_URL = 'https://github.com/localhost-314/HTMLedger';
const VERSION = '2.0.2';

export default function MainDownload() {
  return (
      <div className="dl-page">
      <div className="container">
        <div className="dl-hero">
          <div className="dl-version-chip">
            <span className="dl-version-dot" style={{ background: '#60a5fa' }} />
            Latest Release — v{VERSION}
          </div>
          <h1 className="dl-title">Download HTMLedger</h1>
          <p className="dl-sub">
            Free for Windows 10 and Windows 11. No subscription, no account.
          </p>

          <div className="dl-main-btns">
            <a
              href="https://apps.microsoft.com/detail/9P2G56KQTJDB?referrer=appbadge&mode=full"
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
            <Link to="/main/download/direct">Download directly from HTMLedger</Link>
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
            <p>HTMLedger is 100% free for personal and commercial use. No license key, no trial, no catch.</p>
          </div>
          <div className="dl-card">
            <div className="dl-card-icon">🔒</div>
            <h3>Your Files Stay Local</h3>
            <p>Everything runs on your machine. No files uploaded, no accounts created, no data collected.</p>
          </div>
          <div className="dl-card">
            <div className="dl-card-icon">🛠️</div>
            <h3>What's Included</h3>
            <p>Monaco Editor · Emmet · Multi-tab · DMARC Analyzer · Workspace Manager · Snippet Library · File Watcher</p>
          </div>
          <div className="dl-card">
            <div className="dl-card-icon">🔄</div>
            <h3>Installation</h3>
            <p>Run the installer and follow the prompts. Choose your install directory. Launch from the desktop shortcut.</p>
          </div>
          <div className="dl-card">
            <div className="dl-card-icon">💬</div>
            <h3>Need Help?</h3>
            <p>Questions or issues? <Link to="/contact" style={{ color: 'var(--accent)' }}>Contact us</Link> and we'll get back to you.</p>
          </div>
        </div>

        <div style={{ marginTop: '3.5rem', maxWidth: '640px', margin: '3.5rem auto 0' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>
            Release Notes — v{VERSION}
          </h2>
          <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {[
              'Monaco Editor with syntax highlighting for HTML, CSS, JS & XML',
              'Emmet abbreviation expansion via Tab key',
              'Multi-tab file editing with unsaved-change tracking',
              'DMARC aggregate report viewer (auto-detected from XML)',
              'Workspace manager with card grid, search & sort',
              'Built-in snippet library (HTML5, CSS Reset, JS patterns)',
              'File watcher — notifies when a file changes on disk',
              'Settings panel (font, tab size, autosave, minimap)',
              'Recent files on the home screen',
              'Right-click context menu in the file sidebar',
              'Find in folder (grep-style search with line numbers)',
              'Drag & drop files onto the editor to open them',
            ].map((note, i) => (
              <li key={i} style={{ display: 'flex', gap: '0.65rem', fontSize: '0.9375rem', color: 'var(--text-secondary)' }}>
                <span style={{ color: '#60a5fa' }}>✓</span>
                {note}
              </li>
            ))}
          </ul>
        </div>

        <div className="dl-also-lite">
          <span>Looking for something lighter?</span>
          <Link to="/lite/download" className="dl-also-lite-link">
            Check out HTMLedger Lite →
          </Link>
        </div>
      </div>
    </div>
  );
}
