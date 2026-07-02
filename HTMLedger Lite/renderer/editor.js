const activeWorkspace = JSON.parse(sessionStorage.getItem('active-workspace') || 'null');
if (!activeWorkspace) window.location.href = 'home.html';

let cmView         = null;
let currentFile     = null;   // { path, name }
let lastSavedContent = '';
let isDirty          = false;
let treeExpanded     = new Set();
let renamingPath     = null;  // path of file currently being renamed inline
let settings         = { theme: 'dark', fontSize: 14 };
let previewOn        = false;
let previewDebounce  = null;

// Fully lock/unlock CM — disables editing AND releases keyboard focus
function lockCM() {
  if (!cmView) return;
  CM.setEditable(cmView, false);
  cmView.contentDOM.blur();
}
function unlockCM() {
  if (!cmView || !currentFile) return;
  CM.setEditable(cmView, true);
  setTimeout(() => cmView.focus(), 50);
}
function blurCM()    { lockCM(); }
function refocusCM() { unlockCM(); }

const TEXT_RE  = /\.(html|htm|css|js|jsx|ts|tsx|json|xml|svg|md)$/i;
const HTML_RE  = /\.(html|htm)$/i;
const IMAGE_RE = /\.(png|jpg|jpeg|gif|webp|ico|bmp)$/i;

/* ── Unsaved changes dialog ── */
// Resolves true (yes, save) or false (no, discard). Skips dialog per settings.saveOnExit.
function confirmUnsaved(context) {
  if (!isDirty) return Promise.resolve(null); // null = no-op, nothing dirty
  const mode = settings.saveOnExit || 'ask';
  if (mode === 'save')    return Promise.resolve(true);
  if (mode === 'discard') return Promise.resolve(false);

  return new Promise(resolve => {
    lockCM();
    const msg = currentFile
      ? `"${currentFile.name}" has unsaved changes. Save before ${context}?`
      : `You have unsaved changes. Save before ${context}?`;
    document.getElementById('unsaved-msg').textContent = msg;
    document.getElementById('dont-ask-cb').checked = false;
    document.getElementById('unsaved-modal').style.display = 'flex';

    const cleanup = () => { document.getElementById('unsaved-modal').style.display = 'none'; };

    document.getElementById('btn-unsaved-yes').onclick = async () => {
      cleanup();
      if (document.getElementById('dont-ask-cb').checked) {
        settings.saveOnExit = 'save';
        await saveSettings();
        updateSaveOnExitChips();
      }
      resolve(true);
    };
    document.getElementById('btn-unsaved-no').onclick = async () => {
      cleanup();
      if (document.getElementById('dont-ask-cb').checked) {
        settings.saveOnExit = 'discard';
        await saveSettings();
        updateSaveOnExitChips();
      }
      resolve(false);
    };
  });
}

/* ── Titlebar ── */
document.getElementById('tb-min').onclick = () => window.api.minimize();
document.getElementById('tb-max').onclick = () => window.api.maximize();
document.getElementById('tb-close').onclick = () => window.api.close(); // triggers close-requested
document.getElementById('tb-ws-name').textContent = activeWorkspace.name;
document.getElementById('sidebar-ws-name').textContent = activeWorkspace.name;

document.getElementById('btn-home').onclick = async () => {
  const result = await confirmUnsaved('leaving');
  if (result === true) await saveCurrentFile();
  await window.api.stopDirWatch();
  window.location.href = 'home.html';
};

// Intercept ALL window close attempts (titlebar ✕, Alt+F4, etc.)
window.api.onCloseRequested(async () => {
  const result = await confirmUnsaved('closing');
  if (result === true) await saveCurrentFile();
  await window.api.stopDirWatch();
  window.api.allowClose();
});

/* ── Theme / settings ── */
function applyTheme(v) {
  if (v === 'light') document.documentElement.setAttribute('data-theme', 'light');
  else document.documentElement.removeAttribute('data-theme');
}

async function loadSettings() {
  const s = await window.api.getSettings();
  settings.theme          = s.theme || 'dark';
  settings.fontSize       = s.fontSize || 14;
  settings.saveOnExit     = s.saveOnExit || 'ask';
  settings.restoreOnLaunch    = s.restoreOnLaunch || 'none';
  settings.restoreWorkspaceId = s.restoreWorkspaceId || '';
  applyTheme(settings.theme);
}

