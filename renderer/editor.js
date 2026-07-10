/* ── State ── */
let monacoEditor  = null;
let tabs          = [];
let activeTab     = null;

// Workspace — prefer the full workspace object, fall back to legacy single-folder
const _activeWs = (() => { try { return JSON.parse(sessionStorage.getItem('active-workspace') || 'null'); } catch { return null; } })();
let workspaceName    = _activeWs?.name || null;
let workspaceFolders = _activeWs?.folders?.length ? _activeWs.folders : (sessionStorage.getItem('workspace-folder') ? [sessionStorage.getItem('workspace-folder')] : []);
let workspaceFolder  = workspaceFolders[0] || null;   // primary folder — used for terminal CWD, deploy, etc.

let extraFolders   = [];
let sidebarSort    = localStorage.getItem('htmledger-sidebar-sort') || 'name-asc';
let sidebarSearchMode = 'files'; // 'files' | 'text'
let _lastTree      = [];         // cached tree for client-side file search
const folderCollapsed = new Map();

let fontSize           = 13;
let fontFamily         = "'Cascadia Code','Fira Code',Consolas,monospace";
let tabSize            = 2;
let lineHeight         = 22;
let minimapOn          = true;
let wrapOn             = true;
let autoSaveOn         = false;
let autoSaveDelay      = 2000;
let layoutMode         = 'split';
let fontLigatures      = true;
let autoCloseBrackets  = true;
let autoCloseTags      = true;
let renderWhitespace   = 'none';
let cursorStyle        = 'line';
let autoUpdatesOn      = true;
let sidebarOpen        = true;
let dmarcViewOn        = false;
let autoSaveTimer      = null;
let previewDebounce    = null;
let sidebarCtxTarget   = null;
let _pinnedFiles       = (_activeWs?.pinnedFiles || []).slice(); // mutable copy
let emmetExpand        = null;
let snippetsPanelOpen  = false;
let terminalOpen       = false;
let currentCmdId       = null;
let deployConfigs      = {};
let formatOnSave       = 'ask';
let customKeybindings  = {};
let quickOpenFiles     = [];
let quickOpenIdx       = -1;
const IMAGE_EXTS       = new Set(['png','jpg','jpeg','gif','webp','ico','bmp']);
let previewMode        = 'server';
let previewServerPort  = null;
let recentlyClosed     = [];
let deviceFrame        = 'none'; // 'none' | 'mobile' | 'tablet'

// Default app-level keybindings (normalized lowercase)
const DEFAULT_BINDINGS = {
  'save':            { ctrl:true,  shift:false, alt:false, key:'s'  },
  'new-file':        { ctrl:true,  shift:false, alt:false, key:'n'  },
  'close-tab':       { ctrl:true,  shift:false, alt:false, key:'w'  },
  'quick-open':      { ctrl:true,  shift:false, alt:false, key:'p'  },
  'toggle-terminal': { ctrl:true,  shift:false, alt:false, key:'`'  },
};
function _parseBinding(str) {
  const p = str.toLowerCase().split('+');
  const key = p[p.length - 1];
  return { ctrl: p.includes('ctrl'), shift: p.includes('shift'), alt: p.includes('alt'), key };
}
function matchesBinding(e, id) {
  const b = customKeybindings[id] ? _parseBinding(customKeybindings[id]) : DEFAULT_BINDINGS[id];
  if (!b) return false;
  return e.ctrlKey === b.ctrl && e.shiftKey === b.shift && e.altKey === b.alt
      && e.key.toLowerCase() === b.key;
}

/* ── Snippets data ── */
const SNIPPETS = {
  HTML: [
    { key:'html5',  label:'HTML5 Boilerplate',  code:'<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>${1:Document}</title>\n</head>\n<body>\n  $0\n</body>\n</html>' },
    { key:'meta',   label:'Meta Tags',           code:'<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<meta name="description" content="${1}">\n<meta name="author" content="${2}">'},
    { key:'og',     label:'Open Graph Tags',     code:'<meta property="og:title" content="${1}">\n<meta property="og:description" content="${2}">\n<meta property="og:image" content="${3}">\n<meta property="og:url" content="${4}">'},
    { key:'form',   label:'Form',                code:'<form action="${1:#}" method="post">\n  <div>\n    <label for="name">Name</label>\n    <input type="text" id="name" name="name" required>\n  </div>\n  <div>\n    <label for="email">Email</label>\n    <input type="email" id="email" name="email" required>\n  </div>\n  <button type="submit">${2:Submit}</button>\n</form>'},
    { key:'nav',    label:'Navigation',          code:'<nav>\n  <ul>\n    <li><a href="/">${1:Home}</a></li>\n    <li><a href="/about">${2:About}</a></li>\n    <li><a href="/contact">${3:Contact}</a></li>\n  </ul>\n</nav>'},
    { key:'table',  label:'Table',               code:'<table>\n  <thead>\n    <tr>\n      <th>${1:Column 1}</th>\n      <th>${2:Column 2}</th>\n      <th>${3:Column 3}</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td>$0</td>\n      <td></td>\n      <td></td>\n    </tr>\n  </tbody>\n</table>'},
    { key:'card',   label:'Article Card',        code:'<article class="card">\n  <img src="${1:#}" alt="${2:Image}">\n  <div class="card-content">\n    <h3>${3:Title}</h3>\n    <p>${4:Description}</p>\n    <a href="${5:#}">${6:Read more}</a>\n  </div>\n</article>'},
  ],
  CSS: [
    { key:'reset',  label:'CSS Reset',           code:'*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }\nbody { line-height: 1.5; -webkit-font-smoothing: antialiased; }\nimg, picture, video, canvas, svg { display: block; max-width: 100%; }\ninput, button, textarea, select { font: inherit; }'},
    { key:'flex',   label:'Flexbox Center',      code:'.${1:container} {\n  display: flex;\n  align-items: center;\n  justify-content: center;\n  min-height: ${2:100vh};\n}'},
    { key:'grid',   label:'CSS Grid',            code:'.${1:grid} {\n  display: grid;\n  grid-template-columns: repeat(auto-fill, minmax(${2:250px}, 1fr));\n  gap: ${3:1rem};\n}'},
    { key:'media',  label:'Media Query',         code:'@media (max-width: ${1:768px}) {\n  $0\n}'},
    { key:'vars',   label:'CSS Variables',       code:':root {\n  --primary: ${1:#4f6ef7};\n  --text: ${2:#e8e8f8};\n  --bg: ${3:#0f0f1a};\n}'},
  ],
  JS: [
    { key:'ready',  label:'DOMContentLoaded',    code:"document.addEventListener('DOMContentLoaded', () => {\n  $0\n});"},
    { key:'fetch',  label:'Fetch GET',           code:"fetch('${1:/api/data}')\n  .then(r => r.json())\n  .then(data => {\n    $0\n  })\n  .catch(err => console.error(err));"},
    { key:'class',  label:'ES6 Class',           code:'class ${1:MyClass} {\n  constructor(${2}) {\n    $0\n  }\n}'},
    { key:'arrow',  label:'Arrow Function',      code:'const ${1:fn} = (${2}) => {\n  $0\n};'},
  ],
};

/* ── Boot Monaco ── */
require.config({ paths: { vs: '../node_modules/monaco-editor/min/vs' } });
require(['vs/editor/editor.main'], async function() {
  await Promise.all([initEmmet(), loadAndApplySettings()]);
  defineTheme();
  createEditor();
  installWidgetBoundsFix();
  await loadInitialFile().catch(() => {});
  // Start preview server if workspace is open and mode is server
  if (workspaceFolder && window.api.startPreviewServer) {
    window.api.startPreviewServer(workspaceFolder).then(r => {
      if (r && r.port) { previewServerPort = r.port; updatePreview(); }
    });
  }
  // Restore session (previously open tabs) if no file was passed via argv
  if (workspaceFolders.length > 0 && tabs.length === 0 && window.api.getSession) {
    try {
      const sess = await window.api.getSession();
      if (sess && Array.isArray(sess.tabs) && sess.tabs.length > 0) {
        const overlay = document.getElementById('session-loading');
        const label   = document.getElementById('session-loading-label');
        if (overlay) overlay.style.display = 'flex';
        for (let i = 0; i < sess.tabs.length; i++) {
          if (label) label.textContent = `Restoring session… (${i + 1}/${sess.tabs.length})`;
          try { await openTab(sess.tabs[i]); } catch {}
        }
        const found = tabs.find(t => t.path === sess.activeTab);
        if (found) switchTab(found);
        if (overlay) overlay.style.display = 'none';
      }
    } catch {}
  }
  updateEmptyState();
  try { loadWorkspaceSidebar(); } catch(e) {}
  bindEvents();
  document.getElementById('sidebar-sort').value = sidebarSort;
  bindResizer();
  buildSnippetPanel();
  initTerminal();
  initDeploy();
  initQuickOpen();
  updateSidebarAutoSaveStatus();
  setInterval(updateSidebarAutoSaveStatus, 10000);
  window.api.onFileChanged(onExternalFileChange);
  initSidebarWatcher();
});

/* ── Emmet init ── */
async function initEmmet() {
  try {
    const mod = await import('../node_modules/emmet/dist/emmet.es.js');
    emmetExpand = mod.expand;
  } catch { /* Emmet unavailable — Tab still works normally */ }
}

/* ── Settings ── */
async function loadAndApplySettings() {
  try {
    const s = await window.api.getSettings();
    if (s.fontSize)              fontSize          = s.fontSize;
    if (s.fontFamily)            fontFamily        = s.fontFamily;
    if (s.tabSize)               tabSize           = s.tabSize;
    if (s.lineHeight)            lineHeight        = s.lineHeight;
    if (s.minimap     !== undefined) minimapOn     = s.minimap;
    if (s.wordWrap    !== undefined) wrapOn        = s.wordWrap;
    if (s.autoSave    !== undefined) autoSaveOn    = s.autoSave;
    if (s.autoSaveDelay)         autoSaveDelay     = s.autoSaveDelay;
    if (s.layout)                layoutMode        = s.layout;
    if (s.formatOnSave)          formatOnSave      = s.formatOnSave;
    if (s.fontLigatures     !== undefined) fontLigatures    = s.fontLigatures;
    if (s.autoCloseBrackets !== undefined) autoCloseBrackets= s.autoCloseBrackets;
    if (s.autoCloseTags     !== undefined) autoCloseTags    = s.autoCloseTags;
    if (s.renderWhitespace)      renderWhitespace  = s.renderWhitespace;
    if (s.cursorStyle)           cursorStyle       = s.cursorStyle;
    if (s.autoUpdates   !== undefined) autoUpdatesOn = s.autoUpdates;
    if (s.keybindings)           customKeybindings = s.keybindings;
    if (s.previewMode)           previewMode       = s.previewMode;
    // One-time migration: old default was false, new default is true.
    // Merge wordWrap:true back into the saved file so it persists across restarts.
    if (!localStorage.getItem('htmledger-wrap-migrated') && !wrapOn) {
      wrapOn = true;
      localStorage.setItem('htmledger-wrap-migrated', '1');
      window.api.saveSettings({ ...s, wordWrap: true });
    }
  } catch {}

  // Workspace theme override takes priority over global setting
  if (_activeWs?.theme === 'light' || _activeWs?.theme === 'dark') {
    document.documentElement.setAttribute('data-theme', _activeWs.theme);
  } else {
    const saved = localStorage.getItem('htmledger-theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
  }
}

function openSettingsModal() {
  openUnifiedSettings('editor', _activeWs ? _activeWs.id : null);
}
function closeSettingsModal() { /* replaced by unified settings */ }

/* ── Contact modal ── */
const CONTACT_WEB     = 'https://htmledger.localhost314.com/contact';
const CONTACT_EMAIL   = 'htmledger@localhost314.com';
const CONTACT_FALLBACK = `Keep having issues? <a href="#" onclick="window.api.openExternal('${CONTACT_WEB}');return false;" style="color:inherit;text-decoration:underline">Contact Us</a>`;

function openContactModal() {
  resetContactModal();
  document.getElementById('contact-modal').style.display = 'flex';
  if (!navigator.onLine) showContactOffline();
}
function closeContactModal() {
  document.getElementById('contact-modal').style.display = 'none';
}
function resetContactModal() {
  document.getElementById('contact-body').innerHTML = `
    <div class="contact-fields">
      <div class="contact-field-row">
        <input class="contact-input" id="contact-name"  type="text"  placeholder="Your name"      autocomplete="off">
        <input class="contact-input" id="contact-email" type="email" placeholder="your@email.com" autocomplete="off">
      </div>
      <input class="contact-input" id="contact-subject" type="text" placeholder="Subject" autocomplete="off">
      <textarea class="contact-input contact-textarea" id="contact-message" placeholder="Tell us what's on your mind…" rows="5"></textarea>
      <p class="contact-hint">Or email us directly at <strong>${CONTACT_EMAIL}</strong></p>
      <div id="contact-error" class="contact-error" style="display:none"></div>
    </div>`;
  document.getElementById('btn-contact-send').style.display = '';
  document.getElementById('btn-contact-cancel').textContent = 'Cancel';
}
function showContactOffline() {
  document.getElementById('contact-body').innerHTML = `
    <div class="contact-success" style="padding:24px 16px">
      <div class="contact-success-icon" style="font-size:28px">⚠</div>
      <h3 style="margin-bottom:8px">You're offline</h3>
      <p style="margin-bottom:14px">An internet connection is required to send a message.<br>You can also email us directly at <strong>${CONTACT_EMAIL}</strong></p>
      <button class="btn-primary" id="btn-contact-retry">Refresh</button>
    </div>`;
  document.getElementById('btn-contact-send').style.display = 'none';
  document.getElementById('btn-contact-cancel').textContent = 'Close';
  document.getElementById('btn-contact-retry').onclick = () => {
    if (navigator.onLine) { resetContactModal(); }
    else { const b = document.getElementById('btn-contact-retry'); b.textContent = 'Still offline…'; setTimeout(() => { if (b) b.textContent = 'Refresh'; }, 1500); }
  };
}
async function sendContactForm() {
  if (!navigator.onLine) { showContactOffline(); return; }
  const name    = document.getElementById('contact-name')?.value.trim();
  const email   = document.getElementById('contact-email')?.value.trim();
  const subject = document.getElementById('contact-subject')?.value.trim();
  const message = document.getElementById('contact-message')?.value.trim();
  const errEl   = document.getElementById('contact-error');
  const sendBtn = document.getElementById('btn-contact-send');
  if (!name || !email || !subject || !message) {
    errEl.textContent = 'Please fill in all fields.'; errEl.style.display = ''; return;
  }
  sendBtn.disabled = true; sendBtn.textContent = 'Sending…'; errEl.style.display = 'none';
  try {
    const res  = await fetch('https://htmledger.localhost314.com/api/contact', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, subject, message })
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success) {
      document.getElementById('contact-body').innerHTML = `
        <div class="contact-success">
          <div class="contact-success-icon">✓</div>
          <h3>Message sent!</h3>
          <p>We'll get back to you at ${email} as soon as we can.</p>
        </div>`;
      document.getElementById('btn-contact-send').style.display = 'none';
      document.getElementById('btn-contact-cancel').textContent = 'Close';
    } else {
      errEl.innerHTML = `Error ${res.status} — ${data.error || 'Something went wrong.'} Either try <a href="#" onclick="window.api.openExternal('${CONTACT_WEB}');return false;" style="color:inherit;text-decoration:underline">htmledger.localhost314.com/contact</a> or email <strong>${CONTACT_EMAIL}</strong><br><br>${CONTACT_FALLBACK}`;
      errEl.style.display = ''; sendBtn.disabled = false; sendBtn.textContent = 'Send Message';
    }
  } catch {
    errEl.innerHTML = `Error — Unable to reach the server. Either try <a href="#" onclick="window.api.openExternal('${CONTACT_WEB}');return false;" style="color:inherit;text-decoration:underline">htmledger.localhost314.com/contact</a> or email <strong>${CONTACT_EMAIL}</strong><br><br>${CONTACT_FALLBACK}`;
    errEl.style.display = ''; sendBtn.disabled = false; sendBtn.textContent = 'Send Message';
  }
}

