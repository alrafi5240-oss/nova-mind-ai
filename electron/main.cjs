const { app, BrowserWindow, Menu, dialog, ipcMain, shell } = require('electron');
const fs = require('fs/promises');
const path = require('path');

const isDevelopment = Boolean(process.env.NOVA_MIND_START_URL);

function getStartUrl() {
  if (isDevelopment) {
    return process.env.NOVA_MIND_START_URL;
  }

  return `file://${path.join(__dirname, '..', 'dist', 'index.html')}`;
}

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1480,
    height: 960,
    minWidth: 1180,
    minHeight: 760,
    title: 'NOVA MIND AI',
    backgroundColor: '#0f172a',
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadURL(getStartUrl());

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDevelopment) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

function createMenu() {
  const template = [
    {
      label: 'NOVA MIND AI',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Workspace',
      submenu: [
        {
          label: 'Open Folder…',
          click: async (menuItem, browserWindow) => {
            const result = await dialog.showOpenDialog(browserWindow, {
              properties: ['openDirectory'],
            });

            if (!result.canceled && result.filePaths[0]) {
              browserWindow.webContents.send('nova-desktop:selected-directory', result.filePaths[0]);
            }
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

async function readDirectoryTree(targetPath) {
  const entries = await fs.readdir(targetPath, { withFileTypes: true });
  return Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(targetPath, entry.name);
      return {
        name: entry.name,
        path: entryPath,
        isDirectory: entry.isDirectory(),
      };
    })
  );
}

ipcMain.handle('nova-desktop:select-directory', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory'],
  });

  if (result.canceled || !result.filePaths[0]) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle('nova-desktop:read-directory', async (event, targetPath) => {
  return readDirectoryTree(targetPath);
});

ipcMain.handle('nova-desktop:read-file', async (event, targetPath) => {
  return fs.readFile(targetPath, 'utf8');
});

ipcMain.handle('nova-desktop:write-file', async (event, targetPath, content) => {
  await fs.writeFile(targetPath, content, 'utf8');
  return true;
});

ipcMain.handle('nova-desktop:stat-path', async (event, targetPath) => {
  const stats = await fs.stat(targetPath);
  return {
    path: targetPath,
    isDirectory: stats.isDirectory(),
    isFile: stats.isFile(),
    size: stats.size,
    mtimeMs: stats.mtimeMs,
  };
});

app.whenReady().then(() => {
  createMenu();
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
