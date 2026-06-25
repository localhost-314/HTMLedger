const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Window
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close:    () => ipcRenderer.send('window-close'),

  // Dialogs
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
  openFileDialog:   () => ipcRenderer.invoke('open-file-dialog'),
  saveFileDialog:   (name) => ipcRenderer.invoke('save-file-dialog', name),

  // File I/O
  readFile:            (p) => ipcRenderer.invoke('read-file', p),
  writeFile:           (p, c) => ipcRenderer.invoke('write-file', p, c),
  deleteFile:          (p) => ipcRenderer.invoke('delete-file', p),
  renameFile:          (o, n) => ipcRenderer.invoke('rename-file', o, n),
  listHtmlFiles:       (folder) => ipcRenderer.invoke('list-html-files', folder),
  listWorkspaceFiles:  (folder) => ipcRenderer.invoke('list-workspace-files', folder),
  openInExplorer:      (p) => ipcRenderer.invoke('open-in-explorer', p),

  // Recents
  getRecentFolders:  () => ipcRenderer.invoke('get-recent-folders'),
  saveRecentFolders: (f) => ipcRenderer.invoke('save-recent-folders', f),
  getRecentFiles:    () => ipcRenderer.invoke('get-recent-files'),
  saveRecentFiles:   (f) => ipcRenderer.invoke('save-recent-files', f),

  // File watcher
  watchFile:     (p) => ipcRenderer.invoke('watch-file', p),
  unwatchFile:   (p) => ipcRenderer.invoke('unwatch-file', p),
  onFileChanged: (cb) => ipcRenderer.on('file-changed', (_e, p) => cb(p)),

  // Folder search
  searchInFolder: (folder, query) => ipcRenderer.invoke('search-in-folder', folder, query),

  // Settings
  getSettings:  () => ipcRenderer.invoke('get-settings'),
  saveSettings: (s) => ipcRenderer.invoke('save-settings', s),

  // Auto-updater
  onUpdateDownloaded: (cb) => ipcRenderer.on('update-downloaded', cb),
  installUpdate: () => ipcRenderer.send('install-update'),
});
