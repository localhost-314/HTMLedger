import { Link } from 'react-router-dom';

const MAIN_URL = 'https://github.com/localhost-314/HTMLedger/releases/download/v2.0.0/HTMLedger.Setup.2.0.0.exe';
const GITHUB_URL = 'https://github.com/localhost-314/HTMLedger';
const SOURCE_ZIP = 'https://github.com/localhost-314/HTMLedger/archive/refs/tags/v2.0.0.zip';
const VERSION = '2.0.0';

export default function MainDownload() {
  return (
    <>
      <div className="dl-blip-rail">
        <div className="dl-opensource-blip">
          <span className="dl-opensource-dot" />
          HTMLedger and HTMLedger Lite are fully open source — including this website.{' '}
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">Browse the code on GitHub →</a>
        </div>
      </div>

      <div className="dl-page dl-page--has-blip">
      <div className="container">
        <div className="dl-hero">
          <div className="dl-version-chip">
            <span className="dl-version-dot" style={{ background: '#60a5fa' }} />
            Latest Release — v{VERSION}
          </div>
          <h1 className="dl-title">Download HTMLedger</h1>
          <p className="dl-sub">
            Free for Windows 10 and Windows 11. One installer, no subscription, no account.
          </p>

          <div className="dl-btn-wrap">
            <a href={MAIN_URL} className="btn btn-primary btn-lg" download>
              ↓ &nbsp;HTMLedger Setup {VERSION}.exe
            </a>
          </div>

          <div className="dl-source-links">
            <a href={GITHUB_URL} className="dl-github-btn" target="_blank" rel="noopener noreferrer">
              <img src="/GitHub_Invertocat_White.png" alt="GitHub" className="dl-github-logo" />
              View source code on GitHub
            </a>
            <a href={SOURCE_ZIP} className="dl-source-zip" target="_blank" rel="noopener noreferrer">
              Download source code (zip)
            </a>
          </div>

          <div className="dl-meta">
            Windows x64 &nbsp;·&nbsp; ~150 MB &nbsp;·&nbsp; NSIS Installer
          </div>

          <div className="dl-smartscreen-note">
            <strong>Seeing a Windows SmartScreen warning?</strong> This is normal for new apps that
            haven't yet built a reputation with Microsoft. Click <strong>More info</strong> then{' '}
            <strong>Run anyway</strong> to proceed. HTMLedger is completely open source —{' '}
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">review the full source on GitHub</a>{' '}
            before installing if you'd like. Still have questions?{' '}
            <Link to="/contact">Contact us</Link> — we're happy to help.
          </div>

          <div className="dl-gh-link">
            <a href="https://github.com/localhost-314/HTMLedger/releases/tag/v2.0.0" target="_blank" rel="noopener noreferrer">
              View release on GitHub ↗
            </a>
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
    </>
  );
}
