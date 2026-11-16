const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('deskbuddyHost', {
  ready: () => ipcRenderer.send('overlay:ready'),
  onSettings: cb => ipcRenderer.on('settings', (e, s) => cb(s)),
  onRemind: cb => ipcRenderer.on('remind', (e, r) => cb(r)),
  action: (action, p) => ipcRenderer.send('overlay:action', action, p),
  setIgnore: ignore => ipcRenderer.send('overlay:ignore', ignore),
  charmMoved: pos => ipcRenderer.send('overlay:charm-moved', pos)
});
