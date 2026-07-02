let workspaces = [];
let pickedFolder = '';

/* ── Theme ── */
function applyTheme(v) {
  if (v === 'light') document.documentElement.setAttribute('data-theme', 'light');
  else document.documentElement.removeAttribute('data-theme');
  document.getElementById('theme-label').textContent = v === 'light' ? 'Dark Mode' : 'Light Mode';
}

async function initTheme() {
  const s = await window.api.getSettings();
  applyTheme(s.theme || 'dark');
  return s;
}

document.getElementById('btn-theme').onclick = async () => {
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const next = isLight ? 'dark' : 'light';
  applyTheme(next);
  const s = await window.api.getSettings();
  s.theme = next;
  await window.api.saveSettings(s);
};

/* ── Titlebar ── */
document.getElementById('tb-min').onclick   = () => window.api.minimize();
document.getElementById('tb-max').onclick   = () => window.api.maximize();
document.getElementById('tb-close').onclick = () => window.api.close();

/* ── Relative time ── */
function relativeTime(ms) {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 10) return 'just now';
  if (s < 60) return s + 's ago';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm ago';
  const h = Math.floor(m / 60);
  if (h < 24) return h + 'h ago';
  const d = Math.floor(h / 24);
  return d + 'd ago';
}

/* ── Workspaces ── */
async function loadWorkspaces() {
  const res = await window.api.getWorkspaces();
  workspaces = res.exists ? res.data : [];
  workspaces.sort((a, b) => (b.lastOpened || 0) - (a.lastOpened || 0));
  renderWorkspaces();
}

async function saveWorkspaces() {
  await window.api.saveWorkspaces(workspaces);
}

