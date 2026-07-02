import { Link } from 'react-router-dom';
import { useDownloadModal } from '../contexts/DownloadContext';

const SECTIONS = [
  {
    id: 'editor',
    icon: '⌨️',
    label: 'Monaco Editor',
    title: 'Pro-Grade Editing on Your Desktop',
    body: 'HTMLedger is built on Monaco — the same editor engine that powers VS Code. You get the real thing: not a trimmed-down port, not a code-mirror clone.',
    features: [
      { name: 'Syntax highlighting', desc: 'HTML, CSS, JS, JSX, TS, TSX, JSON, XML, SVG, Markdown, and DMARC reports.' },
      { name: 'Emmet abbreviations', desc: 'Tab to expand any Emmet shorthand. Works in HTML and CSS files.' },
      { name: 'Format on command', desc: 'Format the active file with Shift+Alt+F. Prettier-quality output, no config needed.' },
      { name: 'Multi-cursor editing', desc: 'Hold Alt and click to place multiple cursors. Ctrl+D to select next match.' },
      { name: 'Minimap', desc: 'Bird\'s-eye view of your file on the right edge. Toggle it in Settings.' },
      { name: 'Auto-close brackets & tags', desc: 'Brackets, quotes, and HTML tags are auto-closed as you type.' },
    ],
  },
  {
    id: 'tabs',
    icon: '📑',
    label: 'Multi-Tab Editing',
    title: 'Keep All Your Files Open at Once',
    body: 'Open as many tabs as you need. HTMLedger tracks unsaved changes per-tab, shows a dot indicator on modified files, and restores your session on next launch.',
    features: [
      { name: 'Unlimited tabs', desc: 'Open as many files as you need — no tab limit.' },
      { name: 'Unsaved-change indicator', desc: 'A dot appears on tabs with unsaved content. You\'ll never lose track.' },
      { name: 'Session restore', desc: 'Reopen HTMLedger and your last tabs come back automatically.' },
      { name: 'Drag to reorder', desc: 'Drag tabs left or right to rearrange them.' },
      { name: 'Close all / close others', desc: 'Right-click any tab for bulk-close options.' },
    ],
  },
  {
    id: 'preview',
    icon: '👁️',
    label: 'Live Preview',
    title: 'See Your HTML Instantly',
    body: 'The live preview pane renders your HTML exactly as a browser would. Split, code-only, and preview-only layouts let you work the way that suits you.',
    features: [
      { name: 'Auto-refresh on save', desc: 'The preview updates the moment you save. No manual reload needed.' },
      { name: 'Three layout modes', desc: 'Split view, code-only, or preview-only — switch from the toolbar.' },
      { name: 'Full browser rendering', desc: 'Powered by Chromium (via Electron). Renders CSS, JS, and SVG faithfully.' },
      { name: 'Framework detection', desc: 'HTMLedger warns you if a file uses React / module imports that won\'t preview inline.' },
      { name: 'Console output', desc: 'See console.log output and JS errors directly in the app.' },
    ],
  },
  {
    id: 'workspace',
    icon: '📁',
    label: 'Workspace Manager',
    title: 'Your Files, Organized Like a Pro',
    body: 'Open any folder as a workspace and get an instant card grid of every file inside — color-coded by type, with search, sort, and full context menus.',
    features: [
      { name: 'Card grid view', desc: 'Each file shows its type badge, line count, a code preview, and an Open button.' },
      { name: 'Color-coded type badges', desc: '11 file types, each with a unique color: HTML (orange), CSS (blue), TS (teal), and more.' },
      { name: 'Instant search', desc: 'Filter your workspace by filename as you type. Results are instant.' },
      { name: 'Multi-column sort', desc: 'Sort by name, type, size, or date modified.' },
      { name: 'Right-click context menu', desc: 'Rename, delete, duplicate, open in Explorer, or reveal in sidebar.' },
      { name: 'Sidebar file tree', desc: 'A collapsible file tree stays open alongside the editor for quick navigation.' },
      { name: 'Recent files', desc: 'The home screen shows your recently opened workspaces and files.' },
    ],
  },
  {
    id: 'search',
    icon: '🔍',
    label: 'Search Tools',
    title: 'Find Anything in Your Project',
    body: 'HTMLedger ships with two search tools: quick find-in-file (Ctrl+F) and a full find-in-folder that searches across every file in your workspace.',
    features: [
      { name: 'Find in file', desc: 'Standard Ctrl+F search with regex, match case, and whole word options.' },
      { name: 'Find in folder', desc: 'Grep-style search across all files in the workspace. Results show file, line, and a snippet.' },
      { name: 'Regex support', desc: 'Both search tools support regular expressions.' },
      { name: 'Replace', desc: 'Replace one match or all matches, in-file or across the workspace.' },
    ],
  },
  {
    id: 'snippets',
    icon: '⚡',
    label: 'Snippet Library',
    title: '16 Ready-to-Use Code Blocks',
    body: 'Stop rewriting boilerplate. Click once to insert common HTML structures, CSS patterns, and JS utilities. Add your own custom snippets and they\'ll be there every time.',
    features: [
      { name: 'HTML snippets', desc: 'HTML5 boilerplate, meta tags, Open Graph tags, nav, form, table, article card.' },
      { name: 'CSS snippets', desc: 'CSS reset, flexbox center, CSS grid, media query, custom properties.' },
      { name: 'JS snippets', desc: 'Fetch + async/await, ES6 class, arrow function, DOM ready, localStorage helper.' },
      { name: 'Custom snippets', desc: 'Add your own snippets — they\'re saved locally and persist across sessions.' },
      { name: 'One-click insert', desc: 'Click a snippet to insert it at the cursor. No typing required.' },
    ],
  },
  {
    id: 'dmarc',
    icon: '🛡️',
    label: 'DMARC Analyzer',
    title: 'Read DMARC Reports Without the Headache',
    body: 'Open any DMARC aggregate report XML and HTMLedger automatically switches to a visual summary — no external tools, no uploads, no parsing by hand.',
    features: [
      { name: 'Auto-detection', desc: 'HTMLedger detects DMARC XML files by schema and switches the view automatically.' },
      { name: 'Visual summary', desc: 'Policy, reporting period, and per-record results in a readable table.' },
      { name: 'Pass/fail breakdown', desc: 'SPF and DKIM results per record, with color-coded pass/fail/quarantine indicators.' },
      { name: 'Fully offline', desc: 'The XML is parsed locally. Nothing is uploaded or sent anywhere.' },
    ],
  },
  {
    id: 'settings',
    icon: '⚙️',
    label: 'Settings',
    title: 'Make It Yours',
    body: 'Four tabs of settings let you dial in the editor, app behavior, workspace defaults, and keyboard shortcuts — all saved locally.',
    features: [
      { name: 'Font family & size', desc: 'Choose any installed monospace font. Cascadia Code ships as the default.' },
      { name: 'Line height & ligatures', desc: 'Adjust line height and toggle font ligatures on or off.' },
      { name: 'Tab size & cursor style', desc: '2, 4, or 8 spaces. Line, block, or underline cursor.' },
      { name: 'Format on save', desc: 'Auto-format when you save. Choose never, always, or HTML-only.' },
      { name: 'Default layout', desc: 'Set your preferred layout (split / code-only / preview-only) per session.' },
      { name: 'Keyboard shortcuts', desc: 'View all shortcuts from the Settings panel. Customisation coming soon.' },
      { name: 'Workspace backup', desc: 'Configure automatic workspace backups on a schedule you control.' },
    ],
  },
  {
    id: 'privacy',
    icon: '🔒',
    label: 'Privacy & Updates',
    title: 'Zero Data. Auto Updates.',
    body: 'HTMLedger never phones home, never uploads your files, and collects zero telemetry of any kind. Updates check GitHub Releases on startup — that\'s the only network request.',
    features: [
      { name: 'Zero telemetry', desc: 'No analytics, no crash reporting, no usage data. Nothing leaves your machine.' },
      { name: 'No account required', desc: 'Download and run. No email, no sign-up, no license key.' },
      { name: 'Auto-update notifications', desc: 'HTMLedger checks for new releases on startup and shows a banner when one is available.' },
      { name: 'Open source', desc: 'Full source code on GitHub. Audit anything you like.' },
    ],
  },
];