/* settings-changed is dispatched by settings.js after saving */
document.addEventListener('settings-changed', ev => {
  const s = ev.detail || ev;
  if (s.fontSize          !== undefined) fontSize         = s.fontSize;
  if (s.fontFamily        !== undefined) fontFamily       = s.fontFamily;
  if (s.tabSize           !== undefined) tabSize          = parseInt(s.tabSize);
  if (s.lineHeight        !== undefined) lineHeight       = s.lineHeight;
  if (s.minimap           !== undefined) minimapOn        = s.minimap;
  if (s.wordWrap          !== undefined) wrapOn           = s.wordWrap;
  if (s.autoSave          !== undefined) autoSaveOn       = s.autoSave;
  if (s.autoSaveDelay     !== undefined) autoSaveDelay    = s.autoSaveDelay;
  if (s.layout)                          layoutMode       = s.layout;
  if (s.formatOnSave)                    formatOnSave     = s.formatOnSave;
  if (s.fontLigatures     !== undefined) fontLigatures    = s.fontLigatures;
  if (s.autoCloseBrackets !== undefined) autoCloseBrackets= s.autoCloseBrackets;
  if (s.autoCloseTags     !== undefined) autoCloseTags    = s.autoCloseTags;
  if (s.renderWhitespace)                renderWhitespace = s.renderWhitespace;
  if (s.cursorStyle)                     cursorStyle      = s.cursorStyle;
  if (s.autoUpdates       !== undefined) autoUpdatesOn    = s.autoUpdates;
  if (s.keybindings)                     customKeybindings= s.keybindings;
  if (s.previewMode) {
    const prev = previewMode;
    previewMode = s.previewMode;
    if (previewMode === 'server' && !previewServerPort && workspaceFolder && window.api.startPreviewServer) {
      window.api.startPreviewServer(workspaceFolder).then(r => {
        if (r && r.port) { previewServerPort = r.port; updatePreview(); }
      });
    } else if (previewMode === 'legacy' && prev !== 'legacy') {
      updatePreview();
    }
  }

  if (monacoEditor) {
    monacoEditor.updateOptions({
      fontFamily, tabSize, fontSize, lineHeight,
      fontLigatures,
      autoClosingBrackets: autoCloseBrackets ? 'always' : 'never',
      autoClosingTags: autoCloseTags,
      renderWhitespace,
      cursorStyle,
      minimap: { enabled: minimapOn },
      wordWrap: wrapOn ? 'on' : 'off',
    });
    monacoEditor.layout();
  }
  const fd = document.getElementById('font-display');
  if (fd) fd.textContent = fontSize;
  document.getElementById('btn-minimap').classList.toggle('on', minimapOn);
  document.getElementById('btn-wrap').classList.toggle('on', wrapOn);
  document.getElementById('btn-autosave').classList.toggle('on', autoSaveOn);
  setLayout(layoutMode);
  updateSidebarAutoSaveStatus();
  if (autoSaveOn && activeTab && activeTab.isDirty) scheduleAutoSave();
  showToast('Settings saved');
});

document.addEventListener('open-contact-modal', () => openContactModal());

/* ── Monaco theme ── */
function defineTheme() {
  monaco.editor.defineTheme('htmledger', {
    base: 'vs-dark', inherit: true,
    rules: [
      { token: 'tag',              foreground: '60a5fa' },
      { token: 'tag.id',           foreground: '60a5fa' },
      { token: 'attribute.name',   foreground: '34d399' },
      { token: 'attribute.value',  foreground: 'fbbf24' },
      { token: 'delimiter',        foreground: '6b7db3' },
      { token: 'delimiter.html',   foreground: '6b7db3' },
      { token: 'comment',          foreground: '4a4a8a', fontStyle: 'italic' },
      { token: 'string',           foreground: 'fbbf24' },
      { token: 'keyword',          foreground: 'a78bfa' },
      { token: 'keyword.css',      foreground: 'a78bfa' },
      { token: 'number',           foreground: 'fb923c' },
      { token: 'type',             foreground: '34d399' },
      { token: 'variable',         foreground: 'e8e8f8' },
      { token: 'metatag',          foreground: 'a78bfa' },
      { token: 'metatag.content',  foreground: 'fbbf24' },
    ],
    colors: {
      'editor.background':                  '#0f0f1a',
      'editor.foreground':                  '#e8e8f8',
      'editor.lineHighlightBackground':     '#16162a',
      'editor.selectionBackground':         '#4f6ef740',
      'editor.inactiveSelectionBackground': '#4f6ef720',
      'editorLineNumber.foreground':        '#4a4a6a',
      'editorLineNumber.activeForeground':  '#8888b0',
      'editorCursor.foreground':            '#4f6ef7',
      'editorIndentGuide.background1':      '#1c1c32',
      'editorIndentGuide.activeBackground1':'#4f6ef750',
      'editor.findMatchBackground':         '#4f6ef750',
      'editor.findMatchHighlightBackground':'#4f6ef730',
      'editorWidget.background':            '#16162a',
      'editorWidget.border':                '#2a2a4a',
      'editorSuggestWidget.background':     '#16162a',
      'editorSuggestWidget.border':         '#2a2a4a',
      'editorSuggestWidget.selectedBackground': '#4f6ef730',
      'input.background':                   '#1c1c32',
      'input.foreground':                   '#e8e8f8',
      'input.border':                       '#2a2a4a',
      'minimap.background':                 '#0d0d18',
      'scrollbarSlider.background':         '#4a4a6a50',
      'scrollbarSlider.hoverBackground':    '#4a4a6a80',
    }
  });

  monaco.editor.defineTheme('htmledger-light', {
    base: 'vs', inherit: true,
    rules: [
      { token: 'tag',              foreground: '1d4ed8' },
      { token: 'tag.id',           foreground: '1d4ed8' },
      { token: 'attribute.name',   foreground: '047857' },
      { token: 'attribute.value',  foreground: 'b45309' },
      { token: 'delimiter',        foreground: '6b7280' },
      { token: 'delimiter.html',   foreground: '6b7280' },
      { token: 'comment',          foreground: '9ca3af', fontStyle: 'italic' },
      { token: 'string',           foreground: 'b45309' },
      { token: 'keyword',          foreground: '7c3aed' },
      { token: 'keyword.css',      foreground: '7c3aed' },
      { token: 'number',           foreground: 'c2410c' },
      { token: 'type',             foreground: '047857' },
      { token: 'variable',         foreground: '1a1a2e' },
      { token: 'metatag',          foreground: '7c3aed' },
      { token: 'metatag.content',  foreground: 'b45309' },
    ],
    colors: {
      'editor.background':                  '#f8f8ff',
      'editor.foreground':                  '#1a1a2e',
      'editor.lineHighlightBackground':     '#ebebf8',
      'editor.selectionBackground':         '#4f6ef730',
      'editor.inactiveSelectionBackground': '#4f6ef718',
      'editorLineNumber.foreground':        '#9090b8',
      'editorLineNumber.activeForeground':  '#4a4a7a',
      'editorCursor.foreground':            '#1a1a2e',
      'editorIndentGuide.background1':      '#ddddf0',
      'editorIndentGuide.activeBackground1':'#9090b8',
      'editor.findMatchBackground':         '#4f6ef740',
      'editor.findMatchHighlightBackground':'#4f6ef720',
      'editorWidget.background':            '#ffffff',
      'editorWidget.border':                '#ddddf0',
      'editorSuggestWidget.background':     '#ffffff',
      'editorSuggestWidget.border':         '#ddddf0',
      'editorSuggestWidget.selectedBackground': '#e8e8f8',
      'input.background':                   '#f0f0f8',
      'input.foreground':                   '#1a1a2e',
      'input.border':                       '#ddddf0',
      'minimap.background':                 '#f0f0f8',
      'scrollbarSlider.background':         '#9090b840',
      'scrollbarSlider.hoverBackground':    '#9090b870',
    }
  });
}

/* ── Create Monaco editor ── */
function createEditor() {
  monacoEditor = monaco.editor.create(document.getElementById('monaco-container'), {
    theme: localStorage.getItem('htmledger-theme') === 'light' ? 'htmledger-light' : 'htmledger',
    language: 'html',
    fontSize,
    fontFamily,
    tabSize,
    minimap:    { enabled: minimapOn },
    wordWrap:   wrapOn ? 'on' : 'off',
    lineHeight,
    fontLigatures,
    autoClosingBrackets: autoCloseBrackets ? 'always' : 'never',
    autoClosingTags: autoCloseTags,
    renderWhitespace,
    cursorStyle,
    lineNumbers: 'on',
    automaticLayout: true,
    insertSpaces: true,
    autoIndent: 'full',
    formatOnPaste: false,
    formatOnType:  false,
    scrollBeyondLastLine: false,
    scrollBeyondLastColumn: 0,
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    renderLineHighlight: 'gutter',
    folding: true,
    padding: { top: 10 },
    fixedOverflowWidgets: true,
  });

  monacoEditor.onDidChangeModelContent(() => {
    if (!activeTab) return;
    activeTab.isDirty = monacoEditor.getValue() !== activeTab.savedContent;
    document.getElementById('unsaved-dot').classList.toggle('visible', activeTab.isDirty);
    renderTabBar();
    updateRevertButton();
    if (autoSaveOn && activeTab.isDirty) scheduleAutoSave();
    clearTimeout(previewDebounce);
    previewDebounce = setTimeout(updatePreview, 500);
  });

  monacoEditor.onDidChangeCursorPosition(e => {
    document.getElementById('status-info').textContent =
      `${langLabel(activeTab)} · Ln ${e.position.lineNumber}, Col ${e.position.column} · UTF-8`;
  });

  new ResizeObserver(() => monacoEditor.layout())
    .observe(document.getElementById('monaco-container'));

  // Prevent horizontal scroll drift when wrap is on
  monacoEditor.onDidScrollChange(e => {
    if (e.scrollLeftChanged && e.scrollLeft > 0 && wrapOn) {
      monacoEditor.setScrollLeft(0);
    }
  });

  // Emmet Tab override
  monacoEditor.addCommand(monaco.KeyCode.Tab, () => {
    const sel  = monacoEditor.getSelection();
    const lang = activeTab ? activeTab.language : null;
    if ((lang === 'html' || lang === 'css') && sel.isEmpty() && tryExpandEmmet()) return;
    monacoEditor.trigger('keyboard', 'tab', null);
  });

  // Apply initial layout mode
  if (layoutMode !== 'split') setLayout(layoutMode);
  // Apply autosave/minimap/wrap toggle UI
  document.getElementById('btn-autosave').classList.toggle('on', autoSaveOn);
  document.getElementById('btn-minimap').classList.toggle('on', minimapOn);
  document.getElementById('btn-wrap').classList.toggle('on', wrapOn);
  document.getElementById('font-display').textContent = fontSize;
  updateSidebarAutoSaveStatus();
}

/* ── Emmet expansion ── */
function tryExpandEmmet() {
  if (!emmetExpand) return false;
  const model  = monacoEditor.getModel();
  const pos    = monacoEditor.getPosition();
  const line   = model.getLineContent(pos.lineNumber);
  const before = line.substring(0, pos.column - 1);
  const match  = before.match(/([^\s<>()\[\]{},;'"!@#$%^&*+=\\|`~]+)$/);
  if (!match || match[1].length < 2) return false;
  const abbrev = match[1];
  try {
    const syntax   = activeTab.language === 'css' ? 'css' : 'markup';
    const expanded = emmetExpand(abbrev, { syntax });
    if (!expanded || expanded.trim() === abbrev) return false;
    const startCol = pos.column - abbrev.length;
    const range    = new monaco.Range(pos.lineNumber, startCol, pos.lineNumber, pos.column);
    const sc       = monacoEditor.getContribution('snippetController2');
    monacoEditor.pushUndoStop();
    monacoEditor.executeEdits('emmet', [{ range, text: '' }]);
    if (sc) sc.insert(expanded);
    else monacoEditor.trigger('keyboard', 'type', { text: expanded.replace(/\$\{?\d+:?[^}]*\}?|\$0/g, '') });
    monacoEditor.pushUndoStop();
    return true;
  } catch { return false; }
}

/* ── Snippets panel ── */
function buildSnippetPanel() {
  const list = document.getElementById('snip-list');
  list.innerHTML = '';
  Object.entries(SNIPPETS).forEach(([cat, items]) => {
    const sec = document.createElement('div');
    sec.className = 'snip-section';
    sec.textContent = cat;
    list.appendChild(sec);
    items.forEach(snip => {
      const btn = document.createElement('button');
      btn.className = 'snip-item';
      btn.textContent = snip.label;
      btn.dataset.key = snip.key;
      btn.addEventListener('click', () => { insertSnippet(snip.code); closeSnippetsPanel(); });
      list.appendChild(btn);
    });
  });
}

function toggleSnippetsPanel() {
  snippetsPanelOpen = !snippetsPanelOpen;
  const panel = document.getElementById('snippets-panel');
  if (snippetsPanelOpen) {
    const btn  = document.getElementById('btn-snippets');
    const rect = btn.getBoundingClientRect();
    panel.style.top   = (rect.bottom + 4) + 'px';
    panel.style.right = (window.innerWidth - rect.right) + 'px';
    panel.style.display = 'block';
  } else {
    panel.style.display = 'none';
  }
}

function closeSnippetsPanel() {
  snippetsPanelOpen = false;
  document.getElementById('snippets-panel').style.display = 'none';
}

function insertSnippet(code) {
  if (!monacoEditor) return;
  monacoEditor.focus();
  const sc = monacoEditor.getContribution('snippetController2');
  if (sc) {
    sc.insert(code);
  } else {
    const plain = code.replace(/\$\{?\d+:?[^}]*\}?|\$0/g, '');
    monacoEditor.trigger('keyboard', 'type', { text: plain });
  }
}

/* ── Load initial file ── */
async function loadInitialFile() {
  const filePath = sessionStorage.getItem('edit-file');
  if (filePath) await openTab(filePath);
  const extras = sessionStorage.getItem('extra-files');
  if (extras) {
    sessionStorage.removeItem('extra-files');
    for (const p of JSON.parse(extras)) await openTab(p);
  }
}

/* ── Workspace sidebar (file tree) ── */
function fileIconClass(name) {
  const ext = name.split('.').pop().toLowerCase();
  return { html:'icon-html', htm:'icon-html', css:'icon-css',
           js:'icon-js', jsx:'icon-js', ts:'icon-ts', tsx:'icon-ts',
           json:'icon-json', xml:'icon-xml', svg:'icon-xml',
           md:'icon-md',
           png:'icon-img', jpg:'icon-img', jpeg:'icon-img', gif:'icon-img', webp:'icon-img' }[ext] || 'icon-file';
}
function fileIconLabel(name) {
  const ext = name.split('.').pop().toLowerCase();
  const labels = { jsx:'JSX', tsx:'TSX', json:'JSN', svg:'SVG', xml:'XML', md:'MD' };
  return labels[ext] || ext.toUpperCase().slice(0,3);
}

/* ── Sidebar auto-refresh ── */
let _sidebarLastUpdated = null;

function _relativeTime(date) {
  if (!date) return '';
  const secs = Math.floor((Date.now() - date) / 1000);
  if (secs < 10)  return 'just now';
  if (secs < 60)  return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60)  return `${mins}m ago`;
  const hrs  = Math.floor(mins / 60);
  return `${hrs}h ago`;
}

function _tickSidebarTimestamp() {
  const el = document.getElementById('sidebar-last-updated');
  if (el && _sidebarLastUpdated) el.textContent = 'Updated ' + _relativeTime(_sidebarLastUpdated);
}

function _touchSidebarTimestamp() {
  _sidebarLastUpdated = new Date();
  _tickSidebarTimestamp();
}

function initSidebarWatcher() {
  const folders = [...workspaceFolders, ...extraFolders].filter(Boolean);
  if (folders.length) window.api.startDirWatch(folders);

  window.api.onSidebarChanged(() => {
    loadWorkspaceSidebar();
  });

  // Tick every 30s to keep "X min ago" fresh
  setInterval(_tickSidebarTimestamp, 30000);
}

