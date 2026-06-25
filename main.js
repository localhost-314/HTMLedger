const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');
const fs = require('fs');

const watchers    = new Map();
const watchTimers = new Map();

Menu.setApplicationMenu(null); // prevent Electron menu from swallowing Ctrl+Z/Y/etc.

let mainWindow;

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

ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Web Files', extensions: ['html', 'htm', 'xml', 'css', 'js'] },
      { name: 'HTML Files', extensions: ['html', 'htm'] },
      { name: 'XML Files', extensions: ['xml'] },
      { name: 'CSS Files', extensions: ['css'] },
      { name: 'JavaScript Files', extensions: ['js'] }
    ]
  });
  return result.canceled ? null : result.filePaths[0];
});

ipcMain.handle('save-file-dialog', async (event, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName || 'untitled.html',
    filters: [
      { name: 'Web Files', extensions: ['html', 'htm', 'xml', 'css', 'js'] },
      { name: 'HTML Files', extensions: ['html', 'htm'] },
      { name: 'XML Files', extensions: ['xml'] },
      { name: 'CSS Files', extensions: ['css'] },
      { name: 'JavaScript Files', extensions: ['js'] }
    ]
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
    fs.writeFileSync(filePath, content, 'utf8');
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
});

ipcMain.handle('list-html-files', async (event, folderPath) => {
  try {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    const files = entries
      .filter(e => e.isFile() && /\.(html|htm|xml|css|js)$/i.test(e.name))
      .map(e => {
        const full = path.join(folderPath, e.name);
        const stat = fs.statSync(full);
        const content = fs.readFileSync(full, 'utf8');
        return {
          name: e.name,
          path: full,
          modified: stat.mtime.toISOString(),
          size: stat.size,
          preview: content.slice(0, 2000)
        };
      });
    return { success: true, files };
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

// --- Folder search ---
ipcMain.handle('search-in-folder', async (event, folderPath, query) => {
  if (!query || query.trim().length < 2) return { success: true, results: [] };
  const lq = query.toLowerCase();
  const results = [];
  try {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isFile() || !/\.(html|htm|xml|css|js)$/i.test(e.name)) continue;
      const fp = path.join(folderPath, e.name);
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
    return { success: true, results };
  } catch (e) { return { success: false, error: e.message }; }
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
      .filter(e => e.isFile() && /\.(html|htm|xml|css|js)$/i.test(e.name))
      .map(e => ({ name: e.name, path: path.join(folderPath, e.name) }))
      .sort((a, b) => a.name.localeCompare(b.name));
    return { success: true, files };
  } catch (e) {
    return { success: false, error: e.message };
  }
});
