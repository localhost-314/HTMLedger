/* ── State ── */
let currentFolder = null;
let allFiles = [];
let filteredFiles = [];
let viewMode = localStorage.getItem('htmledger-view') || 'grid';
let sortBy = 'name-asc';
let contextTarget = null;
let recentFolders    = [];
let recentFiles      = [];
let workspaceRoot    = null;
let folderStack      = [];

// Workspace system
let workspaces      = [];        // array of workspace objects
let activeWorkspace = null;      // workspace currently browsed/open
let wsModalFolders  = [];        // folders in the New/Edit modal
let wsModalEditId   = null;      // non-null when editing an existing workspace

/* ── DOM refs ── */
const grid          = document.getElementById('file-grid');
const emptyState    = document.getElementById('empty-state');
const homeLanding   = document.getElementById('home-landing');
const searchWrap    = document.getElementById('search-wrap');
const searchInput   = document.getElementById('search-input');
const sortSelect    = document.getElementById('sort-select');
const fileCount     = document.getElementById('file-count');
const bcHome        = document.getElementById('bc-home');
const bcSep         = document.getElementById('bc-sep');
const bcFolder      = document.getElementById('bc-folder');
const ctxMenu       = document.getElementById('context-menu');
const sidebarWs     = document.getElementById('sidebar-workspace');
const workspaceName = document.getElementById('workspace-name');
const btnNewFile    = document.getElementById('btn-new-file');

/* ── Init ── */
async function init() {
  [recentFolders, recentFiles] = await Promise.all([
    window.api.getRecentFolders().catch(() => []),
    window.api.getRecentFiles().catch(() => []),
  ]);
  await loadWorkspaces();
  renderHomeLanding();
  bindEvents();
  initWorkspaces();
  applyRestoreOnLaunch();
  document.getElementById('view-grid').classList.toggle('active', viewMode === 'grid');
  document.getElementById('view-list').classList.toggle('active', viewMode === 'list');
}

