const { contextBridge, ipcRenderer } = require('electron/renderer');

contextBridge.exposeInMainWorld('electronAPI', {
  getTwig: (tpl, data) => ipcRenderer.sendSync('twig', tpl, data),
  getData: () => ipcRenderer.sendSync('getData'),
  controll: (status) => ipcRenderer.send('controll', status),
  debug: (data) => ipcRenderer.send('debug', data),
  setRange: (date_range) => ipcRenderer.send('setRange', date_range),
  addDay: (data) => ipcRenderer.send('addDay', data),
  editDay: (data) => ipcRenderer.send('editDay', data),
  setBalance: (data) => ipcRenderer.send('setBalance', data),
  clearBase: () => ipcRenderer.send('clearBase'),
})