/**
 * js/core/window-manager.js
 * Purpose: Open, close, minimize, maximize, focus, drag, resize floating windows.
 * Manage z-index stacking. Handle window snap. Track all open windows.
 */

(function () {
  'use strict';

  // ─── Window size defaults ─────────────────────────────────────────────────
  const WINDOW_SIZES = {
    calculator:   { w: 300, h: 460 },
    settings:     { w: 640, h: 520 },
    weather:      { w: 480, h: 480 },
    prayer:       { w: 360, h: 500 },
    calendar:     { w: 380, h: 400 },
    music:        { w: 560, h: 460 },
    maps:         { w: 640, h: 520 },
    files:        { w: 680, h: 500 },
    code:         { w: 720, h: 540 },
    word:         { w: 680, h: 540 },
    whiteboard:   { w: 720, h: 540 },
    howto:        { w: 580, h: 500 },
    search:       { w: 600, h: 500 },
    browser:      { w: 720, h: 540 },
    qrconnect:    { w: 360, h: 520 },
    converter:    { w: 420, h: 400 },
    hijri:        { w: 380, h: 420 },
    religiouscal: { w: 500, h: 480 },
    community:    { w: 580, h: 500 },
    library:      { w: 680, h: 500 },
    default_iframe: { w: 860, h: 600 },
  };

  // ─── State ────────────────────────────────────────────────────────────────
  window.openWindows    = {};
  window.focusedWindowId = null;
  let zCounter           = 100;

  // ─── App content builders (inline apps) ──────────────────────────────────
  function getAppContent(id) {
    const builders = {
      calculator:   () => `<div id="calc-app" class="app-inner"><div id="calc-display" class="calc-display">0</div><div class="calc-grid"></div></div>`,
      settings:     () => `<div id="settings-app" class="app-inner"><div id="settings-panels"></div></div>`,
      weather:      () => `<div id="weather-app" class="app-inner"><div id="weather-content"><div class="loading-msg">📡 Fetching weather...</div></div></div>`,
      prayer:       () => `<div id="prayer-app" class="app-inner"><div id="prayer-content"><div class="loading-msg">🕌 Loading prayer times...</div></div></div>`,
      calendar:     () => `<div id="calendar-app" class="app-inner"><div id="calendar-content"></div></div>`,
      music:        () => `<div id="music-app" class="app-inner"><div id="music-content"></div></div>`,
      maps:         () => `<div id="maps-app" class="app-inner"><div id="map-container" style="width:100%;height:100%"></div></div>`,
      files:        () => `<div id="files-app" class="app-inner"><div id="files-content"><div class="loading-msg">📁 Loading files...</div></div></div>`,
      code:         () => `<div id="code-app" class="app-inner"><textarea id="code-editor" class="code-editor" spellcheck="false" placeholder="// Start coding..."></textarea></div>`,
      word:         () => `<div id="word-app" class="app-inner"><div id="word-content"></div></div>`,
      whiteboard:   () => `<div id="whiteboard-app" class="app-inner"><canvas id="wb-canvas"></canvas></div>`,
      howto:        () => `<div id="howto-app" class="app-inner"><div id="howto-content"></div></div>`,
      search:       () => `<div id="search-app" class="app-inner"><input id="search-input" class="search-input" placeholder="Search the web..."/><div id="search-results"></div></div>`,
      browser:      () => `<div id="browser-app" class="app-inner"><div class="browser-bar"><input id="browser-url" placeholder="Enter URL..." /><button onclick="loadBrowserURL()">Go</button></div><iframe id="browser-frame" class="browser-frame" sandbox="allow-scripts allow-same-origin allow-forms"></iframe></div>`,
      qrconnect:    () => `<div id="qrconnect-app" class="app-inner"><div id="qrconnect-content"></div></div>`,
      converter:    () => `<div id="converter-app" class="app-inner"><div id="converter-content"></div></div>`,
      hijri:        () => `<div id="hijri-app" class="app-inner"><div id="hijri-content"></div></div>`,
      religiouscal: () => `<div id="religiouscal-app" class="app-inner"><div id="religiouscal-content"></div></div>`,
      community:    () => `<div id="community-app" class="app-inner"><div id="community-content"></div></div>`,
      library:      () => `<div id="library-app" class="app-inner"><div id="library-content"><div class="loading-msg">📚 Loading library...</div></div></div>`,
    };
    return (builders[id] || (() => `<div class="app-inner"><div class="loading-msg">App not found: ${id}</div></div>`))();
  }

  // ─── Get app info from ALL_APPS ───────────────────────────────────────────
  function getAppInfo(id) {
    return (window.ALL_APPS || []).find(a => a.id === id) || { id, name: id, icon: '📦' };
  }

  // ─── openApp ──────────────────────────────────────────────────────────────
  /**
   * Opens an app by its id. Delegates to openIframeApp or openWindow.
   * @param {string} id - App id from ALL_APPS
   */
  function openApp(id) {
    // If already open, focus it
    if (window.openWindows[id]) {
      focusWindow(id);
      if (window.openWindows[id].minimized) minimizeWindow(id);
      return;
    }

    const app = getAppInfo(id);

    // URL-based apps open in iframe
    if (app.url) {
      openIframeApp(app);
      return;
    }

    const size    = WINDOW_SIZES[id] || { w: 640, h: 480 };
    const content = getAppContent(id);
    openWindow(id, app.name, app.icon, content, size);
    setDockActive(id);
  }
  window.openApp    = openApp;
  window._wmOpenApp = openApp;   // reference for desktop.js

  // ─── openIframeApp ────────────────────────────────────────────────────────
  /**
   * Opens an external URL in a sandboxed iframe window.
   * @param {object} app - App object with url, name, icon
   */
  function openIframeApp(app) {
    const size = WINDOW_SIZES.default_iframe;
    const content = `
      <div class="app-inner" style="padding:0">
        <iframe
          src="${app.url}"
          class="iframe-app-frame"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          loading="lazy"
          title="${app.name}"
        ></iframe>
      </div>
    `;
    openWindow(app.id, app.name, app.icon, content, size);
    setDockActive(app.id);
  }
  window.openIframeApp = openIframeApp;

  // ─── openWindow ───────────────────────────────────────────────────────────
  /**
   * Creates and renders a floating window on the desktop.
   * @param {string} id       - Unique window id
   * @param {string} title    - Window title bar text
   * @param {string} icon     - Emoji icon for title bar
   * @param {string} content  - HTML content string for window body
   * @param {{ w:number, h:number }} size - Default window size
   */
  function openWindow(id, title, icon, content, size) {
    if (window.openWindows[id]) { focusWindow(id); return; }

    const taskbarH = 48;
    let w = size.w;
    let h = size.h;

    // Mobile: full screen
    if (window.IS_MOBILE) {
      w = window.innerWidth;
      h = window.innerHeight - taskbarH;
    }
    // TV: 20% larger
    if (window.IS_TV) {
      w = Math.round(w * 1.2);
      h = Math.round(h * 1.2);
    }

    // Center the window
    const x = Math.max(0, Math.round((window.innerWidth  - w) / 2));
    const y = Math.max(0, Math.round((window.innerHeight - h - taskbarH) / 2));

    const win = document.createElement('div');
    win.id         = `win-${id}`;
    win.dataset.id = id;
    win.classList.add('os-window');
    win.style.cssText = `
      width:${w}px; height:${h}px;
      left:${x}px;  top:${y}px;
      z-index:${++zCounter};
    `;

    win.innerHTML = `
      <div class="win-titlebar" id="titlebar-${id}">
        <span class="win-icon">${icon}</span>
        <span class="win-title">${title}</span>
        <div class="win-controls">
          <button class="win-btn win-min"  title="Minimize" onclick="minimizeWindow('${id}')">─</button>
          <button class="win-btn win-max"  title="Maximize" onclick="toggleMaximize('${id}')">□</button>
          <button class="win-btn win-close"title="Close"    onclick="closeWindow('${id}')">✕</button>
        </div>
      </div>
      <div class="win-body" id="winbody-${id}">${content}</div>
      <div class="win-resize-handle" id="resize-${id}"></div>
    `;

    // Focus on click
    win.addEventListener('mousedown', () => focusWindow(id));
    win.addEventListener('touchstart', () => focusWindow(id), { passive: true });

    document.getElementById('windows-layer')?.appendChild(win) ||
    document.body.appendChild(win);

    // Register in openWindows
    window.openWindows[id] = { el: win, minimized: false, maximized: false, id };

    // Drag & Resize
    const titlebar     = document.getElementById(`titlebar-${id}`);
    const resizeHandle = document.getElementById(`resize-${id}`);
    if (titlebar)     makeDraggable(win, titlebar, id);
    if (resizeHandle) makeResizable(win, resizeHandle);

    focusWindow(id);

    // Init app logic after render
    setTimeout(() => initAppAfterRender(id), 100);
  }
  window.openWindow = openWindow;

  // ─── closeWindow ─────────────────────────────────────────────────────────
  /**
   * Closes and removes a window by id.
   * @param {string} id
   */
  function closeWindow(id) {
    const entry = window.openWindows[id];
    if (!entry) return;
    entry.el.remove();
    delete window.openWindows[id];
    if (window.focusedWindowId === id) window.focusedWindowId = null;
    // Remove dock active state if no other window with same id
    if (!window.openWindows[id]) {
      document.querySelectorAll(`.dock-icon[data-id="${id}"]`).forEach(el => el.classList.remove('active'));
    }
  }
  window.closeWindow = closeWindow;

  // ─── minimizeWindow ───────────────────────────────────────────────────────
  /**
   * Toggles minimize state of a window.
   * @param {string} id
   */
  function minimizeWindow(id) {
    const entry = window.openWindows[id];
    if (!entry) return;
    entry.minimized = !entry.minimized;
    entry.el.classList.toggle('minimized', entry.minimized);
  }
  window.minimizeWindow = minimizeWindow;

  // ─── toggleMaximize ───────────────────────────────────────────────────────
  /**
   * Toggles maximize state of a window.
   * @param {string} id
   */
  function toggleMaximize(id) {
    const entry = window.openWindows[id];
    if (!entry) return;
    entry.maximized = !entry.maximized;
    entry.el.classList.toggle('maximized', entry.maximized);
  }
  window.toggleMaximize = toggleMaximize;

  // ─── focusWindow ─────────────────────────────────────────────────────────
  /**
   * Brings a window to the front by raising its z-index.
   * @param {string} id
   */
  function focusWindow(id) {
    const entry = window.openWindows[id];
    if (!entry) return;
    entry.el.style.zIndex = ++zCounter;
    window.focusedWindowId = id;
    document.querySelectorAll('.os-window').forEach(w => w.classList.remove('focused'));
    entry.el.classList.add('focused');
    setDockActive(id);
  }
  window.focusWindow = focusWindow;

  // ─── minimizeAll ─────────────────────────────────────────────────────────
  /**
   * Minimizes all currently open windows.
   */
  function minimizeAll() {
    Object.keys(window.openWindows).forEach(id => {
      const entry = window.openWindows[id];
      if (!entry.minimized) minimizeWindow(id);
    });
  }
  window.minimizeAll = minimizeAll;

  // ─── setDockActive (delegates to desktop.js) ─────────────────────────────
  function setDockActive(id) {
    if (typeof window.setDockActive === 'function') window.setDockActive(id);
  }

  // ─── makeDraggable ───────────────────────────────────────────────────────
  /**
   * Attaches mouse and touch drag events to a window via its handle.
   * @param {HTMLElement} win     - The window element
   * @param {HTMLElement} handle  - Drag handle (titlebar)
   * @param {string}      id      - Window id for snap tracking
   */
  function makeDraggable(win, handle, id) {
    if (!win || !handle) return;
    if (window.IS_MOBILE) return;  // mobile: no drag (full screen)

    let startX, startY, startL, startT, dragging = false;
    const taskbarH = 48;

    function onStart(cx, cy) {
      dragging = true;
      startX = cx; startY = cy;
      startL = parseInt(win.style.left) || 0;
      startT = parseInt(win.style.top)  || 0;
      win.classList.remove('snap-left', 'snap-right');
      focusWindow(id);
    }

    function onMove(cx, cy) {
      if (!dragging) return;
      let nx = startL + (cx - startX);
      let ny = startT + (cy - startY);
      // Clamp: cannot go above taskbar area or offscreen
      ny = Math.max(0, Math.min(ny, window.innerHeight - taskbarH - 60));
      nx = Math.max(-win.offsetWidth + 100, Math.min(nx, window.innerWidth - 100));
      win.style.left = `${nx}px`;
      win.style.top  = `${ny}px`;
    }

    function onEnd() {
      if (!dragging) return;
      dragging = false;
      const nx = parseInt(win.style.left);
      // Snap to edges
      if (nx < 20)                              win.classList.add('snap-left');
      else if (nx > window.innerWidth - win.offsetWidth - 20) win.classList.add('snap-right');
    }

    // Mouse
    handle.addEventListener('mousedown', (e) => { e.preventDefault(); onStart(e.clientX, e.clientY); });
    document.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
    document.addEventListener('mouseup',   () => onEnd());

    // Touch
    handle.addEventListener('touchstart', (e) => {
      const t = e.touches[0];
      onStart(t.clientX, t.clientY);
    }, { passive: true });
    document.addEventListener('touchmove', (e) => {
      if (!dragging) return;
      const t = e.touches[0];
      onMove(t.clientX, t.clientY);
    }, { passive: true });
    document.addEventListener('touchend', () => onEnd(), { passive: true });
  }
  window.makeDraggable = makeDraggable;

  // ─── makeResizable ────────────────────────────────────────────────────────
  /**
   * Attaches resize events to a window via bottom-right handle.
   * Disabled on mobile. Min: 320×240.
   * @param {HTMLElement} win    - The window element
   * @param {HTMLElement} handle - Resize grip element
   */
  function makeResizable(win, handle) {
    if (!win || !handle) return;
    if (window.IS_MOBILE) { handle.style.display = 'none'; return; }

    let resizing = false, startX, startY, startW, startH;
    const MIN_W = 320, MIN_H = 240;

    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      resizing = true;
      startX = e.clientX; startY = e.clientY;
      startW = win.offsetWidth; startH = win.offsetHeight;
    });

    document.addEventListener('mousemove', (e) => {
      if (!resizing) return;
      const newW = Math.max(MIN_W, startW + (e.clientX - startX));
      const newH = Math.max(MIN_H, startH + (e.clientY - startY));
      const maxW = window.innerWidth  - parseInt(win.style.left || 0);
      const maxH = window.innerHeight - parseInt(win.style.top  || 0) - 48;
      win.style.width  = `${Math.min(newW, maxW)}px`;
      win.style.height = `${Math.min(newH, maxH)}px`;
    });

    document.addEventListener('mouseup', () => { resizing = false; });
  }
  window.makeResizable = makeResizable;

  // ─── initAppAfterRender ───────────────────────────────────────────────────
  /**
   * Called 100ms after a window opens to trigger app-specific initialization.
   * @param {string} id - App id
   */
  function initAppAfterRender(id) {
    const initMap = {
      maps:         () => typeof window.initMapsApp         === 'function' && window.initMapsApp(),
      whiteboard:   () => typeof window.initWhiteboard      === 'function' && window.initWhiteboard(),
      calendar:     () => typeof window.renderCalendar      === 'function' && window.renderCalendar(),
      prayer:       () => typeof window.loadPrayer          === 'function' && window.loadPrayer(),
      qrconnect:    () => typeof window.initQRConnect       === 'function' && window.initQRConnect(),
      music:        () => typeof window.initMusicPlayer     === 'function' && window.initMusicPlayer(),
      settings:     () => typeof window.showSettingsPanel   === 'function' && window.showSettingsPanel('general'),
      files:        () => typeof window.initFileManager     === 'function' && window.initFileManager(),
      library:      () => typeof window.sheetsLoadLibrary   === 'function' && window.sheetsLoadLibrary(),
      weather:      () => typeof window.initWeatherApp      === 'function' && window.initWeatherApp(),
      calculator:   () => typeof window.initCalculator      === 'function' && window.initCalculator(),
      converter:    () => typeof window.initConverter       === 'function' && window.initConverter(),
      hijri:        () => typeof window.initHijri           === 'function' && window.initHijri(),
      religiouscal: () => typeof window.initReligiousCal    === 'function' && window.initReligiousCal(),
      community:    () => typeof window.initCommunity       === 'function' && window.initCommunity(),
      howto:        () => typeof window.initHowTo           === 'function' && window.initHowTo(),
    };
    const fn = initMap[id];
    if (fn) {
      try { fn(); } catch (e) { console.warn(`[wm] initAppAfterRender(${id}) error:`, e); }
    }
  }
  window.initAppAfterRender = initAppAfterRender;

  // ─── Alt+Tab cycle ────────────────────────────────────────────────────────
  // Handled in shortcuts.js — exposed here for reference
  window._cycleWindows = function () {
    const ids = Object.keys(window.openWindows);
    if (!ids.length) return;
    const cur = ids.indexOf(window.focusedWindowId);
    const next = ids[(cur + 1) % ids.length];
    focusWindow(next);
    if (window.openWindows[next]?.minimized) minimizeWindow(next);
  };
})();