async function saveSettings() {
  await window.api.saveSettings(settings);
}

/* ── Editor (CodeMirror) ── */
function initEditor() {
  cmView = CM.createEditor({
    parent: document.getElementById('cm-host'),
    doc: '',
    fileName: 'untitled.html',
    dark: settings.theme !== 'light',
    fontSize: settings.fontSize,
    onChange: onEditorChange
  });
}

function onEditorChange(doc) {
  if (!currentFile) return;
  isDirty = doc !== lastSavedContent;
  document.getElementById('dirty-dot').style.display = isDirty ? '' : 'none';
  if (previewOn) {
    clearTimeout(previewDebounce);
    previewDebounce = setTimeout(updatePreview, 500);
  }
}

/* ── File tree ── */
async function loadTree() {
  const res = await window.api.listDirTree(activeWorkspace.folder);
  renderTree(res.success ? res.tree : []);
}

function renderTree(tree) {
  const host = document.getElementById('sidebar-tree');
  host.innerHTML = '';
  renderNodes(tree, host, 0);
}

function renderNodes(nodes, host, depth) {
  nodes.forEach(node => {
    const row = document.createElement('div');
    row.className = 'tree-row' + (currentFile && node.path === currentFile.path ? ' active' : '');
    row.style.paddingLeft = (8 + depth * 14) + 'px';

    if (node.type === 'folder') {
      const open = treeExpanded.has(node.path);
      row.innerHTML = `<span class="tree-icon">${open ? '▾' : '▸'}</span><span class="tree-name">${escapeHtml(node.name)}</span>`;
      row.onclick = () => {
        if (treeExpanded.has(node.path)) treeExpanded.delete(node.path);
        else treeExpanded.add(node.path);
        loadTree();
      };
      host.appendChild(row);
      if (open) renderNodes(node.children, host, depth + 1);
    } else {
      const icon = IMAGE_RE.test(node.name) ? '\u{1F5BC}' : '\u{1F4C4}';

      if (node.path === renamingPath) {
        // Inline rename input row
        row.innerHTML = `
          <span class="tree-icon">${icon}</span>
          <input class="tree-rename-input" value="${escapeHtml(node.name)}" spellcheck="false">`;
        host.appendChild(row);
        const inp = row.querySelector('.tree-rename-input');
        setTimeout(() => { inp.focus(); inp.select(); }, 80);
        const commit = async () => {
          const newName = inp.value.trim();
          renamingPath = null;
          if (!newName || newName === node.name) { loadTree(); return; }
          const newPath = node.path.slice(0, node.path.length - node.name.length) + newName;
          const res = await window.api.renameFile(node.path, newPath);
          if (!res.success) { alert('Rename failed: ' + res.error); loadTree(); return; }
          if (currentFile && currentFile.path === node.path) {
            currentFile = { path: newPath, name: newName };
            document.getElementById('current-file').textContent = newName;
            CM.setLanguage(cmView, newName);
          }
          loadTree();
          refocusCM();
        };
        const cancel = () => { renamingPath = null; loadTree(); refocusCM(); };
        inp.addEventListener('keydown', (e) => {
          e.stopPropagation(); // block CM keymap
          if (e.key === 'Enter')  { e.preventDefault(); commit(); }
          if (e.key === 'Escape') cancel();
        });
        inp.addEventListener('blur', () => { if (renamingPath === node.path) commit(); });
      } else {
        row.innerHTML = `
          <span class="tree-icon">${icon}</span>
          <span class="tree-name">${escapeHtml(node.name)}</span>
          <span class="tree-actions">
            <button data-act="rename" title="Rename">&#9998;</button>
            <button data-act="delete" title="Delete">&#128465;</button>
          </span>`;
        row.onclick = (e) => { if (!e.target.closest('.tree-actions')) openFile(node.path, node.name); };
        row.querySelector('[data-act="rename"]').onclick = (e) => {
          e.stopPropagation();
          renamingPath = node.path;
          blurCM();
          loadTree();
        };
        row.querySelector('[data-act="delete"]').onclick = (e) => { e.stopPropagation(); deleteFile(node.path, node.name); };
        host.appendChild(row);
      }
    }
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ── Open / save / rename / delete ── */
async function openFile(filePath, name) {
  if (IMAGE_RE.test(name)) { window.api.openInExplorer(filePath); return; }
  if (isDirty) await saveCurrentFile();

  const res = await window.api.readFile(filePath);
  if (!res.success) { alert('Could not open file: ' + res.error); return; }

  currentFile = { path: filePath, name };
  lastSavedContent = res.content;
  isDirty = false;

  document.getElementById('empty-editor').style.display = 'none';
  document.getElementById('dirty-dot').style.display = 'none';
  document.getElementById('current-file').textContent = name;

  CM.setEditable(cmView, true);
  CM.setDoc(cmView, res.content);
  CM.setLanguage(cmView, name);

  loadTree(); // refresh active-row highlight
  if (previewOn) updatePreview();
}

async function saveCurrentFile() {
  if (!currentFile || !cmView) return;
  const content = CM.getDoc(cmView);
  const res = await window.api.writeFile(currentFile.path, content);
  if (!res.success) { alert('Could not save file: ' + res.error); return; }
  lastSavedContent = content;
  isDirty = false;
  document.getElementById('dirty-dot').style.display = 'none';
  if (previewOn) updatePreview();
}

// renameFile is now handled inline in renderNodes

async function deleteFile(filePath, name) {
  if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
  const res = await window.api.deleteFile(filePath);
  if (!res.success) { alert('Delete failed: ' + res.error); return; }
  if (currentFile && currentFile.path === filePath) {
    currentFile = null;
    CM.setEditable(cmView, false);
    CM.setDoc(cmView, '');
    document.getElementById('current-file').textContent = 'No file open';
    document.getElementById('empty-editor').style.display = '';
    document.getElementById('dirty-dot').style.display = 'none';
  }
  loadTree();
}

/* ── New File Modal ── */
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
  const ws = (activeWorkspace.folder || '').replace(/\\/g, '/').toLowerCase();
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

function openNfModal() {
  _nfDest    = activeWorkspace.folder || '';
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
  _nfUpdateCreate();
  lockCM();
  document.getElementById('nf-modal').style.display = 'flex';
  setTimeout(() => document.getElementById('nf-name-input').focus(), 80);
}
function closeNfModal() {
  document.getElementById('nf-modal').style.display = 'none';
  unlockCM();
}
async function commitNfCreate() {
  const raw  = document.getElementById('nf-name-input').value.trim() || 'untitled';
  const name = raw.endsWith('.' + _nfExt) ? raw : raw + '.' + _nfExt;
  if (!_nfDest) return;
  const filePath = _nfDest + '\\' + name;
  const res = await window.api.createFile(filePath);
  if (!res.success) {
    if (res.error && res.error.includes('EEXIST')) {
      document.getElementById('nf-name-input').select();
      alert('"' + name + '" already exists. Choose a different name.');
      return;
    }
    alert('Could not create file: ' + res.error); return;
  }
  const starter = NF_STARTERS[_nfExt] ?? '';
  if (starter) await window.api.writeFile(filePath, starter);
  if (_nfOutside === 'add-ws') {
    activeWorkspace.folder = _nfDest;
    const wsList = ((await window.api.getWorkspaces()).data) || [];
    const idx = wsList.findIndex(w => w.id === activeWorkspace.id);
    if (idx >= 0) { wsList[idx].folder = _nfDest; await window.api.saveWorkspaces(wsList); }
    await window.api.stopDirWatch();
    await window.api.startDirWatch(_nfDest);
  }
  closeNfModal();
  await loadTree();
  openFile(filePath, name);
}

document.getElementById('btn-new-file').onclick       = openNfModal;
document.getElementById('btn-nf-close').onclick       = closeNfModal;
document.getElementById('btn-nf-cancel').onclick      = closeNfModal;
document.getElementById('btn-nf-create').onclick      = commitNfCreate;
document.getElementById('btn-nf-browse').onclick      = async () => { const f = await window.api.openFolderDialog(); if (f) _nfSetDest(f); };
document.getElementById('btn-nf-add-ws').onclick      = () => { _nfOutside = 'add-ws';    document.getElementById('nf-outside-warn').style.display = 'none'; _nfUpdateCreate(); };
document.getElementById('btn-nf-just-file').onclick   = () => { _nfOutside = 'just-file'; document.getElementById('nf-outside-warn').style.display = 'none'; _nfUpdateCreate(); };
document.getElementById('btn-nf-change-dest').onclick = () => _nfSetDest(activeWorkspace.folder || '');
document.getElementById('nf-name-input').addEventListener('keydown', e => {
  e.stopPropagation();
  if (e.key === 'Enter')  { e.preventDefault(); commitNfCreate(); }
  if (e.key === 'Escape') closeNfModal();
});

document.getElementById('btn-save').onclick = saveCurrentFile;
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    saveCurrentFile();
  }
});