async function loadWorkspaceSidebar() {
  const container = document.getElementById('sidebar-files');
  const nameEl    = document.getElementById('sidebar-ws-name');

  if (workspaceFolders.length === 0) {
    sidebarOpen = false;
    document.getElementById('file-sidebar').classList.add('collapsed');
    document.getElementById('btn-sidebar').classList.remove('on');
    container.innerHTML = '<div style="padding:12px;font-size:11px;color:var(--text-muted)">No workspace open</div>';
    return;
  }

  // Show workspace name if available, otherwise fall back to folder name
  nameEl.textContent = workspaceName || workspaceFolder.replace(/\\/g, '/').split('/').pop();
  container.innerHTML = '';

  const allFolders = [...workspaceFolders, ...extraFolders];
  const showRootLabels = allFolders.length > 1;
  _lastTree = [];

  // Pinned files section
  if (_pinnedFiles.length > 0) {
    const pinnedSection = document.createElement('div');
    pinnedSection.className = 'sidebar-pinned-section';
    const pinnedHd = document.createElement('div');
    pinnedHd.className = 'sidebar-pinned-hd';
    pinnedHd.textContent = 'PINNED';
    pinnedSection.appendChild(pinnedHd);
    const sorted = [..._pinnedFiles].sort((a, b) => {
      const na = a.split(/[\\/]/).pop(), nb = b.split(/[\\/]/).pop();
      if (sidebarSort === 'name-desc') return nb.localeCompare(na);
      return na.localeCompare(nb);
    });
    sorted.forEach(fp => {
      const name = fp.split(/[\\/]/).pop();
      const row  = document.createElement('div');
      row.className  = 'tree-row pinned-row';
      row.dataset.path = fp;
      row.title = fp;
      const ico  = document.createElement('span');
      ico.className = 'tree-icon ' + fileIconClass(name);
      ico.textContent = fileIconLabel(name);
      const nameEl = document.createElement('span');
      nameEl.className = 'tree-name';
      nameEl.textContent = name;
      const unpin = document.createElement('button');
      unpin.className = 'pin-remove-btn';
      unpin.title = 'Unpin';
      unpin.textContent = '✕';
      unpin.onclick = e => { e.stopPropagation(); _unpinFile(fp); };
      row.appendChild(ico); row.appendChild(nameEl); row.appendChild(unpin);
      row.addEventListener('click', () => openTab(fp));
      row.addEventListener('contextmenu', e => { e.preventDefault(); showSidebarCtx(e.clientX, e.clientY, fp); });
      pinnedSection.appendChild(row);
    });
    container.appendChild(pinnedSection);
  }

  // Onboarding intro — shown once
  if (!localStorage.getItem('htmledger-sidebar-intro-seen')) {
    const banner = document.createElement('div');
    banner.className = 'sidebar-intro-banner';
    banner.innerHTML = `<div class="sib-text"><strong>File Tree</strong> — Root folders expand automatically. Click any folder arrow to expand/collapse. Use the search tab to find files by name.</div><button class="sib-close" title="Got it">✕</button>`;
    banner.querySelector('.sib-close').onclick = () => {
      banner.remove();
      localStorage.setItem('htmledger-sidebar-intro-seen', '1');
    };
    container.appendChild(banner);
  }

  for (const folderPath of allFolders) {
    if (showRootLabels) {
      const rootLabel = document.createElement('div');
      rootLabel.className = 'tree-root-label';
      rootLabel.textContent = folderPath.replace(/\\/g, '/').split('/').pop();
      container.appendChild(rootLabel);
    }
    const result = await window.api.listDirTree(folderPath);
    if (result.success) {
      const sorted = sortTree(result.tree);
      _lastTree = _lastTree.concat(flattenTree(sorted));
      renderTree(sorted, container, 0);
    } else {
      const err = document.createElement('div');
      err.style.cssText = 'padding:6px 12px;font-size:11px;color:#f87171';
      err.textContent = `Could not read ${folderPath.split(/[\\/]/).pop()}`;
      container.appendChild(err);
    }
  }

  highlightSidebarActive();
  _touchSidebarTimestamp();
}

function sortTree(nodes) {
  const sorted = [...nodes].sort((a, b) => {
    const af = a.type === 'folder', bf = b.type === 'folder';
    if (af !== bf) return af ? -1 : 1; // folders first always
    if (sidebarSort === 'name-desc')     return b.name.localeCompare(a.name);
    if (sidebarSort === 'type') {
      const ea = a.name.split('.').pop().toLowerCase(), eb = b.name.split('.').pop().toLowerCase();
      return ea.localeCompare(eb) || a.name.localeCompare(b.name);
    }
    if (sidebarSort === 'modified-desc') return (b.modified || 0) - (a.modified || 0);
    if (sidebarSort === 'modified-asc')  return (a.modified || 0) - (b.modified || 0);
    if (sidebarSort === 'size-desc')     return (b.size || 0) - (a.size || 0);
    if (sidebarSort === 'size-asc')      return (a.size || 0) - (b.size || 0);
    return a.name.localeCompare(b.name); // name-asc default
  });
  return sorted.map(n => n.children ? { ...n, children: sortTree(n.children) } : n);
}

function flattenTree(nodes, result = []) {
  for (const n of nodes) {
    result.push(n);
    if (n.children) flattenTree(n.children, result);
  }
  return result;
}

function renderTree(nodes, container, depth) {
  nodes.forEach(node => {
    const wrapper = document.createElement('div');
    wrapper.className = 'tree-node';

    const row = document.createElement('div');
    row.className = 'tree-row';
    row.style.paddingLeft = (10 + depth * 14) + 'px';

    if (node.type === 'folder') {
      const collapsed = folderCollapsed.has(node.path) ? folderCollapsed.get(node.path) : depth > 0;
      const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      arrow.setAttribute('viewBox', '0 0 24 24'); arrow.setAttribute('fill', 'none');
      arrow.setAttribute('stroke', 'currentColor'); arrow.setAttribute('stroke-width', '2.5');
      arrow.classList.add('tree-arrow');
      if (!collapsed) arrow.classList.add('open');
      arrow.innerHTML = '<polyline points="9,18 15,12 9,6"/>';

      const folderIco = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      folderIco.setAttribute('viewBox', '0 0 24 24'); folderIco.setAttribute('fill', 'none');
      folderIco.setAttribute('stroke', 'currentColor'); folderIco.setAttribute('stroke-width', '2');
      folderIco.classList.add('tree-icon', 'tree-folder-icon');
      folderIco.style.cssText = 'width:13px;height:13px;flex-shrink:0';
      folderIco.innerHTML = '<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>';

      const nameEl = document.createElement('span');
      nameEl.className = 'tree-name';
      nameEl.textContent = node.name;

      row.appendChild(arrow); row.appendChild(folderIco); row.appendChild(nameEl);

      const childContainer = document.createElement('div');
      childContainer.className = 'tree-children';
      if (collapsed) childContainer.style.display = 'none';
      else renderTree(node.children, childContainer, depth + 1);

      row.addEventListener('click', () => {
        const isCollapsed = childContainer.style.display === 'none';
        folderCollapsed.set(node.path, !isCollapsed);
        if (isCollapsed) {
          childContainer.style.display = '';
          arrow.classList.add('open');
          if (childContainer.children.length === 0) renderTree(node.children, childContainer, depth + 1);
        } else {
          childContainer.style.display = 'none';
          arrow.classList.remove('open');
        }
      });

      wrapper.appendChild(row);
      wrapper.appendChild(childContainer);
    } else {
      const ico = document.createElement('span');
      ico.className = 'tree-icon ' + fileIconClass(node.name);
      ico.textContent = fileIconLabel(node.name);

      const nameEl = document.createElement('span');
      nameEl.className = 'tree-name';
      nameEl.textContent = node.name;
      nameEl.title = node.path;

      row.dataset.path = node.path;
      row.appendChild(ico); row.appendChild(nameEl);
      // Star for default file
      if (node.path === _activeWs?.defaultFile) {
        const star = document.createElement('span');
        star.className = 'tree-default-star';
        star.textContent = '★';
        star.title = 'Opens automatically when this workspace loads';
        row.appendChild(star);
      }
      row.addEventListener('click', () => openTab(node.path));
      row.addEventListener('contextmenu', e => { e.preventDefault(); showSidebarCtx(e.clientX, e.clientY, node.path); });
      wrapper.appendChild(row);
    }

    container.appendChild(wrapper);
  });
}

function highlightSidebarActive() {
  document.querySelectorAll('.tree-row[data-path]').forEach(el =>
    el.classList.toggle('active', el.dataset.path === (activeTab && activeTab.path)));
}

/* ── Add extra folder to sidebar ── */
async function addExtraFolder() {
  const folder = await window.api.openFolderDialog();
  if (!folder) return;
  if (folder === workspaceFolder || extraFolders.includes(folder)) { showToast('Folder already in sidebar'); return; }
  extraFolders.push(folder);
  loadWorkspaceSidebar();
}

/* ── Sidebar context menu ── */
function showSidebarCtx(x, y, filePath) {
  sidebarCtxTarget = filePath;
  const m    = document.getElementById('sidebar-ctx');
  const pinEl = document.getElementById('sctx-pin');
  if (pinEl) pinEl.textContent = _pinnedFiles.includes(filePath) ? '📌 Unpin' : '📌 Pin to top';
  m.style.display = 'block';
  m.style.left    = Math.min(x, window.innerWidth  - 170) + 'px';
  m.style.top     = Math.min(y, window.innerHeight - 150) + 'px';
}
function hideSidebarCtx() {
  document.getElementById('sidebar-ctx').style.display = 'none';
  sidebarCtxTarget = null;
}

async function _savePinnedFiles() {
  if (!_activeWs) return;
  const all = (await window.api.getWorkspaces())?.data || [];
  const ws  = all.find(w => w.id === _activeWs.id);
  if (ws) { ws.pinnedFiles = [..._pinnedFiles]; await window.api.saveWorkspaces(all); }
}
function _pinFile(fp) {
  if (_pinnedFiles.includes(fp)) return;
  _pinnedFiles.push(fp);
  _savePinnedFiles();
  loadWorkspaceSidebar();
}
function _unpinFile(fp) {
  _pinnedFiles = _pinnedFiles.filter(p => p !== fp);
  _savePinnedFiles();
  loadWorkspaceSidebar();
}

/* ── Sidebar search (find in folder) ── */
function switchSidebarView(view) {
  document.getElementById('sv-tab-files').classList.toggle('active', view === 'files');
  document.getElementById('sv-tab-search').classList.toggle('active', view === 'search');
  document.getElementById('sv-files-view').style.display  = view === 'files'  ? 'flex' : 'none';
  document.getElementById('sv-search-view').style.display = view === 'search' ? 'flex' : 'none';
  if (view === 'search') document.getElementById('sv-search-input').focus();
}

async function runFolderSearch() {
  if (workspaceFolders.length === 0) { showToast('No workspace open'); return; }
  const query   = document.getElementById('sv-search-input').value.trim();
  const results = document.getElementById('sv-search-results');
  if (!query) {
    results.innerHTML = '<div class="sv-search-hint">Type to search…</div>';
    return;
  }

  if (sidebarSearchMode === 'files') {
    // Client-side name search against cached tree
    const lq = query.toLowerCase();
    const matches = _lastTree.filter(n => n.name.toLowerCase().includes(lq));
    if (matches.length === 0) { results.innerHTML = '<div class="sv-no-results">No matching files or folders</div>'; return; }
    results.innerHTML = '';
    matches.slice(0, 40).forEach(n => {
      const div = document.createElement('div');
      div.className = 'sv-result-match';
      div.style.borderLeftColor = n.type === 'folder' ? 'var(--accent)' : 'transparent';
      const icon = n.type === 'folder' ? '📁 ' : '';
      div.textContent = icon + n.name;
      div.title = n.path;
      if (n.type === 'file') div.addEventListener('click', () => openTab(n.path));
      results.appendChild(div);
    });
    return;
  }

  // Text in files mode (server-side)
  results.innerHTML = '<div class="sv-search-hint">Searching…</div>';
  // Search across all workspace folders
  const allResults = [];
  for (const folder of workspaceFolders) {
    const res2 = await window.api.searchInFolder(folder, query);
    if (res2.success) allResults.push(...res2.results);
  }
  const res = { success: true, results: allResults };
  if (!res.success || res.results.length === 0) {
    results.innerHTML = '<div class="sv-no-results">No matches found</div>';
    return;
  }
  results.innerHTML = '';
  res.results.forEach(file => {
    const fileEl = document.createElement('div');
    fileEl.className = 'sv-result-file';
    fileEl.textContent = file.name;
    results.appendChild(fileEl);
    file.matches.forEach(m => {
      const matchEl = document.createElement('div');
      matchEl.className = 'sv-result-match';
      matchEl.innerHTML = `<span class="sv-result-line">L${m.line}</span>${escapeHtml(m.text)}`;
      matchEl.addEventListener('click', async () => {
        await openTab(file.path);
        monacoEditor.revealLineInCenter(m.line);
        monacoEditor.setPosition({ lineNumber: m.line, column: 1 });
        monacoEditor.focus();
      });
      results.appendChild(matchEl);
    });
  });
}

function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ── File watcher / external change ── */
function onExternalFileChange(filePath) {
  const tab = tabs.find(t => t.path === filePath);
  if (!tab || tab.isImage) return;
  if (autoSaveOn) {
    window.api.readFile(filePath).then(r => {
      if (!r.success) return;
      tab.model.setValue(r.content);
      tab.savedContent = r.content;
      tab.isDirty = false;
      if (tab === activeTab) {
        renderTabBar();
        document.getElementById('unsaved-dot').classList.remove('visible');
      }
    });
    return;
  }
  tab.externallyChanged = true;
  if (tab === activeTab) showFileChangedBanner(tab);
}

function showFileChangedBanner(tab) {
  const banner = document.getElementById('file-changed-banner');
  document.getElementById('file-changed-msg').textContent =
    `"${tab.name}" was modified outside this editor`;
  banner.style.display = 'flex';
}

function hideFileChangedBanner() {
  document.getElementById('file-changed-banner').style.display = 'none';
}

async function reloadActiveFile() {
  if (!activeTab) return;
  const result = await window.api.readFile(activeTab.path);
  if (!result.success) { showToast('Could not reload file'); return; }
  activeTab.model.setValue(result.content);
  activeTab.savedContent = result.content;
  activeTab.isDirty = false;
  activeTab.externallyChanged = false;
  renderTabBar();
  document.getElementById('unsaved-dot').classList.remove('visible');
  hideFileChangedBanner();
  showToast('Reloaded');
}

/* ── Tab management ── */
function isImagePath(p) { return IMAGE_EXTS.has(p.split('.').pop().toLowerCase()); }

async function openTab(filePath) {
  const existing = tabs.find(t => t.path === filePath);
  if (existing) { switchTab(existing); return; }

  const name = filePath.replace(/\\/g, '/').split('/').pop();

  if (isImagePath(filePath)) {
    const tab = { path: filePath, name, isImage: true, isDirty: false, model: null, savedContent: '', viewState: null, language: 'binary', externallyChanged: false };
    tabs.push(tab);
    switchTab(tab);
    updateEmptyState();
    trackRecentFile(filePath);
    return;
  }

  const result = await window.api.readFile(filePath);
  if (!result.success) { showToast('Could not open file'); return; }

  const lang  = detectLanguage(filePath);
  const uri   = monaco.Uri.file(filePath);
  const model = monaco.editor.createModel(result.content, lang, uri);
  const tab   = { path: filePath, name, model, savedContent: result.content, revertContent: result.content, isDirty: false, viewState: null, language: lang, externallyChanged: false };

  tabs.push(tab);
  switchTab(tab);
  updateEmptyState();
  window.api.watchFile(filePath);
  trackRecentFile(filePath);
}