export default function Features() {
  const { open } = useDownloadModal();

  return (
    <>
      {/* Hero */}
      <section className="hero" style={{ paddingBottom: '4rem' }}>
        <div className="hero-bg-glow" />
        <div className="hero-bg-grid" />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div className="hero-tag">&lt;HTMLedger /&gt;</div>
          <h1 className="hero-title" style={{ fontSize: 'clamp(2rem, 5vw, 3.25rem)' }}>
            Everything HTMLedger Can Do
          </h1>
          <p className="hero-sub">
            A full breakdown of every feature — organized by category.
          </p>
          <div className="hero-btns">
            <button className="btn btn-primary btn-lg" onClick={() => open('main')}>
              ↓&nbsp;&nbsp;Download Free
            </button>
            <Link to="/lite/features" className="btn btn-ghost btn-lg">
              See Lite instead →
            </Link>
          </div>
        </div>
      </section>

      {/* Feature sections */}
      <div className="feats-root">
        {SECTIONS.map((sec, i) => (
          <section key={sec.id} id={sec.id} className={`feats-section${i % 2 === 1 ? ' feats-section--alt' : ''}`}>
            <div className="container">
              <div className="feats-head">
                <span className="feats-icon">{sec.icon}</span>
                <div>
                  <span className="section-label">{sec.label}</span>
                  <h2 className="section-title" style={{ marginTop: '0.25rem' }}>{sec.title}</h2>
                  <p className="section-body">{sec.body}</p>
                </div>
              </div>
              <div className="feats-grid">
                {sec.features.map(f => (
                  <div key={f.name} className="feats-item">
                    <div className="feats-item-name">{f.name}</div>
                    <div className="feats-item-desc">{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ))}
      </div>

      {/* CTA */}
      <section className="cta-strip">
        <div className="container">
          <h2>Everything above, for free.</h2>
          <p>No subscription. No signup. No telemetry. Download and start editing.</p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary btn-lg" onClick={() => open('main')}>
              ↓&nbsp;&nbsp;Download HTMLedger Free
            </button>
            <Link to="/lite" className="btn btn-ghost btn-lg">
              See HTMLedger Lite →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
