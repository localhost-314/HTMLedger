import { useState, useMemo, useEffect } from 'react';
import './WorkspaceWidget.css';

interface FileCard {
  name: string;
  type: 'html' | 'css' | 'tsx' | 'ts' | 'json' | 'xml' | 'md';
  size: string;
  lines: number;
  preview: string;
}

const FILES: FileCard[] = [
  { name: 'index.html',       type: 'html', size: '4.2 KB', lines: 87,  preview: '<!DOCTYPE html>\n<html lang="en">\n<head>…' },
  { name: 'styles.css',       type: 'css',  size: '6.8 KB', lines: 214, preview: ':root {\n  --primary: #4f6ef7;\n  --bg: #0f0f1a;\n}…' },
  { name: 'App.tsx',          type: 'tsx',  size: '3.9 KB', lines: 118, preview: 'export default function App() {\n  return (\n    <div className="app">…' },
  { name: 'api.ts',           type: 'ts',   size: '2.3 KB', lines: 78,  preview: 'interface ApiResponse {\n  data: unknown;\n  status: number;\n}…' },
  { name: 'about.html',       type: 'html', size: '2.9 KB', lines: 63,  preview: '<!DOCTYPE html>\n<html>\n<body>\n  <section class="about">…' },
  { name: 'config.json',      type: 'json', size: '1.1 KB', lines: 24,  preview: '{\n  "name": "my-website",\n  "version": "1.0.0",\n  "scripts": {…' },
  { name: 'README.md',        type: 'md',   size: '0.8 KB', lines: 18,  preview: '# My Website\n\nA modern web project\nbuilt with HTMLedger.…' },
  { name: 'dmarc-report.xml', type: 'xml',  size: '1.8 KB', lines: 42,  preview: '<?xml version="1.0"?>\n<feedback>\n  <report_metadata>…' },
];

const TYPE_LABELS: Record<string, string> = {
  html: 'HTML', css: 'CSS', tsx: 'TSX', ts: 'TS',
  json: 'JSON', xml: 'XML', md: 'MD',
};

const CTX_ITEMS = ['Open →', 'Rename', 'Duplicate', '—', 'Open in Explorer', 'Delete'];

interface CtxMenu { x: number; y: number; file: string; }

export default function WorkspaceWidget() {
  const [query, setQuery]     = useState('');
  const [sort, setSort]       = useState<'name' | 'type' | 'size'>('name');
  const [active, setActive]   = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<CtxMenu | null>(null);

  useEffect(() => {
    const close = () => setCtxMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const list = FILES.filter(f => f.name.toLowerCase().includes(q));
    return [...list].sort((a, b) => {
      if (sort === 'type') return a.type.localeCompare(b.type);
      if (sort === 'size') return parseFloat(b.size) - parseFloat(a.size);
      return a.name.localeCompare(b.name);
    });
  }, [query, sort]);

  const onCtx = (e: React.MouseEvent, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ x: e.clientX, y: e.clientY, file: name });
  };

  return (
    <div className="ww-wrap">
      <div className="ww-topbar">
        <div className="ww-folder">
          <span className="ww-folder-icon">📁</span>
          <span className="ww-folder-name">my-website</span>
          <span className="ww-folder-count">{FILES.length} files</span>
        </div>
        <div className="ww-controls">
          <input
            className="ww-search"
            type="text"
            placeholder="Search…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
          <select
            className="ww-sort"
            value={sort}
            onChange={e => setSort(e.target.value as typeof sort)}
          >
            <option value="name">Name</option>
            <option value="type">Type</option>
            <option value="size">Size</option>
          </select>
        </div>
      </div>

      <div className="ww-grid">
        {filtered.length === 0 ? (
          <div className="ww-empty">No files match "{query}"</div>
        ) : filtered.map(f => (
          <div
            key={f.name}
            className={`ww-card ${active === f.name ? 'active' : ''}`}
            onClick={() => setActive(v => v === f.name ? null : f.name)}
            onContextMenu={e => onCtx(e, f.name)}
          >
            <div className="ww-card-top">
              <span className={`badge badge-${f.type}`}>{TYPE_LABELS[f.type]}</span>
              <span className="ww-size">{f.size}</span>
            </div>
            <div className="ww-card-name">{f.name}</div>
            <pre className="ww-preview">{f.preview}</pre>
            <div className="ww-card-footer">
              <span className="ww-lines">{f.lines} lines</span>
              <button className="ww-open-btn">Open →</button>
            </div>
          </div>
        ))}
      </div>

      {ctxMenu && (
        <div
          className="ww-ctx-menu"
          style={{ left: ctxMenu.x, top: ctxMenu.y }}
          onClick={e => e.stopPropagation()}
        >
          <div className="ww-ctx-file">{ctxMenu.file}</div>
          {CTX_ITEMS.map((item, i) =>
            item === '—' ? (
              <div key={i} className="ww-ctx-sep" />
            ) : (
              <button
                key={item}
                className={`ww-ctx-item${item === 'Delete' ? ' danger' : ''}`}
                onClick={() => setCtxMenu(null)}
              >
                {item}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}
