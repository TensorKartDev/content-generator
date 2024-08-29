const { app, BrowserWindow } = require('electron');
const path = require('path');
const url = require('url');

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // if you have a preload script
      contextIsolation: true,
      enableRemoteModule: false,
    }
  });

  // Load the React app from the build folder
  win.loadURL(url.format({
    pathname: path.join(__dirname, '../build/index.html'), // Adjust path if necessary
    protocol: 'file:',
    slashes: true
  }));
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