/* ── Preview ── */
document.getElementById('btn-preview-toggle').onclick = () => {
  previewOn = !previewOn;
  document.getElementById('btn-preview-toggle').classList.toggle('on', previewOn);
  document.getElementById('preview-pane').classList.toggle('show', previewOn);
  if (previewOn) updatePreview();
};

function updatePreview() {
  const frame  = document.getElementById('preview-frame');
  const unavailable = document.getElementById('preview-unavailable');
  if (!currentFile || !HTML_RE.test(currentFile.name)) {
    frame.style.display = 'none';
    unavailable.style.display = '';
    return;
  }
  frame.style.display = '';
  unavailable.style.display = 'none';
  const content = CM.getDoc(cmView);
  frame.src = URL.createObjectURL(new Blob([content], { type: 'text/html' }));
}

/* ── Sidebar auto-refresh ── */
let lastSidebarUpdate = Date.now();

function relativeTime(ms) {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 10) return 'just now';
  if (s < 60) return s + 's ago';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  return h + 'h ago';
}

function touchSidebarTimestamp() {
  lastSidebarUpdate = Date.now();
  tickSidebarTimestamp();
}

function tickSidebarTimestamp() {
  document.getElementById('sidebar-last-updated').textContent = 'Updated ' + relativeTime(lastSidebarUpdate);
}
setInterval(tickSidebarTimestamp, 30000);

