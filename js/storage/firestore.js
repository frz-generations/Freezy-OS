/**
 * js/storage/firestore.js
 * Purpose: All Firestore database operations. User settings, preferences,
 * suspension status. Primary settings storage backend.
 * Saves to both Firestore (cross-device) and localStorage (fast/offline fallback).
 */

(function () {
  'use strict';

  const LS_SETTINGS_KEY = 'frz_os_settings';

  // ─── Global osSettings object ─────────────────────────────────────────────
  window.osSettings = {
    brightness:        100,
    volume:            70,
    wallpaper:         '',
    dockPosition:      'bottom',
    lockPassword:      '',
    inactivityTimeout: 15,
    theme:             'dark-frz',
    iconTheme:         'default',
    iconMap:           {},
  };

  // ─── firestoreInit ────────────────────────────────────────────────────────
  /**
   * Initializes Firestore connection and starts suspension listener.
   */
  function firestoreInit() {
    try {
      const user = firebase.auth().currentUser;
      if (!user) return;
      firestoreListenSuspension(user.uid);
      console.log('[firestore] Initialized for user:', user.uid);
    } catch (e) {
      console.warn('[firestore] firestoreInit failed:', e);
    }
  }
  window.firestoreInit = firestoreInit;

  // ─── firestoreSaveSettings ────────────────────────────────────────────────
  /**
   * Saves osSettings to Firestore users/{uid} document.
   * @param {object} settings - Settings object to save
   */
  async function firestoreSaveSettings(settings) {
    try {
      const user = firebase.auth().currentUser;
      if (!user) return;
      const db = firebase.firestore();
      await db.collection('users').doc(user.uid).set(
        { osSettings: settings },
        { merge: true }
      );
    } catch (e) {
      console.warn('[firestore] firestoreSaveSettings failed — saved locally only:', e);
      if (typeof window.notify === 'function') {
        window.notify('warning', 'Settings Saved Locally', 'Could not sync to cloud. Will retry next session.');
      }
    }
  }
  window.firestoreSaveSettings = firestoreSaveSettings;

  // ─── firestoreLoadSettings ────────────────────────────────────────────────
  /**
   * Loads osSettings from Firestore. Falls back to localStorage on failure.
   * @returns {Promise<object>} - Settings object
   */
  async function firestoreLoadSettings() {
    try {
      const user = firebase.auth().currentUser;
      if (!user) throw new Error('No user');
      const db  = firebase.firestore();
      const doc = await db.collection('users').doc(user.uid).get();
      if (doc.exists && doc.data().osSettings) {
        return doc.data().osSettings;
      }
    } catch (e) {
      console.warn('[firestore] firestoreLoadSettings failed, using localStorage:', e);
    }
    // Fallback
    return loadFromLocalStorage();
  }
  window.firestoreLoadSettings = firestoreLoadSettings;

  // ─── firestoreUpdateUser ─────────────────────────────────────────────────
  /**
   * Updates specific fields on the user's Firestore document.
   * @param {object} data - Partial user document fields
   */
  async function firestoreUpdateUser(data) {
    try {
      const user = firebase.auth().currentUser;
      if (!user) return;
      const db = firebase.firestore();
      await db.collection('users').doc(user.uid).set(data, { merge: true });
    } catch (e) {
      console.warn('[firestore] firestoreUpdateUser failed:', e);
    }
  }
  window.firestoreUpdateUser = firestoreUpdateUser;

  // ─── firestoreCheckSuspension ─────────────────────────────────────────────
  /**
   * One-time check of suspension status from Firestore.
   * @param {string} uid
   * @returns {Promise<boolean>}
   */
  async function firestoreCheckSuspension(uid) {
    try {
      const db  = firebase.firestore();
      const doc = await db.collection('users').doc(uid).get();
      return doc.exists && doc.data().suspended === true;
    } catch (e) {
      console.warn('[firestore] firestoreCheckSuspension failed:', e);
      return false;
    }
  }
  window.firestoreCheckSuspension = firestoreCheckSuspension;

  // ─── firestoreListenSuspension ────────────────────────────────────────────
  /**
   * Sets up a real-time listener for the suspended field.
   * Immediately locks the OS if user gets suspended during session.
   * @param {string} uid
   */
  function firestoreListenSuspension(uid) {
    try {
      const db = firebase.firestore();
      db.collection('users').doc(uid).onSnapshot((doc) => {
        if (!doc.exists) return;
        if (doc.data().suspended === true) {
          firebase.auth().currentUser?.reload().then(() => {
            const u = firebase.auth().currentUser;
            if (u && typeof window.showSuspensionScreen === 'function') {
              window.showSuspensionScreen(u);
            }
          }).catch(e => console.warn('[firestore] Reload failed:', e));
        }
      }, (e) => {
        console.warn('[firestore] Suspension listener failed:', e);
      });
    } catch (e) {
      console.warn('[firestore] firestoreListenSuspension setup failed:', e);
    }
  }
  window.firestoreListenSuspension = firestoreListenSuspension;

  // ─── saveSettings (shorthand) ─────────────────────────────────────────────
  /**
   * Saves window.osSettings to both localStorage and Firestore.
   * localStorage is immediate; Firestore is async.
   */
  function saveSettings() {
    try {
      // 1. In-memory already current (window.osSettings)
      // 2. localStorage — immediate
      localStorage.setItem(LS_SETTINGS_KEY, JSON.stringify(window.osSettings));
      // 3. Firestore — async
      firestoreSaveSettings(window.osSettings);
    } catch (e) {
      console.warn('[firestore] saveSettings failed:', e);
    }
  }
  window.saveSettings = saveSettings;

  // ─── loadSettings (shorthand) ────────────────────────────────────────────
  /**
   * Loads settings from Firestore, falls back to localStorage.
   * Merges into window.osSettings and applies to system.
   */
  async function loadSettings() {
    let loaded = null;

    try {
      loaded = await firestoreLoadSettings();
    } catch (e) {
      loaded = loadFromLocalStorage();
    }

    if (loaded && typeof loaded === 'object') {
      window.osSettings = { ...window.osSettings, ...loaded };
    }

    applySettings();
  }
  window.loadSettings = loadSettings;

  // ─── loadFromLocalStorage (internal) ─────────────────────────────────────
  function loadFromLocalStorage() {
    try {
      const raw = localStorage.getItem(LS_SETTINGS_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('[firestore] localStorage parse failed:', e);
      return null;
    }
  }

  // ─── applySettings (internal) ─────────────────────────────────────────────
  // Applies loaded settings to all subsystems
  function applySettings() {
    const s = window.osSettings;
    try {
      if (typeof window.setBrightness      === 'function') window.setBrightness(s.brightness, true);
      if (typeof window.setVolume          === 'function') window.setVolume(s.volume, true);
      if (typeof window.setSleepTimeout    === 'function') window.setSleepTimeout(s.inactivityTimeout);
      if (s.wallpaper) {
        const desk = document.getElementById('desktop');
        if (desk) desk.style.backgroundImage = `url('${s.wallpaper}')`;
      }
      // Apply theme
      document.body.dataset.theme = s.theme || 'dark-frz';
    } catch (e) {
      console.warn('[firestore] applySettings error:', e);
    }
  }
})();
