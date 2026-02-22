const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const isElectronDev = process.env.ELECTRON_DEV === 'true';
const buildPath = path.join(__dirname, '../build');
const hasBuild = fs.existsSync(buildPath) && fs.existsSync(path.join(buildPath, 'index.html'));
const isProduction = hasBuild && !isElectronDev;

let mainWindow;

function createWindow() {
  const indexPath = path.join(__dirname, '../build/index.html');
  const fileUrl = `file://${indexPath}`;
  const devUrl = 'http://localhost:3000';
  
  console.log('isProduction:', isProduction, 'isElectronDev:', isElectronDev);
  console.log('Loading URL:', isProduction ? fileUrl : devUrl);
  
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
    icon: path.join(__dirname, '../public/favicon.ico'),
    show: false
  });

  mainWindow.loadURL(
    isProduction
      ? fileUrl
      : 'http://localhost:3000'
  );

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription);
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