async function initSidebarWatcher() {
  await window.api.startDirWatch(activeWorkspace.folder);
  window.api.onSidebarChanged(() => { loadTree(); touchSidebarTimestamp(); });
}

/* ── Settings modal ── */
let _settingsSnapshot = null;

function setSegChip(groupIds, activeId) {
  groupIds.forEach(id => document.getElementById(id).classList.toggle('active', id === activeId));
}

function updateSaveOnExitChips() {
  const v = settings.saveOnExit || 'ask';
  setSegChip(['chip-save-ask','chip-save-always','chip-save-discard'],
    v === 'save' ? 'chip-save-always' : v === 'discard' ? 'chip-save-discard' : 'chip-save-ask');
}

async function openSettingsModal() {
  blurCM();
  _settingsSnapshot = { ...settings };

  setSegChip(['chip-dark', 'chip-light'], settings.theme === 'light' ? 'chip-light' : 'chip-dark');
  document.getElementById('font-size-input').value = settings.fontSize;

  updateSaveOnExitChips();

  const restoreMap = { none: 'chip-restore-none', last: 'chip-restore-last', specific: 'chip-restore-specific' };
  setSegChip(Object.values(restoreMap), restoreMap[settings.restoreOnLaunch || 'none']);
  await refreshRestoreSpecific(settings.restoreOnLaunch === 'specific');

  document.getElementById('settings-modal').style.display = 'flex';
}

async function refreshRestoreSpecific(show) {
  const row = document.getElementById('restore-specific-row');
  row.style.display = show ? '' : 'none';
  if (!show) return;
  const sel = document.getElementById('restore-ws-select');
  const res = await window.api.getWorkspaces();
  const list = res.exists ? res.data : [];
  sel.innerHTML = list.map(w =>
    `<option value="${w.id}"${w.id === settings.restoreWorkspaceId ? ' selected' : ''}>${escapeHtml(w.name)}</option>`
  ).join('');
}

