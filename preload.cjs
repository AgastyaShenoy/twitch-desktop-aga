const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    readFollows: () => ipcRenderer.invoke('read-follows'),
    saveFollows: (follows) => ipcRenderer.invoke('save-follows', follows),
    twitchGql: (query, variables) => ipcRenderer.invoke('twitch-gql', query, variables),
    log: (...args) => ipcRenderer.invoke('log', ...args),

    // Auto Updater
    getAppVersion: () => ipcRenderer.invoke('app-version'),
    checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
    installUpdate: () => ipcRenderer.invoke('install-update'),
    onUpdaterEvent: (callback) => {
        ipcRenderer.on('updater-event', (_event, status, info) => callback(status, info));
        // Return a cleanup function
        return () => ipcRenderer.removeAllListeners('updater-event');
    }
});
