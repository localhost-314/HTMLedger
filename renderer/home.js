/* ── State ── */
let currentFolder = null;
let allFiles = [];
let filteredFiles = [];
let viewMode = 'grid';
let sortBy = 'name-asc';
let contextTarget = null;
let recentFolders = [];
let recentFiles   = [];

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
  renderHomeLanding();
  bindEvents();
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
    if (files.length > 1) {
      // Store extra files for editor to pick up
      sessionStorage.setItem('extra-files', JSON.stringify(files.slice(1).map(f => f.path)));
    }
    window.location.href = 'editor.html';
  });
}

/* ── Home screen ── */
function goHome() {
  currentFolder = null;
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

  // Recent workspaces
  const recentSection = document.getElementById('recent-section');
  const recentList    = document.getElementById('recent-list');

  if (recentFolders.length > 0) {
    recentSection.style.display = 'block';
    recentList.innerHTML = '';
    recentFolders.slice(0, 6).forEach(folder => {
      const item = document.createElement('div');
      item.className = 'recent-item';
      const name = folder.replace(/\\/g, '/').split('/').pop();
      item.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
        </svg>
        <span class="recent-item-name">${name}</span>
        <span class="recent-item-path">${folder}</span>`;
      item.addEventListener('click', () => loadFolder(folder));
      recentList.appendChild(item);
    });
  } else {
    recentSection.style.display = 'none';
  }

  // Recent files
  const recentFilesSection = document.getElementById('recent-files-section');
  const recentFilesList    = document.getElementById('recent-files-list');

  if (recentFiles.length > 0) {
    recentFilesSection.style.display = 'block';
    recentFilesList.innerHTML = '';
    recentFiles.slice(0, 8).forEach(f => {
      const item = document.createElement('div');
      item.className = 'recent-item';
      const ext = f.name.split('.').pop().toLowerCase();
      const extColors = { html:'#f97316', htm:'#f97316', css:'#60a5fa', js:'#fbbf24', xml:'#34d399' };
      const color = extColors[ext] || '#8888b0';
      item.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14,2 14,8 20,8"/>
        </svg>
        <span class="recent-item-name">${f.name}</span>
        <span class="recent-item-path">${f.path}</span>`;
      item.addEventListener('click', () => openCard(f.path));
      recentFilesList.appendChild(item);
    });
  } else {
    recentFilesSection.style.display = 'none';
  }
}

/* ── Open folder as workspace ── */
async function openFolder() {
  const folder = await window.api.openFolderDialog();
  if (!folder) return;
  await loadFolder(folder);
}

async function loadFolder(folderPath) {
  const result = await window.api.listHtmlFiles(folderPath);
  if (!result.success) { showToast('Error reading folder'); return; }

  currentFolder = folderPath;
  allFiles      = result.files;
  filteredFiles = [...allFiles];

  // Update recents
  recentFolders = [folderPath, ...recentFolders.filter(f => f !== folderPath)].slice(0, 10);
  await window.api.saveRecentFolders(recentFolders);

  renderWorkspace();
  setActiveNav('nav-workspace-files');
}

/* ── Render workspace file view ── */
function renderWorkspace() {
  if (!currentFolder) return;

  const folderName = currentFolder.replace(/\\/g, '/').split('/').pop();

  // Breadcrumb: Home (clickable) › FolderName
  bcHome.textContent = 'Home';
  bcHome.classList.add('clickable');
  bcSep.style.display  = 'inline';
  bcFolder.textContent = folderName;

  // Show workspace sidebar info
  sidebarWs.style.display = 'block';
  workspaceName.textContent = folderName;

  // Show search, sort & new file button
  searchWrap.style.display = 'flex';
  sortSelect.style.display = 'block';
  btnNewFile.style.display = 'flex';

  // Hide landing
  homeLanding.style.display = 'none';

  filteredFiles = [...allFiles];
  searchInput.value = '';
  applySortAndRender();
}

/* ── Render file cards ── */
function renderFiles() {
  fileCount.textContent = filteredFiles.length === 1
    ? '1 file'
    : filteredFiles.length > 0 ? `${filteredFiles.length} files` : '';

  if (filteredFiles.length === 0) {
    grid.style.display       = 'none';
    emptyState.style.display = 'flex';
    return;
  }

  emptyState.style.display = 'none';
  grid.style.display       = 'grid';
  grid.innerHTML           = '';
  grid.className           = 'file-grid' + (viewMode === 'list' ? ' list-view' : '');

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
  div.className   = 'file-card';
  div.dataset.path = file.path;

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
  window.location.href = 'editor.html';
}

/* ── Open file in editor ── */
function openCard(filePath) {
  sessionStorage.setItem('edit-file', filePath);
  if (currentFolder) sessionStorage.setItem('workspace-folder', currentFolder);
  window.location.href = 'editor.html';
}

/* ── New file ── */
async function newFile() {
  let savePath = await window.api.saveFileDialog(
    currentFolder ? currentFolder + '\\untitled.html' : 'untitled.html'
  );
  if (!savePath) return;
  if (!/\.(html|htm|xml|css|js)$/i.test(savePath)) savePath += '.html';

  const starter = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Page</title>
</head>
<body>

</body>
</html>`;

  const result = await window.api.writeFile(savePath, starter);
  if (!result.success) { showToast('Could not create file'); return; }
  sessionStorage.setItem('edit-file', savePath);
  window.location.href = 'editor.html';
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
  filteredFiles = q ? allFiles.filter(f => f.name.toLowerCase().includes(q)) : [...allFiles];
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
  document.getElementById('view-grid').classList.toggle('active', mode === 'grid');
  document.getElementById('view-list').classList.toggle('active', mode === 'list');
  if (currentFolder) renderFiles();
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
initUpdater();