function closeSettingsModal(revert) {
  if (revert && _settingsSnapshot) {
    const snap = _settingsSnapshot;
    if (snap.theme !== settings.theme) { settings.theme = snap.theme; applyTheme(snap.theme); CM.setTheme(cmView, snap.theme !== 'light'); }
    if (snap.fontSize !== settings.fontSize) { settings.fontSize = snap.fontSize; CM.setFontSize(cmView, snap.fontSize); }
    settings.restoreOnLaunch    = snap.restoreOnLaunch;
    settings.restoreWorkspaceId = snap.restoreWorkspaceId;
    settings.saveOnExit         = snap.saveOnExit;
  }
  document.getElementById('settings-modal').style.display = 'none';
}

document.getElementById('btn-settings').onclick       = openSettingsModal;
document.getElementById('btn-settings-close').onclick = () => closeSettingsModal(true);
document.getElementById('btn-settings-cancel').onclick = () => { closeSettingsModal(true);  refocusCM(); };
document.getElementById('btn-settings-save').onclick   = async () => { await saveSettings(); closeSettingsModal(false); refocusCM(); };

// Theme chips — apply live so user sees preview
document.getElementById('chip-dark').onclick = () => {
  settings.theme = 'dark'; applyTheme('dark'); CM.setTheme(cmView, true);
  setSegChip(['chip-dark', 'chip-light'], 'chip-dark');
};
document.getElementById('chip-light').onclick = () => {
  settings.theme = 'light'; applyTheme('light'); CM.setTheme(cmView, false);
  setSegChip(['chip-dark', 'chip-light'], 'chip-light');
};

// Font size — apply live
document.getElementById('font-size-input').oninput = (e) => {
  const px = parseInt(e.target.value, 10);
  if (px >= 8 && px <= 28) { settings.fontSize = px; CM.setFontSize(cmView, px); }
};

// Unsaved changes chips
document.getElementById('chip-save-ask').onclick     = () => { settings.saveOnExit = 'ask';     updateSaveOnExitChips(); };
document.getElementById('chip-save-always').onclick  = () => { settings.saveOnExit = 'save';    updateSaveOnExitChips(); };
document.getElementById('chip-save-discard').onclick = () => { settings.saveOnExit = 'discard'; updateSaveOnExitChips(); };

// Restore on launch chips
['none','last','specific'].forEach(v => {
  document.getElementById('chip-restore-' + v).onclick = async () => {
    settings.restoreOnLaunch = v;
    setSegChip(['chip-restore-none','chip-restore-last','chip-restore-specific'], 'chip-restore-' + v);
    await refreshRestoreSpecific(v === 'specific');
  };
});
document.getElementById('restore-ws-select').onchange = (e) => {
  settings.restoreWorkspaceId = e.target.value;
};

// Footer links
const SITE = 'https://htmledger.localhost314.com';
document.getElementById('link-website').onclick  = () => window.api.openExternal(SITE);
document.getElementById('link-source').onclick   = () => window.api.openExternal('https://github.com/localhost-314/HTMLedger');
document.getElementById('link-tos').onclick      = () => window.api.openExternal(SITE + '/terms');
document.getElementById('link-privacy').onclick  = () => window.api.openExternal(SITE + '/privacy');
document.getElementById('link-issue').onclick    = () => window.api.openExternal('https://github.com/localhost-314/HTMLedger/issues/new');
document.getElementById('link-known').onclick    = () => window.api.openExternal('https://github.com/localhost-314/HTMLedger/issues');
document.getElementById('link-contact').onclick  = () => window.api.openExternal(SITE + '/contactforlite');

/* ── Init ── */
(async function init() {
  await loadSettings();
  initEditor();
  await loadTree();
  // auto-open defaultFile if set (e.g. from "Open File" on home screen)
  if (activeWorkspace.defaultFile) {
    const name = activeWorkspace.defaultFile.replace(/\\/g, '/').split('/').pop();
    openFile(activeWorkspace.defaultFile, name);
  }
  await initSidebarWatcher();
  touchSidebarTimestamp();
})();
