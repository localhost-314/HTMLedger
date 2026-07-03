const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

const watchers    = new Map();
const watchTimers = new Map();
const savingFiles = new Set();
const savingTimers = new Map();

Menu.setApplicationMenu(null); // prevent Electron menu from swallowing Ctrl+Z/Y/etc.
app.commandLine.appendSwitch('disable-gpu-cache');

let mainWindow;

// File path passed via "Open with" or double-click (argv[1] in packaged app)
function getArgvFile() {
  const args = process.argv.slice(app.isPackaged ? 1 : 2);
  const f = args.find(a => !a.startsWith('-') && /\.(html?|css|jsx?|tsx?|json|xml|svg|md)$/i.test(a));
  return f || null;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'assets', 'icon.ico')
  });

  mainWindow.loadFile('renderer/home.html');

  mainWindow.webContents.once('did-finish-load', () => {
    // "Open with" / double-click file launch
    const argFile = getArgvFile();
    if (argFile) mainWindow.webContents.send('open-file-argv', argFile);

    // Small delay so renderer scripts finish registering IPC listeners
    setTimeout(() => checkShowChangelog(), 800);
  });
}

function checkShowChangelog() {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json');
    const settings = fs.existsSync(settingsPath)
      ? JSON.parse(fs.readFileSync(settingsPath, 'utf8'))
      : {};
    const current  = app.getVersion();
    const lastSeen = settings.lastSeenVersion;
    settings.lastSeenVersion = current;
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2), 'utf8');
    if (lastSeen !== current && settings.showReleaseNotes !== false) {
      mainWindow.webContents.send('show-changelog', current);
    }
  } catch (err) {
    console.error('changelog check error:', err);
  }
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
  autoUpdater.checkForUpdates().catch(() => {});
});

autoUpdater.on('update-downloaded', () => {
  if (mainWindow && !mainWindow.isDestroyed())
    mainWindow.webContents.send('update-downloaded');
});

ipcMain.on('install-update', () => autoUpdater.quitAndInstall());

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- Window controls ---
ipcMain.on('window-minimize', () => mainWindow.minimize());
ipcMain.on('window-maximize', () => {
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
});
ipcMain.on('window-close', () => mainWindow.close());

// --- File system ---
ipcMain.handle('open-folder-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory']
  });
  return result.canceled ? null : result.filePaths[0];
});

const COMPAT_EXT  = ['html','htm','css','js','jsx','ts','tsx','json','xml','svg','md','png','jpg','jpeg','gif','webp'];
const COMPAT_RE   = /\.(html|htm|css|js|jsx|ts|tsx|json|xml|svg|md|png|jpg|jpeg|gif|webp)$/i;
const TEXT_RE     = /\.(html|htm|css|js|jsx|ts|tsx|json|xml|svg|md)$/i; // text-only (no images)

const FILE_FILTERS = [
  { name: 'All Compatible Files (*.*)', extensions: ['*'] },
  { name: 'HTML (.html)',         extensions: ['html'] },
  { name: 'HTM (.htm)',           extensions: ['htm'] },
  { name: 'CSS (.css)',           extensions: ['css'] },
  { name: 'JavaScript (.js)',     extensions: ['js'] },
  { name: 'JSX (.jsx)',           extensions: ['jsx'] },
  { name: 'TypeScript (.ts)',     extensions: ['ts'] },
  { name: 'TSX (.tsx)',           extensions: ['tsx'] },
  { name: 'JSON (.json)',         extensions: ['json'] },
  { name: 'XML (.xml)',           extensions: ['xml'] },
  { name: 'SVG (.svg)',           extensions: ['svg'] },
  { name: 'Markdown (.md)',       extensions: ['md'] },
  { name: 'Images',               extensions: ['png','jpg','jpeg','gif','webp'] },
];

ipcMain.handle('open-file-dialog', async () => {
  const openFilters = FILE_FILTERS.map((f, i) =>
    i === 0 ? { ...f, extensions: COMPAT_EXT } : f
  );
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: openFilters,
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('save-file-dialog', async (event, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName || 'untitled.html',
    filters: FILE_FILTERS,
  });
  return result.canceled ? null : result.filePath;
});

