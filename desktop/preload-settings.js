/* Gives the shared settings page the same storage API it uses inside the browser extension. */
const { contextBridge, ipcRenderer } = require('electron');
const area = name => ({
  get: key => ipcRenderer.invoke('store:get', name, key).then(v => ({ [key]: v })),
  set: obj => ipcRenderer.invoke('store:set', name, obj)
});
contextBridge.exposeInMainWorld('browser', {
  storage: { sync: area('sync'), local: area('local') },
  runtime: { sendMessage: msg => ipcRenderer.invoke('runtime:message', msg) }
});
