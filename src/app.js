/**
 * @author Luuxis
 * @license CC-BY-NC 4.0 - https://creativecommons.org/licenses/by-nc/4.0
 */

const { app, ipcMain, nativeTheme } = require('electron');
const { Microsoft } = require('minecraft-java-core');
const { autoUpdater } = require('electron-updater')

const path = require('path');
const fs = require('fs');

// Patch minecraft-java-core neoforge Maven URLs to include /releases/
try {
    const mCoreUtils = require('minecraft-java-core/build/utils/Index.js');
    const origLoader = mCoreUtils.loader;
    mCoreUtils.loader = function(type) {
        const res = origLoader(type);
        if (type === 'neoforge' && res) {
            res.legacyInstall = 'https://maven.neoforged.net/releases/net/neoforged/forge/${version}/forge-${version}-installer.jar';
            res.install = 'https://maven.neoforged.net/releases/net/neoforged/neoforge/${version}/neoforge-${version}-installer.jar';
        }
        return res;
    };
    console.log('[SATM Patch] Patched minecraft-java-core neoforge maven URLs successfully.');
} catch (e) {
    console.error('[SATM Patch] Failed to patch minecraft-java-core URLs:', e);
}

const UpdateWindow = require("./assets/js/windows/updateWindow.js");
const MainWindow = require("./assets/js/windows/mainWindow.js");

let dev = process.env.NODE_ENV === 'dev';

if (dev) {
    let appPath = path.resolve('./data/Launcher').replace(/\\/g, '/');
    let appdata = path.resolve('./data').replace(/\\/g, '/');
    if (!fs.existsSync(appPath)) fs.mkdirSync(appPath, { recursive: true });
    if (!fs.existsSync(appdata)) fs.mkdirSync(appdata, { recursive: true });
    app.setPath('userData', appPath);
    app.setPath('appData', appdata)
}

if (!app.requestSingleInstanceLock()) app.quit();
else app.whenReady().then(() => {
    if (dev) return MainWindow.createWindow()
    UpdateWindow.createWindow()
});

ipcMain.on('main-window-open', () => MainWindow.createWindow())
ipcMain.on('main-window-dev-tools', () => MainWindow.getWindow().webContents.openDevTools({ mode: 'detach' }))
ipcMain.on('main-window-dev-tools-close', () => MainWindow.getWindow().webContents.closeDevTools())
ipcMain.on('main-window-close', () => MainWindow.destroyWindow())
ipcMain.on('main-window-reload', () => MainWindow.getWindow().reload())
ipcMain.on('main-window-progress', (event, options) => MainWindow.getWindow().setProgressBar(options.progress / options.size))
ipcMain.on('main-window-progress-reset', () => MainWindow.getWindow().setProgressBar(-1))
ipcMain.on('main-window-progress-load', () => MainWindow.getWindow().setProgressBar(2))
ipcMain.on('main-window-minimize', () => MainWindow.getWindow().minimize())

ipcMain.on('update-window-close', () => UpdateWindow.destroyWindow())
ipcMain.on('update-window-dev-tools', () => UpdateWindow.getWindow().webContents.openDevTools({ mode: 'detach' }))
ipcMain.on('update-window-progress', (event, options) => UpdateWindow.getWindow().setProgressBar(options.progress / options.size))
ipcMain.on('update-window-progress-reset', () => UpdateWindow.getWindow().setProgressBar(-1))
ipcMain.on('update-window-progress-load', () => UpdateWindow.getWindow().setProgressBar(2))

ipcMain.handle('path-user-data', () => app.getPath('userData'))
ipcMain.handle('appData', e => app.getPath('appData'))

ipcMain.on('main-window-maximize', () => {
    if (MainWindow.getWindow().isMaximized()) {
        MainWindow.getWindow().unmaximize();
    } else {
        MainWindow.getWindow().maximize();
    }
})

ipcMain.on('main-window-hide', () => MainWindow.getWindow().hide())
ipcMain.on('main-window-show', () => MainWindow.getWindow().show())

