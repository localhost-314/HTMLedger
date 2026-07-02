import { useState } from 'react';
import './DummyEditorWidget.css';

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

const LITE_CODE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport"
    content="width=device-width">
  <title>My Page</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>

  <h1>Hello from Lite</h1>
  <p>Lightweight editing,
     zero compromise.</p>

</body>
</html>`;

const LITE_LINES = LITE_CODE.split('\n').map(hlHTMLLine);

export default function DummyEditorWidget() {
  const [editing, setEditing] = useState(false);
  const [code, setCode]       = useState(LITE_CODE);

  return (
    <div className="dew-wrap">
      <div className="dew-topbar">
        <div className="dew-tabs">
          <span className="dew-tab active">
            <span className="dew-dot dew-dot-html" />
            index.html
          </span>
          <span className="dew-tab">
            <span className="dew-dot dew-dot-css" />
            style.css
          </span>
        </div>
        <span className="dew-lite-badge">Lite</span>
      </div>

      <div className="dew-body">
        {editing ? (
          <textarea
            className="dew-textarea"
            value={code}
            onChange={e => setCode(e.target.value)}
            autoFocus
            spellCheck={false}
          />
        ) : (
          <pre className="dew-pre" onClick={() => setEditing(true)}>
            {LITE_LINES.map((line, i) => (
              <div key={i} className="dew-line">
                <span className="dew-ln">{i + 1}</span>
                <span
                  className="dew-code"
                  dangerouslySetInnerHTML={{ __html: line || ' ' }}
                />
              </div>
            ))}
            <div className="dew-line">
              <span className="dew-ln">{LITE_LINES.length + 1}</span>
              <span className="dew-cursor" />
            </div>
          </pre>
        )}
      </div>

      <div className="dew-footer">
        {editing ? (
          <>
            <span className="dew-hint">Editing — plain text in this demo</span>
            <button
              className="dew-reset"
              onClick={() => { setCode(LITE_CODE); setEditing(false); }}
            >
              Reset
            </button>
          </>
        ) : (
          <span className="dew-hint">Click to edit &middot; CodeMirror 6</span>
        )}
      </div>
    </div>
  );
}