function renderWorkspaces() {
  const list  = document.getElementById('ws-list');
  const empty = document.getElementById('empty-state');
  const label = document.getElementById('ws-section-label');
  list.innerHTML = '';
  if (!workspaces.length) {
    empty.style.display = '';
    label.style.display = 'none';
    return;
  }
  empty.style.display = 'none';
  label.style.display = '';
  workspaces.forEach(ws => {
    const card = document.createElement('div');
    card.className = 'ws-card';
    const meta = ws.lastOpened ? `Last opened ${relativeTime(ws.lastOpened)}` : 'Never opened';
    card.innerHTML = `
      <div class="ws-card-name">${escapeHtml(ws.name)}</div>
      <div class="ws-card-folder" title="${escapeHtml(ws.folder)}">${escapeHtml(ws.folder)}</div>
      <div class="ws-card-meta">${meta}</div>
      <button class="ws-card-del" title="Remove workspace">&#x2715;</button>
    `;
    card.onclick = () => openWorkspace(ws);
    card.querySelector('.ws-card-del').onclick = (e) => {
      e.stopPropagation();
      deleteWorkspace(ws.id);
    };
    list.appendChild(card);
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

async function openWorkspace(ws) {
  ws.lastOpened = Date.now();
  await saveWorkspaces();
  sessionStorage.setItem('active-workspace', JSON.stringify(ws));
  window.location.href = 'editor.html';
}

async function deleteWorkspace(id) {
  workspaces = workspaces.filter(w => w.id !== id);
  await saveWorkspaces();
  renderWorkspaces();
}

/* ── New workspace modal ── */
function openWsModal() {
  pickedFolder = '';
  document.getElementById('ws-folder-input').value = '';
  document.getElementById('ws-name-input').value = '';
  document.getElementById('ws-modal').style.display = 'flex';
}
function closeWsModal() {
  document.getElementById('ws-modal').style.display = 'none';
}

document.getElementById('btn-new-workspace').onclick      = openWsModal;
document.getElementById('btn-new-workspace-side').onclick = openWsModal;

document.getElementById('btn-open-file').onclick = async () => {
  const filePath = await window.api.openFileDialog();
  if (!filePath) return;
  const parts = filePath.replace(/\//g, '\\').split('\\');
  const name   = parts.pop();
  const folder = parts.join('\\') || filePath;
  const ws = { id: '_file_' + Date.now(), name: parts[parts.length - 1] || name, folder, defaultFile: filePath, lastOpened: Date.now() };
  sessionStorage.setItem('active-workspace', JSON.stringify(ws));
  window.location.href = 'editor.html';
};

/* ── New File Modal (home context — no workspace yet) ── */
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

let _nfDest = '';
let _nfExt  = 'html';

function openNfModal() {
  _nfDest = '';
  _nfExt  = 'html';
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
  destEl.textContent = 'Choose a folder…';
  destEl.classList.remove('set');
  document.getElementById('nf-ext').textContent = '.html';
  document.getElementById('nf-name-input').value = '';
  document.getElementById('btn-nf-create').disabled = true;
  document.getElementById('nf-modal').style.display = 'flex';
  setTimeout(() => document.getElementById('nf-name-input').focus(), 80);
}
function closeNfModal() {
  document.getElementById('nf-modal').style.display = 'none';
}
async function commitNfCreate() {
  if (!_nfDest) return;
  const raw  = document.getElementById('nf-name-input').value.trim() || 'untitled';
  const name = raw.endsWith('.' + _nfExt) ? raw : raw + '.' + _nfExt;
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
  const folderName = _nfDest.replace(/\\/g, '/').split('/').filter(Boolean).pop() || 'workspace';
  const ws = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), name: folderName, folder: _nfDest, defaultFile: filePath, lastOpened: Date.now() };
  workspaces.push(ws);
  await saveWorkspaces();
  closeNfModal();
  sessionStorage.setItem('active-workspace', JSON.stringify(ws));
  window.location.href = 'editor.html';
}

document.getElementById('btn-home-new-file').onclick = openNfModal;
document.getElementById('btn-nf-close').onclick      = closeNfModal;
document.getElementById('btn-nf-cancel').onclick     = closeNfModal;
document.getElementById('btn-nf-create').onclick     = commitNfCreate;
document.getElementById('btn-nf-browse').onclick     = async () => {
  const f = await window.api.openFolderDialog();
  if (!f) return;
  _nfDest = f;
  const destEl = document.getElementById('nf-dest-path');
  destEl.textContent = f;
  destEl.classList.add('set');
  document.getElementById('btn-nf-create').disabled = false;
};
document.getElementById('nf-name-input').addEventListener('keydown', e => {
  if (e.key === 'Enter')  { e.preventDefault(); commitNfCreate(); }
  if (e.key === 'Escape') closeNfModal();
});
document.getElementById('btn-ws-close').onclick  = closeWsModal;
document.getElementById('btn-ws-cancel').onclick = closeWsModal;

document.getElementById('btn-ws-browse').onclick = async () => {
  const folder = await window.api.openFolderDialog();
  if (!folder) return;
  pickedFolder = folder;
  document.getElementById('ws-folder-input').value = folder;
  if (!document.getElementById('ws-name-input').value.trim()) {
    const guess = folder.replace(/\\/g, '/').split('/').filter(Boolean).pop() || 'workspace';
    document.getElementById('ws-name-input').value = guess;
  }
};

document.getElementById('btn-ws-create').onclick = async () => {
  const name = document.getElementById('ws-name-input').value.trim();
  if (!pickedFolder) { alert('Choose a folder first'); return; }
  if (!name) { alert('Enter a workspace name'); return; }
  const ws = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), name, folder: pickedFolder, defaultFile: '', lastOpened: 0 };
  workspaces.push(ws);
  await saveWorkspaces();
  closeWsModal();
  openWorkspace(ws);
};

/* ── Restore on launch ── */
async function maybeRestore() {
  const s = await window.api.getSettings();
  const mode = s.restoreOnLaunch || 'none';
  if (mode === 'none') return false;
  const res = await window.api.getWorkspaces();
  const wsList = res.exists ? res.data : [];
  if (!wsList.length) return false;
  let target = null;
  if (mode === 'last') {
    target = [...wsList].sort((a, b) => (b.lastOpened || 0) - (a.lastOpened || 0))[0];
  } else if (mode === 'specific' && s.restoreWorkspaceId) {
    target = wsList.find(w => w.id === s.restoreWorkspaceId) || null;
  }
  if (!target) return false;
  target.lastOpened = Date.now();
  await window.api.saveWorkspaces(wsList);
  sessionStorage.setItem('active-workspace', JSON.stringify(target));
  window.location.href = 'editor.html';
  return true;
}

/* ── Settings modal ── */
let _settingsSnap = null;

function setChip(ids, activeId) {
  ids.forEach(id => document.getElementById(id).classList.toggle('active', id === activeId));
}

function saveOnExitChip(s) {
  const v = s.saveOnExit || 'ask';
  setChip(['chip-save-ask','chip-save-always','chip-save-discard'],
    v === 'save' ? 'chip-save-always' : v === 'discard' ? 'chip-save-discard' : 'chip-save-ask');
}

