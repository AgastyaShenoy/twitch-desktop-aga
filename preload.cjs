const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    readFollows: () => ipcRenderer.invoke('read-follows'),
    saveFollows: (follows) => ipcRenderer.invoke('save-follows', follows),
    twitchGql: (query, variables) => ipcRenderer.invoke('twitch-gql', query, variables),
    log: (...args) => ipcRenderer.invoke('log', ...args)
});
