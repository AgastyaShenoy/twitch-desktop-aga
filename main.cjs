const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');

const isDev = process.env.NODE_ENV === 'development';

// Setup auto-updater logger
autoUpdater.logger = require('electron-log');
if (autoUpdater.logger) {
    autoUpdater.logger.transports.file.level = 'info';
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#0e0e10',
            symbolColor: '#efeff1',
            height: 32
        },
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
            webviewTag: true // allow inner webviews 
        },
        backgroundColor: '#0e0e10'
    });

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools({ mode: 'detach' });
    } else {
        mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
        mainWindow.webContents.openDevTools({ mode: 'detach' });
        // Check for updates on startup if packaged
        setTimeout(() => {
            autoUpdater.checkForUpdatesAndNotify();
        }, 5000);
    }

    updateWindow = mainWindow;
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// IPC Handlers for Settings
const configPath = path.join(app.getPath('userData'), 'twitch-follows.json');

ipcMain.handle('read-follows', () => {
    try {
        if (fs.existsSync(configPath)) {
            const data = fs.readFileSync(configPath, 'utf-8');
            return JSON.parse(data);
        }
        return [];
    } catch (err) {
        console.error('Error reading follows:', err);
        return [];
    }
});

ipcMain.handle('save-follows', (event, follows) => {
    try {
        fs.writeFileSync(configPath, JSON.stringify(follows, null, 2));
        return true;
    } catch (err) {
        console.error('Error saving follows:', err);
        return false;
    }
});

// Twitch GQL Fetcher
// Using the public client ID known to work with gql.twitch.tv
const TWITCH_CLIENT_ID = 'kimne78kx3ncx6brgo4mv6wki5h1ko';

ipcMain.handle('twitch-gql', async (event, query, variables) => {
    try {
        console.log('[MAIN] twitch-gql called with variables:', variables);
        const response = await fetch('https://gql.twitch.tv/gql', {
            method: 'POST',
            headers: {
                'Client-Id': TWITCH_CLIENT_ID,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify([
                {
                    query: query,
                    variables: variables,
                }
            ]),
        });
        const result = await response.json();
        console.log('[MAIN] twitch-gql success, errors:', result[0]?.errors);
        return result;
    } catch (err) {
        console.error('[MAIN] Twitch GQL Error:', err);
        return null;
    }
});
ipcMain.handle('log', (event, ...args) => {
    console.log('[RENDERER LOG]', ...args);
});

// --- Auto Updater Logic ---
let updateWindow;

ipcMain.handle('app-version', () => {
    return app.getVersion();
});

ipcMain.handle('check-for-updates', () => {
    if (isDev) {
        console.log('[Updater] Running in dev mode, skipping update check.');
        return;
    }
    autoUpdater.checkForUpdatesAndNotify();
});

ipcMain.handle('install-update', () => {
    autoUpdater.quitAndInstall();
});

// Forward updater events to the renderer
autoUpdater.on('checking-for-update', () => {
    if (updateWindow) updateWindow.webContents.send('updater-event', 'checking');
});
autoUpdater.on('update-available', (info) => {
    if (updateWindow) updateWindow.webContents.send('updater-event', 'available', info);
});
autoUpdater.on('update-not-available', (info) => {
    if (updateWindow) updateWindow.webContents.send('updater-event', 'not-available', info);
});
autoUpdater.on('error', (err) => {
    if (updateWindow) updateWindow.webContents.send('updater-event', 'error', err);
});
autoUpdater.on('download-progress', (progressObj) => {
    if (updateWindow) updateWindow.webContents.send('updater-event', 'progress', progressObj);
});
autoUpdater.on('update-downloaded', (info) => {
    if (updateWindow) updateWindow.webContents.send('updater-event', 'downloaded', info);
});