async function openSettingsModal() {
  const s = await window.api.getSettings();
  _settingsSnap = { ...s };

  setChip(['chip-dark','chip-light'], (s.theme === 'light') ? 'chip-light' : 'chip-dark');
  saveOnExitChip(s);

  const restoreMap = { none:'chip-restore-none', last:'chip-restore-last', specific:'chip-restore-specific' };
  setChip(Object.values(restoreMap), restoreMap[s.restoreOnLaunch || 'none']);
  await populateSpecificDropdown(s.restoreOnLaunch === 'specific', s.restoreWorkspaceId);

  document.getElementById('settings-modal').style.display = 'flex';
}

async function populateSpecificDropdown(show, selectedId) {
  const row = document.getElementById('restore-specific-row');
  row.style.display = show ? '' : 'none';
  if (!show) return;
  const res = await window.api.getWorkspaces();
  const list = res.exists ? res.data : [];
  const sel = document.getElementById('restore-ws-select');
  sel.innerHTML = list.map(w =>
    `<option value="${w.id}"${w.id === selectedId ? ' selected' : ''}>${w.name.replace(/</g,'&lt;')}</option>`
  ).join('');
}

function closeSettingsModal(revert) {
  if (revert && _settingsSnap) {
    applyTheme(_settingsSnap.theme || 'dark');
  }
  document.getElementById('settings-modal').style.display = 'none';
}

document.getElementById('btn-settings').onclick       = openSettingsModal;
document.getElementById('btn-settings-close').onclick = () => closeSettingsModal(true);
document.getElementById('btn-settings-cancel').onclick = () => closeSettingsModal(true);
document.getElementById('btn-settings-save').onclick = async () => {
  const s = await window.api.getSettings();
  s.theme = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  const restore = ['none','last','specific'].find(v =>
    document.getElementById('chip-restore-' + v)?.classList.contains('active')) || 'none';
  s.restoreOnLaunch = restore;
  if (restore === 'specific') s.restoreWorkspaceId = document.getElementById('restore-ws-select').value;
  const saveExit = ['ask','always','discard'].find(v =>
    document.getElementById('chip-save-' + v)?.classList.contains('active')) || 'ask';
  s.saveOnExit = saveExit === 'always' ? 'save' : saveExit === 'discard' ? 'discard' : 'ask';
  await window.api.saveSettings(s);
  closeSettingsModal(false);
};

document.getElementById('chip-save-ask').onclick     = () => setChip(['chip-save-ask','chip-save-always','chip-save-discard'], 'chip-save-ask');
document.getElementById('chip-save-always').onclick  = () => setChip(['chip-save-ask','chip-save-always','chip-save-discard'], 'chip-save-always');
document.getElementById('chip-save-discard').onclick = () => setChip(['chip-save-ask','chip-save-always','chip-save-discard'], 'chip-save-discard');

document.getElementById('chip-dark').onclick  = () => { applyTheme('dark');  setChip(['chip-dark','chip-light'], 'chip-dark'); };
document.getElementById('chip-light').onclick = () => { applyTheme('light'); setChip(['chip-dark','chip-light'], 'chip-light'); };

['none','last','specific'].forEach(v => {
  document.getElementById('chip-restore-' + v).onclick = async () => {
    setChip(['chip-restore-none','chip-restore-last','chip-restore-specific'], 'chip-restore-' + v);
    await populateSpecificDropdown(v === 'specific', null);
  };
});

const SITE = 'https://htmledger.localhost314.com';
document.getElementById('link-website').onclick  = () => window.api.openExternal(SITE);
document.getElementById('link-source').onclick   = () => window.api.openExternal('https://github.com/localhost-314/HTMLedger');
document.getElementById('link-tos').onclick      = () => window.api.openExternal(SITE + '/terms');
document.getElementById('link-privacy').onclick  = () => window.api.openExternal(SITE + '/privacy');
document.getElementById('link-issue').onclick    = () => window.api.openExternal('https://github.com/localhost-314/HTMLedger/issues/new');
document.getElementById('link-known').onclick    = () => window.api.openExternal('https://github.com/localhost-314/HTMLedger/issues');
document.getElementById('link-contact').onclick  = () => window.api.openExternal(SITE + '/contactforlite');

// Home has no unsaved state — always allow close immediately
window.api.onCloseRequested(() => window.api.allowClose());

/* ── Init ── */
(async () => {
  await initTheme();
  if (await maybeRestore()) return;
  loadWorkspaces();
})();
