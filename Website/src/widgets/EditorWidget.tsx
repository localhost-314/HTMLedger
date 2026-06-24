import { useState } from 'react';
import './EditorWidget.css';

// ── Syntax highlighting (single-pass, no chained regexes) ──────────────────

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function hlTag(raw: string): string {
  if (raw.startsWith('<!--')) return `<span class="hl-comment">${esc(raw)}</span>`;
  if (/^<![A-Z]/.test(raw)) return `<span class="hl-meta">${esc(raw)}</span>`;

  const isClose = raw.startsWith('</');
  const isSelf  = raw.endsWith('/>');
  const inner   = raw.slice(isClose ? 2 : 1, isSelf ? -2 : -1);
  const ws      = inner.search(/\s/);
  const name    = ws === -1 ? inner : inner.slice(0, ws);
  const attrStr = ws === -1 ? '' : inner.slice(ws);

  let r = `<span class="hl-bracket">${isClose ? '&lt;/' : '&lt;'}</span>`;
  r += `<span class="hl-tag">${name}</span>`;

  if (attrStr) {
    r += attrStr.replace(/\s+([\w:-]+)(?:="([^"]*)")?/g, (_, n, v) =>
      v !== undefined
        ? ` <span class="hl-attr">${n}</span>=<span class="hl-val">"${v}"</span>`
        : ` <span class="hl-attr">${n}</span>`
    );
  }

  r += `<span class="hl-bracket">${isSelf ? '/&gt;' : '&gt;'}</span>`;
  return r;
}

function hlHTMLLine(line: string): string {
  let r = '', i = 0;
  while (i < line.length) {
    if (line[i] === '<') {
      const end = line.indexOf('>', i);
      if (end === -1) { r += '&lt;' + esc(line.slice(i + 1)); break; }
      r += hlTag(line.slice(i, end + 1));
      i = end + 1;
    } else if (line[i] === '&') { r += '&amp;'; i++;
    } else if (line[i] === '>') { r += '&gt;'; i++;
    } else { r += line[i]; i++; }
  }
  return r;
}

function hlCSSLine(line: string): string {
  if (/^\s*[a-zA-Z*#.&@[\-]/.test(line) && line.trimEnd().endsWith('{')) {
    return line.replace(/^(\s*)(.+?)(\s*\{)$/, (_, ind, sel, brace) =>
      `${ind}<span class="hl-selector">${sel.trim()}</span>${brace}`
    );
  }
  const m = line.match(/^(\s*)([\w-]+)(\s*:\s*)(.+?)(;?\s*)$/);
  if (m) {
    return `${m[1]}<span class="hl-prop">${m[2]}</span>${m[3]}<span class="hl-css-val">${m[4]}</span>${m[5]}`;
  }
  return line;
}

// ── Static code samples ────────────────────────────────────────────────────

const HTML_CODE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Portfolio</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="card">
    <h1>Hello, World!</h1>
    <p>Built with HTMLedger</p>
    <a href="#" class="btn">
      Get Started
    </a>
  </div>
</body>
</html>`;

const CSS_CODE = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: #0f0f1a;
  color: #e8e8f8;
  font-family: 'Segoe UI', sans-serif;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card {
  background: #1c1c32;
  border: 1px solid rgba(255,255,255,.07);
  border-radius: 16px;
  padding: 2.5rem 2rem;
  text-align: center;
}

h1 {
  font-size: 1.75rem;
  color: #4f6ef7;
  margin-bottom: 0.5rem;
}

p {
  color: #8888b0;
  margin-bottom: 1.5rem;
}

.btn {
  display: inline-block;
  background: #4f6ef7;
  color: #fff;
  padding: 0.6rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
}`;

const PREVIEW_SRC = `<!DOCTYPE html><html><head><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0f0f1a;color:#e8e8f8;font-family:'Segoe UI',sans-serif;min-height:100vh;display:flex;align-items:center;justify-content:center}.card{background:#1c1c32;border:1px solid rgba(255,255,255,.07);border-radius:16px;padding:2.5rem 2rem;text-align:center}h1{font-size:1.75rem;color:#4f6ef7;margin-bottom:.5rem}p{color:#8888b0;margin-bottom:1.5rem}.btn{display:inline-block;background:#4f6ef7;color:#fff;padding:.6rem 1.5rem;border-radius:8px;text-decoration:none;font-weight:600}</style></head><body><div class="card"><h1>Hello, World!</h1><p>Built with HTMLedger</p><a href="#" class="btn">Get Started</a></div></body></html>`;

const HTML_LINES = HTML_CODE.split('\n').map(hlHTMLLine);
const CSS_LINES  = CSS_CODE.split('\n').map(hlCSSLine);

// ── Component ──────────────────────────────────────────────────────────────

export default function EditorWidget() {
  const [tab, setTab] = useState<'html' | 'css'>('html');
  const lines = tab === 'html' ? HTML_LINES : CSS_LINES;

  return (
    <div className="ew-wrap">
      <div className="ew-topbar">
        <div className="ew-tabs">
          <button className={`ew-tab ${tab === 'html' ? 'active' : ''}`} onClick={() => setTab('html')}>
            <span className="ew-dot ew-dot-html" />index.html
          </button>
          <button className={`ew-tab ${tab === 'css' ? 'active' : ''}`} onClick={() => setTab('css')}>
            <span className="ew-dot ew-dot-css" />style.css
          </button>
        </div>
        <span className="ew-pill">● LIVE</span>
      </div>

      <div className="ew-body">
        <div className="ew-editor">
          <pre className="ew-pre">
            {lines.map((line, i) => (
              <div key={i} className="ew-line">
                <span className="ew-ln">{i + 1}</span>
                <span className="ew-code" dangerouslySetInnerHTML={{ __html: line || ' ' }} />
              </div>
            ))}
          </pre>
        </div>

        <div className="ew-preview">
          <div className="ew-preview-bar">
            <span className="ew-pb-dot" /><span className="ew-pb-dot" /><span className="ew-pb-dot" />
            <span className="ew-pb-label">preview</span>
          </div>
          <iframe srcDoc={PREVIEW_SRC} title="Live Preview" sandbox="allow-scripts" className="ew-iframe" />
        </div>
      </div>
    </div>
  );
}
