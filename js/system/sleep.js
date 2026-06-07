/**
 * js/system/sleep.js
 * Purpose: Handle inactivity timeout and lock screen activation.
 * Track user activity. Auto-lock after configured time.
 * Also handle manual lock, and EXE sleep/shutdown via Electron.
 */

(function () {
  'use strict';

  let inactivityTimer    = null;
  let _sleepMinutes      = 15;     // default 15 minutes
  let _isLocked          = false;
  let _bootInProgress    = true;   // prevents lock during boot

  // Disable boot-lock-prevention after 10 seconds (covers full boot sequence)
  setTimeout(() => { _bootInProgress = false; }, 10000);

  // ─── Activity events that reset the timer ────────────────────────────────
  const ACTIVITY_EVENTS = ['mousemove','mousedown','keydown','click','touchstart','touchmove','wheel'];

  /**
   * Resets the inactivity timer. Called on any user activity.
   */
  function resetInactivity() {
    if (_isLocked) return;
    clearTimeout(inactivityTimer);
    if (_sleepMinutes > 0) {
      inactivityTimer = setTimeout(lockScreen, _sleepMinutes * 60 * 1000);
    }
  }
  window.resetInactivity = resetInactivity;

  ACTIVITY_EVENTS.forEach(ev =>
    document.addEventListener(ev, resetInactivity, { passive: true })
  );

  // ─── lockScreen ──────────────────────────────────────────────────────────
  /**
   * Activates the lock screen immediately.
   */
  function lockScreen() {
    if (_bootInProgress) return;

    _isLocked = true;
    clearTimeout(inactivityTimer);

    const lockEl = document.getElementById('lock-screen');
    if (lockEl) {
      lockEl.classList.add('visible');
      // Focus password input after animation
      setTimeout(() => {
        const passEl = document.getElementById('lock-pass');
        if (passEl) { passEl.value = ''; passEl.focus(); }
      }, 300);
    }

    // Close all popups when locking
    if (typeof window.closeAllPopups === 'function') window.closeAllPopups();
  }
  window.lockScreen = lockScreen;

  // ─── unlockByPass ────────────────────────────────────────────────────────
  /**
   * Attempts to unlock the screen using the value in #lock-pass.
   */
  function unlockByPass() {
    const passEl = document.getElementById('lock-pass');
    if (!passEl) return;

    const entered  = passEl.value;
    const password = window.osSettings?.lockPassword || '';

    if (!password || entered === password) {
      // Correct (or no password set)
      _isLocked = false;
      const lockEl = document.getElementById('lock-screen');
      if (lockEl) lockEl.classList.remove('visible');
      resetInactivity();
    } else {
      // Wrong password
      passEl.style.border = '2px solid #ff4444';
      passEl.value = '';
      setTimeout(() => { passEl.style.border = ''; }, 800);
      if (typeof window.notify === 'function') {
        window.notify('error', 'Wrong Password', 'Incorrect lock screen password.');
      }
    }
  }
  window.unlockByPass = unlockByPass;

  // ─── unlockCheck ─────────────────────────────────────────────────────────
  /**
   * Called on keydown in the lock screen password input.
   * Attempts unlock on Enter key.
   * @param {KeyboardEvent} event
   */
  function unlockCheck(event) {
    if (event.key === 'Enter') unlockByPass();
  }
  window.unlockCheck = unlockCheck;

  // ─── setSleepTimeout ─────────────────────────────────────────────────────
  /**
   * Updates the inactivity timeout duration.
   * @param {number} minutes - Minutes until auto-lock (0 = never, min 1)
   */
  function setSleepTimeout(minutes) {
    if (minutes !== 0 && minutes < 1) {
      console.warn('[sleep] Minimum timeout is 1 minute. Using 1.');
      minutes = 1;
    }
    _sleepMinutes = minutes;
    resetInactivity();
  }
  window.setSleepTimeout = setSleepTimeout;

  // ─── EXE: system sleep / shutdown ────────────────────────────────────────
  function systemSleep() {
    if (window.IS_ELECTRON && window.electron) {
      try { window.electron.ipcRenderer.send('system-sleep'); } catch (e) {
        console.warn('[sleep] Electron system-sleep IPC failed:', e);
      }
    } else {
      lockScreen(); // fallback for browser
    }
  }
  window.systemSleep = systemSleep;

  function systemShutdown() {
    if (window.IS_ELECTRON && window.electron) {
      try { window.electron.ipcRenderer.send('system-shutdown'); } catch (e) {
        console.warn('[sleep] Electron system-shutdown IPC failed:', e);
      }
    }
    // No browser fallback for shutdown
  }
  window.systemShutdown = systemShutdown;

  // ─── Sync settings on load ───────────────────────────────────────────────
  window.addEventListener('DOMContentLoaded', () => {
    try {
      const saved = JSON.parse(localStorage.getItem('frz_os_settings') || '{}');
      if (typeof saved.inactivityTimeout === 'number') {
        _sleepMinutes = saved.inactivityTimeout;
      }
    } catch (e) {
      console.warn('[sleep] Could not read saved sleep settings:', e);
    }
    resetInactivity();
  });
})();
