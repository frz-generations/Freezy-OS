/**
 * js/core/boot.js
 * Purpose: Control the boot sequence animation shown after login before the OS
 * desktop appears. Manages loading screen progression, log lines, progress bar,
 * and redirect to os.html.
 */

(function () {
  'use strict';

  // ─── Boot steps ────────────────────────────────────────────────────────────
  const BOOT_STEPS = [
    { msg: 'Firebase Authentication verified',  type: 'ok',   progress: 10,  delay: 0   },
    { msg: 'Loading user profile',              type: 'load', progress: 20,  delay: 380 },
    { msg: 'Connecting to Google Drive',        type: 'init', progress: 32,  delay: 380 },
    { msg: 'Initializing file system',          type: 'ok',   progress: 44,  delay: 380 },
    { msg: 'Loading desktop environment',       type: 'load', progress: 56,  delay: 380 },
    { msg: 'Mounting system applications',      type: 'ok',   progress: 67,  delay: 380 },
    { msg: 'Applying user preferences',         type: 'init', progress: 77,  delay: 380 },
    { msg: 'Starting window manager',           type: 'ok',   progress: 85,  delay: 380 },
    { msg: 'Launching Freezy-OS desktop',       type: 'load', progress: 95,  delay: 380 },
    { msg: 'System ready',                      type: 'ok',   progress: 100, delay: 380 },
  ];

  // ─── Type prefix labels ────────────────────────────────────────────────────
  const TYPE_LABELS = {
    ok:   '[ OK ]',
    load: '[LOAD]',
    init: '[INIT]',
    warn: '[WARN]',
  };

  // ─── DOM helpers ───────────────────────────────────────────────────────────
  function getBootLog()      { return document.getElementById('boot-log'); }
  function getProgressBar()  { return document.getElementById('boot-progress-bar'); }
  function getBootStatus()   { return document.getElementById('boot-status'); }

  // ─── Public: bootLog ───────────────────────────────────────────────────────
  /**
   * Adds a line to the boot log output.
   * @param {string} message - The log message to display
   * @param {'ok'|'load'|'init'|'warn'} type - Log type prefix
   */
  function bootLog(message, type = 'ok') {
    const log = getBootLog();
    if (!log) return;

    const line = document.createElement('div');
    line.classList.add('boot-line', `boot-${type}`);
    const prefix = TYPE_LABELS[type] || '[ -- ]';
    line.textContent = `${prefix}  ${message}`;

    log.appendChild(line);
    log.scrollTop = log.scrollHeight;
  }
  window.bootLog = bootLog;

  // ─── Public: bootProgress ──────────────────────────────────────────────────
  /**
   * Sets the boot progress bar to a given percentage.
   * @param {number} percent - 0 to 100
   */
  function bootProgress(percent) {
    const bar = getProgressBar();
    if (!bar) return;
    bar.style.width = `${Math.min(100, Math.max(0, percent))}%`;
  }
  window.bootProgress = bootProgress;

  // ─── Public: bootStatus ────────────────────────────────────────────────────
  /**
   * Updates the status text shown below the progress bar.
   * @param {string} message
   */
  function bootStatus(message) {
    const el = getBootStatus();
    if (!el) return;
    el.textContent = message;
  }
  window.bootStatus = bootStatus;

  // ─── Public: startBootSequence ────────────────────────────────────────────
  /**
   * Starts the animated boot sequence for the given authenticated user.
   * Stores user in sessionStorage, runs all boot steps, then redirects to os.html.
   * @param {object} user - Firebase user object
   */
  function startBootSequence(user) {
    if (!user) {
      console.warn('[boot] startBootSequence called without a user object');
      return;
    }

    // Store user in sessionStorage for os.html to read
    try {
      sessionStorage.setItem('freezy_user', JSON.stringify({
        uid:   user.uid,
        name:  user.displayName || user.email || 'User',
        email: user.email || '',
        photo: user.photoURL || ''
      }));
    } catch (e) {
      console.warn('[boot] Could not write to sessionStorage:', e);
    }

    // Show boot screen if it exists
    const bootScreen = document.getElementById('boot-screen');
    if (bootScreen) {
      bootScreen.style.display = 'flex';
    }

    // Clear previous log lines
    const log = getBootLog();
    if (log) log.innerHTML = '';

    bootProgress(0);
    bootStatus('Initializing...');

    // Run each step with accumulated delay
    let totalDelay = 0;
    BOOT_STEPS.forEach((step, index) => {
      totalDelay += step.delay;
      setTimeout(() => {
        bootLog(step.msg, step.type);
        bootProgress(step.progress);
        bootStatus(step.msg);

        // After last step: redirect after 600ms
        if (index === BOOT_STEPS.length - 1) {
          setTimeout(() => {
            // If already on os.html, init the desktop
            if (typeof window.initDesktop === 'function') {
              if (bootScreen) bootScreen.style.display = 'none';
              window.initDesktop();
            } else {
              window.location.href = 'os.html';
            }
          }, 600);
        }
      }, totalDelay);
    });
  }
  window.startBootSequence = startBootSequence;
})();
