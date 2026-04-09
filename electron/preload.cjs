const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('novaMindDesktop', {
  isDesktop: true,
  platform: process.platform,
  selectDirectory: () => ipcRenderer.invoke('nova-desktop:select-directory'),
  readDirectory: (targetPath) => ipcRenderer.invoke('nova-desktop:read-directory', targetPath),
  readFile: (targetPath) => ipcRenderer.invoke('nova-desktop:read-file', targetPath),
  writeFile: (targetPath, content) => ipcRenderer.invoke('nova-desktop:write-file', targetPath, content),
  statPath: (targetPath) => ipcRenderer.invoke('nova-desktop:stat-path', targetPath),
  onSelectedDirectory: (listener) => {
    const wrapped = (_event, payload) => listener(payload);
    ipcRenderer.on('nova-desktop:selected-directory', wrapped);
    return () => ipcRenderer.removeListener('nova-desktop:selected-directory', wrapped);
  },
});