function switchTab(tab) {
  if (activeTab && monacoEditor && !activeTab.isImage) activeTab.viewState = monacoEditor.saveViewState();
  activeTab = tab;
  // Reset per-tab warning dismissal
  const _wb = document.getElementById('preview-warning-bar');
  if (_wb) { _wb.dataset.dismissed = ''; _wb.style.display = 'none'; }

  const monacoEl = document.getElementById('monaco-container');
  const imgArea  = document.getElementById('image-preview-area');

  if (tab.isImage) {
    monacoEl.style.display = 'none';
    imgArea.style.display  = 'flex';
    const img  = document.getElementById('image-preview-img');
    const info = document.getElementById('image-preview-info');
    img.src = '';
    info.textContent = 'Loading…';
    window.api.readFileBinary(tab.path).then(r => {
      if (r.success) {
        img.src = `data:${r.mime};base64,${r.base64}`;
        info.textContent = tab.name;
      } else {
        info.textContent = 'Could not load image';
      }
    });
    // Hide preview panel for images (image is shown in left pane)
    document.getElementById('preview-section').style.display = 'none';
    document.getElementById('pane-resizer').style.display    = 'none';
    document.getElementById('no-preview-bar').style.display  = 'none';
  } else {
    monacoEl.style.display = '';
    imgArea.style.display  = 'none';
    monacoEditor.setModel(tab.model);
    if (tab.viewState) monacoEditor.restoreViewState(tab.viewState);
    monacoEditor.setScrollPosition({ scrollLeft: 0 });
    monacoEditor.focus();
    updatePreview();
    if (tab.externallyChanged) showFileChangedBanner(tab);
    else hideFileChangedBanner();
  }

  renderTabBar();
  updateCrumb();
  highlightSidebarActive();
  updateRevertButton();
  document.getElementById('unsaved-dot').classList.toggle('visible', tab.isDirty);
  document.getElementById('status-path').textContent = tab.path;
  document.getElementById('status-info').textContent = tab.isImage ? 'IMAGE' : `${langLabel(tab)} · UTF-8`;
}

function closeTab(tab, e) {
  if (e) e.stopPropagation();
  if (tab.isDirty && !confirm(`"${tab.name}" has unsaved changes. Close anyway?`)) return;
  window.api.unwatchFile(tab.path);
  if (!tab.isImage) recentlyClosed.push(tab.path);
  if (recentlyClosed.length > 20) recentlyClosed.shift();
  const idx = tabs.indexOf(tab);
  tabs.splice(idx, 1);
  if (tab.model) tab.model.dispose();
  if (tabs.length === 0) {
    activeTab = null;
    monacoEditor.setModel(monaco.editor.createModel('', 'html'));
    renderTabBar();
    document.getElementById('crumb-file').textContent   = '';
    document.getElementById('crumb-folder').textContent = '';
    document.getElementById('unsaved-dot').classList.remove('visible');
    document.getElementById('preview-frame').src = 'about:blank';
    hideFileChangedBanner();
    updateEmptyState();
    return;
  }
  switchTab(tabs[Math.min(idx, tabs.length - 1)]);
}

function renderTabBar() {
  const list = document.getElementById('tabs-list');
  list.innerHTML = '';
  let dragSrc = null;
  tabs.forEach((tab, i) => {
    const el = document.createElement('div');
    el.className = 'tab' + (tab === activeTab ? ' active' : '') + (tab.isDirty ? ' dirty' : '');
    el.draggable = true;
    const ic  = fileIconClass(tab.name);
    const lbl = fileIconLabel(tab.name);
    el.innerHTML = `<span class="tab-icon ${ic}">${lbl}</span><span class="tab-name" title="${tab.path}">${tab.name}</span><span class="tab-dirty-dot"></span><span class="tab-close" title="Close">✕</span>`;

    el.addEventListener('click', () => switchTab(tab));
    el.querySelector('.tab-close').addEventListener('click', e => closeTab(tab, e));

    // Double-click tab name to rename file
    el.querySelector('.tab-name').addEventListener('dblclick', e => {
      e.stopPropagation();
      startTabRename(tab, el.querySelector('.tab-name'));
    });

    // Drag-and-drop reorder
    el.addEventListener('dragstart', ev => {
      dragSrc = i;
      ev.dataTransfer.effectAllowed = 'move';
    });
    el.addEventListener('dragover', ev => {
      ev.preventDefault();
      ev.dataTransfer.dropEffect = 'move';
      el.classList.add('tab-drag-over');
    });
    el.addEventListener('dragleave', () => el.classList.remove('tab-drag-over'));
    el.addEventListener('drop', ev => {
      ev.preventDefault();
      el.classList.remove('tab-drag-over');
      if (dragSrc === null || dragSrc === i) return;
      const moved = tabs.splice(dragSrc, 1)[0];
      tabs.splice(i, 0, moved);
      renderTabBar();
    });
    el.addEventListener('dragend', () => { dragSrc = null; });

    list.appendChild(el);
  });
}