/* ── Events ── */
function bindEvents() {
  document.getElementById('btn-min').onclick   = () => window.api.minimize();
  document.getElementById('btn-max').onclick   = () => window.api.maximize();
  document.getElementById('btn-close').onclick = () => window.api.close();

  // Sidebar nav
  document.getElementById('nav-home').onclick            = goHome;
  document.getElementById('nav-workspace-files').onclick = () => renderWorkspace();
  document.getElementById('btn-open-folder').onclick     = openFolder;
  document.getElementById('btn-open-file').onclick       = openSingleFile;
  document.getElementById('btn-new-file-side').onclick   = newFile;

  // Landing buttons
  document.getElementById('land-open-folder').onclick = openFolder;
  document.getElementById('land-open-file').onclick   = openSingleFile;
  document.getElementById('land-new-file').onclick    = newFile;

  // Breadcrumb home click
  bcHome.addEventListener('click', () => {
    if (currentFolder) goHome();
  });

  // Topbar buttons
  btnNewFile.onclick = newFile;
  document.getElementById('empty-new-file').onclick = newFile;

  _initNfModal();

  // View toggle
  document.getElementById('view-grid').onclick = () => setView('grid');
  document.getElementById('view-list').onclick = () => setView('list');

  // Search
  searchInput.addEventListener('input', onSearch);

  // Context menu
  document.getElementById('ctx-open').onclick      = () => { hideCtx(); openCard(contextTarget); };
  document.getElementById('ctx-rename').onclick    = () => { hideCtx(); renameFile(contextTarget); };
  document.getElementById('ctx-duplicate').onclick = () => { hideCtx(); duplicateFile(contextTarget); };
  document.getElementById('ctx-explorer').onclick  = () => { hideCtx(); window.api.openInExplorer(contextTarget); };
  document.getElementById('ctx-delete').onclick    = () => { hideCtx(); deleteFile(contextTarget); };

  sortSelect.addEventListener('change', () => { sortBy = sortSelect.value; applySortAndRender(); });

  document.addEventListener('click', (e) => { if (!ctxMenu.contains(e.target)) hideCtx(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideCtx(); });

  // Drag & drop — drop a file directly onto the home screen to open it
  document.addEventListener('dragover', e => e.preventDefault());
  document.addEventListener('drop', e => {
    e.preventDefault();
    const files = [...e.dataTransfer.files].filter(f => /\.(html|htm|xml|css|js)$/i.test(f.name));
    if (files.length === 0) return;
    sessionStorage.setItem('edit-file', files[0].path);
    sessionStorage.removeItem('active-workspace');
    sessionStorage.removeItem('workspace-folder');
    if (files.length > 1) {
      sessionStorage.setItem('extra-files', JSON.stringify(files.slice(1).map(f => f.path)));
    }
    window.location.href = 'editor.html';
  });
}

/* ── Home screen ── */
function goHome() {
  currentFolder = null;
  workspaceRoot = null;
  folderStack   = [];
  renderHomeLanding();
  setActiveNav('nav-home');
}

function renderHomeLanding() {
  // Show landing, hide workspace views
  homeLanding.style.display   = 'flex';
  emptyState.style.display    = 'none';
  grid.style.display          = 'none';
  searchWrap.style.display    = 'none';
  btnNewFile.style.display    = 'none';
  sidebarWs.style.display     = 'none';
  fileCount.textContent       = '';
  // Breadcrumb: just "Home" (not clickable)
  bcHome.textContent = 'Home';
  bcHome.classList.remove('clickable');
  bcSep.style.display   = 'none';
  bcFolder.textContent  = '';
  searchWrap.style.display = 'none';
  sortSelect.style.display = 'none';
  btnNewFile.style.display = 'none';
  sidebarWs.style.display  = 'none';
  fileCount.textContent    = '';

  const isGrid = viewMode === 'grid';

  // Deduplicate recent folders
  const sep = (p) => p.replace(/\\/g, '/').toLowerCase() + '/';
  const deduped = recentFolders.filter(f =>
    !recentFolders.some(other => other !== f && sep(f).startsWith(sep(other)))
  );

  // Workspace cards
  const recentSection = document.getElementById('recent-section');
  const recentList    = document.getElementById('recent-list');
  if (workspaces.length > 0) {
    recentSection.style.display = 'block';
    recentList.innerHTML = '';
    recentList.className = 'ws-card-list';
    workspaces.slice().sort((a, b) => (b.lastOpened || '') > (a.lastOpened || '') ? 1 : -1)
      .forEach(ws => recentList.appendChild(makeWsCard(ws)));
  } else {
    recentSection.style.display = 'none';
  }

  // Recent files
  const recentFilesSection = document.getElementById('recent-files-section');
  const recentFilesList    = document.getElementById('recent-files-list');
  if (recentFiles.length > 0) {
    recentFilesSection.style.display = 'block';
    recentFilesList.innerHTML = '';
    recentFilesList.className = isGrid ? 'recent-grid' : 'recent-list-view';
    const extColors = { html:'#f97316', htm:'#f97316', css:'#60a5fa', js:'#fbbf24', xml:'#34d399' };
    recentFiles.slice(0, isGrid ? 6 : 8).forEach(f => {
      const ext   = f.name.split('.').pop().toLowerCase();
      const color = extColors[ext] || '#8888b0';
      const item  = document.createElement('div');
      if (isGrid) {
        const EXT = ext.toUpperCase();
        item.className = 'file-card';
        item.innerHTML = `
          <div class="card-preview">
            <div class="card-preview-placeholder">
              <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
            </div>
            <span class="card-badge">${EXT}</span>
          </div>
          <div class="card-info">
            <div class="card-name" title="${f.path}">${f.name}</div>
            <div class="card-meta"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${f.path}</span></div>
          </div>`;
      } else {
        item.className = 'recent-item';
        item.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
          <span class="recent-item-name">${f.name}</span>
          <span class="recent-item-path">${f.path}</span>`;
      }
      item.addEventListener('click', () => openCard(f.path));
      recentFilesList.appendChild(item);
    });
  } else {
    recentFilesSection.style.display = 'none';
  }
}

/* ── Open folder as workspace — now opens the New Workspace modal ── */
async function openFolder() {
  openWsModal();
}

async function loadFolder(folderPath) {
  const result = await window.api.listHtmlFiles(folderPath);
  if (!result.success) { showToast('Error reading folder'); return; }

  workspaceRoot = folderPath;
  folderStack   = [];
  currentFolder = folderPath;
  allFiles      = result.files;
  filteredFiles = [...allFiles];

  // Update recents (only for top-level opens)
  recentFolders = [folderPath, ...recentFolders.filter(f => f !== folderPath)].slice(0, 10);
  await window.api.saveRecentFolders(recentFolders);

  renderWorkspace();
  setActiveNav('nav-workspace-files');
}

async function drillIntoFolder(folderPath) {
  const result = await window.api.listHtmlFiles(folderPath);
  if (!result.success) { showToast('Error reading folder'); return; }

  folderStack.push(currentFolder);
  currentFolder = folderPath;
  allFiles      = result.files;
  filteredFiles = [...allFiles];

  renderWorkspace();
}

async function drillUp() {
  if (folderStack.length === 0) return;
  const parent = folderStack.pop();
  const result = await window.api.listHtmlFiles(parent);
  if (!result.success) { showToast('Error reading folder'); return; }

  currentFolder = parent;
  allFiles      = result.files;
  filteredFiles = [...allFiles];

  renderWorkspace();
}

/* ── Render workspace file view ── */
function renderWorkspace() {
  if (!currentFolder) return;

  const rootName    = (workspaceRoot || currentFolder).replace(/\\/g, '/').split('/').pop();
  const folderName  = currentFolder.replace(/\\/g, '/').split('/').pop();
  const isSubfolder = folderStack.length > 0;

  // Breadcrumb
  bcHome.textContent = 'Home';
  bcHome.classList.add('clickable');
  bcSep.style.display = 'inline';

  if (isSubfolder) {
    bcFolder.innerHTML = `<span class="bc-back" id="bc-back-btn">← ${rootName}</span> › ${folderName}`;
    document.getElementById('bc-back-btn').addEventListener('click', (e) => { e.stopPropagation(); drillUp(); });
  } else {
    bcFolder.textContent = folderName;
  }

  // Sidebar
  sidebarWs.style.display  = 'block';
  workspaceName.textContent = rootName;

  searchWrap.style.display = 'flex';
  sortSelect.style.display = 'block';
  btnNewFile.style.display = 'flex';

  homeLanding.style.display = 'none';

  filteredFiles = [...allFiles];
  searchInput.value = '';
  applySortAndRender();
}

/* ── Render file cards ── */
function renderFiles() {
  const fileOnlyCount = filteredFiles.filter(f => f.type !== 'folder').length;
  const folderCount   = filteredFiles.filter(f => f.type === 'folder').length;
  const parts = [];
  if (fileOnlyCount > 0) parts.push(fileOnlyCount === 1 ? '1 file' : `${fileOnlyCount} files`);
  if (folderCount > 0)   parts.push(folderCount === 1 ? '1 folder' : `${folderCount} folders`);
  fileCount.textContent = parts.join(', ');

  if (filteredFiles.length === 0) {
    grid.style.display       = 'none';
    emptyState.style.display = 'flex';
    return;
  }

  emptyState.style.display              = 'none';
  grid.style.display                    = 'grid';
  grid.className                        = 'file-grid' + (viewMode === 'list' ? ' list-view' : '');
  grid.style.gridTemplateColumns        = viewMode === 'list' ? '1fr' : 'repeat(auto-fill, minmax(180px, 1fr))';
  grid.style.gap                        = viewMode === 'list' ? '6px' : '16px';
  grid.innerHTML                        = '';
  filteredFiles.forEach(f => grid.appendChild(makeCard(f)));
}

function badgeClass(ext) {
  if (ext === 'CSS') return 'badge-css';
  if (ext === 'JS')  return 'badge-js';
  if (ext === 'XML') return 'badge-xml';
  return '';
}

function makeCard(file) {
  const div  = document.createElement('div');
  div.dataset.path = file.path;

  if (file.type === 'folder') {
    div.className = 'file-card folder-card';
    if (viewMode === 'grid') {
      div.innerHTML = `
        <div class="card-preview">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
        </div>
        <div class="card-info">
          <div class="card-name" title="${file.name}">${file.name}</div>
          <div class="card-meta"><span>Folder</span></div>
        </div>`;
    } else {
      div.innerHTML = `
        <div class="card-preview">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
        </div>
        <div class="card-info">
          <div class="list-name-wrap">
            <span class="card-name" title="${file.name}">${file.name}</span>
            <span class="card-badge" style="background:rgba(79,110,247,.2);border-color:rgba(79,110,247,.4);color:#8ba0ff">DIR</span>
          </div>
          <div class="card-meta"><span>Folder</span></div>
        </div>`;
    }
    div.addEventListener('click', () => {
      if (localStorage.getItem('htmledger-folders-as-workspace') === 'true') {
        loadFolder(file.path);
      } else {
        drillIntoFolder(file.path);
      }
    });
    return div;
  }

  div.className = 'file-card';

  const ext  = file.name.split('.').pop().toUpperCase();
  const bc   = badgeClass(ext);
  const date = new Date(file.modified).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const size = file.size > 1024 ? (file.size / 1024).toFixed(1) + ' KB' : file.size + ' B';

  if (viewMode === 'grid') {
    div.innerHTML = `
      <div class="card-preview">
        ${buildPreview(file)}
        <span class="card-badge ${bc}">${ext}</span>
      </div>
      <div class="card-info">
        <div class="card-name" title="${file.name}">${file.name}</div>
        <div class="card-meta"><span>${date}</span><span>${size}</span></div>
      </div>`;
  } else {
    div.innerHTML = `
      <div class="card-preview">
        ${buildPreview(file)}
      </div>
      <div class="card-info">
        <div class="list-name-wrap">
          <span class="card-name" title="${file.name}">${file.name}</span>
          <span class="card-badge ${bc}">${ext}</span>
        </div>
        <div class="card-meta"><span>${date} &nbsp;·&nbsp; ${size}</span></div>
      </div>`;
  }

  div.addEventListener('click', () => openCard(file.path));
  div.addEventListener('contextmenu', (e) => { e.preventDefault(); showCtx(e.clientX, e.clientY, file.path); });
  return div;
}

function buildPreview(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const isHTML = ext === 'html' || ext === 'htm';

  if (!file.preview || file.preview.trim().length < 10) {
    return `<div class="card-preview-placeholder">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
        <polyline points="14,2 14,8 20,8"/>
      </svg></div>`;
  }

  if (isHTML) {
    const blob = new Blob([file.preview], { type: 'text/html' });
    return `<iframe src="${URL.createObjectURL(blob)}" sandbox="" scrolling="no" loading="lazy"></iframe>`;
  }

  // CSS / JS / XML — show code snippet
  const snippet = file.preview.slice(0, 300).replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return `<div class="card-preview-placeholder" style="align-items:flex-start;padding:8px;overflow:hidden">
    <pre style="font-family:monospace;font-size:9px;color:#6060a0;line-height:1.4;white-space:pre-wrap;word-break:break-all;margin:0">${snippet}</pre>
  </div>`;
}

/* ── Open single file (no workspace) ── */
async function openSingleFile() {
  const filePath = await window.api.openFileDialog();
  if (!filePath) return;
  sessionStorage.setItem('edit-file', filePath);
  sessionStorage.removeItem('active-workspace');
  sessionStorage.removeItem('workspace-folder');
  window.location.href = 'editor.html';
}

/* ── Open file in editor ── */
function openCard(filePath) {
  sessionStorage.setItem('edit-file', filePath);
  if (activeWorkspace) {
    sessionStorage.setItem('active-workspace', JSON.stringify(activeWorkspace));
    sessionStorage.removeItem('workspace-folder');
  } else if (currentFolder) {
    sessionStorage.setItem('workspace-folder', currentFolder);
    sessionStorage.removeItem('active-workspace');
  } else {
    sessionStorage.removeItem('active-workspace');
    sessionStorage.removeItem('workspace-folder');
  }
  window.location.href = 'editor.html';
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
let _nfOutside = null; // null | 'just-file'

function _nfInsideFolder(p) {
  if (!currentFolder) return true; // no folder browsed, no restriction
  const base = currentFolder.replace(/\\/g, '/').toLowerCase();
  return p.replace(/\\/g, '/').toLowerCase().startsWith(base);
}
function _nfSetDest(p) {
  _nfDest    = p;
  _nfOutside = null;
  const el = document.getElementById('nf-dest-path');
  el.textContent = p || 'Choose a folder…';
  el.classList.toggle('set', !!p);
  document.getElementById('nf-outside-warn').style.display = (p && currentFolder && !_nfInsideFolder(p)) ? '' : 'none';
  document.getElementById('btn-nf-create').disabled = !p;
}

function newFile() {
  _nfDest    = currentFolder || '';
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
  document.getElementById('nf-outside-warn').style.display = 'none';
  document.getElementById('nf-ext').textContent = '.html';
  document.getElementById('nf-name-input').value = '';
  document.getElementById('btn-nf-create').disabled = !_nfDest;
  document.getElementById('nf-modal').style.display = 'flex';
  setTimeout(() => document.getElementById('nf-name-input').focus(), 80);
}
function _closeNfModal() { document.getElementById('nf-modal').style.display = 'none'; }
async function _commitNfCreate() {
  if (!_nfDest) return;
  const raw  = document.getElementById('nf-name-input').value.trim() || 'untitled';
  const name = raw.endsWith('.' + _nfExt) ? raw : raw + '.' + _nfExt;
  const filePath = _nfDest + '\\' + name;
  const exists = await window.api.readFile(filePath);
  if (exists.success) { showToast('"' + name + '" already exists'); document.getElementById('nf-name-input').select(); return; }
  const starter = NF_STARTERS[_nfExt] ?? '';
  const r = await window.api.writeFile(filePath, starter);
  if (!r.success) { showToast('Could not create file'); return; }
  _closeNfModal();
  sessionStorage.setItem('edit-file', filePath);
  window.location.href = 'editor.html';
}

function _initNfModal() {
  document.getElementById('btn-nf-close').onclick      = _closeNfModal;
  document.getElementById('btn-nf-cancel').onclick     = _closeNfModal;
  document.getElementById('btn-nf-create').onclick     = _commitNfCreate;
  document.getElementById('btn-nf-browse').onclick     = async () => { const f = await window.api.openFolderDialog(); if (f) _nfSetDest(f); };
  document.getElementById('btn-nf-just-file').onclick  = () => { _nfOutside = 'just-file'; document.getElementById('nf-outside-warn').style.display = 'none'; document.getElementById('btn-nf-create').disabled = false; };
  document.getElementById('btn-nf-change-dest').onclick = () => _nfSetDest(currentFolder || '');
  document.getElementById('nf-name-input').addEventListener('keydown', e => {
    if (e.key === 'Enter')  { e.preventDefault(); _commitNfCreate(); }
    if (e.key === 'Escape') _closeNfModal();
  });
}

/* ── Delete ── */
async function deleteFile(filePath) {
  const name = filePath.split(/[\\/]/).pop();
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
  const result = await window.api.deleteFile(filePath);
  if (!result.success) { showToast('Could not delete file'); return; }
  allFiles      = allFiles.filter(f => f.path !== filePath);
  filteredFiles = filteredFiles.filter(f => f.path !== filePath);
  renderFiles();
  showToast(`Deleted ${name}`);
}

/* ── Search ── */
function onSearch() {
  const q = searchInput.value.toLowerCase();
  filteredFiles = q
    ? allFiles.filter(f => f.type === 'folder' || f.name.toLowerCase().includes(q))
    : [...allFiles];
  applySortAndRender();
}

/* ── Sort ── */
function applySortAndRender() {
  const s = sortBy;
  filteredFiles.sort((a, b) => {
    if (s === 'name-asc')   return a.name.localeCompare(b.name);
    if (s === 'name-desc')  return b.name.localeCompare(a.name);
    if (s === 'date-desc')  return new Date(b.modified) - new Date(a.modified);
    if (s === 'date-asc')   return new Date(a.modified) - new Date(b.modified);
    if (s === 'size-desc')  return b.size - a.size;
    if (s === 'size-asc')   return a.size - b.size;
    if (s === 'type') {
      const order = ['html','htm','css','js','xml'];
      const ea = order.indexOf(a.name.split('.').pop().toLowerCase());
      const eb = order.indexOf(b.name.split('.').pop().toLowerCase());
      return (ea === -1 ? 99 : ea) - (eb === -1 ? 99 : eb);
    }
    return 0;
  });
  renderFiles();
}

/* ── View mode ── */
function setView(mode) {
  viewMode = mode;
  localStorage.setItem('htmledger-view', mode);
  document.getElementById('view-grid').classList.toggle('active', mode === 'grid');
  document.getElementById('view-list').classList.toggle('active', mode === 'list');
  if (currentFolder) renderFiles();
  else renderHomeLanding();
}

/* ── Rename ── */
async function renameFile(filePath) {
  const oldName = filePath.split(/[\\/]/).pop();
  const newName = prompt(`Rename "${oldName}" to:`, oldName);
  if (!newName || newName === oldName) return;
  const dir     = filePath.replace(/[\\/][^\\/]+$/, '');
  const newPath = dir + '\\' + newName;
  const result  = await window.api.renameFile(filePath, newPath);
  if (!result.success) { showToast('Rename failed: ' + result.error); return; }
  // Update in-memory arrays
  const update = f => f.path === filePath ? { ...f, name: newName, path: newPath } : f;
  allFiles      = allFiles.map(update);
  filteredFiles = filteredFiles.map(update);
  applySortAndRender();
  showToast(`Renamed to ${newName}`);
}

/* ── Duplicate ── */
async function duplicateFile(filePath) {
  const r = await window.api.readFile(filePath);
  if (!r.success) { showToast('Could not read file'); return; }
  const ext   = filePath.split('.').pop();
  const base  = filePath.slice(0, filePath.length - ext.length - 1);
  const newPath = `${base}_copy.${ext}`;
  const w = await window.api.writeFile(newPath, r.content);
  if (!w.success) { showToast('Could not duplicate file'); return; }
  // Reload the workspace to pick up the new file
  await loadFolder(currentFolder);
  showToast(`Duplicated as ${newPath.split(/[\\/]/).pop()}`);
}

/* ── Nav helper ── */
function setActiveNav(id) {
  document.querySelectorAll('.sidebar-btn').forEach(b => b.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

/* ── Context menu ── */
function showCtx(x, y, path) {
  contextTarget = path;
  ctxMenu.style.display = 'block';
  const cx = Math.min(x, window.innerWidth - 188);
  const cy = Math.min(y, window.innerHeight - 110);
  ctxMenu.style.left = cx + 'px';
  ctxMenu.style.top  = cy + 'px';
}
function hideCtx() {
  ctxMenu.style.display = 'none';
  contextTarget = null;
}

/* ── Toast ── */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 3000);
}

/* ── Workspace system ── */
async function loadWorkspaces() {
  const result = await window.api.getWorkspaces().catch(() => ({ exists: false, data: [] }));
  workspaces = result.data || [];

  // Migration: if no workspaces.json yet but recent folders exist, prompt user
  if (!result.exists && recentFolders.length > 0) {
    await showMigrationPrompt();
  }
}

async function saveWorkspaces() {
  await window.api.saveWorkspaces(workspaces);
}

function showMigrationPrompt() {
  return new Promise(resolve => {
    document.getElementById('migration-modal').style.display = 'flex';
    document.getElementById('btn-migrate-convert').onclick = async () => {
      workspaces = recentFolders.map(f => makeWorkspace(f.replace(/\\/g, '/').split('/').pop(), [f]));
      await saveWorkspaces();
      document.getElementById('migration-modal').style.display = 'none';
      resolve();
    };
    document.getElementById('btn-migrate-fresh').onclick = async () => {
      workspaces = [];
      recentFolders = [];
      await Promise.all([saveWorkspaces(), window.api.saveRecentFolders([])]);
      document.getElementById('migration-modal').style.display = 'none';
      resolve();
    };
  });
}

function makeWorkspace(name, folders, opts = {}) {
  return {
    id: Date.now().toString() + Math.random().toString(36).slice(2, 6),
    name,
    folders,
    deploy: opts.deploy || '',
    theme:  opts.theme  || '',
    createdAt:   new Date().toISOString(),
    lastOpened:  null,
  };
}

function makeWsCard(ws) {
  const card = document.createElement('div');
  card.className = 'ws-card';

  const folderCount = ws.folders.length;
  const folderLabel = folderCount === 1
    ? ws.folders[0].replace(/\\/g, '/').split('/').slice(-2).join('/')
    : `${folderCount} folders`;

  card.innerHTML = `
    <div class="ws-card-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
    </div>
    <div class="ws-card-body">
      <div class="ws-card-name">${ws.name}</div>
      <div class="ws-card-meta">${folderLabel}</div>
      ${ws.lastOpened ? `<div class="ws-card-opened">Last opened ${relTime(ws.lastOpened)}</div>` : ''}
    </div>
    <div class="ws-card-actions">
      <button class="ws-card-btn" title="Workspace Settings" data-action="edit">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
      </button>
      <button class="ws-card-btn ws-card-btn-del" title="Remove Workspace" data-action="delete">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
      </button>
    </div>`;

  card.querySelector('[data-action="edit"]').addEventListener('click', e => { e.stopPropagation(); openWsModal(ws); });
  card.querySelector('[data-action="delete"]').addEventListener('click', e => { e.stopPropagation(); deleteWorkspace(ws.id); });
  card.addEventListener('click', () => openWorkspace(ws));
  return card;
}

function relTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 2)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function openWorkspace(ws) {
  ws.lastOpened = new Date().toISOString();
  saveWorkspaces();
  activeWorkspace = ws;
  sessionStorage.setItem('active-workspace', JSON.stringify(ws));
  sessionStorage.removeItem('workspace-folder');
  if (ws.defaultFile) {
    sessionStorage.setItem('edit-file', ws.defaultFile);
  } else {
    sessionStorage.removeItem('edit-file');
  }
  window.location.href = 'editor.html';
}

async function deleteWorkspace(id) {
  const ws = workspaces.find(w => w.id === id);
  if (!ws) return;
  if (!confirm(`Remove workspace "${ws.name}"? The files won't be deleted.`)) return;
  workspaces = workspaces.filter(w => w.id !== id);
  await saveWorkspaces();
  renderHomeLanding();
}

/* ── New / Edit Workspace modal ── */
function openWsModal(editWs = null) {
  wsModalEditId  = editWs ? editWs.id : null;
  wsModalFolders = editWs ? [...editWs.folders] : [];

  document.getElementById('ws-modal-title').textContent   = editWs ? 'Workspace Settings' : 'New Workspace';
  document.getElementById('btn-ws-modal-save').textContent = editWs ? 'Save Changes' : 'Create Workspace';
  document.getElementById('ws-name-input').value           = editWs ? editWs.name : '';
  document.getElementById('ws-deploy-input').value         = editWs ? (editWs.deploy || '') : '';
  document.getElementById('ws-theme-select').value         = editWs ? (editWs.theme || '') : '';
  document.getElementById('ws-conflict-warning').style.display = 'none';

  renderWsFoldersList();
  document.getElementById('ws-modal').style.display = 'flex';
  setTimeout(() => document.getElementById('ws-name-input').focus(), 50);
}

function closeWsModal() {
  document.getElementById('ws-modal').style.display = 'none';
  wsModalFolders = [];
  wsModalEditId  = null;
}

function renderWsFoldersList() {
  const list = document.getElementById('ws-folders-list');
  if (wsModalFolders.length === 0) {
    list.innerHTML = '<p class="contact-hint" style="margin:4px 0">No folders added yet.</p>';
    return;
  }
  list.innerHTML = '';
  wsModalFolders.forEach((f, i) => {
    const row = document.createElement('div');
    row.className = 'ws-folder-row';
    row.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width:14px;height:14px;flex-shrink:0;opacity:.6"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>
      <span class="ws-folder-path">${f}</span>
      <button class="ws-folder-remove" title="Remove" data-idx="${i}">✕</button>`;
    row.querySelector('.ws-folder-remove').addEventListener('click', () => {
      wsModalFolders.splice(i, 1);
      renderWsFoldersList();
      checkAndShowConflicts();
    });
    list.appendChild(row);
  });
}

async function wsAddFolder() {
  const folder = await window.api.openFolderDialog();
  if (!folder) return;
  if (wsModalFolders.some(f => f.toLowerCase() === folder.toLowerCase())) {
    showToast('That folder is already in this workspace.');
    return;
  }
  // Auto-fill workspace name from first folder
  const nameInput = document.getElementById('ws-name-input');
  if (!nameInput.value.trim() && wsModalFolders.length === 0) {
    nameInput.value = folder.replace(/\\/g, '/').split('/').pop();
  }
  wsModalFolders.push(folder);
  renderWsFoldersList();
  checkAndShowConflicts();
}

function checkFolderConflicts(folders) {
  const msgs = [];
  for (const ws of workspaces) {
    if (ws.id === wsModalEditId) continue;
    for (const nf of folders) {
      const nl = nf.toLowerCase().replace(/\\/g, '/');
      for (const ef of ws.folders) {
        const el = ef.toLowerCase().replace(/\\/g, '/');
        if (nl === el)
          msgs.push(`"${nf}" is already in workspace <strong>${ws.name}</strong>.`);
        else if (nl.startsWith(el + '/'))
          msgs.push(`"${nf}" is inside a folder already used by workspace <strong>${ws.name}</strong>.`);
        else if (el.startsWith(nl + '/'))
          msgs.push(`A folder in workspace <strong>${ws.name}</strong> is inside "${nf}".`);
      }
    }
  }
  return msgs;
}

function checkAndShowConflicts() {
  const warn = document.getElementById('ws-conflict-warning');
  const msgs = checkFolderConflicts(wsModalFolders);
  if (msgs.length === 0) { warn.style.display = 'none'; return; }
  warn.innerHTML = '⚠ ' + msgs.join('<br>') + '<br><span style="opacity:.75">You can still save — this is just a heads-up.</span>';
  warn.style.display = '';
}

async function saveWsModal() {
  const name = document.getElementById('ws-name-input').value.trim();
  if (!name) { document.getElementById('ws-name-input').focus(); showToast('Please enter a workspace name.'); return; }
  if (wsModalFolders.length === 0) { showToast('Add at least one folder.'); return; }

  const deploy    = document.getElementById('ws-deploy-input').value.trim();
  const theme     = document.getElementById('ws-theme-select').value;
  const isEditing = !!wsModalEditId; // capture before closeWsModal clears it

  if (isEditing) {
    const ws = workspaces.find(w => w.id === wsModalEditId);
    if (ws) { ws.name = name; ws.folders = [...wsModalFolders]; ws.deploy = deploy; ws.theme = theme; }
  } else {
    workspaces.push(makeWorkspace(name, [...wsModalFolders], { deploy, theme }));
  }

  await saveWorkspaces();
  closeWsModal();
  renderHomeLanding();
  if (!isEditing) {
    const newWs = workspaces[workspaces.length - 1];
    if (confirm(`Workspace "${name}" created! Open it now?`)) openWorkspace(newWs);
  }
}

function initWorkspaces() {
  document.getElementById('btn-ws-modal-close').onclick  = closeWsModal;
  document.getElementById('btn-ws-modal-cancel').onclick = closeWsModal;
  document.getElementById('btn-ws-modal-save').onclick   = saveWsModal;
  document.getElementById('btn-ws-add-folder').onclick   = wsAddFolder;
  document.getElementById('ws-modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeWsModal(); });
}

/* ── Compatible files modal ── */
function openCompat() {
  document.getElementById('compat-modal').style.display = 'flex';
}
function closeCompat() {
  document.getElementById('compat-modal').style.display = 'none';
}
function initCompat() {
  document.getElementById('compat-link').onclick        = e => { e.preventDefault(); openCompat(); };
  document.getElementById('compat-link-empty').onclick  = e => { e.preventDefault(); openCompat(); };
  document.getElementById('btn-compat-close').onclick   = closeCompat;
  document.getElementById('btn-compat-done').onclick    = closeCompat;
  document.getElementById('compat-modal').addEventListener('click', e => {
    if (e.target === document.getElementById('compat-modal')) closeCompat();
  });
}

/* ── Restore workspace on launch ── */
async function applyRestoreOnLaunch() {
  // Skip auto-restore when the user explicitly navigated back from the editor
  if (sessionStorage.getItem('user-navigated-back')) {
    sessionStorage.removeItem('user-navigated-back');
    return;
  }
  try {
    const s = await window.api.getSettings();
    if (s.restoreWorkspace === 'last') {
      const ws = [...workspaces].sort((a, b) =>
        ((b.lastOpened || '') > (a.lastOpened || '')) ? 1 : -1
      )[0];
      if (ws) { setTimeout(() => openWorkspace(ws), 80); }
    } else if (s.restoreWorkspace === 'specific' && s.restoreWorkspaceId) {
      const ws = workspaces.find(w => w.id === s.restoreWorkspaceId);
      if (ws) { setTimeout(() => openWorkspace(ws), 80); }
    }
  } catch {}
}

/* ── Settings — unified panel ── */
function initSettings() {
  document.getElementById('btn-settings-home').onclick = () => openUnifiedSettings('app');
  document.addEventListener('settings-changed', e => {
    const s = e.detail || {};
    if (s.theme) applyTheme(s.theme);
  });
  document.addEventListener('open-contact-modal', () => openContactModal());
}

/* ── Contact modal ── */
const CONTACT_WEB = 'https://htmledger.localhost314.com/contact';
const CONTACT_EMAIL = 'htmledger@localhost314.com';
const CONTACT_FALLBACK = `Keep having issues? <a href="#" onclick="window.api.openExternal('${CONTACT_WEB}');return false;" style="color:inherit;text-decoration:underline">Contact Us</a>`;

function openContactModal() {
  resetContactModal();
  const modal = document.getElementById('contact-modal');
  modal.style.display = 'flex';
  if (!navigator.onLine) showContactOffline();
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
    if (navigator.onLine) { resetContactModal(); document.getElementById('btn-contact-send').style.display = ''; document.getElementById('btn-contact-cancel').textContent = 'Cancel'; }
    else { document.getElementById('btn-contact-retry').textContent = 'Still offline…'; setTimeout(() => { if(document.getElementById('btn-contact-retry')) document.getElementById('btn-contact-retry').textContent = 'Refresh'; }, 1500); }
  };
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
      <p class="contact-hint">Or email us directly at <strong>htmledger@localhost314.com</strong></p>
      <div id="contact-error" class="contact-error" style="display:none"></div>
    </div>`;
  document.getElementById('btn-contact-send').style.display = '';
  document.getElementById('btn-contact-cancel').textContent = 'Cancel';
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
document.getElementById('btn-contact-close').onclick  = closeContactModal;
document.getElementById('btn-contact-cancel').onclick = closeContactModal;
document.getElementById('btn-contact-send').onclick   = sendContactForm;
document.getElementById('contact-modal').addEventListener('click', e => { if (e.target === e.currentTarget) closeContactModal(); });

/* ── Theme ── */
function initTheme() {
  const saved = localStorage.getItem('htmledger-theme') || 'dark';
  applyTheme(saved);
  document.getElementById('btn-theme-toggle').addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(next);
    localStorage.setItem('htmledger-theme', next);
  });
}
function applyTheme(theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    document.getElementById('theme-label').textContent = 'Dark Mode';
  } else {
    document.documentElement.removeAttribute('data-theme');
    document.getElementById('theme-label').textContent = 'Light Mode';
  }
}

/* ── Auto-update ── */
function initUpdater() {
  if (!window.api?.onUpdateDownloaded) return;
  window.api.onUpdateDownloaded(() => {
    document.getElementById('update-banner').style.display = 'flex';
  });
  document.getElementById('btn-install-update').onclick = () => window.api.installUpdate();
  document.getElementById('btn-dismiss-update').onclick = () => {
    document.getElementById('update-banner').style.display = 'none';
  };
}

init();
initTheme();
initCompat();
initSettings();
initUpdater();

// "Open with" / double-click: open file directly in editor
if (window.api?.onOpenFileArgv) {
  window.api.onOpenFileArgv(filePath => {
    sessionStorage.setItem('edit-file', filePath);
    sessionStorage.removeItem('active-workspace');
    sessionStorage.removeItem('workspace-folder');
    window.location.href = 'editor.html';
  });
}
