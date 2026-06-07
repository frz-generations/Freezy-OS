/**
 * js/system/permissions.js
 * Purpose: Manage OS permission toggles. Request browser permissions.
 * Save permission state. Check permissions before features that need them.
 * Stored in localStorage only — no Firestore needed.
 */

(function () {
  'use strict';

  const LS_KEY = 'freezy_permissions';

  // ─── Default permissions ──────────────────────────────────────────────────
  const DEFAULT_PERMISSIONS = {
    location:      true,
    notifications: true,
    camera:        true,
    audio:         true,
    storage:       true,
    system:        true,
  };

  let _permissions = { ...DEFAULT_PERMISSIONS };

  // ─── loadPermissions ─────────────────────────────────────────────────────
  /**
   * Loads saved permissions from localStorage. Falls back to defaults.
   */
  function loadPermissions() {
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || 'null');
      if (saved && typeof saved === 'object') {
        _permissions = { ...DEFAULT_PERMISSIONS, ...saved };
      }
    } catch (e) {
      console.warn('[permissions] Could not load permissions:', e);
    }
  }
  window.loadPermissions = loadPermissions;

  // ─── savePermissions ─────────────────────────────────────────────────────
  /**
   * Saves the given permissions object to localStorage.
   * @param {object} prefs - Partial or full permissions object
   */
  function savePermissions(prefs) {
    try {
      _permissions = { ..._permissions, ...prefs };
      localStorage.setItem(LS_KEY, JSON.stringify(_permissions));
    } catch (e) {
      console.warn('[permissions] Could not save permissions:', e);
    }
  }
  window.savePermissions = savePermissions;

  // ─── getAllPermissions ────────────────────────────────────────────────────
  /**
   * Returns the full permissions object.
   * @returns {object}
   */
  function getAllPermissions() {
    return { ..._permissions };
  }
  window.getAllPermissions = getAllPermissions;

  // ─── checkPermission ─────────────────────────────────────────────────────
  /**
   * Returns whether a named permission is granted.
   * @param {string} name - Permission name
   * @returns {boolean}
   */
  function checkPermission(name) {
    return _permissions[name] === true;
  }
  window.checkPermission = checkPermission;

  // ─── requestPermission ───────────────────────────────────────────────────
  /**
   * Requests a browser-level permission if needed, then updates state.
   * @param {string} name - Permission name
   * @returns {Promise<boolean>} - Resolves to true if granted
   */
  async function requestPermission(name) {
    let granted = false;

    try {
      switch (name) {
        case 'location':
          if ('geolocation' in navigator) {
            await new Promise((res, rej) =>
              navigator.geolocation.getCurrentPosition(
                () => res(true),
                (err) => rej(err),
                { timeout: 5000 }
              )
            );
            granted = true;
          }
          break;

        case 'notifications':
          if ('Notification' in window) {
            const result = await Notification.requestPermission();
            granted = result === 'granted';
          }
          break;

        case 'camera':
          if (navigator.mediaDevices?.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(t => t.stop()); // immediately release
            granted = true;
          }
          break;

        case 'audio':
          if (navigator.mediaDevices?.getUserMedia) {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(t => t.stop());
            granted = true;
          }
          break;

        case 'storage':
        case 'system':
          // These are logical toggles — always grant when requested
          granted = true;
          break;

        default:
          console.warn('[permissions] Unknown permission:', name);
      }
    } catch (e) {
      console.warn(`[permissions] Request for "${name}" denied or failed:`, e);
      granted = false;
    }

    // Update saved state
    const update = {};
    update[name] = granted;
    savePermissions(update);

    if (!granted && typeof window.notify === 'function') {
      window.notify('warning', 'Permission Denied',
        `${name.charAt(0).toUpperCase() + name.slice(1)} permission was not granted. Enable it in Settings → Permissions.`
      );
    }

    return granted;
  }
  window.requestPermission = requestPermission;

  // ─── initPermissions ─────────────────────────────────────────────────────
  /**
   * Loads saved permissions on OS start.
   */
  function initPermissions() {
    loadPermissions();
    console.log('[permissions] Initialized');
  }
  window.initPermissions = initPermissions;
})();