ipcMain.handle('read-file', async (event, filePath) => {
  try {
    return { success: true, content: fs.readFileSync(filePath, 'utf8') };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('write-file', async (event, filePath, content) => {
  try {
    savingFiles.add(filePath);
    clearTimeout(savingTimers.get(filePath));
    savingTimers.set(filePath, setTimeout(() => {
      savingFiles.delete(filePath);
      savingTimers.delete(filePath);
    }, 500));
    fs.writeFileSync(filePath, content, 'utf8');
    return { success: true };
  } catch (e) {
    savingFiles.delete(filePath);
    savingTimers.delete(filePath);
    return { success: false, error: e.message };
  }
});

ipcMain.handle('list-html-files', async (event, folderPath) => {
  try {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    const folders = entries
      .filter(e => e.isDirectory() && !e.name.startsWith('.') && !SKIP_DIRS.has(e.name))
      .map(e => ({
        name: e.name,
        path: path.join(folderPath, e.name),
        type: 'folder',
        modified: '',
        size: 0,
        preview: ''
      }));
    const isImage = n => /\.(png|jpg|jpeg|gif|webp)$/i.test(n);
    const files = entries
      .filter(e => e.isFile() && COMPAT_RE.test(e.name))
      .map(e => {
        const full = path.join(folderPath, e.name);
        const stat = fs.statSync(full);
        let preview = '';
        if (!isImage(e.name)) { try { preview = fs.readFileSync(full, 'utf8').slice(0, 2000); } catch {} }
        return { name: e.name, path: full, type: 'file', modified: stat.mtime.toISOString(), size: stat.size, preview, isImage: isImage(e.name) };
      });
    return { success: true, files: [...folders, ...files] };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('get-recent-folders', async () => {
  const configPath = path.join(app.getPath('userData'), 'recent.json');
  try {
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch {
    return [];
  }
});

ipcMain.handle('save-recent-folders', async (event, folders) => {
  const configPath = path.join(app.getPath('userData'), 'recent.json');
  fs.writeFileSync(configPath, JSON.stringify(folders), 'utf8');
});

ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    fs.unlinkSync(filePath);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('open-in-explorer', async (event, filePath) => {
  shell.showItemInFolder(filePath);
});

ipcMain.handle('open-external', async (event, url) => {
  shell.openExternal(url);
});

ipcMain.handle('rename-file', async (event, oldPath, newPath) => {
  try {
    fs.renameSync(oldPath, newPath);
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

// --- File watcher ---
ipcMain.handle('watch-file', async (event, filePath) => {
  if (watchers.has(filePath)) return { success: true };
  try {
    const watcher = fs.watch(filePath, () => {
      if (savingFiles.has(filePath)) {
        return; // suppress; savingTimers will clean up savingFiles
      }
      clearTimeout(watchTimers.get(filePath));
      watchTimers.set(filePath, setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed())
          mainWindow.webContents.send('file-changed', filePath);
      }, 300));
    });
    watcher.on('error', () => { watchers.delete(filePath); watchTimers.delete(filePath); });
    watchers.set(filePath, watcher);
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('unwatch-file', async (event, filePath) => {
  const w = watchers.get(filePath);
  if (w) { w.close(); watchers.delete(filePath); clearTimeout(watchTimers.get(filePath)); watchTimers.delete(filePath); }
  return { success: true };
});

// --- Folder search (recursive) ---
const SKIP_DIRS = new Set(['node_modules', '.git', '.vscode', 'dist', 'build', '.next', 'out', 'coverage', '__pycache__']);
ipcMain.handle('search-in-folder', async (event, folderPath, query) => {
  if (!query || query.trim().length < 2) return { success: true, results: [] };
  const lq = query.toLowerCase();
  const results = [];
  function searchDir(dir) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        if (e.name.startsWith('.')) continue;
        const fp = path.join(dir, e.name);
        if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) searchDir(fp); continue; }
        if (!TEXT_RE.test(e.name)) continue;
        try {
          const lines = fs.readFileSync(fp, 'utf8').split('\n');
          const matches = [];
          lines.forEach((line, i) => {
            if (line.toLowerCase().includes(lq))
              matches.push({ line: i + 1, text: line.trim().slice(0, 120) });
          });
          if (matches.length) results.push({ name: e.name, path: fp, matches: matches.slice(0, 8) });
        } catch {}
      }
    } catch {}
  }
  try { searchDir(folderPath); return { success: true, results }; }
  catch (e) { return { success: false, error: e.message }; }
});

// --- Directory tree for file sidebar ---
ipcMain.handle('list-dir-tree', async (event, folderPath) => {
  function buildTree(dir, depth) {
    if (depth > 8) return [];
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      const folders = entries.filter(e => e.isDirectory() && !e.name.startsWith('.') && !SKIP_DIRS.has(e.name))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(e => ({ name: e.name, path: path.join(dir, e.name), type: 'folder', children: buildTree(path.join(dir, e.name), depth + 1) }));
      const files = entries.filter(e => e.isFile() && (TEXT_RE.test(e.name) || IMAGE_RE.test(e.name)))
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(e => ({ name: e.name, path: path.join(dir, e.name), type: 'file' }));
      return [...folders, ...files];
    } catch { return []; }
  }
  try { return { success: true, tree: buildTree(folderPath, 0) }; }
  catch (e) { return { success: false, error: e.message }; }
});

// --- Terminal / command runner ---
const { spawn } = require('child_process');
const runningProcs = new Map();

// --- Directory watcher (sidebar auto-refresh) ---
const dirWatchers = [];
let   sidebarDebounce = null;

ipcMain.handle('start-dir-watch', (event, folders) => {
  // Close any existing watchers first
  dirWatchers.forEach(w => { try { w.close(); } catch {} });
  dirWatchers.length = 0;

  folders.forEach(folder => {
    if (!folder || !fs.existsSync(folder)) return;
    try {
      const w = fs.watch(folder, { recursive: true }, () => {
        clearTimeout(sidebarDebounce);
        sidebarDebounce = setTimeout(() => {
          if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('sidebar-changed');
          }
        }, 600);
      });
      dirWatchers.push(w);
    } catch { /* folder may be inaccessible */ }
  });
});

ipcMain.handle('stop-dir-watch', () => {
  dirWatchers.forEach(w => { try { w.close(); } catch {} });
  dirWatchers.length = 0;
});

ipcMain.handle('resolve-cd', async (event, cwd, arg) => {
  let target;
  if (!arg || arg === '~') {
    target = cwd; // bare `cd` or `cd ~` → stay / go to workspace root (caller handles ~)
    return { ok: true, path: target };
  }
  try {
    target = path.resolve(cwd, arg);
    const stat = fs.statSync(target);
    if (!stat.isDirectory()) return { ok: false, error: 'Not a directory' };
    return { ok: true, path: target };
  } catch {
    return { ok: false, error: `The system cannot find the path specified: "${arg}"` };
  }
});

ipcMain.handle('run-command', async (event, command, cwd) => {
  const id = Date.now().toString();
  const proc = spawn('cmd.exe', ['/c', command], { cwd: cwd || process.cwd(), windowsHide: true });
  runningProcs.set(id, proc);
  proc.stdout.on('data', d => { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('cmd-output', { id, data: d.toString() }); });
  proc.stderr.on('data', d => { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('cmd-output', { id, data: d.toString(), isErr: true }); });
  proc.on('close', code => { runningProcs.delete(id); if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('cmd-done', { id, code }); });
  return { id };
});
ipcMain.handle('kill-command', async (event, id) => {
  const proc = runningProcs.get(id);
  if (proc) { try { proc.kill(); } catch {} runningProcs.delete(id); }
});

// --- Backup ---
const { spawnSync } = require('child_process');

ipcMain.handle('pick-backup-folder', async () => {
  const result = await dialog.showOpenDialog({
    title: 'Choose backup destination',
    properties: ['openDirectory', 'createDirectory'],
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('create-backup', async (event, { folders, destDir, zipName }) => {
  try {
    fs.mkdirSync(destDir, { recursive: true });
    // Sanitize zip name — strip characters illegal in filenames
    const safeName = zipName.replace(/[<>:"/\\|?*]/g, '-').trim() || 'backup';
    const zipPath  = path.join(destDir, safeName + '.zip');
    // Remove existing zip so -Force doesn't merge (Compress-Archive merges by default)
    try { fs.unlinkSync(zipPath); } catch {}
    // Build PowerShell Compress-Archive command
    const srcArray = folders.map(f => `'${f.replace(/'/g, "''")}'`).join(',');
    const dest     = zipPath.replace(/'/g, "''");
    const psCmd    = `Compress-Archive -Path @(${srcArray}) -DestinationPath '${dest}'`;
    const result   = spawnSync('powershell.exe', ['-NonInteractive', '-Command', psCmd], {
      timeout: 120000,
      windowsHide: true,
    });
    if (result.status !== 0) {
      const err = (result.stderr?.toString() || result.stdout?.toString() || 'Unknown error').trim();
      return { ok: false, error: err };
    }
    return { ok: true, path: zipPath };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});

// --- Deploy configs (per workspace) ---
ipcMain.handle('get-deploy-configs', async () => {
  const f = path.join(app.getPath('userData'), 'deploy-configs.json');
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return {}; }
});
ipcMain.handle('save-deploy-configs', async (event, configs) => {
  const f = path.join(app.getPath('userData'), 'deploy-configs.json');
  fs.writeFileSync(f, JSON.stringify(configs, null, 2), 'utf8');
});

// --- Binary file read (images) ---
const IMAGE_RE = /\.(png|jpg|jpeg|gif|webp|ico|bmp)$/i;
ipcMain.handle('read-file-binary', async (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath);
    const ext  = path.extname(filePath).toLowerCase().slice(1);
    const mime = { png:'image/png', jpg:'image/jpeg', jpeg:'image/jpeg', gif:'image/gif', webp:'image/webp', ico:'image/x-icon', bmp:'image/bmp' }[ext] || 'application/octet-stream';
    return { success: true, base64: data.toString('base64'), mime };
  } catch (e) { return { success: false, error: e.message }; }
});

// --- Workspaces ---
ipcMain.handle('get-workspaces', async () => {
  const f = path.join(app.getPath('userData'), 'workspaces.json');
  try { return { exists: true, data: JSON.parse(fs.readFileSync(f, 'utf8')) }; }
  catch { return { exists: false, data: [] }; }
});
ipcMain.handle('save-workspaces', async (event, workspaces) => {
  const f = path.join(app.getPath('userData'), 'workspaces.json');
  fs.writeFileSync(f, JSON.stringify(workspaces, null, 2), 'utf8');
  return { success: true };
});

// --- Settings ---
ipcMain.handle('get-app-version', () => app.getVersion());

ipcMain.handle('get-settings', async () => {
  try { return JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'settings.json'), 'utf8')); }
  catch { return {}; }
});
ipcMain.handle('save-settings', async (event, s) => {
  fs.writeFileSync(path.join(app.getPath('userData'), 'settings.json'), JSON.stringify(s, null, 2), 'utf8');
  return { success: true };
});

// --- Recent files ---
ipcMain.handle('get-recent-files', async () => {
  try { return JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'recent-files.json'), 'utf8')); }
  catch { return []; }
});
ipcMain.handle('save-recent-files', async (event, files) => {
  fs.writeFileSync(path.join(app.getPath('userData'), 'recent-files.json'), JSON.stringify(files), 'utf8');
});

ipcMain.handle('list-workspace-files', async (event, folderPath) => {
  try {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    const files = entries
      .filter(e => e.isFile() && COMPAT_RE.test(e.name))
      .map(e => ({ name: e.name, path: path.join(folderPath, e.name) }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return { success: true, files };
  } catch (e) {
    return { success: false, error: e.message };
  }
});
