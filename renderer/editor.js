/* ── State ── */
let monacoEditor  = null;
let tabs          = [];
let activeTab     = null;
let workspaceFolder = sessionStorage.getItem('workspace-folder') || null;

let fontSize        = 13;
let fontFamily      = "'Cascadia Code','Fira Code',Consolas,monospace";
let tabSize         = 2;
let minimapOn       = true;
let wrapOn          = false;
let autoSaveOn      = false;
let layoutMode      = 'split';
let sidebarOpen     = true;
let dmarcViewOn     = false;
let autoSaveTimer   = null;
let previewDebounce = null;
let sidebarCtxTarget = null;
let emmetExpand     = null;
let snippetsPanelOpen = false;

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
  if (localStorage.getItem('htmledger-theme') === 'light') monaco.editor.setTheme('vs');
  createEditor();
  loadInitialFile();
  loadWorkspaceSidebar();
  bindEvents();
  bindResizer();
  buildSnippetPanel();
  window.api.onFileChanged(onExternalFileChange);
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
    if (s.fontSize)     fontSize   = s.fontSize;
    if (s.fontFamily)   fontFamily = s.fontFamily;
    if (s.tabSize)      tabSize    = s.tabSize;
    if (s.minimap  !== undefined) minimapOn  = s.minimap;
    if (s.wordWrap !== undefined) wrapOn     = s.wordWrap;
    if (s.autoSave !== undefined) autoSaveOn = s.autoSave;
    if (s.layout)       layoutMode = s.layout;
  } catch {}
}

function openSettingsModal() {
  const s = document.getElementById('settings-modal');
  document.getElementById('set-font-family').value   = fontFamily;
  document.getElementById('set-tab-size').value      = tabSize;
  document.getElementById('set-font-size').value     = fontSize;
  document.getElementById('set-font-size-val').textContent = fontSize + 'px';
  document.getElementById('set-layout').value        = layoutMode;
  document.getElementById('set-minimap').checked     = minimapOn;
  document.getElementById('set-wordwrap').checked    = wrapOn;
  document.getElementById('set-autosave').checked    = autoSaveOn;
  s.style.display = 'flex';
}

function closeSettingsModal() {
  document.getElementById('settings-modal').style.display = 'none';
}

async function saveSettings() {
  const newFont    = document.getElementById('set-font-family').value;
  const newTabSize = parseInt(document.getElementById('set-tab-size').value);
  const newFontSz  = parseInt(document.getElementById('set-font-size').value);
  const newLayout  = document.getElementById('set-layout').value;
  const newMinimap = document.getElementById('set-minimap').checked;
  const newWrap    = document.getElementById('set-wordwrap').checked;
  const newAuto    = document.getElementById('set-autosave').checked;

  fontFamily  = newFont;
  tabSize     = newTabSize;
  fontSize    = newFontSz;
  minimapOn   = newMinimap;
  wrapOn      = newWrap;
  autoSaveOn  = newAuto;
  layoutMode  = newLayout;

  monacoEditor.updateOptions({
    fontFamily, tabSize, fontSize,
    minimap:  { enabled: minimapOn },
    wordWrap: wrapOn ? 'on' : 'off',
  });
  document.getElementById('font-display').textContent = fontSize;
  document.getElementById('btn-minimap').classList.toggle('on', minimapOn);
  document.getElementById('btn-wrap').classList.toggle('on', wrapOn);
  document.getElementById('btn-autosave').classList.toggle('on', autoSaveOn);
  setLayout(layoutMode);

  await window.api.saveSettings({ fontSize, fontFamily, tabSize, minimap: minimapOn, wordWrap: wrapOn, autoSave: autoSaveOn, layout: layoutMode });
  closeSettingsModal();
  showToast('Settings saved');
}

