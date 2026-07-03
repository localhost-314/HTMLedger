import { Link } from 'react-router-dom';

const LITE_URL = 'https://github.com/localhost-314/HTMLedger/releases/download/v2.0.0-lite/HTMLedger.Lite.Setup.2.0.0.exe';
const GITHUB_URL = 'https://github.com/localhost-314/HTMLedger';
const SOURCE_ZIP = 'https://github.com/localhost-314/HTMLedger/archive/refs/tags/v2.0.0-lite.zip';
const VERSION = '2.0.0';
const ACCENT = '#818cf8';

export default function LiteDownload() {
  return (
    <div className="dl-page">

      <div className="dl-opensource-blip dl-opensource-blip--lite">
        <span className="dl-opensource-dot" style={{ background: ACCENT }} />
        HTMLedger and HTMLedger Lite are fully open source — including this website.{' '}
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">Browse the code on GitHub →</a>
      </div>

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

          <div className="dl-btn-wrap">
            <a
              href={LITE_URL}
              className="btn btn-lg"
              style={{ background: ACCENT, color: '#fff' }}
              download
            >
              ↓ &nbsp;HTMLedger Lite Setup {VERSION}.exe
            </a>
          </div>

          <div className="dl-source-links">
            <a href={GITHUB_URL} className="dl-github-btn dl-github-btn--lite" target="_blank" rel="noopener noreferrer">
              <img src="/GitHub_Invertocat_White.png" alt="GitHub" className="dl-github-logo" />
              View source code on GitHub
            </a>
            <a href={SOURCE_ZIP} className="dl-source-zip" target="_blank" rel="noopener noreferrer">
              Download source code (zip)
            </a>
          </div>

          <div className="dl-meta">
            Windows x64 &nbsp;·&nbsp; ~25 MB &nbsp;·&nbsp; NSIS Installer
          </div>

          <div className="dl-smartscreen-note">
            <strong>Seeing a Windows SmartScreen warning?</strong> This is normal for new apps that
            haven't yet built a reputation with Microsoft. Click <strong>More info</strong> then{' '}
            <strong>Run anyway</strong> to proceed. HTMLedger Lite is completely open source —{' '}
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">review the full source on GitHub</a>{' '}
            before installing if you'd like. Still have questions?{' '}
            <Link to="/contact">Contact us</Link> — we're happy to help.
          </div>

          <div className="dl-gh-link">
            <a href="https://github.com/localhost-314/HTMLedger/releases/tag/v2.0.0-lite" target="_blank" rel="noopener noreferrer">
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
