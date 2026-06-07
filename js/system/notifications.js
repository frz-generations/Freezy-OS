/**
 * js/system/notifications.js
 * Purpose: Manage the in-OS notification system (toast popups),
 * notification center history, notification badge count.
 * Uses custom toast system — NOT the browser Notification API.
 */

(function () {
  'use strict';

  // ─── State ────────────────────────────────────────────────────────────────
  window.notifHistory = [];
  let notifIdCounter  = 0;
  let _unreadCount    = 0;
  const MAX_VISIBLE   = 5;
  const MAX_HISTORY   = 50;

  // ─── Type config ─────────────────────────────────────────────────────────
  const TYPE_CONFIG = {
    info:    { icon: 'ℹ️', color: '#00bcd4' },
    success: { icon: '✅', color: '#4caf50' },
    warning: { icon: '⚠️', color: '#ffc107' },
    error:   { icon: '❌', color: '#f44336' },
  };

  // ─── notify ───────────────────────────────────────────────────────────────
  /**
   * Shows a toast notification. Auto-dismisses after 4 seconds.
   * @param {'info'|'success'|'warning'|'error'} type
   * @param {string} title
   * @param {string} message
   */
  function notify(type, title, message) {
    const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.info;
    const id  = `notif-${++notifIdCounter}`;

    // Add to history
    const entry = { id, type, title, message, time: new Date().toISOString() };
    window.notifHistory.unshift(entry);
    if (window.notifHistory.length > MAX_HISTORY) window.notifHistory.pop();

    // Update badge
    _unreadCount++;
    updateBadge();

    // Respect max visible — dismiss oldest if needed
    const container = getOrCreateContainer();
    const current   = container.querySelectorAll('.toast-notif');
    if (current.length >= MAX_VISIBLE) {
      const oldest = current[current.length - 1];
      oldest?.remove();
    }

    // Create toast element
    const toast = document.createElement('div');
    toast.id = id;
    toast.classList.add('toast-notif', `toast-${type}`);
    toast.style.borderLeft = `3px solid ${cfg.color}`;
    toast.innerHTML = `
      <div class="toast-icon">${cfg.icon}</div>
      <div class="toast-text">
        <div class="toast-title">${escapeHtml(title)}</div>
        <div class="toast-msg">${escapeHtml(message)}</div>
      </div>
      <button class="toast-close" onclick="dismissNotif('${id}')" title="Dismiss">✕</button>
    `;

    // Click to dismiss
    toast.addEventListener('click', (e) => {
      if (!e.target.classList.contains('toast-close')) dismissNotif(id);
    });

    container.prepend(toast);

    // Play subtle sound if volume > 0
    playNotifSound(type);

    // Auto-dismiss after 4 seconds
    setTimeout(() => dismissNotif(id), 4000);
  }
  window.notify = notify;

  // ─── dismissNotif ────────────────────────────────────────────────────────
  /**
   * Dismisses a specific toast notification by id.
   * @param {string} id
   */
  function dismissNotif(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add('toast-dismiss');
    el.addEventListener('animationend', () => el.remove(), { once: true });
    setTimeout(() => el.remove(), 400); // fallback
  }
  window.dismissNotif = dismissNotif;

  // ─── clearAllNotifs ───────────────────────────────────────────────────────
  /**
   * Clears all visible and history notifications.
   */
  function clearAllNotifs() {
    const container = document.getElementById('toast-container');
    if (container) container.innerHTML = '';
    window.notifHistory = [];
    _unreadCount = 0;
    updateBadge();
    updateNotifCenter();
  }
  window.clearAllNotifs = clearAllNotifs;

  // ─── updateNotifCenter ───────────────────────────────────────────────────
  /**
   * Refreshes the notification center dropdown with current history.
   */
  function updateNotifCenter() {
    const panel = document.getElementById('notif-center-list');
    if (!panel) return;

    if (!window.notifHistory.length) {
      panel.innerHTML = '<div class="notif-empty">No notifications</div>';
      return;
    }

    panel.innerHTML = window.notifHistory.map(n => {
      const cfg  = TYPE_CONFIG[n.type] || TYPE_CONFIG.info;
      const time = new Date(n.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `
        <div class="notif-item notif-${n.type}">
          <span class="notif-icon">${cfg.icon}</span>
          <div class="notif-body">
            <div class="notif-title">${escapeHtml(n.title)}</div>
            <div class="notif-desc">${escapeHtml(n.message)}</div>
          </div>
          <span class="notif-time">${time}</span>
        </div>
      `;
    }).join('');
  }
  window.updateNotifCenter = updateNotifCenter;

  // ─── toggleNotifCenter ───────────────────────────────────────────────────
  /**
   * Toggles the notification center panel open/closed.
   * Clears badge when opened.
   */
  function toggleNotifCenter() {
    if (typeof window.togglePopup === 'function') {
      window.togglePopup('notif-center');
    }
    const isOpen = document.getElementById('notif-center')?.classList.contains('visible');
    if (isOpen) {
      _unreadCount = 0;
      updateBadge();
      updateNotifCenter();
    }
  }
  window.toggleNotifCenter = toggleNotifCenter;

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function getOrCreateContainer() {
    let el = document.getElementById('toast-container');
    if (!el) {
      el = document.createElement('div');
      el.id = 'toast-container';
      document.body.appendChild(el);
    }
    return el;
  }

  function updateBadge() {
    const badge = document.getElementById('notif-badge');
    if (!badge) return;
    if (_unreadCount > 0) {
      badge.textContent = _unreadCount > 99 ? '99' : _unreadCount;
      badge.style.display = 'flex';
    } else {
      badge.textContent = '';
      badge.style.display = 'none';
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function playNotifSound(type) {
    try {
      const vol = window.osSettings?.volume ?? 70;
      if (!vol || !window.AudioContext && !window.webkitAudioContext) return;

      const ctx  = new (window.AudioContext || window.webkitAudioContext)();
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const freqs = { info: 880, success: 1040, warning: 660, error: 440 };
      osc.frequency.value = freqs[type] || 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.05 * (vol / 100), ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // Silently ignore — notification sound is non-critical
    }
  }
})();
