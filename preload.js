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

  // Binary files (images)
  readFileBinary: (p) => ipcRenderer.invoke('read-file-binary', p),

  // Recents
  getRecentFolders:  () => ipcRenderer.invoke('get-recent-folders'),
  saveRecentFolders: (f) => ipcRenderer.invoke('save-recent-folders', f),
  getRecentFiles:    () => ipcRenderer.invoke('get-recent-files'),
  saveRecentFiles:   (f) => ipcRenderer.invoke('save-recent-files', f),

  // File watcher
  watchFile:     (p) => ipcRenderer.invoke('watch-file', p),
  unwatchFile:   (p) => ipcRenderer.invoke('unwatch-file', p),
  onFileChanged: (cb) => ipcRenderer.on('file-changed', (_e, p) => cb(p)),

  // Folder search (recursive)
  searchInFolder: (folder, query) => ipcRenderer.invoke('search-in-folder', folder, query),

  // Directory tree (for file tree sidebar)
  listDirTree: (folder) => ipcRenderer.invoke('list-dir-tree', folder),

  // Settings
  getSettings:  () => ipcRenderer.invoke('get-settings'),
  saveSettings: (s) => ipcRenderer.invoke('save-settings', s),

  // Auto-updater
  onUpdateDownloaded: (cb) => ipcRenderer.on('update-downloaded', cb),
  installUpdate: () => ipcRenderer.send('install-update'),

  // "Open with" / double-click file launch
  onOpenFileArgv: (cb) => ipcRenderer.on('open-file-argv', (_e, p) => cb(p)),

  // App version + release notes
  getAppVersion:    ()       => ipcRenderer.invoke('get-app-version'),
  onShowChangelog:  (cb)     => ipcRenderer.on('show-changelog', (_e, v) => cb(v)),

  // Shell
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // Terminal / command runner
  runCommand:  (command, cwd) => ipcRenderer.invoke('run-command', command, cwd),
  killCommand: (id) => ipcRenderer.invoke('kill-command', id),
  onCmdOutput: (cb) => ipcRenderer.on('cmd-output', (_e, data) => cb(data)),
  onCmdDone:   (cb) => ipcRenderer.on('cmd-done',   (_e, data) => cb(data)),

  // Directory watcher
  startDirWatch:    (folders) => ipcRenderer.invoke('start-dir-watch', folders),
  stopDirWatch:     ()        => ipcRenderer.invoke('stop-dir-watch'),
  onSidebarChanged: (fn)      => ipcRenderer.on('sidebar-changed', fn),

  // Terminal helpers
  resolveCd: (cwd, arg) => ipcRenderer.invoke('resolve-cd', cwd, arg),

  // Backup
  pickBackupFolder: ()            => ipcRenderer.invoke('pick-backup-folder'),
  createBackup:     (opts)        => ipcRenderer.invoke('create-backup', opts),

  // Deploy configs (per workspace)
  getDeployConfigs:  ()        => ipcRenderer.invoke('get-deploy-configs'),
  saveDeployConfigs: (configs) => ipcRenderer.invoke('save-deploy-configs', configs),

  // Workspaces
  getWorkspaces:  ()  => ipcRenderer.invoke('get-workspaces'),
  saveWorkspaces: (w) => ipcRenderer.invoke('save-workspaces', w),
});
