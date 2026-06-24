import { useState } from 'react';
import './SnippetWidget.css';

interface Snippet { id: string; name: string; lang: 'html' | 'css' | 'js'; code: string; }

const SNIPPETS: Snippet[] = [
  {
    id: 'html5',
    name: 'HTML5 Boilerplate',
    lang: 'html',
    code: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport"
        content="width=device-width,
                 initial-scale=1.0">
  <title>Document</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>

</body>
</html>`,
  },
  {
    id: 'reset',
    name: 'CSS Reset',
    lang: 'css',
    code: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', sans-serif;
  line-height: 1.6;
}`,
  },
  {
    id: 'flex',
    name: 'Flexbox Center',
    lang: 'css',
    code: `.container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
}`,
  },
  {
    id: 'nav',
    name: 'Navigation Bar',
    lang: 'html',
    code: `<nav class="navbar">
  <a href="/" class="nav-brand">Brand</a>
  <ul class="nav-links">
    <li><a href="/about">About</a></li>
    <li><a href="/work">Work</a></li>
    <li><a href="/contact">Contact</a></li>
  </ul>
</nav>`,
  },
  {
    id: 'card',
    name: 'Card Component',
    lang: 'css',
    code: `.card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.08);
  padding: 1.5rem;
  transition: transform 0.2s;
}

.card:hover {
  transform: translateY(-2px);
}`,
  },
  {
    id: 'btn',
    name: 'Button Styles',
    lang: 'css',
    code: `.btn {
  display: inline-flex;
  align-items: center;
  padding: 0.6rem 1.4rem;
  border-radius: 8px;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn:hover { opacity: 0.85; }`,
  },
];

const LANG_COLOR: Record<string, string> = {
  html: '#e8834a',
  css: '#4f8ef7',
  js: '#f7d44f',
};

export default function SnippetWidget() {
  const [active, setActive] = useState('html5');
  const [copied, setCopied] = useState(false);
  const snippet = SNIPPETS.find(s => s.id === active)!;

  function copy() {
    navigator.clipboard.writeText(snippet.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="sw-wrap">
      <div className="sw-header">
        <span className="sw-title">Snippet Library</span>
        <span className="sw-count">{SNIPPETS.length} snippets</span>
      </div>
      <div className="sw-body">
        <div className="sw-list">
          {SNIPPETS.map(s => (
            <button
              key={s.id}
              className={`sw-item ${active === s.id ? 'active' : ''}`}
              onClick={() => setActive(s.id)}
            >
              <span className="sw-item-name">{s.name}</span>
              <span className="sw-lang" style={{ color: LANG_COLOR[s.lang] }}>{s.lang}</span>
            </button>
          ))}
        </div>
        <div className="sw-code-panel">
          <div className="sw-code-bar">
            <span className="sw-code-name">{snippet.name}</span>
            <button className="sw-copy" onClick={copy}>
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <pre className="sw-pre"><code>{snippet.code}</code></pre>
        </div>
      </div>
    </div>
  );
}
