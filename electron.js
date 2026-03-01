const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const isElectronDev = process.env.ELECTRON_DEV === 'true';
const buildPath = path.join(__dirname, '../build');
const hasBuild = fs.existsSync(buildPath) && fs.existsSync(path.join(buildPath, 'index.html'));
const isProduction = hasBuild && !isElectronDev;

let mainWindow;

function createWindow() {
  const landingPath = path.join(__dirname, '../build/index.html');
  const devUrl = 'http://localhost:3000/';
  
  console.log('isProduction:', isProduction, 'isElectronDev:', isElectronDev);
  console.log('Loading URL:', isProduction ? landingPath : devUrl);
  
  mainWindow = new BrowserWindow({
    width: 500,
    height: 1120,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      devTools: true,
    },
    title: 'GLPal - Health Tracker',
    icon: path.join(__dirname, 'favicon.ico'),
    show: false
  });

  if (isProduction) {
    mainWindow.loadFile(landingPath);
  } else {
    mainWindow.loadURL(devUrl);
  }

  // Handle page reload in dev mode - reload the dev server URL
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
    // Retry loading in dev mode
    if (!isProduction) {
      mainWindow.loadURL(devUrl);
    }
  });

  // Handle renderer process crash
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('Renderer process gone:', details.reason);
    if (!isProduction) {
      mainWindow.loadURL(devUrl);
    }
  });

  // Handle page reload in dev mode
  mainWindow.webContents.on('reload', () => {
    if (!isProduction) {
      mainWindow.loadURL(devUrl);
    }
  });

  // Handle navigation to app (mainly for production)
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isProduction && (url.includes('/app/') || url.endsWith('/app'))) {
      event.preventDefault();
      const appPath = path.join(__dirname, '../build/app/index.html');
      console.log('Navigating to app:', appPath);
      mainWindow.loadFile(appPath);
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isProduction && (url.includes('/app/') || url.endsWith('/app'))) {
      const appPath = path.join(__dirname, '../build/app/index.html');
      mainWindow.loadFile(appPath);
    }
    return { action: 'deny' };
  });

  mainWindow.webContents.on('console-message', (event, level, message) => {
    console.log('Console:', message);
  });

  // Hide scrollbars completely
  mainWindow.webContents.insertCSS(`
    html, body, * {
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
    }
    html::-webkit-scrollbar, body::-webkit-scrollbar, *::-webkit-scrollbar {
      display: none !important;
      width: 0 !important;
      height: 0 !important;
    }
    body.modal-open {
      overflow: hidden !important;
    }
  `);

  mainWindow.webContents.once('did-finish-load', () => {
    mainWindow.show();
    mainWindow.webContents.openDevTools();
  });

  // Handle blank page issues in dev mode
  mainWindow.webContents.on('did-stop-loading', () => {
    // Check if the page is blank
    mainWindow.webContents.executeJavaScript('document.body.innerHTML').then((content) => {
      if (!content || content.trim() === '') {
        console.log('Page appears blank, reloading...');
        if (!isProduction) {
          mainWindow.loadURL(devUrl);
        }
      }
    }).catch(() => {
      // Ignore errors
    });
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