ipcMain.handle('Microsoft-window', async (_, client_id) => {
    try {
        console.log('[MS Auth Main] Starting Microsoft authentication...');
        console.log('[MS Auth Main] Client ID received from config:', client_id);
        
        // FORCE the use of the default Microsoft Xbox Live client ID.
        // We ALWAYS use null to trigger the built-in default Xbox Live client ID ('00000000402b5328')
        // since the library's Electron GUI handler is hardcoded to listen only for the
        // https://login.live.com/oauth20_desktop.srf redirect URI, which only matches this client ID.
        console.log('[MS Auth Main] Forcing use of default Xbox Live client ID (ignoring config client_id)');
        const msAuth = new Microsoft(null);
        console.log('[MS Auth Main] Microsoft instance created with default client ID');
        
        const result = await msAuth.getAuth();
        console.log('[MS Auth Main] getAuth completed');
        console.log('[MS Auth Main] Result type:', typeof result);
        console.log('[MS Auth Main] Result keys:', result ? Object.keys(result) : 'null/undefined');
        console.log('[MS Auth Main] Full result:', JSON.stringify(result, null, 2));
        
        // Vérifier si le résultat contient une erreur
        if (result && result.error) {
            console.error('[MS Auth Main] Microsoft API Error:', result.error);
            console.error('[MS Auth Main] Error Type:', result.errorType);
            console.error('[MS Auth Main] Error Path:', result.path);
            
            // Gestion spécifique des erreurs
            if (result.error === 'TOO_MANY_REQUESTS') {
                throw new Error('Trop de tentatives de connexion. Veuillez attendre quelques minutes avant de réessayer.');
            } else if (result.error === 'INVALID_CREDENTIALS') {
                throw new Error('Identifiants Microsoft invalides.');
            } else if (result.error === 'NO_PROFILE') {
                throw new Error('Aucun profil Minecraft associé à ce compte Microsoft.');
            } else {
                throw new Error(`Erreur Microsoft: ${result.error}`);
            }
        }
        
        // Vérifier si le résultat contient les propriétés attendues
        if (result && typeof result === 'object' && !result.error) {
            console.log('[MS Auth Main] Checking result properties:');
            console.log('  - name:', result.name);
            console.log('  - uuid:', result.uuid);
            console.log('  - access_token:', result.access_token ? 'Present' : 'Missing');
            console.log('  - meta:', result.meta);
            
            // Vérifier que toutes les propriétés essentielles sont présentes
            if (!result.name || !result.uuid || !result.access_token) {
                throw new Error('Réponse Microsoft incomplète - propriétés manquantes');
            }
        }
        
        return result;
        
    } catch (error) {
        console.error('[MS Auth Main] Error during authentication:', error);
        console.error('[MS Auth Main] Error stack:', error.stack);
        throw error;
    }
})

ipcMain.handle('is-dark-theme', (_, theme) => {
    if (theme === 'dark') return true
    if (theme === 'light') return false
    return nativeTheme.shouldUseDarkColors;
})

app.on('window-all-closed', () => app.quit());

autoUpdater.autoDownload = false;

ipcMain.handle('update-app', async () => {
    if (!app.isPackaged) {
        const updateWindow = UpdateWindow.getWindow();
        if (updateWindow) updateWindow.webContents.send('update-not-available');
        return { skipped: true };
    }
    return await new Promise(async (resolve, reject) => {
        autoUpdater.checkForUpdates().then(res => {
            resolve(res);
        }).catch(error => {
            reject({
                error: true,
                message: error
            })
        })
    })
})

autoUpdater.on('update-available', () => {
    const updateWindow = UpdateWindow.getWindow();
    if (updateWindow) updateWindow.webContents.send('updateAvailable');
});

ipcMain.on('start-update', () => {
    autoUpdater.downloadUpdate();
})

autoUpdater.on('update-not-available', () => {
    const updateWindow = UpdateWindow.getWindow();
    if (updateWindow) updateWindow.webContents.send('update-not-available');
});

autoUpdater.on('update-downloaded', () => {
    autoUpdater.quitAndInstall();
});

autoUpdater.on('download-progress', (progress) => {
    const updateWindow = UpdateWindow.getWindow();
    if (updateWindow) updateWindow.webContents.send('download-progress', progress);
})

autoUpdater.on('error', (err) => {
    const updateWindow = UpdateWindow.getWindow();
    if (updateWindow) updateWindow.webContents.send('error', err);
});