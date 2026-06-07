/**
 * js/system/volume.js
 * Purpose: Control audio volume for the OS.
 * Browser mode: Web Audio API gainNode.
 * Electron mode: IPC to system volume.
 */

(function () {
  'use strict';

  // ─── Audio context state ──────────────────────────────────────────────────
  let audioCtx  = null;
  let gainNode  = null;
  let _volume   = 70; // default

  // ─── Init audio context (must be called after user gesture) ───────────────
  /**
   * Creates the Web Audio API context and gain node.
   * Must be called after a user interaction (browser restriction).
   */
  function initAudioContext() {
    if (audioCtx) return;
    try {
      audioCtx  = new (window.AudioContext || window.webkitAudioContext)();
      gainNode  = audioCtx.createGain();
      gainNode.connect(audioCtx.destination);
      gainNode.gain.value = _volume / 100;
    } catch (e) {
      console.warn('[volume] Could not create AudioContext:', e);
    }
  }
  window.initAudioContext = initAudioContext;

  // Init on first user interaction
  document.addEventListener('click', initAudioContext, { once: true });

  // ─── setVolume ───────────────────────────────────────────────────────────
  /**
   * Sets the OS volume to a given level.
   * @param {number}  value  - 0 to 100
   * @param {boolean} silent - If true, skips updating the UI
   */
  function setVolume(value, silent = false) {
    _volume = Math.min(100, Math.max(0, Math.round(value)));

    // Browser: update gain node
    if (gainNode) {
      gainNode.gain.value = _volume / 100;
    }

    // Electron: send IPC
    if (window.IS_ELECTRON && window.electron) {
      try {
        window.electron.ipcRenderer.send('set-volume', _volume);
      } catch (e) {
        console.warn('[volume] Electron IPC set-volume failed:', e);
      }
    }

    // Save to osSettings
    if (window.osSettings) {
      window.osSettings.volume = _volume;
      if (typeof window.saveSettings === 'function') {
        window.saveSettings();
      }
    }

    if (!silent) updateVolumeUI();
  }
  window.setVolume = setVolume;

  // ─── getVolume ───────────────────────────────────────────────────────────
  /**
   * Returns the current volume level (0–100).
   * @returns {number}
   */
  function getVolume() {
    return _volume;
  }
  window.getVolume = getVolume;

  // ─── updateVolumeUI ──────────────────────────────────────────────────────
  function updateVolumeUI() {
    // Taskbar popup slider
    const slider = document.getElementById('vol-slider');
    if (slider) slider.value = _volume;

    // Taskbar popup label
    const label = document.getElementById('vol-label');
    if (label) label.textContent = `${_volume}%`;

    // Settings panel slider
    const sysSel = document.getElementById('sys-vol');
    if (sysSel) sysSel.value = _volume;

    // Taskbar icon — muted indicator
    const icon = document.getElementById('vol-icon');
    if (icon) {
      if      (_volume === 0) icon.textContent = '🔇';
      else if (_volume < 40)  icon.textContent = '🔈';
      else if (_volume < 70)  icon.textContent = '🔉';
      else                    icon.textContent = '🔊';
    }
  }

  // ─── Sync from saved settings on load ────────────────────────────────────
  window.addEventListener('DOMContentLoaded', () => {
    try {
      const saved = JSON.parse(localStorage.getItem('frz_os_settings') || '{}');
      if (typeof saved.volume === 'number') {
        _volume = saved.volume;
        updateVolumeUI();
      }
    } catch (e) {
      console.warn('[volume] Could not read saved volume:', e);
    }
  });
})();