function startTabRename(tab, nameEl) {
  const oldName = tab.name;
  const inp = document.createElement('input');
  inp.className = 'tab-rename-input';
  inp.value = oldName;
  inp.style.cssText = 'width:120px;background:var(--bg-primary);border:1px solid var(--accent);color:var(--text-primary);border-radius:3px;padding:0 4px;font-size:12px;font-family:inherit;outline:none';
  nameEl.replaceWith(inp);
  inp.select();
  const commit = async () => {
    const newName = inp.value.trim();
    if (!newName || newName === oldName) { renderTabBar(); return; }
    const dir = tab.path.replace(/\\/g, '/').split('/').slice(0, -1).join('/');
    const newPath = dir + '/' + newName;
    const res = await window.api.renameFile(tab.path, newPath.replace(/\//g, '\\'));
    if (res.success) {
      window.api.unwatchFile(tab.path);
      tab.path = newPath.replace(/\//g, '\\');
      tab.name = newName;
      tab.language = detectLanguage(newName);
      window.api.watchFile(tab.path);
      if (tab.model) monaco.editor.getModel(tab.model.uri)?.dispose?.();
      const uri = monaco.Uri.file(tab.path);
      tab.model = monaco.editor.createModel(tab.model ? monacoEditor.getValue() : '', tab.language, uri);
      monacoEditor.setModel(tab.model);
      loadWorkspaceSidebar();
    }
    renderTabBar();
  };
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') renderTabBar();
  });
  inp.addEventListener('blur', commit);
}

/* ── Recent files tracking ── */
async function trackRecentFile(filePath) {
  try {
    let recent = await window.api.getRecentFiles() || [];
    recent = recent.filter(f => f.path !== filePath);
    recent.unshift({ path: filePath, name: filePath.replace(/\\/g, '/').split('/').pop(), accessed: new Date().toISOString() });
    await window.api.saveRecentFiles(recent.slice(0, 20));
  } catch {}
}

/* ── Language detection ── */
function detectLanguage(filePath) {
  const ext = filePath.split('.').pop().toLowerCase();
  return {
    html:'html', htm:'html',
    css:'css',
    js:'javascript', jsx:'javascript',
    ts:'typescript', tsx:'typescript',
    json:'json',
    xml:'xml', svg:'xml',
    md:'markdown'
  }[ext] || 'plaintext';
}

function langLabel(tab) {
  if (!tab) return 'TEXT';
  return {
    html:'HTML', css:'CSS', javascript:'JS',
    typescript:'TS', json:'JSON', xml:'XML',
    markdown:'MD', plaintext:'TEXT'
  }[tab.language] || tab.language.toUpperCase();
}

/* ── Preview ── */
// Swap the preview iframe src while preserving scroll position.
// If the new content is shorter the browser clamps scrollTo automatically,
// which lands the user at the bottom — exactly right when content was deleted.
function setPreviewSrc(blobUrl) {
  const frame = document.getElementById('preview-frame');
  const saved = frame.contentWindow?.scrollY ?? 0;
  frame.addEventListener('load', () => { frame.contentWindow?.scrollTo(0, saved); }, { once: true });
  frame.src = blobUrl;
}

function updatePreview() {
  if (!activeTab) return;
  if (activeTab.isImage) return;
  const lang        = activeTab.language;
  const isSVG       = activeTab.name.toLowerCase().endsWith('.svg');
  const frame       = document.getElementById('preview-frame');
  const noPrev      = document.getElementById('no-preview');
  const previewSection = document.getElementById('preview-section');
  const paneResizer    = document.getElementById('pane-resizer');
  const noPreviewBar   = document.getElementById('no-preview-bar');

  const warnBar = document.getElementById('preview-warning-bar');

  if (lang === 'html') {
    previewSection.style.display = ''; paneResizer.style.display = '';
    frame.style.display = 'flex'; noPrev.style.display = 'none';
    noPreviewBar.style.display = 'none';
    const content = monacoEditor.getValue();
    // Detect SPA/framework shells that likely won't render
    const mightBlank = !warnBar.dataset.dismissed && detectEmptyPreview(content);
    if (mightBlank) {
      warnBar.style.display = 'flex';
      warnBar.dataset.dismissed = '';
    } else {
      warnBar.style.display = 'none';
      if (previewMode === 'server' && previewServerPort && activeTab?.path && workspaceFolder) {
        const relPath = activeTab.path.replace(/\\/g, '/').slice(workspaceFolder.replace(/\\/g, '/').length).replace(/^\//, '');
        frame.src = `http://127.0.0.1:${previewServerPort}/${relPath}`;
      } else {
        setPreviewSrc(URL.createObjectURL(new Blob([content], { type: 'text/html' })));
      }
    }
    monacoEditor.layout();
  } else if (lang === 'xml' && isSVG) {
    previewSection.style.display = ''; paneResizer.style.display = '';
    frame.style.display = 'flex'; noPrev.style.display = 'none';
    noPreviewBar.style.display = 'none'; warnBar.style.display = 'none';
    updateDMARCButton('');
    const page = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>html,body{margin:0;padding:16px;background:#1a1a2e;display:flex;align-items:center;justify-content:center;min-height:calc(100vh - 32px)}svg{max-width:100%;max-height:calc(100vh - 32px)}</style></head><body>${monacoEditor.getValue()}</body></html>`;
    setPreviewSrc(URL.createObjectURL(new Blob([page], { type: 'text/html' })));
    monacoEditor.layout();
  } else if (lang === 'xml') {
    previewSection.style.display = ''; paneResizer.style.display = '';
    frame.style.display = 'flex'; noPrev.style.display = 'none';
    noPreviewBar.style.display = 'none'; warnBar.style.display = 'none';
    monacoEditor.layout();
    const xml = monacoEditor.getValue();
    updateDMARCButton(xml);
    if (dmarcViewOn && isDMARCReport(xml)) renderDMARCPreview(xml);
    else renderXMLPreview(xml);
  } else if (lang === 'markdown') {
    previewSection.style.display = ''; paneResizer.style.display = '';
    frame.style.display = 'flex'; noPrev.style.display = 'none';
    noPreviewBar.style.display = 'none'; warnBar.style.display = 'none';
    updateDMARCButton('');
    renderMarkdownPreview(monacoEditor.getValue());
    monacoEditor.layout();
  } else {
    warnBar.style.display = 'none';
    updateDMARCButton('');
    if (layoutMode === 'preview') {
      // Preview-only mode with no preview — show "unable" panel
      previewSection.style.display = ''; paneResizer.style.display = 'none';
      frame.style.display = 'none'; noPrev.style.display = 'flex';
      noPreviewBar.style.display = 'none';
    } else {
      previewSection.style.display = 'none'; paneResizer.style.display = 'none';
      noPreviewBar.style.display = 'flex';
    }
    monacoEditor.layout();
  }
}

function detectEmptyPreview(html) {
  // Returns true if the HTML looks like a build-tool shell that won't render
  const stripped = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  const bodyMatch = stripped.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (!bodyMatch) return false;
  const bodyText = bodyMatch[1].replace(/<[^>]+>/g, '').trim();
  return bodyText.length < 20 ||
    /type=["']module["']|<div\s+id=["'](root|app)["']|import\s+React/i.test(html);
}

function renderMarkdownPreview(md) {
  const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  let html = esc(md)
    .replace(/^######\s+(.+)$/gm, '<h6>$1</h6>').replace(/^#####\s+(.+)$/gm,'<h5>$1</h5>')
    .replace(/^####\s+(.+)$/gm,'<h4>$1</h4>').replace(/^###\s+(.+)$/gm,'<h3>$1</h3>')
    .replace(/^##\s+(.+)$/gm,'<h2>$1</h2>').replace(/^#\s+(.+)$/gm,'<h1>$1</h1>')
    .replace(/^---+$/gm,'<hr>')
    .replace(/```[\w]*\n?([\s\S]*?)```/g,(_,c)=>`<pre><code>${c.trim()}</code></pre>`)
    .replace(/`([^`]+)`/g,'<code>$1</code>')
    .replace(/\*\*\*(.+?)\*\*\*/g,'<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>')
    .replace(/^&gt;\s+(.+)$/gm,'<blockquote>$1</blockquote>')
    .replace(/^[-*]\s+(.+)$/gm,'<li>$1</li>').replace(/^\d+\.\s+(.+)$/gm,'<li>$1</li>')
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g,'<img alt="$1" src="$2">')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g,'<a href="$2">$1</a>')
    .replace(/(<li>.*<\/li>\n?)+/g, m=>`<ul>${m}</ul>`)
    .replace(/(?:^|\n)((?:\|[^\n]+\|\n?)+)/g, (_, block) => {
      const rows = block.trim().split('\n').map(r => r.trim());
      const isSep = r => /^\|[\s\-:|]+\|$/.test(r);
      const cells = r => r.replace(/^\||\|$/g,'').split('|').map(c=>c.trim());
      if (rows.length < 2 || !isSep(rows[1])) return _;
      const head = cells(rows[0]).map(c=>`<th>${c}</th>`).join('');
      const body = rows.slice(2).map(r=>`<tr>${cells(r).map(c=>`<td>${c}</td>`).join('')}</tr>`).join('');
      return `\n<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
    })
    .replace(/\n\n([^<])/g,'\n\n<p>$1').replace(/([^>])\n\n/g,'$1</p>\n\n')
    .replace(/([^>\n])\n([^<\n])/g,'$1<br>$2');
  const light = document.documentElement.getAttribute('data-theme') === 'light';
  const bg = light ? '#f8f8ff' : '#0f0f1a', fg = light ? '#1a1a2e' : '#e8e8f8';
  const page = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    body{margin:0;padding:24px 32px;background:${bg};color:${fg};font-family:'Segoe UI',system-ui,sans-serif;font-size:14px;line-height:1.7;max-width:780px}
    h1,h2,h3,h4,h5,h6{margin:1.2em 0 .4em;font-weight:700;line-height:1.3}
    h1{font-size:2em;border-bottom:2px solid ${light?'rgba(0,0,0,.1)':'rgba(255,255,255,.08)'};padding-bottom:.3em}
    h2{font-size:1.4em;border-bottom:1px solid ${light?'rgba(0,0,0,.07)':'rgba(255,255,255,.06)'};padding-bottom:.2em}
    p{margin:.6em 0}a{color:#4f6ef7}
    code{background:${light?'rgba(0,0,0,.06)':'rgba(255,255,255,.08)'};padding:1px 5px;border-radius:4px;font-family:'Cascadia Code',Consolas,monospace;font-size:.88em}
    pre{background:${light?'rgba(0,0,0,.06)':'rgba(255,255,255,.05)'};border:1px solid ${light?'rgba(0,0,0,.08)':'rgba(255,255,255,.07)'};border-radius:8px;padding:14px 16px;overflow-x:auto;margin:1em 0}
    pre code{background:none;padding:0}blockquote{border-left:3px solid #4f6ef7;margin:1em 0;padding:.3em 1em;color:${light?'#6060a0':'#8888b0'};background:rgba(79,110,247,.08);border-radius:0 6px 6px 0}
    ul,ol{margin:.6em 0;padding-left:1.6em}li{margin:.2em 0}hr{border:none;border-top:1px solid ${light?'rgba(0,0,0,.1)':'rgba(255,255,255,.08)'};margin:1.5em 0}
    img{max-width:100%;border-radius:6px}
    table{border-collapse:collapse;width:100%;margin:1em 0;font-size:.9em}
    th,td{border:1px solid ${light?'rgba(0,0,0,.15)':'rgba(255,255,255,.12)'};padding:6px 12px;text-align:left}
    th{background:${light?'rgba(0,0,0,.05)':'rgba(255,255,255,.06)'};font-weight:600}
    tr:nth-child(even) td{background:${light?'rgba(0,0,0,.02)':'rgba(255,255,255,.03)'}}
    ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:${light?'#b0b0d0':'#3a3a5a'};border-radius:3px}
  </style></head><body>${html}</body></html>`;
  setPreviewSrc(URL.createObjectURL(new Blob([page], { type: 'text/html' })));
}

/* ── DMARC ── */
function isDMARCReport(xml) {
  return xml.includes('<feedback>') && xml.includes('<report_metadata>');
}
function updateDMARCButton(xml) {
  const btn  = document.getElementById('btn-dmarc-view');
  const show = activeTab && activeTab.language === 'xml' && isDMARCReport(xml);
  btn.style.display = show ? 'flex' : 'none';
  if (!show && dmarcViewOn) { dmarcViewOn = false; btn.classList.remove('on'); }
}
function toggleDMARCView() {
  dmarcViewOn = !dmarcViewOn;
  document.getElementById('btn-dmarc-view').classList.toggle('on', dmarcViewOn);
  updatePreview();
}

function renderDMARCPreview(xml) {
  try {
    const doc  = new DOMParser().parseFromString(xml, 'text/xml');
    const get  = (el, tag) => el?.querySelector(tag)?.textContent?.trim() || '';
    const fmtDate = ts => isNaN(ts) ? '?' : new Date(ts * 1000).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' });

    const meta    = doc.querySelector('report_metadata');
    const pol     = doc.querySelector('policy_published');
    const records = [...doc.querySelectorAll('record')];

    const orgName  = get(meta,'org_name');
    const reportId = get(meta,'report_id');
    const begin    = parseInt(get(meta,'begin'));
    const end      = parseInt(get(meta,'end'));
    const domain   = get(pol,'domain');
    const p        = get(pol,'p');
    const sp       = get(pol,'sp');
    const pct      = get(pol,'pct');
    const adkim    = get(pol,'adkim') === 's' ? 'Strict' : 'Relaxed';
    const aspf     = get(pol,'aspf')  === 's' ? 'Strict' : 'Relaxed';

    const totalEmails = records.reduce((s,r) => s + (parseInt(get(r,'count')) || 0), 0);
    const passing = records.filter(r => {
      const pe = r.querySelector('policy_evaluated');
      return get(pe,'dkim') === 'pass' || get(pe,'spf') === 'pass';
    }).length;
    const failing  = records.length - passing;
    const passRate = records.length > 0 ? Math.round((passing / records.length) * 100) : 0;

    const bc = v => ({ pass:'pass', none:'pass', fail:'fail', reject:'fail', quarantine:'quarantine' }[v] || 'neutral');

    const recordCards = records.map((rec, i) => {
      const row  = rec.querySelector('row');
      const pe   = row?.querySelector('policy_evaluated');
      const ip   = get(row,'source_ip');
      const cnt  = get(row,'count');
      const disp = get(pe,'disposition');
      const ed   = get(pe,'dkim');
      const es   = get(pe,'spf');
      const hf   = get(rec.querySelector('identifiers'),'header_from');
      const ar   = rec.querySelector('auth_results');

      const dkimRows = [...(ar?.querySelectorAll('dkim') || [])].map(d =>
        `<div class="ar-row"><span class="ar-type">DKIM</span><span class="ar-domain">${get(d,'domain')}${get(d,'selector') ? ` <span class="ar-sel">(${get(d,'selector')})</span>` : ''}</span><span class="badge b-${bc(get(d,'result'))}">${get(d,'result').toUpperCase()}</span></div>`).join('');
      const spfRows = [...(ar?.querySelectorAll('spf') || [])].map(s =>
        `<div class="ar-row"><span class="ar-type">SPF</span><span class="ar-domain">${get(s,'domain')}</span><span class="badge b-${bc(get(s,'result'))}">${get(s,'result').toUpperCase()}</span></div>`).join('');

      const accent = { none:'#34d399', quarantine:'#fbbf24', reject:'#f87171' }[disp] || '#8888b0';
      return `<div class="card" style="border-left:3px solid ${accent}">
        <div class="card-hd"><span class="card-title">Record ${i+1}</span><span class="badge b-${bc(disp)}">${disp.toUpperCase()}</span></div>
        <div class="grid3">
          <div class="field"><div class="fl">Source IP</div><div class="fv mono">${ip}</div></div>
          <div class="field"><div class="fl">Emails</div><div class="fv">${cnt}</div></div>
          <div class="field"><div class="fl">Header From</div><div class="fv mono">${hf}</div></div>
        </div>
        <div class="eval-row">
          <div class="eval-item"><span class="eval-lbl">DKIM Alignment</span><span class="badge b-${bc(ed)}">${ed.toUpperCase()}</span></div>
          <div class="eval-item"><span class="eval-lbl">SPF Alignment</span><span class="badge b-${bc(es)}">${es.toUpperCase()}</span></div>
        </div>
        ${dkimRows||spfRows ? `<div class="sec-lbl">Auth Results</div><div class="ar-list">${dkimRows}${spfRows}</div>` : ''}
      </div>`;
    }).join('');

    const light = document.documentElement.getAttribute('data-theme') === 'light';
    const t = light ? {
      body:'#f0f0f8', txt:'#1a1a2e', chip:'#ffffff', chipBorder:'rgba(0,0,0,.08)',
      cl:'#9090b8', cv:'#1a1a2e', card:'#ffffff', cardBorder:'rgba(0,0,0,.08)',
      cardTitle:'#4a4a7a', fl:'#9090b8', fv:'#1a1a2e', arRow:'#e8e8f4',
      arTypeBg:'rgba(79,110,247,.12)', arTypeClr:'#4f6ef7', arDomain:'#2a2a4e',
      arSel:'#6060a0', scroll:'#b0b0d0', evalLbl:'#4a4a7a',
    } : {
      body:'#0f0f1a', txt:'#e8e8f8', chip:'#1c1c32', chipBorder:'rgba(255,255,255,.07)',
      cl:'#4a4a6a', cv:'#e8e8f8', card:'#1c1c32', cardBorder:'rgba(255,255,255,.07)',
      cardTitle:'#8888b0', fl:'#4a4a6a', fv:'#e8e8f8', arRow:'#16162a',
      arTypeBg:'rgba(79,110,247,.2)', arTypeClr:'#8ba0ff', arDomain:'#c8c8e8',
      arSel:'#8888b0', scroll:'#4a4a6a', evalLbl:'#8888b0',
    };

    const page = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
      *{box-sizing:border-box;margin:0;padding:0}
      body{background:${t.body};color:${t.txt};font-family:'Segoe UI',system-ui,sans-serif;font-size:13px;padding:14px;overflow-y:auto}
      .chips{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:14px}
      .chip{background:${t.chip};border:1px solid ${t.chipBorder};border-radius:8px;padding:8px 14px;flex:1;min-width:100px;max-width:200px;overflow:hidden}
      .chip .cl{font-size:10px;color:${t.cl};text-transform:uppercase;letter-spacing:1px;margin-bottom:3px}
      .chip .cv{font-size:17px;font-weight:700;color:${t.cv};overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .chip.cg .cv{color:#34d399}.chip.cr .cv{color:#f87171}.chip.cb .cv{color:#60a5fa}
      .card{background:${t.card};border:1px solid ${t.cardBorder};border-radius:10px;padding:14px;margin-bottom:10px}
      .card-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
      .card-title{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${t.cardTitle}}
      .grid3{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;margin-bottom:12px}
      .field{min-width:0}
      .fl{font-size:10px;color:${t.fl};text-transform:uppercase;letter-spacing:.8px;margin-bottom:3px}
      .fv{font-size:13px;color:${t.fv};font-weight:500;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .mono{font-family:'Cascadia Code',Consolas,monospace;font-size:11px}
      .eval-row{display:flex;gap:10px;flex-wrap:nowrap;margin-bottom:10px;align-items:center}
      .eval-item{display:flex;align-items:center;gap:6px;white-space:nowrap}
      .eval-lbl{font-size:11px;color:${t.evalLbl}}
      .sec-lbl{font-size:10px;color:${t.fl};text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px}
      .ar-list{display:flex;flex-direction:column;gap:5px}
      .ar-row{display:flex;align-items:center;gap:8px;background:${t.arRow};border-radius:5px;padding:6px 10px;min-width:0}
      .ar-type{font-size:10px;font-weight:800;padding:1px 5px;border-radius:3px;background:${t.arTypeBg};color:${t.arTypeClr};min-width:36px;text-align:center;flex-shrink:0}
      .ar-domain{flex:1;font-family:monospace;font-size:11px;color:${t.arDomain};overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .ar-sel{color:${t.arSel}}
      .badge{display:inline-flex;align-items:center;font-size:10px;font-weight:800;padding:2px 7px;border-radius:4px;letter-spacing:.5px;white-space:nowrap;flex-shrink:0}
      .b-pass{background:rgba(52,211,153,.2);color:#34d399;border:1px solid rgba(52,211,153,.4)}
      .b-fail{background:rgba(248,113,113,.2);color:#f87171;border:1px solid rgba(248,113,113,.4)}
      .b-quarantine{background:rgba(251,191,36,.2);color:#fbbf24;border:1px solid rgba(251,191,36,.4)}
      .b-neutral{background:rgba(136,136,176,.2);color:#8888b0;border:1px solid rgba(136,136,176,.3)}
      ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:${t.scroll};border-radius:3px}
    </style></head><body>
    <div class="chips">
      <div class="chip cb"><div class="cl">Domain</div><div class="cv" style="font-size:14px">${domain}</div></div>
      <div class="chip"><div class="cl">Reported By</div><div class="cv" style="font-size:13px;font-weight:600">${orgName}</div></div>
      <div class="chip"><div class="cl">Period</div><div class="cv" style="font-size:11px;font-weight:600;padding-top:3px">${fmtDate(begin)} – ${fmtDate(end)}</div></div>
      <div class="chip"><div class="cl">Total Emails</div><div class="cv">${totalEmails}</div></div>
      <div class="chip cg"><div class="cl">Pass Rate</div><div class="cv">${passRate}%</div></div>
      <div class="chip cg"><div class="cl">Passing</div><div class="cv">${passing}</div></div>
      <div class="chip ${failing>0?'cr':''}"><div class="cl">Failing</div><div class="cv">${failing}</div></div>
    </div>
    <div class="card">
      <div class="card-hd"><span class="card-title">Published Policy</span><span class="badge b-${bc(p)}">${p.toUpperCase()}</span></div>
      <div class="grid3">
        <div class="field"><div class="fl">DKIM Alignment</div><div class="fv">${adkim}</div></div>
        <div class="field"><div class="fl">SPF Alignment</div><div class="fv">${aspf}</div></div>
        <div class="field"><div class="fl">Subdomain Policy</div><div class="fv"><span class="badge b-${bc(sp)}">${sp.toUpperCase()}</span></div></div>
        <div class="field"><div class="fl">Coverage</div><div class="fv">${pct}%</div></div>
        <div class="field"><div class="fl">Report ID</div><div class="fv mono" style="font-size:9px;color:#8888b0;word-break:break-all">${reportId}</div></div>
      </div>
    </div>
    ${recordCards}
    </body></html>`;

    setPreviewSrc(URL.createObjectURL(new Blob([page], { type: 'text/html' })));
  } catch { renderXMLPreview(xml); }
}

function renderXMLPreview(xml) {
  const esc = xml.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const hi  = esc
    .replace(/(&lt;\?[^?]*\?&gt;)/g,    '<span class="xd">$1</span>')
    .replace(/(&lt;!--[\s\S]*?--&gt;)/g, '<span class="xc">$1</span>')
    .replace(/(&lt;\/?)([\w:-]+)/g,      '$1<span class="xt">$2</span>')
    .replace(/([\w:-]+)=(&quot;[^&]*&quot;)/g,'<span class="xa">$1</span>=<span class="xv">$2</span>');
  const page = `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
    body{margin:0;padding:16px;background:#0d0d1a;font:13px/1.7 'Cascadia Code',Consolas,monospace;color:#c8c8e8;white-space:pre-wrap;word-break:break-all}
    .xd{color:#a78bfa}.xc{color:#4a4a8a;font-style:italic}.xt{color:#60a5fa}.xa{color:#34d399}.xv{color:#fbbf24}
  </style></head><body>${hi}</body></html>`;
  setPreviewSrc(URL.createObjectURL(new Blob([page], { type: 'text/html' })));
}

/* ── Save ── */
async function save(tab, isAutoSave = false) {
  tab = tab || activeTab;
  if (!tab || tab.isImage) return;
  if (!tab.path || tab.path === 'untitled') {
    const newPath = await window.api.saveFileDialog('untitled.html');
    if (!newPath) return;
    tab.path     = /\.(html|htm|css|js|jsx|ts|tsx|json|xml|svg|md)$/i.test(newPath) ? newPath : newPath + '.html';
    tab.name     = tab.path.replace(/\\/g, '/').split('/').pop();
    tab.language = detectLanguage(tab.path);
    updateCrumb();
    window.api.watchFile(tab.path);
  }
  // Format-on-save check
  if (formatOnSave === 'ask' && tab.isDirty) {
    const proceed = await showFormatOnSavePrompt();
    if (proceed === null) return; // user closed modal
  } else if (formatOnSave === 'yes' && tab.isDirty) {
    await formatCode();
  }
  const content = monacoEditor.getValue();
  const result  = await window.api.writeFile(tab.path, content);
  if (result.success) {
    tab.savedContent = content;
    if (!isAutoSave) tab.revertContent = content; // only manual saves update the revert point
    tab.isDirty = false;
    renderTabBar();
    document.getElementById('unsaved-dot').classList.remove('visible');
    document.getElementById('status-path').textContent = tab.path;
    if (isAutoSave) document.getElementById('status-autosave-label').textContent = 'Auto-saved ' + new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
    updateRevertButton();
    if (!isAutoSave) showToast('Saved');
  } else {
    showToast('Save failed: ' + result.error);
  }
}

function updateRevertButton() {
  const btn = document.getElementById('btn-revert');
  if (!btn) return;
  const show = activeTab && !activeTab.isImage && autoSaveOn &&
               activeTab.revertContent !== undefined &&
               monacoEditor.getValue() !== activeTab.revertContent;
  btn.style.display = show ? '' : 'none';
}

function revertFile() {
  if (!activeTab || activeTab.isImage) return;
  const target = activeTab.revertContent;
  if (target === undefined) { showToast('Nothing to revert to'); return; }
  if (monacoEditor.getValue() === target) { showToast('Already at last saved state'); return; }
  if (!confirm('Revert to last manually saved version? Autosave changes will be lost.')) return;
  monacoEditor.pushUndoStop();
  monacoEditor.executeEdits('revert', [{
    range: monacoEditor.getModel().getFullModelRange(),
    text: target,
    forceMoveMarkers: true
  }]);
  monacoEditor.pushUndoStop();
  // Write the reverted content to disk immediately
  window.api.writeFile(activeTab.path, target).then(() => {
    activeTab.savedContent = target;
    activeTab.isDirty = false;
    renderTabBar();
    document.getElementById('unsaved-dot').classList.remove('visible');
    updateRevertButton();
    showToast('Reverted to last manual save');
  });
}

/* ── Auto-save ── */
let lastAutoSaveTime = null;

function scheduleAutoSave() {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(async () => {
    await save(null, true); // isAutoSave = true — won't update revertContent
    lastAutoSaveTime = Date.now();
    updateSidebarAutoSaveStatus();
    updateRevertButton();
  }, autoSaveDelay);
}

function updateSidebarAutoSaveStatus() {
  const el    = document.getElementById('sidebar-autosave-status');
  const label = document.getElementById('sidebar-autosave-label');
  if (!el) return;
  if (!autoSaveOn) { el.style.display = 'none'; return; }
  el.style.display = 'flex';
  if (!lastAutoSaveTime) { label.textContent = 'Auto-save on'; return; }
  const secs = Math.round((Date.now() - lastAutoSaveTime) / 1000);
  label.textContent = secs < 5 ? 'Saved just now' : secs < 60 ? `Saved ${secs}s ago` : `Saved ${Math.round(secs/60)}m ago`;
}

/* ── Format ── */
async function formatCode() {
  if (!activeTab) return;
  if (activeTab.language === 'xml') { applyEdit(prettyXML(monacoEditor.getValue())); showToast('Formatted'); return; }
  try {
    await monacoEditor.getAction('editor.action.formatDocument').run();
    showToast('Formatted');
  } catch {
    if (activeTab.language === 'html') { applyEdit(prettyHTML(monacoEditor.getValue())); showToast('Formatted'); }
    else showToast('Formatter unavailable');
  }
}

function applyEdit(text) {
  const model = monacoEditor.getModel();
  monacoEditor.pushUndoStop();
  monacoEditor.executeEdits('format', [{ range: model.getFullModelRange(), text, forceMoveMarkers: true }]);
  monacoEditor.pushUndoStop();
}

function prettyHTML(html) {
  let result = '', indent = 0;
  const voidTags = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
  let inPre = false;
  html.split(/(<[^>]+>)/g).forEach(part => {
    if (!part) return;
    if (/<pre[\s>]/i.test(part)) inPre = true;
    if (/<\/pre>/i.test(part)) inPre = false;
    if (inPre) { result += part; return; }
    const isClose = /^<\//.test(part), isOpen = /^<[^/!]/.test(part);
    const isSelf = /\/>$/.test(part), tagName = (part.match(/^<\/?([a-z0-9]+)/i)||[])[1]||'';
    const isVoid = voidTags.has(tagName.toLowerCase());
    const isComment = /^<!--/.test(part), isDoctype = /^<!DOCTYPE/i.test(part);
    if (isClose) indent = Math.max(0, indent - 1);
    const trimmed = part.trim();
    if (trimmed) result += '  '.repeat(indent) + trimmed + '\n';
    if (isOpen && !isSelf && !isVoid && !isComment && !isDoctype) indent++;
  });
  return result.trim();
}

function prettyXML(xml) {
  let result = '', indent = 0;
  xml.split(/(<[^>]+>)/g).forEach(part => {
    if (!part.trim()) return;
    const isClose = /^<\//.test(part), isOpen = /^<[^/?!]/.test(part), isSelf = /\/>$/.test(part);
    if (isClose) indent = Math.max(0, indent - 1);
    result += '  '.repeat(indent) + part.trim() + '\n';
    if (isOpen && !isSelf) indent++;
  });
  return result.trim();
}

/* ── New File modal ── */
const NF_TYPES = [
  { ext: 'html', label: 'HTML' }, { ext: 'css',  label: 'CSS'  },
  { ext: 'js',   label: 'JS'   }, { ext: 'jsx',  label: 'JSX'  },
  { ext: 'ts',   label: 'TS'   }, { ext: 'tsx',  label: 'TSX'  },
  { ext: 'json', label: 'JSON' }, { ext: 'xml',  label: 'XML'  },
  { ext: 'svg',  label: 'SVG'  }, { ext: 'md',   label: 'MD'   },
  { ext: 'txt',  label: 'TXT'  },
];
const NF_STARTERS = {
  html: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>New Page</title>\n</head>\n<body>\n\n</body>\n</html>',
  css:  '/* Styles */\n', js: '// Script\n', jsx: '// Component\n',
  ts:   '// TypeScript\n', tsx: '// TSX Component\n',
  json: '{\n  \n}\n',
  xml:  '<?xml version="1.0" encoding="UTF-8"?>\n<root>\n\n</root>',
  svg:  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n\n</svg>',
  md: '# Title\n\n', txt: '',
};

let _nfDest    = '';
let _nfExt     = 'html';
let _nfOutside = null; // null | 'add-ws' | 'just-file'

function _nfInsideWs(p) {
  const ws = (workspaceFolder || '').replace(/\\/g, '/').toLowerCase();
  return ws && p.replace(/\\/g, '/').toLowerCase().startsWith(ws);
}
function _nfSetDest(p) {
  _nfDest    = p;
  _nfOutside = null;
  const el = document.getElementById('nf-dest-path');
  el.textContent = p || 'Choose a folder…';
  el.classList.toggle('set', !!p);
  document.getElementById('nf-outside-warn').style.display = (p && !_nfInsideWs(p)) ? '' : 'none';
  _nfUpdateCreate();
}
function _nfUpdateCreate() {
  document.getElementById('btn-nf-create').disabled =
    !(_nfDest && (_nfInsideWs(_nfDest) || _nfOutside !== null));
}

function newFile() {
  const activeDir = activeTab?.path ? activeTab.path.replace(/[\\/][^\\/]+$/, '') : null;
  _nfDest    = activeDir || workspaceFolder || '';
  _nfExt     = 'html';
  _nfOutside = null;
  const grid = document.getElementById('nf-type-grid');
  grid.innerHTML = NF_TYPES.map(t =>
    `<button type="button" class="nf-type-chip${t.ext === 'html' ? ' active' : ''}" data-ext="${t.ext}">${t.label}</button>`
  ).join('');
  grid.querySelectorAll('.nf-type-chip').forEach(b => b.onclick = () => {
    _nfExt = b.dataset.ext;
    grid.querySelectorAll('.nf-type-chip').forEach(x => x.classList.toggle('active', x === b));
    document.getElementById('nf-ext').textContent = '.' + _nfExt;
  });
  const destEl = document.getElementById('nf-dest-path');
  destEl.textContent = _nfDest || 'Choose a folder…';
  destEl.classList.toggle('set', !!_nfDest);
  document.getElementById('nf-outside-warn').style.display =
    (_nfDest && workspaceFolder && !_nfInsideWs(_nfDest)) ? '' : 'none';
  document.getElementById('nf-ext').textContent = '.html';
  document.getElementById('nf-name-input').value = '';
  _nfUpdateCreate();
  document.getElementById('nf-modal').style.display = 'flex';
  setTimeout(() => document.getElementById('nf-name-input').focus(), 80);
}
function _closeNfModal() {
  document.getElementById('nf-modal').style.display = 'none';
  setTimeout(() => monacoEditor?.focus(), 0);
}
async function _commitNfCreate() {
  const raw  = document.getElementById('nf-name-input').value.trim() || 'untitled';
  const name = raw.endsWith('.' + _nfExt) ? raw : raw + '.' + _nfExt;
  if (!_nfDest) return;
  const filePath = _nfDest + '\\' + name;
  const exists = await window.api.readFile(filePath);
  if (exists.success) { showToast('"' + name + '" already exists'); document.getElementById('nf-name-input').select(); return; }
  const starter = NF_STARTERS[_nfExt] ?? '';
  const r = await window.api.writeFile(filePath, starter);
  if (!r.success) { showToast('Could not create file'); return; }
  if (_nfOutside === 'add-ws') {
    workspaceFolder = _nfDest;
    if (_activeWs) { _activeWs.folder = _nfDest; sessionStorage.setItem('active-workspace', JSON.stringify(_activeWs)); }
  }
  _closeNfModal();
  await openTab(filePath);
  if (workspaceFolder) loadWorkspaceSidebar();
}

// Wire modal buttons (after DOM is ready — called from init)
function _initNfModal() {
  document.getElementById('btn-nf-close').onclick       = _closeNfModal;
  document.getElementById('btn-nf-cancel').onclick      = _closeNfModal;
  document.getElementById('btn-nf-create').onclick      = _commitNfCreate;
  document.getElementById('btn-nf-browse').onclick      = async () => { const f = await window.api.openFolderDialog(); if (f) _nfSetDest(f); };
  document.getElementById('btn-nf-add-ws').onclick      = () => { _nfOutside = 'add-ws';    document.getElementById('nf-outside-warn').style.display = 'none'; _nfUpdateCreate(); };
  document.getElementById('btn-nf-just-file').onclick   = () => { _nfOutside = 'just-file'; document.getElementById('nf-outside-warn').style.display = 'none'; _nfUpdateCreate(); };
  document.getElementById('btn-nf-change-dest').onclick = () => _nfSetDest(workspaceFolder || '');
  document.getElementById('nf-name-input').addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); _commitNfCreate(); }
    if (e.key === 'Escape') _closeNfModal();
  });
}

