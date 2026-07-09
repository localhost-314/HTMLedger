import { Link } from 'react-router-dom';
import { useDownloadModal } from '../contexts/DownloadContext';
import EditorWidget from '../widgets/EditorWidget';
import SnippetWidget from '../widgets/SnippetWidget';
import DummyEditorWidget from '../widgets/DummyEditorWidget';

const COMPARE = [
  { feature: 'Editor engine',         main: 'Monaco (VS Code)',  lite: 'CodeMirror 6' },
  { feature: 'Install size',          main: '~690 MB',           lite: '~260 MB' },
  { feature: 'Syntax highlighting',   main: '11 file types',     lite: '11 file types' },
  { feature: 'Multi-tab editing',     main: true,                lite: true },
  { feature: 'Live HTML preview',     main: true,                lite: true },
  { feature: 'Workspace manager',     main: true,                lite: true },
  { feature: 'Snippet library',       main: true,                lite: false },
  { feature: 'DMARC report viewer',   main: true,                lite: false },
  { feature: 'Find in folder',        main: true,                lite: false },
  { feature: 'Workspace backup',      main: true,                lite: false },
  { feature: 'Portable build',        main: false,               lite: true },
];

const MAIN_FEATS = [
  { icon: '🛡️', title: 'DMARC Analyzer', desc: 'Open any DMARC aggregate XML and instantly see a visual breakdown — no uploads, no external tools.' },
  { icon: '⚡', title: 'Snippet Library', desc: '16 ready-to-insert code blocks across HTML, CSS, and JS. Plus add your own and they\'re there every session.' },
  { icon: '🔍', title: 'Find in Folder', desc: 'Grep-style search across your entire workspace. Results show file, line number, and a code snippet.' },
  { icon: '💾', title: 'Workspace Backup', desc: 'Automatically back up your workspace on a schedule you control. Restore any previous version instantly.' },
];

const LITE_FEATS = [
  { icon: '🚀', title: 'Instant Startup', desc: 'CodeMirror 6 loads in a fraction of the time Monaco takes. Open, click, edit — no waiting.' },
  { icon: '📦', title: 'Portable Build', desc: 'The portable version runs directly from a folder. No installer, no admin rights, no system changes.' },
  { icon: '🎨', title: '11 File Types', desc: 'Full syntax highlighting for HTML, CSS, JS, JSX, TS, TSX, JSON, XML, SVG, Markdown, and plain text.' },
  { icon: '🗂️', title: 'Workspace Manager', desc: 'Same card-grid workspace manager as the full edition — open, search, sort, rename, and create files.' },
];

function Cell({ val }: { val: boolean | string }) {
  if (typeof val === 'string') return <td className="cmp-cell cmp-cell--str">{val}</td>;
  return (
    <td className={`cmp-cell ${val ? 'cmp-yes' : 'cmp-no'}`}>
      {val ? '✓' : '—'}
    </td>
  );
}

