// ============================================================
// FREEZY-OS ELECTRON PRELOAD SCRIPT
// FRZ Generations © 2026
// ============================================================
// This script runs in a privileged context before os.html loads
// It safely exposes IPC functions to the renderer via contextBridge
//
// SECURITY MODEL:
// - contextIsolation: true — renderer cannot access Node.js directly
// - Only explicitly exposed functions are available to os.html
// - window.electron.ipcRenderer is the bridge
//
// HOW os.html USES THIS:
// In js/system/volume.js:
//   if (window.IS_ELECTRON && window.electron) {
//     window.electron.ipcRenderer.send('set-volume', value);
//   }
// ============================================================

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {

    // Send a message to main process (one-way)
    send: (channel, data) => {
      // Whitelist of allowed channels
      // ONLY these channels can be sent from renderer
      const allowedChannels = [
        'set-volume',
        'set-brightness',
        'system-sleep',
        'system-shutdown',
        'system-lock',
        'toggle-fullscreen',
        'close-app',
      ];
      if (allowedChannels.includes(channel)) {
        ipcRenderer.send(channel, data);
      } else {
        console.warn('Freezy-OS: Blocked IPC channel:', channel);
      }
    },

    // Send and receive a reply from main process (two-way)
    invoke: async (channel, data) => {
      const allowedChannels = [
        'get-platform',
      ];
      if (allowedChannels.includes(channel)) {
        return await ipcRenderer.invoke(channel, data);
      }
      console.warn('Freezy-OS: Blocked IPC invoke:', channel);
      return null;
    },

    // Listen for messages from main process
    on: (channel, callback) => {
      const allowedChannels = [
        'suspension-alert',  // Main tells renderer: this account is suspended
        'force-logout',      // Main tells renderer: force logout
      ];
      if (allowedChannels.includes(channel)) {
        ipcRenderer.on(channel, (event, ...args) => callback(...args));
      }
    },

    // Remove a listener
    removeListener: (channel, callback) => {
      ipcRenderer.removeListener(channel, callback);
    },
  },

  // Expose platform info synchronously
  platform: process.platform,    // 'win32' | 'darwin' | 'linux'
  isElectron: true,
});