/* ── Rename file from sidebar ── */
async function renameSidebarFile(filePath) {
  const oldName = filePath.split(/[\\/]/).pop();
  const newName = prompt(`Rename "${oldName}" to:`, oldName);
  if (!newName || newName === oldName) return;
  const dir     = filePath.replace(/[\\/][^\\/]+$/, '');
  const newPath = dir + '\\' + newName;
  const result  = await window.api.renameFile(filePath, newPath);
  if (!result.success) { showToast('Rename failed'); return; }
  // Update open tab if it matches
  const tab = tabs.find(t => t.path === filePath);
  if (tab) { tab.path = newPath; tab.name = newName; tab.language = detectLanguage(newPath); renderTabBar(); updateCrumb(); }
  loadWorkspaceSidebar();
  showToast(`Renamed to ${newName}`);
}

/* ── Delete file from sidebar ── */
async function deleteSidebarFile(filePath) {
  const name = filePath.split(/[\\/]/).pop();
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
  const tab = tabs.find(t => t.path === filePath);
  if (tab) closeTab(tab);
  const result = await window.api.deleteFile(filePath);
  if (!result.success) { showToast('Delete failed'); return; }
  loadWorkspaceSidebar();
  showToast(`Deleted ${name}`);
}

/* ── Crumb ── */
function updateCrumb() {
  if (!activeTab) return;
  const parts = activeTab.path.replace(/\\/g, '/').split('/');
  document.getElementById('crumb-file').textContent   = parts.pop();
  document.getElementById('crumb-folder').textContent = parts.slice(-2).join(' / ');
}

/* ── Format-on-save prompt ── */
function showFormatOnSavePrompt() {
  return new Promise(resolve => {
    const modal = document.getElementById('fmt-modal');
    modal.style.display = 'flex';
    document.getElementById('fmt-dna').checked = false;

    const cleanup = (result) => {
      modal.style.display = 'none';
      if (document.getElementById('fmt-dna').checked) {
        formatOnSave = result ? 'yes' : 'no';
        window.api.saveSettings({ fontSize, fontFamily, tabSize, minimap: minimapOn, wordWrap: wrapOn, autoSave: autoSaveOn, layout: layoutMode, formatOnSave });
      }
      resolve(result);
    };

    document.getElementById('btn-fmt-yes').onclick = async () => { cleanup(true); await formatCode(); };
    document.getElementById('btn-fmt-no').onclick  = () => cleanup(false);
  });
}

/* ── Terminal ── */
const termHistory = [];
let termHistoryIdx = -1;
let termCwd        = workspaceFolder || 'C:\\';
let currentDevCmdId = null;
let devServerRunning = false;

function termPrompt() { return termCwd + '>'; }

function initTerminal() {
  document.getElementById('terminal-status').innerHTML = '<span class="term-status-dot"></span> Ready';
  document.getElementById('terminal-live-prompt').textContent = termPrompt();

  // Stream output
  window.api.onCmdOutput(data => {
    if (data.id !== currentCmdId) return;
    appendTermOutput(data.data, data.isErr ? 'term-line-err' : '');
  });

  // Process done
  window.api.onCmdDone(data => {
    if (data.id !== currentCmdId) return;
    // Dev server exited
    if (data.id === currentDevCmdId) {
      currentDevCmdId  = null;
      devServerRunning = false;
      updateDevButton();
    }
    if (window._deployDoneCleanup) {
      const fn = window._deployDoneCleanup;
      window._deployDoneCleanup = null;
      fn(data);
    }
    currentCmdId = null;
    document.getElementById('btn-term-kill').style.display = 'none';
    document.querySelector('.term-status-dot')?.classList.remove('running');
    document.getElementById('terminal-input').readOnly = false;
    appendTermPromptLine('');
    document.getElementById('terminal-status').innerHTML = '<span class="term-status-dot"></span> Ready';
    focusTermInput();
  });

  // Input box: Enter runs, Up/Down history, Ctrl+C kills
  const inp = document.getElementById('terminal-input');
  inp.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); runTerminalCommand(); }
    if (e.key === 'c' && e.ctrlKey) { e.preventDefault(); killTerminalCommand(); }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (termHistory.length === 0) return;
      termHistoryIdx = Math.min(termHistoryIdx + 1, termHistory.length - 1);
      inp.value = termHistory[termHistoryIdx];
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      termHistoryIdx = Math.max(termHistoryIdx - 1, -1);
      inp.value = termHistoryIdx >= 0 ? termHistory[termHistoryIdx] : '';
    }
  });

  // Clicking output area focuses input instantly
  document.getElementById('terminal-output').addEventListener('click', focusTermInput);

  // Typing anywhere in the terminal panel (but not in input) redirects to input
  document.getElementById('terminal-panel').addEventListener('keydown', e => {
    if (e.target === inp) return;
    if (e.ctrlKey && e.key === 'c') { e.preventDefault(); killTerminalCommand(); return; }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      focusTermInput();
      inp.value += e.key;
      e.preventDefault();
    }
  });

  document.getElementById('btn-term-kill').onclick  = killTerminalCommand;
  document.getElementById('btn-term-clear').onclick = clearTerminal;
  document.getElementById('btn-term-close').onclick = closeTerminal;
}

function focusTermInput() {
  const inp = document.getElementById('terminal-input');
  inp.focus();
  inp.setSelectionRange(inp.value.length, inp.value.length);
}

function appendTermOutput(text, cls) {
  const out = document.getElementById('terminal-output');
  // split on newlines so each line renders cleanly
  const lines = text.split(/\r?\n/);
  lines.forEach((line, i) => {
    if (i === lines.length - 1 && line === '') return; // skip trailing empty
    const el = document.createElement('div');
    if (cls) el.className = cls;
    el.textContent = line;
    out.appendChild(el);
  });
  out.scrollTop = out.scrollHeight;
}

function appendTermPromptLine(extra) {
  if (extra) {
    const out = document.getElementById('terminal-output');
    const el  = document.createElement('div');
    el.className = 'term-line-prompt';
    el.textContent = termPrompt() + ' ' + extra;
    out.appendChild(el);
    out.scrollTop = out.scrollHeight;
  }
  const lp = document.getElementById('terminal-live-prompt');
  if (lp) lp.textContent = termPrompt();
  const inp = document.getElementById('terminal-input');
  if (inp) inp.value = '';
}

function appendTermSys(msg) {
  const out  = document.getElementById('terminal-output');
  const line = document.createElement('div');
  line.className = 'term-line-sys';
  line.textContent = msg;
  out.appendChild(line);
  out.scrollTop = out.scrollHeight;
}

function openTerminal() {
  terminalOpen = true;
  document.getElementById('terminal-panel').style.display = 'flex';
  document.getElementById('btn-terminal').classList.add('on');
  // Show a prompt if output is empty
  const out = document.getElementById('terminal-output');
  if (out.children.length === 0) appendTermPromptLine('');
  setTimeout(() => { monacoEditor.layout(); focusTermInput(); }, 0);
}

function closeTerminal() {
  terminalOpen = false;
  document.getElementById('terminal-panel').style.display = 'none';
  document.getElementById('btn-terminal').classList.remove('on');
  setTimeout(() => monacoEditor.layout(), 0);
}

function toggleTerminal() {
  terminalOpen ? closeTerminal() : openTerminal();
}

function clearTerminal() {
  document.getElementById('terminal-output').innerHTML = '';
  document.getElementById('terminal-status').innerHTML = '<span class="term-status-dot"></span> Ready';
  if (terminalOpen) appendTermPromptLine('');
  focusTermInput();
}

async function runTerminalCommand() {
  const input = document.getElementById('terminal-input');
  const cmd   = input.value.trim();
  if (!cmd) { focusTermInput(); return; }
  if (!terminalOpen) openTerminal();

  // Add to history
  if (termHistory[0] !== cmd) termHistory.unshift(cmd);
  if (termHistory.length > 100) termHistory.pop();
  termHistoryIdx = -1;

  // Intercept cd client-side (no persistent shell session in cmd /c)
  const cdMatch = cmd.match(/^cd(?:\s+(.+))?$/i);
  if (cdMatch) {
    appendTermPromptLine(cmd);
    const arg = cdMatch[1]?.trim();
    if (!arg || arg === '~') {
      // bare `cd` or `cd ~` → back to workspace root
      termCwd = workspaceFolder || 'C:\\';
      document.getElementById('terminal-live-prompt').textContent = termPrompt();
      appendTermPromptLine('');
    } else {
      const res = await window.api.resolveCd(termCwd, arg);
      if (res.ok) {
        termCwd = res.path;
        document.getElementById('terminal-live-prompt').textContent = termPrompt();
      } else {
        appendTermOutput(res.error, 'term-line-err');
      }
      appendTermPromptLine('');
    }
    document.getElementById('terminal-input').value = '';
    focusTermInput();
    return;
  }

  // Show prompt + command in output, lock input while running
  appendTermPromptLine(cmd);
  document.getElementById('terminal-input').readOnly = true;
  document.getElementById('btn-term-kill').style.display = '';
  document.getElementById('terminal-status').innerHTML = '<span class="term-status-dot running"></span> Running…';

  const res = await window.api.runCommand(cmd, termCwd);
  currentCmdId = res.id;
}

