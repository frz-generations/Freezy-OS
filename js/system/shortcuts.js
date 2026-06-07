/**
 * js/system/shortcuts.js
 * Purpose: Handle all keyboard shortcuts. Block DevTools shortcuts.
 * Implement OS-level shortcuts. Block right-click context menu globally.
 */

(function () {
  'use strict';

  let devtoolsAttempts = 0;
  let devtoolsOpen     = false;
  let devtoolsCheckInterval = null;

  // ─── DevTools: key blocking ───────────────────────────────────────────────
  const BLOCKED_KEYS = new Set(['F12']);
  const BLOCKED_COMBOS = [
    { ctrl: true,  shift: true,  key: 'I' },
    { ctrl: true,  shift: true,  key: 'J' },
    { ctrl: true,  shift: true,  key: 'C' },
    { ctrl: true,  shift: false, key: 'U' },
    { ctrl: true,  shift: false, key: 'S' },
  ];

  function isDevToolsCombo(e) {
    if (BLOCKED_KEYS.has(e.key)) return true;
    return BLOCKED_COMBOS.some(c =>
      (c.ctrl  === e.ctrlKey  || c.ctrl  === undefined) &&
      (c.shift === e.shiftKey || c.shift === undefined) &&
      c.key.toLowerCase() === e.key.toLowerCase()
    );
  }

  function showDevToolsWarning() {
    const popup = document.getElementById('devtools-warning');
    if (popup) {
      popup.classList.add('visible');
      setTimeout(() => popup.classList.remove('visible'), 4000);
    } else if (typeof window.notify === 'function') {
      window.notify('warning', 'Access Denied', 'Developer tools are not permitted in Freezy-OS.');
    }
  }

  function handleDevToolsAttempt() {
    devtoolsAttempts++;
    showDevToolsWarning();
    if (devtoolsAttempts >= 2) {
      try {
        if (typeof window.appsScriptLog === 'function') {
          window.appsScriptLog({
            action:    'devtools_violation',
            attempts:  devtoolsAttempts,
            userAgent: navigator.userAgent,
          });
        }
      } catch (e) {
        console.warn('[shortcuts] DevTools log failed:', e);
      }
    }
  }

  // ─── DevTools: window size detection ────────────────────────────────────
  function startDevToolsDetection() {
    devtoolsCheckInterval = setInterval(() => {
      const widthDiff  = window.outerWidth  - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      const isOpen     = widthDiff > 160 || heightDiff > 160;

      if (isOpen && !devtoolsOpen) {
        devtoolsOpen = true;
        handleDevToolsAttempt();
      } else if (!isOpen && devtoolsOpen) {
        devtoolsOpen = false;
      }
    }, 1000);
  }

  // ─── OS Shortcuts ────────────────────────────────────────────────────────
  function handleOSShortcut(e) {
    const ctrl  = e.ctrlKey;
    const shift = e.shiftKey;
    const meta  = e.metaKey;
    const key   = e.key;

    // Win/Meta → toggle app drawer
    if ((key === 'Meta' || key === 'OS') && !ctrl && !shift) {
      e.preventDefault();
      if (typeof window.toggleDrawer === 'function') window.toggleDrawer();
      return;
    }

    // Ctrl+D → minimize all windows
    if (ctrl && !shift && key === 'd') {
      e.preventDefault();
      if (typeof window.minimizeAll === 'function') window.minimizeAll();
      return;
    }

    // Ctrl+W → close focused window
    if (ctrl && !shift && key === 'w') {
      if (!isTypingTarget(e.target)) {
        e.preventDefault();
        if (window.focusedWindowId && typeof window.closeWindow === 'function') {
          window.closeWindow(window.focusedWindowId);
        }
      }
      return;
    }

    // Ctrl+Shift+M → open Music Player
    if (ctrl && shift && key === 'M') {
      e.preventDefault();
      if (typeof window.openApp === 'function') window.openApp('music');
      return;
    }

    // Ctrl+Shift+F → open File Manager
    if (ctrl && shift && key === 'F') {
      e.preventDefault();
      if (typeof window.openApp === 'function') window.openApp('files');
      return;
    }

    // Ctrl+Shift+S → open Settings
    if (ctrl && shift && key === 'S') {
      e.preventDefault();
      if (typeof window.openApp === 'function') window.openApp('settings');
      return;
    }

    // Ctrl+Shift+T → open Browser
    if (ctrl && shift && key === 'T') {
      e.preventDefault();
      if (typeof window.openApp === 'function') window.openApp('browser');
      return;
    }

    // Ctrl+Shift+N → open Notification center
    if (ctrl && shift && key === 'N') {
      e.preventDefault();
      if (typeof window.toggleNotifCenter === 'function') window.toggleNotifCenter();
      return;
    }

    // F11 → toggle maximize focused window
    if (key === 'F11') {
      e.preventDefault();
      if (window.focusedWindowId && typeof window.toggleMaximize === 'function') {
        window.toggleMaximize(window.focusedWindowId);
      }
      return;
    }

    // Win+L or Ctrl+L → lock screen
    if ((meta && key === 'l') || (ctrl && !shift && key === 'l')) {
      e.preventDefault();
      if (typeof window.lockScreen === 'function') window.lockScreen();
      return;
    }

    // Escape → close app drawer if open
    if (key === 'Escape') {
      if (typeof window.toggleDrawer === 'function') {
        const drawer = document.getElementById('app-drawer');
        if (drawer && drawer.classList.contains('open')) {
          window.toggleDrawer();
        }
      }
      return;
    }

    // Alt+Tab → cycle through open windows
    if (e.altKey && key === 'Tab') {
      e.preventDefault();
      if (typeof window._cycleWindows === 'function') window._cycleWindows();
      return;
    }
  }

  // ─── Typing target check ─────────────────────────────────────────────────
  // Don't block Ctrl+A/C/V/X/Z or Ctrl+W inside text inputs
  function isTypingTarget(el) {
    if (!el) return false;
    const tag = el.tagName?.toLowerCase();
    return tag === 'input' || tag === 'textarea' || el.isContentEditable;
  }

  // ─── Context menu blocking ────────────────────────────────────────────────
  function initContextMenuBlock() {
    document.addEventListener('contextmenu', (e) => {
      // Allow on desktop and desk-icons (handled by desktop.js)
      if (
        e.target.id === 'desktop' ||
        e.target.id === 'desktop-icons' ||
        e.target.closest('.desk-icon')
      ) return;
      e.preventDefault();
    });
  }

  // ─── initShortcuts (entry point) ─────────────────────────────────────────
  /**
   * Registers all keydown listeners for OS shortcuts and DevTools blocking.
   * Called once on OS load.
   */
  function initShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Block DevTools combos first
      if (isDevToolsCombo(e)) {
        e.preventDefault();
        e.stopPropagation();
        handleDevToolsAttempt();
        return;
      }

      // OS shortcuts (skip if typing in an input for text-editing shortcuts)
      const skipForTyping = isTypingTarget(e.target);
      const isEditKey = ['a','c','v','x','z'].includes(e.key.toLowerCase());
      if (skipForTyping && e.ctrlKey && isEditKey) return;

      handleOSShortcut(e);
    }, true); // capture phase to intercept before other handlers

    initContextMenuBlock();
    startDevToolsDetection();
    console.log('[shortcuts] Initialized');
  }
  window.initShortcuts = initShortcuts;
})();
