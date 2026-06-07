/**
 * js/system/brightness.js
 * Purpose: Control screen brightness.
 * Browser mode: CSS rgba overlay on #brightness-overlay.
 * Electron mode: IPC to system display API.
 * Minimum brightness: 10 (cannot go below — OS becomes unusable).
 */

(function () {
  'use strict';

  let _brightness = 100; // default: full brightness

  // ─── setBrightness ───────────────────────────────────────────────────────
  /**
   * Sets the screen brightness level.
   * @param {number}  value  - 10 to 100
   * @param {boolean} silent - If true, skips updating the UI
   */
  function setBrightness(value, silent = false) {
    _brightness = Math.min(100, Math.max(10, Math.round(value)));

    // Browser: update CSS overlay
    const overlay = document.getElementById('brightness-overlay');
    if (overlay) {
      // At 100% → darkness = 0 (transparent)
      // At 10%  → darkness ≈ 0.765
      const darkness = (100 - _brightness) / 100 * 0.85;
      overlay.style.backgroundColor = `rgba(0,0,0,${darkness.toFixed(3)})`;
    }

    // Electron: send IPC
    if (window.IS_ELECTRON && window.electron) {
      try {
        window.electron.ipcRenderer.send('set-brightness', _brightness);
      } catch (e) {
        console.warn('[brightness] Electron IPC set-brightness failed:', e);
      }
    }

    // Save to osSettings
    if (window.osSettings) {
      window.osSettings.brightness = _brightness;
      if (typeof window.saveSettings === 'function') {
        window.saveSettings();
      }
    }

    if (!silent) updateBrightnessUI();
  }
  window.setBrightness = setBrightness;

  // ─── getBrightness ───────────────────────────────────────────────────────
  /**
   * Returns the current brightness level (10–100).
   * @returns {number}
   */
  function getBrightness() {
    return _brightness;
  }
  window.getBrightness = getBrightness;

  // ─── updateBrightnessUI ──────────────────────────────────────────────────
  function updateBrightnessUI() {
    // Taskbar popup slider
    const slider = document.getElementById('bright-slider');
    if (slider) slider.value = _brightness;

    // Taskbar popup label
    const label = document.getElementById('bright-label');
    if (label) label.textContent = `${_brightness}%`;

    // Settings panel input
    const sysEl = document.getElementById('sys-bright');
    if (sysEl) sysEl.value = _brightness;
  }

  // ─── Sync from saved settings on load ────────────────────────────────────
  window.addEventListener('DOMContentLoaded', () => {
    try {
      const saved = JSON.parse(localStorage.getItem('frz_os_settings') || '{}');
      if (typeof saved.brightness === 'number') {
        setBrightness(saved.brightness, true);
      } else {
        setBrightness(100, true);
      }
    } catch (e) {
      setBrightness(100, true);
      console.warn('[brightness] Could not read saved brightness:', e);
    }
  });
})();