async function killTerminalCommand() {
  if (!currentCmdId) {
    // Clear input line like real Ctrl+C
    const inp = document.getElementById('terminal-input');
    if (inp.value) {
      appendTermPromptLine(inp.value + '^C');
      inp.value = '';
    }
    focusTermInput();
    return;
  }
  await window.api.killCommand(currentCmdId);
  currentCmdId = null;
  document.getElementById('btn-term-kill').style.display = 'none';
  document.getElementById('terminal-input').readOnly = false;
  document.getElementById('terminal-status').innerHTML = '<span class="term-status-dot"></span> Ready';
  appendTermSys('^C');
  appendTermPromptLine('');
  focusTermInput();
}

/* ── Deploy + Dev Server ── */
async function initDeploy() {
  deployConfigs = await window.api.getDeployConfigs() || {};
  // Always prefer the workspace setting over a stale cached config
  if (_activeWs?.deploy && workspaceFolder) {
    deployConfigs[workspaceFolder] = _activeWs.deploy;
  }
  updateDeployButton();
  updateDevButton();
}

function _devServerCmd() {
  if (!workspaceFolder) return '';
  // Prefer live workspace data fetched from settings; fall back to _activeWs
  return _liveDevCmd !== undefined ? _liveDevCmd : (_activeWs?.devServer || '');
}
let _liveDevCmd   = _activeWs?.devServer || '';
let _liveDeployCmd = _activeWs?.deploy || '';

// When settings saves workspaces, update live commands for the current workspace
document.addEventListener('workspaces-changed', ev => {
  const ws = (ev.detail || []).find(w => w.id === _activeWs?.id);
  if (!ws) return;
  _liveDevCmd    = ws.devServer || '';
  _liveDeployCmd = ws.deploy    || '';
  if (_liveDeployCmd && workspaceFolder) deployConfigs[workspaceFolder] = _liveDeployCmd;
  updateDeployButton();
  updateDevButton();
});

function updateDevButton() {
  const cmd = _devServerCmd();
  const btn = document.getElementById('btn-dev');
  if (!btn) return;
  btn.style.display = cmd ? '' : 'none';
  if (devServerRunning) {
    btn.classList.add('on');
    btn.title = 'Stop dev server';
    const lbl = document.getElementById('btn-dev-label');
    if (lbl) lbl.textContent = 'Stop Dev';
  } else {
    btn.classList.remove('on');
    btn.title = 'Start dev server';
    const lbl = document.getElementById('btn-dev-label');
    if (lbl) lbl.textContent = 'Dev';
  }
}

async function toggleDevServer() {
  if (devServerRunning) {
    stopDevServer();
  } else {
    await runDevServer();
  }
}

async function runDevServer() {
  const cmd = _devServerCmd();
  if (!cmd) { showToast('No dev server command set — add one in workspace settings'); return; }
  if (!terminalOpen) openTerminal();
  clearTerminal();
  appendTermSys(`Dev Server: ${cmd}`);
  document.getElementById('terminal-input').readOnly = true;
  document.getElementById('btn-term-kill').style.display = '';
  document.getElementById('terminal-status').innerHTML = '<span class="term-status-dot running"></span> Dev server running…';
  devServerRunning = true;
  updateDevButton();
  const res = await window.api.runCommand(cmd, workspaceFolder);
  currentDevCmdId = res.id;
  currentCmdId    = res.id; // so kill button works too
}

function stopDevServer() {
  if (currentDevCmdId) window.api.killCommand(currentDevCmdId);
  currentDevCmdId  = null;
  devServerRunning = false;
  currentCmdId     = null;
  document.getElementById('terminal-input').readOnly = false;
  document.getElementById('btn-term-kill').style.display = 'none';
  document.getElementById('terminal-status').innerHTML = '<span class="term-status-dot"></span> Ready';
  appendTermSys('Dev server stopped.');
  appendTermPromptLine('');
  updateDevButton();
}

function updateDeployButton() {
  const hasCmd = workspaceFolder && (deployConfigs[workspaceFolder] || _liveDeployCmd);
  document.getElementById('btn-deploy').style.display = hasCmd ? '' : 'none';
}

function openDeployModal() {
  const modal = document.getElementById('deploy-modal');
  document.getElementById('deploy-ws-label').textContent = workspaceFolder || '(no workspace)';
  document.getElementById('deploy-cmd-input').value = (workspaceFolder && deployConfigs[workspaceFolder]) || '';
  modal.style.display = 'flex';
  setTimeout(() => document.getElementById('deploy-cmd-input').focus(), 50);
}

function closeDeployModal() {
  document.getElementById('deploy-modal').style.display = 'none';
}

async function saveAndRunDeploy() {
  const cmd = document.getElementById('deploy-cmd-input').value.trim();
  if (!cmd) { showToast('Enter a command first'); return; }
  if (!workspaceFolder) { showToast('No workspace open'); return; }
  deployConfigs[workspaceFolder] = cmd;
  await window.api.saveDeployConfigs(deployConfigs);
  updateDeployButton();
  closeDeployModal();
  runDeploy();
}

async function runDeploy() {
  const cmd = (workspaceFolder && deployConfigs[workspaceFolder]) || _liveDeployCmd;
  if (!cmd) { openDeployModal(); return; }
  if (!terminalOpen) openTerminal();
  clearTerminal();
  appendTermSys(`Deploy: ${cmd}`);
  document.getElementById('terminal-input').readOnly = true;
  document.getElementById('btn-term-kill').style.display = '';
  document.getElementById('terminal-status').innerHTML   = '<span class="term-status-dot running"></span> Deploying…';
  const res = await window.api.runCommand(cmd, workspaceFolder);
  currentCmdId = res.id;

  // Override done handler to show Deploy Done / Keep Working
  const origDone = window._deployDoneHandler;
  if (origDone) window.api.onCmdDone(() => {}); // noop guard
  window._deployDoneCleanup = (data) => {
    if (data.id !== currentCmdId) return;
    showDeployDoneBar(data.code);
  };
}

function showDeployDoneBar(exitCode) {
  const out   = document.getElementById('terminal-output');
  const bar   = document.createElement('div');
  const ok    = exitCode === 0;
  bar.style.cssText = `display:flex;align-items:center;gap:10px;padding:10px 14px;margin-top:8px;background:${ok?'rgba(52,211,153,.12)':'rgba(248,113,113,.1)'};border-radius:6px;border:1px solid ${ok?'rgba(52,211,153,.3)':'rgba(248,113,113,.3)'}`;
  bar.innerHTML = `<span style="font-size:12px;color:${ok?'#34d399':'#f87171'};flex:1">${ok?'Deploy complete':'Deploy finished with errors'} (exit ${exitCode})</span>
    <button onclick="clearTerminal();closeTerminal()" style="background:none;border:1px solid ${ok?'rgba(52,211,153,.4)':'rgba(248,113,113,.4)'};border-radius:4px;padding:3px 10px;font-size:11px;color:${ok?'#34d399':'#f87171'};cursor:pointer">Done</button>
    <button onclick="this.closest('[style]').remove()" style="background:none;border:1px solid rgba(255,255,255,.1);border-radius:4px;padding:3px 10px;font-size:11px;color:#8888b0;cursor:pointer">Keep Working</button>`;
  out.appendChild(bar);
  out.scrollTop = out.scrollHeight;
}

/* ── Backup ── */
function openBackupModal() {
  if (!workspaceFolder) { showToast('No workspace open'); return; }

  // Default name: workspaceName-backup-YYYY-MM-DD
  const today    = new Date().toISOString().slice(0, 10);
  const safeName = (workspaceName || 'workspace').replace(/[<>:"/\\|?*]/g, '-');
  document.getElementById('backup-name-input').value = `${safeName}-backup-${today}`;

  // Default destination: primary workspace folder\HTMLedger-Backups
  document.getElementById('backup-dest-input').value = workspaceFolder + '\\HTMLedger-Backups';

  const status = document.getElementById('backup-status');
  status.style.display = 'none';
  status.className = 'backup-status';

  document.getElementById('btn-backup-create').disabled = false;
  document.getElementById('btn-backup-create').textContent = 'Create Backup';

  document.getElementById('backup-modal').style.display = 'flex';
  setTimeout(() => document.getElementById('backup-name-input').select(), 50);
}

function closeBackupModal() {
  document.getElementById('backup-modal').style.display = 'none';
}

async function runCreateBackup() {
  const zipName = document.getElementById('backup-name-input').value.trim();
  const destDir = document.getElementById('backup-dest-input').value.trim();
  if (!zipName) { showToast('Enter a backup name'); return; }
  if (!destDir) { showToast('Choose a destination folder'); return; }

  const status = document.getElementById('backup-status');
  const btn    = document.getElementById('btn-backup-create');
  status.className     = 'backup-status backup-status-running';
  status.textContent   = 'Creating backup…';
  status.style.display = '';
  btn.disabled         = true;
  btn.textContent      = 'Working…';

  const allFolders = [...workspaceFolders, ...extraFolders].filter(Boolean);
  const res = await window.api.createBackup({ folders: allFolders, destDir, zipName });

  if (res.ok) {
    status.className   = 'backup-status backup-status-ok';
    status.innerHTML   = `Saved to <span class="backup-path" title="${res.path}">${res.path}</span> ` +
      `<button class="backup-show-btn" id="btn-backup-show">Show in Folder</button>`;
    document.getElementById('btn-backup-show').onclick = () => window.api.openInExplorer(res.path);
    btn.textContent    = 'Done';
    btn.onclick        = closeBackupModal;
    btn.disabled       = false;
  } else {
    status.className   = 'backup-status backup-status-err';
    status.textContent = 'Error: ' + res.error;
    btn.disabled       = false;
    btn.textContent    = 'Retry';
  }
}

/* ── Quick-open palette (Ctrl+P) ── */
function initQuickOpen() {
  document.getElementById('qo-overlay').addEventListener('click', e => {
    if (e.target === document.getElementById('qo-overlay')) closeQuickOpen();
  });
  document.getElementById('qo-input').addEventListener('input', filterQuickOpen);
  document.getElementById('qo-input').addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); moveQO(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); moveQO(-1); }
    else if (e.key === 'Enter')   { e.preventDefault(); selectQO(); }
    else if (e.key === 'Escape')  { e.preventDefault(); closeQuickOpen(); }
  });
}

async function openQuickOpen() {
  if (!workspaceFolder) { showToast('No workspace open'); return; }
  const overlay = document.getElementById('qo-overlay');
  overlay.style.display = 'flex';
  document.getElementById('qo-input').value = '';
  document.getElementById('qo-input').focus();
  quickOpenIdx = -1;

  // Collect all files from tree
  const res = await window.api.listDirTree(workspaceFolder);
  quickOpenFiles = [];
  function collect(nodes) { nodes.forEach(n => { if (n.type === 'file') quickOpenFiles.push(n); else collect(n.children); }); }
  if (res.success) collect(res.tree);
  filterQuickOpen();
}

function closeQuickOpen() {
  document.getElementById('qo-overlay').style.display = 'none';
  quickOpenFiles = []; quickOpenIdx = -1;
}

function filterQuickOpen() {
  const q       = document.getElementById('qo-input').value.toLowerCase();
  const results = document.getElementById('qo-results');
  quickOpenIdx  = -1;
  const filtered = q
    ? quickOpenFiles.filter(f => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q))
    : quickOpenFiles.slice(0, 50);

  if (filtered.length === 0) {
    results.innerHTML = '<div class="qo-empty">No files found</div>';
    results._filtered = [];
    return;
  }
  results.innerHTML = '';
  results._filtered = filtered;
  filtered.slice(0, 60).forEach((f, i) => {
    const item = document.createElement('div');
    item.className = 'qo-item';
    item.dataset.idx = i;
    const rel = f.path.replace(workspaceFolder, '').replace(/^[/\\]/, '').replace(/\\/g, '/');
    item.innerHTML = `<span class="tree-icon ${fileIconClass(f.name)}" style="flex-shrink:0">${fileIconLabel(f.name)}</span><span class="qo-item-name">${f.name}</span><span class="qo-item-path">${rel}</span>`;
    item.addEventListener('click', () => { openTab(f.path); closeQuickOpen(); });
    item.addEventListener('mouseenter', () => { quickOpenIdx = i; highlightQO(); });
    results.appendChild(item);
  });
}

function moveQO(dir) {
  const results  = document.getElementById('qo-results');
  const items    = results.querySelectorAll('.qo-item');
  quickOpenIdx   = Math.max(0, Math.min(items.length - 1, quickOpenIdx + dir));
  highlightQO();
  items[quickOpenIdx]?.scrollIntoView({ block: 'nearest' });
}

function highlightQO() {
  document.querySelectorAll('.qo-item').forEach((el, i) =>
    el.classList.toggle('active', i === quickOpenIdx));
}

function selectQO() {
  const results  = document.getElementById('qo-results');
  const filtered = results._filtered || [];
  const idx      = quickOpenIdx >= 0 ? quickOpenIdx : 0;
  if (filtered[idx]) { openTab(filtered[idx].path); closeQuickOpen(); }
}

