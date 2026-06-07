// ============================================================
// FREEZY-OS ELECTRON MAIN PROCESS
// FRZ Generations © 2026
// ============================================================
// This file runs in Node.js (not in the browser)
// It creates the OS window and handles system-level operations
//
// BROWSER vs EXE differences handled here:
// - Volume: system audio via node packages
// - Brightness: system display API
// - Sleep: OS sleep command
// - Shutdown: OS shutdown command
// - All system commands require user permission granted on first launch
//
// TO BUILD THE EXE:
// npm install electron electron-builder --save-dev
// npm run build:win  (Windows .exe)
// npm run build:mac  (Mac .dmg)
// npm run build:linux (.AppImage)
// ============================================================

const { app, BrowserWindow, ipcMain, screen, powerSaveBlocker } = require('electron');
const path = require('path');

let mainWindow;
let powerBlockerId = null;

// ============================================================
// CREATE MAIN WINDOW
// ============================================================
function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: width,
    height: height,
    minWidth: 800,
    minHeight: 600,
    frame: false,              // No native window frame — OS has its own
    titleBarStyle: 'hidden',   // Hide native title bar
    backgroundColor: '#020408',// FRZ dark background while loading
    icon: path.join(__dirname, '../assets/icons/apps/freezy-os.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,  // Security — never enable this
      contextIsolation: true,  // Security — always keep true
      webSecurity: true,       // Security — keep true
      allowRunningInsecureContent: false,
    },
    show: false,               // Don't show until ready
  });

  // Load the OS
  mainWindow.loadFile('os.html');

  // Show window when ready to avoid white flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Maximize on start
    mainWindow.maximize();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
    if (powerBlockerId !== null) {
      powerSaveBlocker.stop(powerBlockerId);
    }
  });

  // Open DevTools only in development
  // REMOVE THIS LINE before packaging for release
  // mainWindow.webContents.openDevTools();
}

// ============================================================
// APP LIFECYCLE
// ============================================================
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ============================================================
// IPC HANDLERS — System controls from renderer
// These are called by js/system/volume.js and brightness.js
// when IS_ELECTRON is true
// ============================================================

// VOLUME CONTROL
// BROWSER: Web Audio API gainNode
// EXE: system volume via this IPC handler
ipcMain.on('set-volume', (event, value) => {
  // value: 0-100
  // Platform-specific implementation:
  // Windows: use PowerShell nircmd or Windows Audio API
  // Mac: use AppleScript
  // Linux: use amixer
  // For now: log and implement per platform
  console.log('Set system volume:', value);
  // TODO: implement platform-specific volume control
  // Example Windows: require('child_process').exec(`nircmd.exe setsysvolume ${value * 655.35}`)
});

// BRIGHTNESS CONTROL
// BROWSER: CSS rgba overlay on #brightness-overlay
// EXE: system brightness via this IPC handler
ipcMain.on('set-brightness', (event, value) => {
  // value: 10-100
  console.log('Set system brightness:', value);
  // TODO: implement platform-specific brightness
  // Requires: electron-screen-brightness or similar package
});

// SLEEP — EXE ONLY
ipcMain.on('system-sleep', (event) => {
  // Suspend system to sleep
  const { powerMonitor } = require('electron');
  // Windows: require('child_process').exec('rundll32.exe powrprof.dll,SetSuspendState 0,1,0')
  // Mac: require('child_process').exec('pmset sleepnow')
  // Linux: require('child_process').exec('systemctl suspend')
  console.log('System sleep requested');
});

// SHUTDOWN — EXE ONLY
ipcMain.on('system-shutdown', (event) => {
  // Shutdown system
  // Windows: require('child_process').exec('shutdown /s /t 0')
  // Mac: require('child_process').exec('sudo shutdown -h now')
  // Linux: require('child_process').exec('sudo shutdown -h now')
  console.log('System shutdown requested');
  app.quit();
});

// LOCK SCREEN — EXE ONLY
ipcMain.on('system-lock', (event) => {
  // Lock workstation
  // Windows: require('child_process').exec('rundll32.exe user32.dll,LockWorkStation')
  // Mac: require('child_process').exec('/System/Library/CoreServices/Menu\\ Extras/User.menu/Contents/Resources/CGSession -suspend')
  console.log('Lock screen requested');
});

// FULLSCREEN TOGGLE
ipcMain.on('toggle-fullscreen', (event) => {
  if (mainWindow) {
    mainWindow.setFullScreen(!mainWindow.isFullScreen());
  }
});

// CLOSE APP (from OS logout)
ipcMain.on('close-app', (event) => {
  app.quit();
});

// GET PLATFORM INFO
ipcMain.handle('get-platform', () => {
  return {
    platform: process.platform,  // 'win32' | 'darwin' | 'linux'
    version: process.getSystemVersion(),
    isElectron: true
  };
});
