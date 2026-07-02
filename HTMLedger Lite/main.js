const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

Menu.setApplicationMenu(null); // prevent Electron menu from swallowing Ctrl+Z/Y/etc.

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 780,
    minWidth: 800,
    minHeight: 560,
    frame: false,
    backgroundColor: '#54566B',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'assets', 'icon.ico')
  });

  mainWindow.loadFile('renderer/home.html');
  setupCloseIntercept();
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- Window controls ---
ipcMain.on('window-minimize', () => mainWindow.minimize());
ipcMain.on('window-maximize', () => {
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
});

let _allowClose = false;
function setupCloseIntercept() {
  mainWindow.on('close', (e) => {
    if (!_allowClose) {
      e.preventDefault();
      mainWindow.webContents.send('close-requested');
    }
  });
}
ipcMain.on('allow-close',  () => { _allowClose = true;  mainWindow.close(); });
ipcMain.on('window-close', () => { mainWindow.webContents.send('close-requested'); });

// --- File system ---
const SKIP_DIRS  = new Set(['node_modules', '.git', '.vscode', 'dist', 'build', '.next', 'out', 'coverage', '__pycache__']);
const COMPAT_EXT = ['html', 'htm', 'css', 'js', 'jsx', 'ts', 'tsx', 'json', 'xml', 'svg', 'md', 'png', 'jpg', 'jpeg', 'gif', 'webp'];
const TEXT_RE    = /\.(html|htm|css|js|jsx|ts|tsx|json|xml|svg|md)$/i;
const IMAGE_RE   = /\.(png|jpg|jpeg|gif|webp|ico|bmp)$/i;
const COMPAT_RE  = /\.(html|htm|css|js|jsx|ts|tsx|json|xml|svg|md|png|jpg|jpeg|gif|webp)$/i;

ipcMain.handle('open-folder-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
  return result.canceled ? null : result.filePaths[0];
});

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
  { name: 'Images',               extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp'] },
];

ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: FILE_FILTERS,
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
  try { return { success: true, content: fs.readFileSync(filePath, 'utf8') }; }
  catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('write-file', async (event, filePath, content) => {
  try { fs.writeFileSync(filePath, content, 'utf8'); return { success: true }; }
  catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('delete-file', async (event, filePath) => {
  try { fs.unlinkSync(filePath); return { success: true }; }
  catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('rename-file', async (event, oldPath, newPath) => {
  try { fs.renameSync(oldPath, newPath); return { success: true }; }
  catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('create-file', async (event, filePath) => {
  try { fs.writeFileSync(filePath, '', { flag: 'wx' }); return { success: true }; }
  catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('read-file-binary', async (event, filePath) => {
  try {
    const data = fs.readFileSync(filePath);
    const ext  = path.extname(filePath).toLowerCase().slice(1);
    const mime = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', ico: 'image/x-icon', bmp: 'image/bmp' }[ext] || 'application/octet-stream';
    return { success: true, base64: data.toString('base64'), mime };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('open-in-explorer', async (event, filePath) => { shell.showItemInFolder(filePath); });
ipcMain.handle('open-external', async (event, url) => { shell.openExternal(url); });

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

// --- Directory watcher (sidebar auto-refresh) ---
const dirWatchers = [];
let sidebarDebounce = null;

ipcMain.handle('start-dir-watch', (event, folder) => {
  dirWatchers.forEach(w => { try { w.close(); } catch {} });
  dirWatchers.length = 0;
  if (!folder || !fs.existsSync(folder)) return;
  try {
    const w = fs.watch(folder, { recursive: true }, () => {
      clearTimeout(sidebarDebounce);
      sidebarDebounce = setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send('sidebar-changed');
      }, 600);
    });
    dirWatchers.push(w);
  } catch { /* folder may be inaccessible */ }
});

ipcMain.handle('stop-dir-watch', () => {
  dirWatchers.forEach(w => { try { w.close(); } catch {} });
  dirWatchers.length = 0;
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
ipcMain.handle('get-settings', async () => {
  try { return JSON.parse(fs.readFileSync(path.join(app.getPath('userData'), 'settings.json'), 'utf8')); }
  catch { return {}; }
});
ipcMain.handle('save-settings', async (event, s) => {
  fs.writeFileSync(path.join(app.getPath('userData'), 'settings.json'), JSON.stringify(s, null, 2), 'utf8');
  return { success: true };
});