/* ── Monaco theme ── */
function defineTheme() {
  monaco.editor.defineTheme('htmledger', {
    base: 'vs-dark', inherit: true,
    rules: [
      { token: 'tag',                 foreground: '60a5fa' },
      { token: 'tag.id',              foreground: '60a5fa' },
      { token: 'attribute.name',      foreground: '34d399' },
      { token: 'attribute.value',     foreground: 'fbbf24' },
      { token: 'delimiter',           foreground: '6b7db3' },
      { token: 'delimiter.html',      foreground: '6b7db3' },
      { token: 'comment',             foreground: '4a4a8a', fontStyle: 'italic' },
      { token: 'string',              foreground: 'fbbf24' },
      { token: 'keyword',             foreground: 'a78bfa' },
      { token: 'keyword.css',         foreground: 'a78bfa' },
      { token: 'number',              foreground: 'fb923c' },
      { token: 'type',                foreground: '34d399' },
      { token: 'variable',            foreground: 'e8e8f8' },
      { token: 'metatag',             foreground: 'a78bfa' },
      { token: 'metatag.content',     foreground: 'fbbf24' },
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
      'editorIndentGuide.background1':       '#1c1c32',
      'editorIndentGuide.activeBackground1': '#4f6ef750',
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
}

/* ── Create Monaco editor ── */
function createEditor() {
  monacoEditor = monaco.editor.create(document.getElementById('monaco-container'), {
    theme: 'htmledger',
    language: 'html',
    fontSize,
    fontFamily,
    tabSize,
    minimap:    { enabled: minimapOn },
    wordWrap:   wrapOn ? 'on' : 'off',
    lineNumbers: 'on',
    automaticLayout: true,
    insertSpaces: true,
    autoClosingBrackets: 'always',
    autoClosingTags: true,
    autoIndent: 'full',
    formatOnPaste: false,
    formatOnType:  false,
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    cursorBlinking: 'smooth',
    renderLineHighlight: 'gutter',
    folding: true,
    fontLigatures: true,
    padding: { top: 10 },
  });

  monacoEditor.onDidChangeModelContent(() => {
    if (!activeTab) return;
    activeTab.isDirty = monacoEditor.getValue() !== activeTab.savedContent;
    document.getElementById('unsaved-dot').classList.toggle('visible', activeTab.isDirty);
    renderTabBar();
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

/* ── Workspace sidebar (files view) ── */
async function loadWorkspaceSidebar() {
  const container = document.getElementById('sidebar-files');
  const nameEl    = document.getElementById('sidebar-ws-name');

  if (!workspaceFolder) {
    sidebarOpen = false;
    document.getElementById('file-sidebar').classList.add('collapsed');
    document.getElementById('btn-sidebar').classList.remove('on');
    container.innerHTML = '<div style="padding:12px;font-size:11px;color:var(--text-muted)">No workspace open</div>';
    return;
  }

  nameEl.textContent = workspaceFolder.replace(/\\/g, '/').split('/').pop();
  const result = await window.api.listWorkspaceFiles(workspaceFolder);
  if (!result.success) { container.innerHTML = '<div style="padding:12px;font-size:11px;color:var(--text-muted)">Could not read folder</div>'; return; }

  container.innerHTML = '';
  result.files.forEach(f => {
    const item = document.createElement('div');
    item.className = 'sidebar-file-item';
    item.dataset.path = f.path;
    const ext = f.name.split('.').pop().toLowerCase();
    const iconClass = { html:'icon-html', htm:'icon-html', css:'icon-css', js:'icon-js', xml:'icon-xml' }[ext] || 'icon-file';
    item.innerHTML = `<span class="sidebar-file-icon ${iconClass}">${ext.toUpperCase().slice(0,3)}</span><span class="sidebar-file-name" title="${f.name}">${f.name}</span>`;
    item.addEventListener('click', () => openTab(f.path));
    item.addEventListener('contextmenu', e => { e.preventDefault(); showSidebarCtx(e.clientX, e.clientY, f.path); });
    container.appendChild(item);
  });

  highlightSidebarActive();
}

function highlightSidebarActive() {
  document.querySelectorAll('.sidebar-file-item').forEach(el =>
    el.classList.toggle('active', el.dataset.path === (activeTab && activeTab.path)));
}

/* ── Sidebar context menu ── */
function showSidebarCtx(x, y, filePath) {
  sidebarCtxTarget = filePath;
  const m  = document.getElementById('sidebar-ctx');
  m.style.display = 'block';
  m.style.left    = Math.min(x, window.innerWidth  - 170) + 'px';
  m.style.top     = Math.min(y, window.innerHeight - 150) + 'px';
}
function hideSidebarCtx() {
  document.getElementById('sidebar-ctx').style.display = 'none';
  sidebarCtxTarget = null;
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
  if (!workspaceFolder) { showToast('No workspace open'); return; }
  const query   = document.getElementById('sv-search-input').value.trim();
  const results = document.getElementById('sv-search-results');
  if (!query) { results.innerHTML = '<div class="sv-search-hint">Type to search across all files</div>'; return; }
  results.innerHTML = '<div class="sv-search-hint">Searching…</div>';
  const res = await window.api.searchInFolder(workspaceFolder, query);
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
  if (!tab) return;
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
async function openTab(filePath) {
  const existing = tabs.find(t => t.path === filePath);
  if (existing) { switchTab(existing); return; }

  const result = await window.api.readFile(filePath);
  if (!result.success) { showToast('Could not open file'); return; }

  const lang  = detectLanguage(filePath);
  const uri   = monaco.Uri.file(filePath);
  const model = monaco.editor.createModel(result.content, lang, uri);
  const tab   = { path: filePath, name: filePath.replace(/\\/g, '/').split('/').pop(), model, savedContent: result.content, isDirty: false, viewState: null, language: lang, externallyChanged: false };

  tabs.push(tab);
  switchTab(tab);
  window.api.watchFile(filePath);
  trackRecentFile(filePath);
}

function switchTab(tab) {
  if (activeTab && monacoEditor) activeTab.viewState = monacoEditor.saveViewState();
  activeTab = tab;
  if (monacoEditor) {
    monacoEditor.setModel(tab.model);
    if (tab.viewState) monacoEditor.restoreViewState(tab.viewState);
    monacoEditor.focus();
  }
  renderTabBar();
  updateCrumb();
  updatePreview();
  highlightSidebarActive();
  document.getElementById('unsaved-dot').classList.toggle('visible', tab.isDirty);
  document.getElementById('status-path').textContent = tab.path;
  document.getElementById('status-info').textContent = `${langLabel(tab)} · UTF-8`;
  if (tab.externallyChanged) showFileChangedBanner(tab);
  else hideFileChangedBanner();
}

function closeTab(tab, e) {
  if (e) e.stopPropagation();
  if (tab.isDirty && !confirm(`"${tab.name}" has unsaved changes. Close anyway?`)) return;
  window.api.unwatchFile(tab.path);
  const idx = tabs.indexOf(tab);
  tabs.splice(idx, 1);
  tab.model.dispose();
  if (tabs.length === 0) {
    activeTab = null;
    monacoEditor.setModel(monaco.editor.createModel('', 'html'));
    renderTabBar();
    document.getElementById('crumb-file').textContent   = '';
    document.getElementById('crumb-folder').textContent = '';
    document.getElementById('unsaved-dot').classList.remove('visible');
    document.getElementById('preview-frame').src = 'about:blank';
    hideFileChangedBanner();
    return;
  }
  switchTab(tabs[Math.min(idx, tabs.length - 1)]);
}

function renderTabBar() {
  const list = document.getElementById('tabs-list');
  list.innerHTML = '';
  tabs.forEach(tab => {
    const el = document.createElement('div');
    el.className = 'tab' + (tab === activeTab ? ' active' : '') + (tab.isDirty ? ' dirty' : '');
    const ext = tab.name.split('.').pop().toLowerCase();
    const iconClass = { html:'icon-html', htm:'icon-html', css:'icon-css', js:'icon-js', xml:'icon-xml' }[ext] || 'icon-file';
    el.innerHTML = `<span class="tab-icon ${iconClass}">${ext.toUpperCase().slice(0,3)}</span><span class="tab-name" title="${tab.path}">${tab.name}</span><span class="tab-dirty-dot"></span><span class="tab-close" title="Close">✕</span>`;
    el.addEventListener('click', () => switchTab(tab));
    el.querySelector('.tab-close').addEventListener('click', e => closeTab(tab, e));
    list.appendChild(el);
  });
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
  return { html:'html', htm:'html', css:'css', js:'javascript', xml:'xml' }[ext] || 'plaintext';
}

function langLabel(tab) {
  if (!tab) return 'HTML';
  return { html:'HTML', css:'CSS', javascript:'JS', xml:'XML', plaintext:'TEXT' }[tab.language] || tab.language.toUpperCase();
}

/* ── Preview ── */
function updatePreview() {
  if (!activeTab) return;
  const lang   = activeTab.language;
  const frame  = document.getElementById('preview-frame');
  const noPrev = document.getElementById('no-preview');

  const previewSection = document.getElementById('preview-section');
  const paneResizer   = document.getElementById('pane-resizer');

  if (lang === 'html') {
    previewSection.style.display = ''; paneResizer.style.display = '';
    frame.style.display = 'flex'; noPrev.style.display = 'none';
    frame.src = URL.createObjectURL(new Blob([monacoEditor.getValue()], { type: 'text/html' }));
    monacoEditor.layout();
  } else if (lang === 'xml') {
    previewSection.style.display = ''; paneResizer.style.display = '';
    frame.style.display = 'flex'; noPrev.style.display = 'none';
    monacoEditor.layout();
    const xml = monacoEditor.getValue();
    updateDMARCButton(xml);
    if (dmarcViewOn && isDMARCReport(xml)) renderDMARCPreview(xml);
    else renderXMLPreview(xml);
  } else {
    previewSection.style.display = 'none'; paneResizer.style.display = 'none';
    monacoEditor.layout();
    updateDMARCButton('');
  }
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

    document.getElementById('preview-frame').src =
      URL.createObjectURL(new Blob([page], { type: 'text/html' }));
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
  document.getElementById('preview-frame').src = URL.createObjectURL(new Blob([page], { type: 'text/html' }));
}

/* ── Save ── */
async function save(tab) {
  tab = tab || activeTab;
  if (!tab) return;
  if (!tab.path || tab.path === 'untitled') {
    const newPath = await window.api.saveFileDialog('untitled.html');
    if (!newPath) return;
    tab.path     = /\.(html|htm|xml|css|js)$/i.test(newPath) ? newPath : newPath + '.html';
    tab.name     = tab.path.replace(/\\/g, '/').split('/').pop();
    tab.language = detectLanguage(tab.path);
    updateCrumb();
    window.api.watchFile(tab.path);
  }
  const result = await window.api.writeFile(tab.path, monacoEditor.getValue());
  if (result.success) {
    tab.savedContent = monacoEditor.getValue();
    tab.isDirty = false;
    renderTabBar();
    document.getElementById('unsaved-dot').classList.remove('visible');
    document.getElementById('status-path').textContent = tab.path;
    if (autoSaveOn) document.getElementById('status-autosave-label').textContent = 'Auto-saved ' + new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
    showToast('Saved');
  } else {
    showToast('Save failed: ' + result.error);
  }
}

/* ── Auto-save ── */
function scheduleAutoSave() {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => save(), 2000);
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

/* ── New file ── */
async function newFile() {
  const savePath = await window.api.saveFileDialog(
    workspaceFolder ? workspaceFolder + '\\untitled.html' : 'untitled.html');
  if (!savePath) return;
  const finalPath = /\.(html|htm|xml|css|js)$/i.test(savePath) ? savePath : savePath + '.html';
  const starters = {
    html:`<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>New Page</title>\n</head>\n<body>\n\n</body>\n</html>`,
    css:'/* Styles */\n', js:'// Script\n', xml:'<?xml version="1.0" encoding="UTF-8"?>\n<root>\n\n</root>',
  };
  const ext = finalPath.split('.').pop().toLowerCase();
  const r   = await window.api.writeFile(finalPath, starters[ext] || starters.html);
  if (!r.success) { showToast('Could not create file'); return; }
  await openTab(finalPath);
  if (workspaceFolder) loadWorkspaceSidebar();
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

/* ── Events ── */
function bindEvents() {
  document.getElementById('btn-min').onclick   = () => window.api.minimize();
  document.getElementById('btn-max').onclick   = () => window.api.maximize();
  document.getElementById('btn-close').onclick = () => window.api.close();

  document.getElementById('btn-back').onclick = () => {
    const dirty = tabs.filter(t => t.isDirty);
    if (dirty.length > 0 && !confirm(`${dirty.length} file(s) have unsaved changes. Leave anyway?`)) return;
    window.location.href = 'home.html';
  };

  document.getElementById('btn-save').onclick   = () => save();
  document.getElementById('btn-undo').onclick   = () => monacoEditor.trigger('', 'undo', null);
  document.getElementById('btn-redo').onclick   = () => monacoEditor.trigger('', 'redo', null);
  document.getElementById('btn-format').onclick = formatCode;
  document.getElementById('btn-new-tab').onclick = newFile;

  document.getElementById('btn-sidebar-refresh').onclick    = loadWorkspaceSidebar;
  document.getElementById('btn-sidebar-new-file').onclick   = newFile;

  document.getElementById('btn-dmarc-view').onclick    = toggleDMARCView;
  document.getElementById('btn-refresh-preview').onclick = updatePreview;
  document.getElementById('btn-open-browser').onclick = () => {
    if (activeTab) window.api.openInExplorer(activeTab.path);
    else showToast('No file open');
  };

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
  document.getElementById('btn-settings').onclick       = openSettingsModal;
  document.getElementById('btn-settings-close').onclick = closeSettingsModal;
  document.getElementById('btn-settings-cancel').onclick = closeSettingsModal;
  document.getElementById('btn-settings-save').onclick  = saveSettings;
  document.getElementById('set-font-size').addEventListener('input', e => {
    document.getElementById('set-font-size-val').textContent = e.target.value + 'px';
  });
  document.getElementById('settings-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('settings-modal')) closeSettingsModal();
  });

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

  // Sidebar context menu
  document.getElementById('sctx-open').onclick    = () => { const p = sidebarCtxTarget; hideSidebarCtx(); if (p) openTab(p); };
  document.getElementById('sctx-rename').onclick  = () => { const p = sidebarCtxTarget; hideSidebarCtx(); if (p) renameSidebarFile(p); };
  document.getElementById('sctx-explorer').onclick = () => { const p = sidebarCtxTarget; hideSidebarCtx(); if (p) window.api.openInExplorer(p); };
  document.getElementById('sctx-delete').onclick  = () => { const p = sidebarCtxTarget; hideSidebarCtx(); if (p) deleteSidebarFile(p); };
  document.addEventListener('click', e => {
    if (!document.getElementById('sidebar-ctx').contains(e.target)) hideSidebarCtx();
    if (snippetsPanelOpen && !document.getElementById('snippets-panel').contains(e.target) && e.target.id !== 'btn-snippets') closeSnippetsPanel();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 's') { e.preventDefault(); save(); }
    if (e.ctrlKey && e.key === 'n') { e.preventDefault(); newFile(); }
    if (e.ctrlKey && e.key === 'w') { e.preventDefault(); if (activeTab) closeTab(activeTab); }
    if (e.key === 'Escape') { closeSnippetsPanel(); closeSettingsModal(); hideSidebarCtx(); }
    if (!monacoEditor.hasTextFocus()) {
      if (e.ctrlKey && !e.shiftKey && e.key === 'z') { e.preventDefault(); monacoEditor.trigger('keyboard','undo',null); monacoEditor.focus(); }
      if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'Z'))) { e.preventDefault(); monacoEditor.trigger('keyboard','redo',null); monacoEditor.focus(); }
    }
  });

  // Drag & drop — open files by dragging onto editor
  document.addEventListener('dragover', e => e.preventDefault());
  document.addEventListener('drop', e => {
    e.preventDefault();
    const files = [...e.dataTransfer.files].filter(f => /\.(html|htm|xml|css|js)$/i.test(f.name));
    files.forEach(f => openTab(f.path));
  });
}

/* ── Feature controls ── */
function setFontSize(size) {
  fontSize = Math.max(10, Math.min(24, size));
  monacoEditor.updateOptions({ fontSize });
  document.getElementById('font-display').textContent = fontSize;
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
  autoSaveOn = !autoSaveOn;
  document.getElementById('btn-autosave').classList.toggle('on', autoSaveOn);
  if (!autoSaveOn) { clearTimeout(autoSaveTimer); document.getElementById('status-autosave-label').textContent = ''; }
  showToast(autoSaveOn ? 'Auto-save on' : 'Auto-save off');
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
  const edSec   = document.getElementById('editor-section');
  const prSec   = document.getElementById('preview-section');
  let dragging = false, startX = 0, startW = 0;

  resizer.addEventListener('mousedown', e => {
    dragging = true; startX = e.clientX; startW = edSec.getBoundingClientRect().width;
    resizer.classList.add('dragging');
    document.body.style.cssText += 'cursor:col-resize;user-select:none';
  });
  document.addEventListener('mousemove', e => {
    if (!dragging) return;
    const total = document.getElementById('workspace-area').getBoundingClientRect().width - (sidebarOpen ? 200 : 0) - 4;
    const w = Math.max(200, Math.min(total - 200, startW + (e.clientX - startX)));
    edSec.style.flex = 'none'; edSec.style.width = w + 'px';
    prSec.style.flex = '1';
    monacoEditor.layout();
  });
  document.addEventListener('mouseup', () => {
    if (!dragging) return;
    dragging = false;
    resizer.classList.remove('dragging');
    document.body.style.cursor = ''; document.body.style.userSelect = '';
  });
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
      monaco.editor.setTheme('vs');
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
    document.getElementById('update-banner').style.display = 'flex';
  });
  document.getElementById('btn-install-update').onclick = () => window.api.installUpdate();
  document.getElementById('btn-dismiss-update').onclick = () => {
    document.getElementById('update-banner').style.display = 'none';
  };
})();