/* ── Events ── */
function bindEvents() {
  document.getElementById('btn-min').onclick   = () => window.api.minimize();
  document.getElementById('btn-max').onclick   = () => window.api.maximize();
  document.getElementById('btn-close').onclick = () => window.api.close();

  document.getElementById('btn-back').onclick = () => {
    const dirty = tabs.filter(t => t.isDirty);
    if (dirty.length > 0 && !confirm(`${dirty.length} file(s) have unsaved changes. Leave anyway?`)) return;
    sessionStorage.setItem('user-navigated-back', '1');
    window.location.href = 'home.html';
  };

  document.getElementById('btn-save').onclick   = () => save();
  document.getElementById('btn-revert').onclick = revertFile;
  document.getElementById('btn-undo').onclick   = () => monacoEditor.trigger('', 'undo', null);
  document.getElementById('btn-redo').onclick   = () => monacoEditor.trigger('', 'redo', null);
  document.getElementById('btn-format').onclick = formatCode;
  document.getElementById('btn-new-tab').onclick = newFile;
  _initNfModal();

  document.getElementById('btn-sidebar-refresh').onclick    = loadWorkspaceSidebar;
  document.getElementById('btn-sidebar-new-file').onclick   = newFile;
  document.getElementById('btn-add-folder').onclick         = addExtraFolder;

  document.getElementById('btn-dmarc-view').onclick    = toggleDMARCView;
  document.getElementById('btn-refresh-preview').onclick = () => {
    const frame = document.getElementById('preview-frame');
    if (previewMode === 'server' && frame.src.startsWith('http://127.0.0.1:')) {
      try { frame.contentWindow.location.reload(); } catch { updatePreview(); }
    } else {
      updatePreview();
    }
  };
  document.getElementById('btn-open-browser').onclick = () => {
    if (activeTab) window.api.openInExplorer(activeTab.path);
    else showToast('No file open');
  };

  // Preview warning bar
  document.getElementById('btn-preview-try').onclick = () => {
    const bar = document.getElementById('preview-warning-bar');
    bar.dataset.dismissed = '1';
    bar.style.display = 'none';
    setPreviewSrc(URL.createObjectURL(new Blob([monacoEditor.getValue()], { type: 'text/html' })));
  };
  document.getElementById('btn-preview-hide').onclick = () => {
    const bar = document.getElementById('preview-warning-bar');
    bar.dataset.dismissed = '1';
    bar.style.display = 'none';
    document.getElementById('preview-section').style.display = 'none';
    document.getElementById('pane-resizer').style.display = 'none';
    document.getElementById('no-preview-bar').style.display = 'flex';
    monacoEditor.layout();
  };
  document.getElementById('btn-no-preview-switch').onclick = () => setLayout('split');

  // Empty workspace "Set Default File" button
  const _ewBtn = document.getElementById('btn-ew-set-default');
  if (_ewBtn) _ewBtn.onclick = () => openUnifiedSettings('workspace', _activeWs ? _activeWs.id : null, 'default-file');

  // Font size
  document.getElementById('btn-font-dec').onclick = () => setFontSize(fontSize - 1);
  document.getElementById('btn-font-inc').onclick = () => setFontSize(fontSize + 1);

  // Toggles
  document.getElementById('btn-sidebar').onclick  = toggleSidebar;
  document.getElementById('btn-minimap').onclick  = toggleMinimap;
  document.getElementById('btn-wrap').onclick     = toggleWrap;
  document.getElementById('btn-autosave').onclick = toggleAutoSave;

  // Layout
  document.getElementById('layout-split').onclick   = () => setLayout('split');
  document.getElementById('layout-code').onclick    = () => setLayout('code');
  document.getElementById('layout-preview').onclick = () => setLayout('preview');

  // Snippets
  document.getElementById('btn-snippets').onclick = toggleSnippetsPanel;

  // Settings
  // Terminal
  document.getElementById('btn-terminal').onclick = toggleTerminal;

  // Deploy
  document.getElementById('btn-backup').onclick          = openBackupModal;
  document.getElementById('btn-backup-close').onclick    = closeBackupModal;
  document.getElementById('btn-backup-cancel').onclick   = closeBackupModal;
  document.getElementById('btn-backup-create').onclick   = runCreateBackup;
  document.getElementById('btn-backup-browse').onclick   = async () => {
    const picked = await window.api.pickBackupFolder();
    if (picked) document.getElementById('backup-dest-input').value = picked;
  };
  document.getElementById('btn-dev').onclick              = toggleDevServer;
  document.getElementById('btn-deploy').onclick          = runDeploy;
  document.getElementById('btn-deploy-close').onclick    = closeDeployModal;
  document.getElementById('btn-deploy-cancel').onclick   = closeDeployModal;
  document.getElementById('btn-deploy-save').onclick     = saveAndRunDeploy;
  document.getElementById('deploy-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('deploy-modal')) closeDeployModal();
  });

  document.getElementById('btn-settings').onclick = openSettingsModal;

  document.getElementById('btn-contact-close').onclick  = closeContactModal;
  document.getElementById('btn-contact-cancel').onclick = closeContactModal;
  document.getElementById('btn-contact-send').onclick   = sendContactForm;
  document.getElementById('contact-modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeContactModal(); });

  // File changed banner
  document.getElementById('btn-file-reload').onclick  = reloadActiveFile;
  document.getElementById('btn-file-dismiss').onclick = () => {
    if (activeTab) activeTab.externallyChanged = false;
    hideFileChangedBanner();
  };

  // Sidebar view tabs
  document.getElementById('sv-tab-files').onclick  = () => switchSidebarView('files');
  document.getElementById('sv-tab-search').onclick = () => switchSidebarView('search');

  // Sidebar search
  document.getElementById('btn-sv-search').onclick = runFolderSearch;
  document.getElementById('sv-search-input').addEventListener('keydown', e => {
    if (e.key === 'Enter') runFolderSearch();
  });
  document.getElementById('sv-search-mode').addEventListener('change', e => {
    sidebarSearchMode = e.target.value;
    const inp = document.getElementById('sv-search-input');
    inp.placeholder = sidebarSearchMode === 'files' ? 'Search files & folders…' : 'Search text in files…';
    if (inp.value.trim()) runFolderSearch();
  });
  // Sidebar sort
  document.getElementById('sidebar-sort').addEventListener('change', e => {
    sidebarSort = e.target.value;
    localStorage.setItem('htmledger-sidebar-sort', sidebarSort);
    loadWorkspaceSidebar();
  });

  // Sidebar context menu
  document.getElementById('sctx-open').onclick      = () => { const p = sidebarCtxTarget; hideSidebarCtx(); if (p) openTab(p); };
  document.getElementById('sctx-pin').onclick       = () => { const p = sidebarCtxTarget; hideSidebarCtx(); if (p) { _pinnedFiles.includes(p) ? _unpinFile(p) : _pinFile(p); } };
  document.getElementById('sctx-rename').onclick    = () => { const p = sidebarCtxTarget; hideSidebarCtx(); if (p) renameSidebarFile(p); };
  document.getElementById('sctx-duplicate').onclick = () => {
    const p = sidebarCtxTarget; hideSidebarCtx();
    if (!p) return;
    const parts = p.replace(/\\/g, '/').split('/');
    const base  = parts.pop();
    const dot   = base.lastIndexOf('.');
    const name  = dot > 0 ? base.slice(0, dot) : base;
    const ext   = dot > 0 ? base.slice(dot) : '';
    const dest  = [...parts, name + '-copy' + ext].join('/').replace(/\//g, '\\');
    window.api.copyFile(p, dest).then(r => {
      if (r.success) { loadWorkspaceSidebar(); openTab(dest); }
      else showToast('Duplicate failed: ' + r.error);
    });
  };
  document.getElementById('sctx-explorer').onclick  = () => { const p = sidebarCtxTarget; hideSidebarCtx(); if (p) window.api.openInExplorer(p); };
  document.getElementById('sctx-delete').onclick    = () => { const p = sidebarCtxTarget; hideSidebarCtx(); if (p) deleteSidebarFile(p); };
  document.addEventListener('mousedown', e => {
    if (!document.getElementById('sidebar-ctx').contains(e.target)) hideSidebarCtx();
    if (snippetsPanelOpen && !document.getElementById('snippets-panel').contains(e.target) && !e.target.closest('#btn-snippets')) closeSnippetsPanel();
  });

  // Session save on close
  window.addEventListener('beforeunload', () => {
    if (tabs.length > 0 && window.api.saveSession) {
      window.api.saveSession({ tabs: tabs.map(t => t.path), activeTab: activeTab?.path });
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (matchesBinding(e, 'save'))            { e.preventDefault(); save(); }
    if (matchesBinding(e, 'new-file'))        { e.preventDefault(); newFile(); }
    if (matchesBinding(e, 'close-tab'))       { e.preventDefault(); if (activeTab) closeTab(activeTab); }
    if (matchesBinding(e, 'quick-open'))      { e.preventDefault(); openQuickOpen(); }
    if (matchesBinding(e, 'toggle-terminal')) { e.preventDefault(); toggleTerminal(); }
    // Reopen last closed tab
    if (e.ctrlKey && e.shiftKey && e.key === 'T') {
      e.preventDefault();
      const last = recentlyClosed.pop();
      if (last) openTab(last);
    }
    if (e.key === 'Escape') {
      closeSnippetsPanel(); closeSettingsModal(); hideSidebarCtx();
      closeQuickOpen();
      document.getElementById('deploy-modal').style.display = 'none';
      document.getElementById('fmt-modal').style.display = 'none';
    }
    if (!monacoEditor.hasTextFocus()) {
      if (e.ctrlKey && !e.shiftKey && e.key === 'z') { e.preventDefault(); monacoEditor.trigger('keyboard','undo',null); monacoEditor.focus(); }
      if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); monacoEditor.trigger('keyboard','redo',null); monacoEditor.focus(); }
    }
  });

  // Drag & drop — open files by dragging onto editor
  document.addEventListener('dragover', e => e.preventDefault());
  document.addEventListener('drop', e => {
    e.preventDefault();
    const files = [...e.dataTransfer.files].filter(f => /\.(html|htm|css|js|jsx|ts|tsx|json|xml|svg|md|png|jpg|jpeg|gif|webp)$/i.test(f.name));
    files.forEach(f => openTab(f.path));
  });
}

/* ── Feature controls ── */
function _saveSettings() {
  window.api.saveSettings({
    fontSize, fontFamily, tabSize, lineHeight, minimap: minimapOn, wordWrap: wrapOn,
    autoSave: autoSaveOn, autoSaveDelay, layout: layoutMode, formatOnSave,
    fontLigatures, autoCloseBrackets, autoCloseTags, renderWhitespace, cursorStyle,
    autoUpdates: autoUpdatesOn, keybindings: customKeybindings, previewMode,
  });
}

function setFontSize(size) {
  fontSize = Math.max(10, Math.min(24, size));
  monacoEditor.updateOptions({ fontSize });
  document.getElementById('font-display').textContent = fontSize;
  _saveSettings();
}

function setDeviceFrame(mode) {
  deviceFrame = mode;
  const frame = document.getElementById('preview-frame');
  const btns  = document.querySelectorAll('.dev-frame-btn');
  btns.forEach(b => b.classList.toggle('on', b.dataset.frame === mode));
  if (mode === 'mobile') {
    frame.style.width = '375px'; frame.style.margin = '0 auto'; frame.style.height = '100%';
  } else if (mode === 'tablet') {
    frame.style.width = '768px'; frame.style.margin = '0 auto'; frame.style.height = '100%';
  } else {
    frame.style.width = ''; frame.style.margin = ''; frame.style.height = '';
  }
}

function toggleSidebar() {
  sidebarOpen = !sidebarOpen;
  document.getElementById('file-sidebar').classList.toggle('collapsed', !sidebarOpen);
  document.getElementById('btn-sidebar').classList.toggle('on', sidebarOpen);
  setTimeout(() => monacoEditor.layout(), 210);
}

function toggleMinimap() {
  minimapOn = !minimapOn;
  monacoEditor.updateOptions({ minimap: { enabled: minimapOn } });
  document.getElementById('btn-minimap').classList.toggle('on', minimapOn);
}

function toggleWrap() {
  wrapOn = !wrapOn;
  monacoEditor.updateOptions({ wordWrap: wrapOn ? 'on' : 'off' });
  document.getElementById('btn-wrap').classList.toggle('on', wrapOn);
}

function toggleAutoSave() {
  if (!autoSaveOn) {
    // Show confirmation before enabling
    const modal = document.getElementById('autosave-confirm-modal');
    modal.style.display = 'flex';
    document.getElementById('btn-autosave-confirm').onclick = () => {
      modal.style.display = 'none';
      enableAutoSave();
    };
    document.getElementById('btn-autosave-cancel').onclick = () => {
      modal.style.display = 'none';
    };
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
  } else {
    autoSaveOn = false;
    clearTimeout(autoSaveTimer);
    document.getElementById('btn-autosave').classList.remove('on');
    document.getElementById('status-autosave-label').textContent = '';
    lastAutoSaveTime = null;
    updateSidebarAutoSaveStatus();
    updateRevertButton();
    showToast('Auto-save off');
  }
}

function enableAutoSave() {
  autoSaveOn = true;
  document.getElementById('btn-autosave').classList.add('on');
  updateSidebarAutoSaveStatus();
  updateRevertButton();
  showToast('Auto-save enabled');
}

function setLayout(mode) {
  layoutMode = mode;
  const area = document.getElementById('workspace-area');
  area.className = 'workspace-area' + (mode === 'code' ? ' code-only' : mode === 'preview' ? ' preview-only' : '');
  document.getElementById('layout-split').classList.toggle('active', mode === 'split');
  document.getElementById('layout-code').classList.toggle('active', mode === 'code');
  document.getElementById('layout-preview').classList.toggle('active', mode === 'preview');
  setTimeout(() => monacoEditor.layout(), 0);
  if (mode !== 'code') updatePreview();
}

/* ── Resizer ── */
function bindResizer() {
  const resizer = document.getElementById('pane-resizer');
  const edSec   = document.getElementById('editor-col');
  const prSec   = document.getElementById('preview-section');
  const area    = document.getElementById('workspace-area');
  let dragging = false, startX = 0, startW = 0;

  resizer.addEventListener('mousedown', e => {
    e.preventDefault();
    dragging = true;
    startX = e.clientX;
    startW = edSec.getBoundingClientRect().width;
    resizer.classList.add('dragging');
    document.body.style.cursor     = 'col-resize';
    document.body.style.userSelect = 'none';
    // Overlay to capture mouse even if it leaves the resizer strip
    document.getElementById('drag-capture').style.display = 'block';
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const sidebar = document.getElementById('sidebar');
    const sideW   = sidebarOpen ? (sidebar ? sidebar.getBoundingClientRect().width : 0) : 0;
    const total   = area.getBoundingClientRect().width - sideW - resizer.offsetWidth;
    const w = Math.max(220, Math.min(total - 220, startW + (e.clientX - startX)));
    edSec.style.flex  = 'none';
    edSec.style.width = w + 'px';
    prSec.style.flex  = '1';
    monacoEditor.layout();
  });
  const stopDrag = () => {
    if (!dragging) return;
    dragging = false;
    resizer.classList.remove('dragging');
    document.body.style.cursor     = '';
    document.body.style.userSelect = '';
    document.getElementById('drag-capture').style.display = 'none';
  };
  document.addEventListener('mouseup', stopDrag);
  document.addEventListener('mouseleave', stopDrag);
}

/* ── Widget overflow fix ── */
// Monaco positions action/suggest/hover/action widgets with fixed left/top.
// When near the right or bottom edge they bleed off-screen.
// Watch only direct body children (that's where fixedOverflowWidgets land),
// debounced via rAF so we don't thrash on every Monaco DOM mutation.
function installWidgetBoundsFix() {
  // Monaco sets position:fixed + style.top/left on these elements directly.
  // .monaco-resizable-hover is the actual positioned node for the hover tooltip;
  // .monaco-hover (its inner child) is NOT positioned and was the wrong target.
  const SELECTORS = '.monaco-resizable-hover, .action-widget, .suggest-widget, .context-view.monaco-component';

  const tick = () => {
    const widgets = document.querySelectorAll(SELECTORS);
    if (widgets.length) {
      const editorTop = document.getElementById('monaco-container')?.getBoundingClientRect().top ?? 8;
      const vw  = window.innerWidth;
      const vh  = window.innerHeight;
      const pad = 8;
      widgets.forEach(w => {
        const r = w.getBoundingClientRect();
        if (!r.width || !r.height) return;
        const curLeft = parseFloat(w.style.left || '0');
        const curTop  = parseFloat(w.style.top  || '0');
        if (r.top    < editorTop)  w.style.top  = (curTop  + (editorTop - r.top))                + 'px';
        if (r.right  > vw - pad)   w.style.left = Math.max(pad, curLeft - (r.right  - vw  + pad)) + 'px';
        if (r.bottom > vh - pad)   w.style.top  = Math.max(pad, curTop  - (r.bottom - vh + pad))  + 'px';
        if (r.left   < pad)        w.style.left = pad + 'px';
      });
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* ── Empty workspace state ── */
function updateEmptyState() {
  const ew  = document.getElementById('empty-ws');
  const mc  = document.getElementById('monaco-container');
  const img = document.getElementById('image-preview-area');
  if (!ew || !mc || !img) return;
  const hasContent = tabs.length > 0;
  const wasEmpty   = ew.style.display !== 'none';
  ew.style.display = hasContent ? 'none' : 'flex';
  document.body.classList.toggle('no-file', !hasContent);
  if (!hasContent) {
    mc.style.display  = 'none';
    img.style.display = 'none';
  } else if (!activeTab || !activeTab.isImage) {
    mc.style.display = '';
    if (wasEmpty && monacoEditor) setTimeout(() => monacoEditor.layout(), 0);
  }
}

/* ── Toast ── */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2500);
}

/* ── Theme ── */
(function initTheme() {
  const saved = localStorage.getItem('htmledger-theme') || 'dark';
  if (saved === 'light') document.documentElement.setAttribute('data-theme', 'light');
  document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    if (next === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      monaco.editor.setTheme('htmledger-light');
    } else {
      document.documentElement.removeAttribute('data-theme');
      monaco.editor.setTheme('htmledger');
    }
    localStorage.setItem('htmledger-theme', next);
    if (dmarcViewOn && activeTab?.language === 'xml') updatePreview();
  });
})();

/* ── Auto-update ── */
(function initUpdater() {
  if (!window.api?.onUpdateDownloaded) return;
  window.api.onUpdateDownloaded(() => {
    if (autoUpdatesOn) document.getElementById('update-banner').style.display = 'flex';
  });
  document.getElementById('btn-install-update').onclick = () => window.api.installUpdate();
  document.getElementById('btn-dismiss-update').onclick = () => {
    document.getElementById('update-banner').style.display = 'none';
  };
})();
