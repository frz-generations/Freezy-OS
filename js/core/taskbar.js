/**
 * js/core/taskbar.js
 * Purpose: Manage the taskbar UI — clock, user menu, popup toggles,
 * notification badge, connection status. No Firebase calls. No app logic.
 */

(function () {
  'use strict';

  // ─── Clock ────────────────────────────────────────────────────────────────
  let clockInterval = null;

  /**
   * Starts the live clock, updating every second.
   * Updates taskbar clock and lock screen clock when visible.
   */
  function startClock() {
    if (clockInterval) clearInterval(clockInterval);

    function tick() {
      const now  = new Date();
      const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
      const mons = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];

      const hh  = String(now.getHours()).padStart(2,'0');
      const mm  = String(now.getMinutes()).padStart(2,'0');
      const ss  = String(now.getSeconds()).padStart(2,'0');
      const day = days[now.getDay()];
      const mon = mons[now.getMonth()];
      const dd  = String(now.getDate()).padStart(2,'0');
      const yyyy = now.getFullYear();

      // Taskbar: HH:MM:SS on top, DAY MON DD below
      const timeEl = document.getElementById('taskbar-time');
      const dateEl = document.getElementById('taskbar-date');
      if (timeEl) timeEl.textContent = `${hh}:${mm}:${ss}`;
      if (dateEl) dateEl.textContent = `${day} ${mon} ${dd}`;

      // Lock screen: large HH:MM, subtitle line below
      const lockTimeEl = document.getElementById('lock-time');
      const lockDateEl = document.getElementById('lock-date');
      if (lockTimeEl) lockTimeEl.textContent = `${hh}:${mm}`;
      if (lockDateEl) lockDateEl.textContent = `${day} • ${mon} ${dd} • ${yyyy}`;
    }

    tick();
    clockInterval = setInterval(tick, 1000);
  }
  window.startClock = startClock;

  // ─── Popups ───────────────────────────────────────────────────────────────
  const POPUP_IDS = ['vol-popup', 'bright-popup', 'user-menu', 'notif-center'];

  /**
   * Closes all taskbar popups.
   */
  function closeAllPopups() {
    POPUP_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.classList.remove('visible');
    });
  }
  window.closeAllPopups = closeAllPopups;

  /**
   * Toggles a popup visible/hidden. Only one popup open at a time.
   * @param {string} id - Popup element id
   */
  function togglePopup(id) {
    const target = document.getElementById(id);
    if (!target) return;

    const wasVisible = target.classList.contains('visible');
    closeAllPopups();

    if (!wasVisible) {
      target.classList.add('visible');
      target.classList.add('pop-in');
      target.addEventListener('animationend', () => target.classList.remove('pop-in'), { once: true });
    }
  }
  window.togglePopup = togglePopup;

  // Close popups when clicking outside
  document.addEventListener('click', (e) => {
    const inPopup  = e.target.closest('.taskbar-popup');
    const inToggle = e.target.closest('[data-popup-toggle]');
    if (!inPopup && !inToggle) closeAllPopups();
  });

  // ─── Toggle notification center ───────────────────────────────────────────
  /**
   * Toggles the notification center panel open/closed.
   * Clears notification badge when opened.
   */
  function toggleNotifCenter() {
    togglePopup('notif-center');
    const isOpen = document.getElementById('notif-center')?.classList.contains('visible');
    if (isOpen) {
      // Clear badge
      const badge = document.getElementById('notif-badge');
      if (badge) badge.textContent = '';
      badge?.style && (badge.style.display = 'none');
      // Refresh center content
      if (typeof window.updateNotifCenter === 'function') window.updateNotifCenter();
    }
  }
  window.toggleNotifCenter = toggleNotifCenter;

  // ─── Update taskbar user info ─────────────────────────────────────────────
  /**
   * Updates the user avatar, name, and email shown in the taskbar user menu.
   * @param {object} user - { name, email, photo }
   */
  function updateTaskbarUser(user) {
    if (!user) return;

    const avatarEl = document.getElementById('taskbar-avatar');
    const nameEl   = document.getElementById('user-menu-name');
    const emailEl  = document.getElementById('user-menu-email');

    if (avatarEl) {
      if (user.photo) {
        avatarEl.style.backgroundImage = `url('${user.photo}')`;
        avatarEl.textContent = '';
      } else {
        avatarEl.style.backgroundImage = '';
        avatarEl.textContent = (user.name || 'U')[0].toUpperCase();
      }
    }
    if (nameEl)  nameEl.textContent  = user.name  || 'User';
    if (emailEl) emailEl.textContent = user.email || '';
  }
  window.updateTaskbarUser = updateTaskbarUser;

  // ─── Connection status ────────────────────────────────────────────────────
  /**
   * Updates the online/offline indicator in the taskbar.
   */
  function updateConnectionStatus() {
    const el = document.getElementById('connection-status');
    if (!el) return;
    el.classList.toggle('offline', !window.IS_ONLINE);
    el.title = window.IS_ONLINE ? 'Online' : 'Offline';
  }
  window.updateConnectionStatus = updateConnectionStatus;

  // Listen for online/offline changes
  window.addEventListener('online',  updateConnectionStatus);
  window.addEventListener('offline', updateConnectionStatus);

  // ─── Initialize taskbar on load ───────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    startClock();
    updateConnectionStatus();

    // Load saved user from sessionStorage
    try {
      const saved = sessionStorage.getItem('freezy_user');
      if (saved) updateTaskbarUser(JSON.parse(saved));
    } catch (e) {
      console.warn('[taskbar] Could not read freezy_user from sessionStorage:', e);
    }
  });
})();
