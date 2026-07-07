import { useState } from 'react';
import { Link } from 'react-router-dom';

const MAIN_URL = 'https://github.com/localhost-314/HTMLedger/releases/download/v2.0.2/HTMLedger.Setup.2.0.2.exe';
const GITHUB_URL = 'https://github.com/localhost-314/HTMLedger';
const VERSION = '2.0.2';

export default function DirectDownload() {
  const [showWarning, setShowWarning] = useState(false);

  function handleDownloadClick(e: React.MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    setShowWarning(true);
  }

  function confirmDownload() {
    setShowWarning(false);
    window.location.href = MAIN_URL;
  }

  return (
    <>
      {showWarning && (
        <div className="direct-dl-overlay" onClick={() => setShowWarning(false)}>
          <div className="direct-dl-modal" onClick={e => e.stopPropagation()}>
            <h2 className="direct-dl-modal-title">Heads up before you download</h2>
            <p className="direct-dl-modal-body">
              Direct downloads do not receive automatic updates. To get the latest version automatically,
              install HTMLedger from the Microsoft Store instead.
            </p>
            <div className="direct-dl-modal-badge">
              <ms-store-badge
                productid="9P2G56KQTJDB"
                window-mode="direct"
                theme="dark"
                size="large"
                language="en-us"
                animation="on"
              />
            </div>
            <div className="direct-dl-modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowWarning(false)}>Cancel</button>
              <a href={MAIN_URL} className="btn btn-primary" onClick={confirmDownload}>
                Download anyway
              </a>
            </div>
          </div>
        </div>
      )}

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
            <h1 className="dl-title">Direct Download</h1>
            <p className="dl-sub">
              Download the installer directly from GitHub. No automatic updates — manage updates manually.
            </p>

            <div className="dl-btn-wrap">
              <a href={MAIN_URL} className="btn btn-primary btn-lg" onClick={handleDownloadClick}>
                ↓ &nbsp;HTMLedger Setup {VERSION}.exe
              </a>
            </div>

            <div className="dl-meta">
              Windows x64 &nbsp;·&nbsp; NSIS Installer
            </div>

            <div className="dl-smartscreen-note">
              <strong>Seeing a Windows SmartScreen warning?</strong> This is normal for apps downloaded
              outside the Microsoft Store. Click <strong>More info</strong> then{' '}
              <strong>Run anyway</strong> to proceed. HTMLedger is completely open source —{' '}
              <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">review the full source on GitHub</a>{' '}
              before installing if you'd like. Still have questions?{' '}
              <Link to="/contact">Contact us</Link> — we're happy to help.
            </div>

            <div className="dl-gh-link">
              <a href={`https://github.com/localhost-314/HTMLedger/releases/tag/v${VERSION}`} target="_blank" rel="noopener noreferrer">
                View release on GitHub ↗
              </a>
            </div>

            <div className="direct-dl-store-nudge">
              <p>Want automatic updates and no SmartScreen warnings?</p>
              <Link to="/main/download" className="direct-dl-store-link">← Get it from the Microsoft Store instead</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
