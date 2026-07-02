const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Window
  minimize:        () => ipcRenderer.send('window-minimize'),
  maximize:        () => ipcRenderer.send('window-maximize'),
  close:           () => ipcRenderer.send('window-close'),
  allowClose:      () => ipcRenderer.send('allow-close'),
  onCloseRequested:(fn) => ipcRenderer.on('close-requested', fn),

  // Dialogs
  openFolderDialog: () => ipcRenderer.invoke('open-folder-dialog'),
  openFileDialog:   () => ipcRenderer.invoke('open-file-dialog'),
  saveFileDialog:   (name) => ipcRenderer.invoke('save-file-dialog', name),

  // File I/O
  readFile:       (p) => ipcRenderer.invoke('read-file', p),
  writeFile:      (p, c) => ipcRenderer.invoke('write-file', p, c),
  deleteFile:     (p) => ipcRenderer.invoke('delete-file', p),
  renameFile:     (o, n) => ipcRenderer.invoke('rename-file', o, n),
  createFile:     (p) => ipcRenderer.invoke('create-file', p),
  readFileBinary: (p) => ipcRenderer.invoke('read-file-binary', p),
  openInExplorer: (p) => ipcRenderer.invoke('open-in-explorer', p),
  openExternal:   (url) => ipcRenderer.invoke('open-external', url),

  // Directory tree (file sidebar)
  listDirTree: (folder) => ipcRenderer.invoke('list-dir-tree', folder),

  // Directory watcher (sidebar auto-refresh)
  startDirWatch:    (folder) => ipcRenderer.invoke('start-dir-watch', folder),
  stopDirWatch:     ()       => ipcRenderer.invoke('stop-dir-watch'),
  onSidebarChanged: (fn)     => ipcRenderer.on('sidebar-changed', fn),

  // Workspaces
  getWorkspaces:  ()  => ipcRenderer.invoke('get-workspaces'),
  saveWorkspaces: (w) => ipcRenderer.invoke('save-workspaces', w),

  // Settings
  getSettings:  () => ipcRenderer.invoke('get-settings'),
  saveSettings: (s) => ipcRenderer.invoke('save-settings', s),
});