export default function Home() {
  const { open, openQuiz } = useDownloadModal();

  return (
    <>
      {/* ── Hero + Both Apps Above the Fold ── */}
      <section className="hero hub-hero">
        <div className="hero-bg-glow hub-glow" />
        <div className="hero-bg-grid" />
        <div className="hub-hero-inner">
          <h1 className="hero-title hub-hero-title">
            Two editors.<br />Both free.
          </h1>
          <p className="hero-sub hub-hero-sub">
            Full Monaco power or ultralight Lite — same privacy, zero price, different power levels.
          </p>
          <div className="trust-pills">
            <span className="trust-pill">🔓 Always free</span>
            <span className="trust-pill">🔒 Zero telemetry</span>
            <span className="trust-pill">✈️ Offline-first</span>
            <span className="trust-pill">💻 Windows 10/11</span>
          </div>

          {/* Both app cards — visible on first load */}
          <div className="hub-cards hub-cards--hero">
            <div className="hub-card">
              <div className="hub-card-header">
                <span className="hub-card-badge">Full Edition</span>
                <h2 className="hub-card-name hub-card-name--sm">HTMLedger</h2>
                <p className="hub-card-engine">Monaco · the engine behind VS Code</p>
              </div>
              <ul className="hub-card-list">
                <li><span className="hub-check">✓</span> Snippet library — 16 built-in blocks</li>
                <li><span className="hub-check">✓</span> DMARC aggregate report viewer</li>
                <li><span className="hub-check">✓</span> Find in folder (grep-style search)</li>
                <li><span className="hub-check">✓</span> Workspace backup &amp; restore</li>
                <li><span className="hub-check">✓</span> Full Monaco — Emmet, minimap, format</li>
              </ul>
              <div className="hub-card-btns hub-card-btns--store">
                <a
                  href="https://apps.microsoft.com/detail/9P2G56KQTJDB?referrer=appbadge&mode=full"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src="https://get.microsoft.com/images/en-us%20dark.svg" alt="Get it from Microsoft" className="hub-store-badge" />
                </a>
                <Link to="/main" className="btn btn-ghost">Explore →</Link>
              </div>
              <a href="https://github.com/localhost-314/HTMLedger" className="hub-card-oss" target="_blank" rel="noopener noreferrer">
                Fully open source · View code →
              </a>
            </div>

            <div className="hub-vs">VS</div>

            <div className="hub-card hub-card--lite">
              <div className="hub-card-header">
                <span className="hub-card-badge hub-card-badge--lite">Lite Edition</span>
                <h2 className="hub-card-name hub-card-name--sm">HTMLedger Lite</h2>
                <p className="hub-card-engine">CodeMirror 6 · ultralight &amp; fast</p>
              </div>
              <ul className="hub-card-list">
                <li><span className="hub-check hub-check--lite">✓</span> 11 file types with syntax highlighting</li>
                <li><span className="hub-check hub-check--lite">✓</span> Workspace manager + file search</li>
                <li><span className="hub-check hub-check--lite">✓</span> Multi-tab editing</li>
                <li><span className="hub-check hub-check--lite">✓</span> Faster startup, smaller install</li>
                <li><span className="hub-check hub-check--lite">✓</span> Portable build — no install needed</li>
              </ul>
              <div className="hub-card-btns hub-card-btns--store">
                <a
                  href="https://apps.microsoft.com/detail/9NFD2K13FB56?referrer=appbadge&mode=full"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img src="https://get.microsoft.com/images/en-us%20dark.svg" alt="Get it from Microsoft" className="hub-store-badge" />
                </a>
                <Link to="/lite" className="btn btn-ghost">Explore →</Link>
              </div>
              <a href="https://github.com/localhost-314/HTMLedger/tree/main/HTMLedger%20Lite" className="hub-card-oss hub-card-oss--lite" target="_blank" rel="noopener noreferrer">
                Fully open source · View code →
              </a>
            </div>
          </div>

          <button className="hub-quiz-cta" onClick={openQuiz}>
            Not sure which is right for you? Take the 1-minute quiz →
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          HTMLedger Full — Feature Showcase
      ══════════════════════════════════════════ */}
      <section className="hub-showcase hub-showcase--main">
        <div className="hub-showcase-accent" />
        <div className="container">

          {/* Section header */}
          <div className="hub-showcase-head">
            <span className="section-label">HTMLedger — Full Edition</span>
            <h2 className="section-title">Monaco-Powered Editing,<br />Built for Your Projects</h2>
            <p className="section-body" style={{ maxWidth: 540, margin: '0 auto' }}>
              The editor VS Code runs on, packaged as a focused desktop app.
              All the power, none of the bloat.
            </p>
          </div>

          {/* Editor widget feature row */}
          <div className="feature-row" style={{ marginBottom: '3.5rem' }}>
            <div className="feature-text">
              <span className="section-label">Monaco Editor</span>
              <h3 className="section-title" style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}>
                Pro-Grade Editing,<br />Right on Your Desktop
              </h3>
              <p className="section-body">
                Emmet abbreviations, multi-cursor, format on command,
                Ctrl+Z that actually works, and live preview — all in one window.
              </p>
              <ul className="feature-list">
                <li>Syntax highlighting for 11 file types</li>
                <li>Emmet — tab to expand any shorthand</li>
                <li>Multi-tab with unsaved-change indicators</li>
                <li>Split, code-only, or preview-only layouts</li>
              </ul>
            </div>
            <div className="feature-widget-wrap">
              <EditorWidget />
            </div>
          </div>

          {/* Snippet widget feature row — flipped */}
          <div className="feature-row flip" style={{ marginBottom: '3.5rem' }}>
            <div className="feature-text">
              <span className="section-label">Snippet Library</span>
              <h3 className="section-title" style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}>
                16 Blocks, One Click Away
              </h3>
              <p className="section-body">
                HTML5 boilerplate, CSS resets, flexbox layouts, fetch patterns —
                all pre-loaded and ready to insert. Add your own and they stick.
              </p>
              <ul className="feature-list">
                <li>HTML, CSS, and JS categories</li>
                <li>Click once to insert at cursor</li>
                <li>Custom snippets saved locally</li>
              </ul>
            </div>
            <div className="feature-widget-wrap">
              <SnippetWidget />
            </div>
          </div>

          {/* Feature mini-cards */}
          <div className="hub-mini-grid">
            {MAIN_FEATS.map(f => (
              <div key={f.title} className="hub-mini-card">
                <span className="hub-mini-icon">{f.icon}</span>
                <h4 className="hub-mini-title">{f.title}</h4>
                <p className="hub-mini-desc">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Handoff */}
          <div className="hub-handoff">
            <div className="hub-handoff-text">
              <div className="hub-handoff-label">9 feature categories</div>
              <h3 className="hub-handoff-title">There's a lot more under the hood.</h3>
              <p className="hub-handoff-sub">
                Monaco editor · Live preview · Snippets · DMARC · Search tools · Settings · and more
              </p>
            </div>
            <div className="hub-handoff-btns">
              <Link to="/main/features" className="btn btn-primary">
                See all features →
              </Link>
              <Link to="/main/download" className="btn btn-ghost">
                ↓ Download Free
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ── Divider ── */}
      <div className="hub-section-divider" />

      {/* ══════════════════════════════════════════
          HTMLedger Lite — Feature Showcase
      ══════════════════════════════════════════ */}
      <section className="hub-showcase hub-showcase--lite">
        <div className="hub-showcase-accent hub-showcase-accent--lite" />
        <div className="container">

          {/* Section header */}
          <div className="hub-showcase-head">
            <span className="section-label" style={{ color: '#818cf8' }}>HTMLedger Lite</span>
            <h2 className="section-title">The Editor,<br />Without the Weight</h2>
            <p className="section-body" style={{ maxWidth: 540, margin: '0 auto' }}>
              All the editing essentials — workspace manager, 11 file types,
              multi-tab — in a package 6× smaller.
            </p>
          </div>

          {/* Lite editor widget feature row */}
          <div className="feature-row" style={{ marginBottom: '3.5rem' }}>
            <div className="feature-text">
              <span className="section-label" style={{ color: '#818cf8' }}>CodeMirror 6</span>
              <h3 className="section-title" style={{ fontSize: 'clamp(1.4rem, 3vw, 2rem)' }}>
                Fast, Clean Editing —<br />Nothing Wasted
              </h3>
              <p className="section-body">
                CodeMirror 6 loads in milliseconds. Full syntax highlighting,
                multi-tab editing, and a complete workspace manager — without the overhead.
              </p>
              <ul className="feature-list" style={{ ['--check-color' as string]: '#818cf8' }}>
                <li>Starts in under a second</li>
                <li>Multi-tab with unsaved-change tracking</li>
                <li>Workspace card grid with search &amp; sort</li>
                <li>New file modal with type picker</li>
              </ul>
            </div>
            <div className="feature-widget-wrap">
              <DummyEditorWidget />
            </div>
          </div>

          {/* Feature mini-cards */}
          <div className="hub-mini-grid">
            {LITE_FEATS.map(f => (
              <div key={f.title} className="hub-mini-card hub-mini-card--lite">
                <span className="hub-mini-icon">{f.icon}</span>
                <h4 className="hub-mini-title">{f.title}</h4>
                <p className="hub-mini-desc">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Handoff */}
          <div className="hub-handoff hub-handoff--lite">
            <div className="hub-handoff-text">
              <div className="hub-handoff-label" style={{ color: '#818cf8', background: 'rgba(129,140,248,0.12)' }}>
                ~260 MB installed · free for Windows
              </div>
              <h3 className="hub-handoff-title">Fast enough to love. Light enough to go anywhere.</h3>
              <p className="hub-handoff-sub">
                Editor · Workspace manager · 11 file types · Zero telemetry · Free forever
              </p>
            </div>
            <div className="hub-handoff-btns">
              <Link to="/lite" className="btn btn-lg" style={{ background: '#818cf8', color: '#fff' }}>
                Explore Lite →
              </Link>
              <Link to="/lite/download" className="btn btn-ghost">
                ↓ Download Lite Free
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* ── Comparison Table ── */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <span className="section-label">Feature Comparison</span>
            <h2 className="section-title">Side by Side</h2>
          </div>
          <div className="cmp-wrap">
            <table className="cmp-table">
              <thead>
                <tr>
                  <th className="cmp-th cmp-th--feature" />
                  <th className="cmp-th">HTMLedger</th>
                  <th className="cmp-th cmp-th--lite">HTMLedger Lite</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(row => (
                  <tr key={row.feature} className="cmp-row">
                    <td className="cmp-feat">{row.feature}</td>
                    <Cell val={row.main} />
                    <Cell val={row.lite} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="cta-strip">
        <div className="container">
          <h2>Free, private, and yours.</h2>
          <p>
            No subscription. No signup. No telemetry.<br />
            Pick an edition and start editing today.
          </p>
          <button className="btn btn-primary btn-lg" onClick={() => open()}>
            ↓&nbsp;&nbsp;Download Free
          </button>
        </div>
      </section>
    </>
  );
}
