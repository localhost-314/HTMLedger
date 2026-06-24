import { useState, useMemo } from 'react';
import './WorkspaceWidget.css';

interface FileCard {
  name: string;
  type: 'html' | 'css' | 'js' | 'xml' | 'json';
  size: string;
  lines: number;
  preview: string;
}

const FILES: FileCard[] = [
  { name: 'index.html',       type: 'html', size: '4.2 KB', lines: 87,  preview: '<!DOCTYPE html>\n<html lang="en">\n<head>…' },
  { name: 'style.css',        type: 'css',  size: '6.8 KB', lines: 214, preview: '* { box-sizing: border-box; }\nbody {\n  background: #0f0f1a;…' },
  { name: 'script.js',        type: 'js',   size: '3.1 KB', lines: 94,  preview: 'document.addEventListener(\n  "DOMContentLoaded",\n  () => {…' },
  { name: 'about.html',       type: 'html', size: '2.9 KB', lines: 63,  preview: '<!DOCTYPE html>\n<html>\n<body>\n  <section class="about">…' },
  { name: 'contact.html',     type: 'html', size: '3.4 KB', lines: 72,  preview: '<form class="contact-form">\n  <input type="text"\n    name="name">…' },
  { name: 'dmarc-report.xml', type: 'xml',  size: '1.8 KB', lines: 42,  preview: '<?xml version="1.0"?>\n<feedback>\n  <report_metadata>…' },
];

const TYPE_LABELS: Record<string, string> = {
  html: 'HTML', css: 'CSS', js: 'JS', xml: 'XML', json: 'JSON',
};

export default function WorkspaceWidget() {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'name' | 'type' | 'size'>('name');
  const [active, setActive] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const list = FILES.filter(f => f.name.toLowerCase().includes(q));
    return [...list].sort((a, b) => {
      if (sort === 'type') return a.type.localeCompare(b.type);
      if (sort === 'size') return parseFloat(b.size) - parseFloat(a.size);
      return a.name.localeCompare(b.name);
    });
  }, [query, sort]);

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
    </div>
  );
}
