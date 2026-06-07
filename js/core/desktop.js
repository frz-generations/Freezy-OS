/**
 * js/core/desktop.js
 * Purpose: Build and manage the desktop environment after OS loads.
 * Build desktop icons, dock, app drawer. Handle desktop right-click context menu.
 * Defines window.ALL_APPS — single source of truth for all apps.
 */

(function () {
  'use strict';

  // ─── ALL_APPS — single source of truth ────────────────────────────────────
  window.ALL_APPS = [
    // System
    { id:'settings',     name:'Settings',        icon:'⚙️',  category:'System' },
    { id:'files',        name:'File Manager',    icon:'📁',  category:'System' },
    { id:'howto',        name:'How-To Guide',    icon:'📖',  category:'System' },
    // Tools
    { id:'calculator',   name:'Calculator',      icon:'🧮',  category:'Tools' },
    { id:'converter',    name:'Unit Converter',  icon:'⚖️',  category:'Tools' },
    { id:'qrconnect',    name:'QR Connect',      icon:'📱',  category:'Tools' },
    { id:'calendar',     name:'Calendar',        icon:'📅',  category:'Tools' },
    { id:'code',         name:'Code Editor',     icon:'💻',  category:'Tools' },
    // Study (iframed)
    { id:'quiz',         name:'Quiz Generator',  icon:'📝',  category:'Study', url:'https://quizgenerator-frz.netlify.app' },
    { id:'flashcard',    name:'Flashcard Gen',   icon:'🃏',  category:'Study', url:'https://flashcardgenerator-frz.netlify.app' },
    { id:'qpaper',       name:'Question Paper',  icon:'📄',  category:'Study', url:'https://questionpapergenerator-frz.netlify.app' },
    { id:'answerkey',    name:'Answer Key',      icon:'🔑',  category:'Study', url:'https://answerkeygenerstor-frz.netlify.app' },
    { id:'shortnote',    name:'Short Notes',     icon:'📋',  category:'Study', url:'https://shortnotecreator-frz.netlify.app' },
    { id:'revnote',      name:'Revision Notes',  icon:'📚',  category:'Study', url:'https://revisionnotegenerstor-frz.netlify.app' },
    { id:'studytimer',   name:'Study Timer',     icon:'⏱️',  category:'Study', url:'https://studytimer-frz.netlify.app' },
    // Office
    { id:'word',         name:'Word Editor',     icon:'📝',  category:'Office' },
    { id:'whiteboard',   name:'Whiteboard',      icon:'🎨',  category:'Office' },
    // Media
    { id:'music',        name:'Music Player',    icon:'🎵',  category:'Media' },
    { id:'imagehost',    name:'Image Host',      icon:'🖼️',  category:'Media', url:'https://frzimage.xo.je' },
    { id:'pdfhost',      name:'PDF Host',        icon:'📄',  category:'Media', url:'https://frzpdf.xo.je' },
    { id:'mediahost',    name:'Media Host',      icon:'🎞️',  category:'Media', url:'https://frzmedia.xo.je' },
    // Web
    { id:'browser',      name:'Web Browser',     icon:'🌐',  category:'Web' },
    { id:'search',       name:'Search',          icon:'🔍',  category:'Web' },
    { id:'urlshort',     name:'URL Shortener',   icon:'🔗',  category:'Web', url:'https://turl.xo.je' },
    { id:'qrgen',        name:'QR Generator',    icon:'📷',  category:'Web', url:'https://qrfrz.xo.je' },
    { id:'whatsapp',     name:'WA Converter',    icon:'💬',  category:'Web', url:'https://wame-frz.netlify.app' },
    // Religious
    { id:'prayer',       name:'Prayer Times',    icon:'🕌',  category:'Religious' },
    { id:'hijri',        name:'Hijri Calendar',  icon:'📅',  category:'Religious' },
    { id:'religiouscal', name:'Religious Cals',  icon:'🗓️',  category:'Religious' },
    // Maps & Weather
    { id:'weather',      name:'Weather',         icon:'🌤️',  category:'Maps & Weather' },
    { id:'maps',         name:'Maps',            icon:'🗺️',  category:'Maps & Weather' },
    // PDF Tools (iframed)
    { id:'pdfsplit',     name:'PDF Splitter',    icon:'✂️',  category:'PDF Tools', url:'https://pdfsplitter-frz.netlify.app' },
    { id:'pdfmerge',     name:'PDF Merger',      icon:'📎',  category:'PDF Tools', url:'https://pdfmerger-frz.netlify.app' },
    // Community
    { id:'community',    name:'Community Tools', icon:'🌐',  category:'Community' },
    { id:'library',      name:'Public Library',  icon:'📚',  category:'Community' },
  ];

  window.CATEGORIES = [
    'System','Tools','Study','Office','Media',
    'Web','Religious','Maps & Weather','PDF Tools','Community'
  ];

  // ─── Desktop icon state ───────────────────────────────────────────────────
  // Default desktop icons (first 6 apps)
  const DEFAULT_DESK_ICONS = ['settings','files','calculator','word','music','browser'];

  function loadDeskIcons() {
    try {
      const saved = localStorage.getItem('freezy_desk_icons');
      return saved ? JSON.parse(saved) : [...DEFAULT_DESK_ICONS];
    } catch (e) {
      return [...DEFAULT_DESK_ICONS];
    }
  }

  function saveDeskIcons(icons) {
    try {
      localStorage.setItem('freezy_desk_icons', JSON.stringify(icons));
    } catch (e) {
      console.warn('[desktop] Could not save desk icons:', e);
    }
  }

  // ─── Dock state ───────────────────────────────────────────────────────────
  const DEFAULT_DOCK = ['settings','files','calculator','word','music','browser','search'];

  function loadDockIcons() {
    try {
      const saved = localStorage.getItem('freezy_dock_icons');
      return saved ? JSON.parse(saved) : [...DEFAULT_DOCK];
    } catch (e) {
      return [...DEFAULT_DOCK];
    }
  }

  function saveDockIcons(icons) {
    try {
      localStorage.setItem('freezy_dock_icons', JSON.stringify(icons));
    } catch (e) {
      console.warn('[desktop] Could not save dock icons:', e);
    }
  }

  // ─── Build desktop icons ──────────────────────────────────────────────────
  /**
   * Renders desktop icon grid from saved icon list.
   */
  function buildDesktopIcons() {
    const grid = document.getElementById('desktop-icons');
    if (!grid) return;

    const icons = loadDeskIcons();
    grid.innerHTML = '';

    icons.forEach(id => {
      const app = window.ALL_APPS.find(a => a.id === id);
      if (!app) return;

      const el = document.createElement('div');
      el.classList.add('desk-icon');
      el.dataset.id = app.id;
      el.innerHTML = `
        <div class="desk-icon-emoji">${app.icon}</div>
        <div class="desk-icon-label">${app.name}</div>
      `;

      // Open on single click (mobile/TV) or double click (desktop)
      if (window.IS_MOBILE || window.IS_TV) {
        el.addEventListener('click', () => openApp(app.id));
      } else {
        el.addEventListener('dblclick', () => openApp(app.id));
      }

      // Right-click context menu
      el.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showIconContextMenu(e, app.id);
      });

      grid.appendChild(el);
    });
  }
  window.buildDesktopIcons = buildDesktopIcons;

  // ─── Remove desktop icon ──────────────────────────────────────────────────
  /**
   * Removes an app from the desktop icon grid.
   * @param {string} id - App id
   */
  function removeDesktopIcon(id) {
    let icons = loadDeskIcons();
    icons = icons.filter(i => i !== id);
    saveDeskIcons(icons);
    buildDesktopIcons();
  }
  window.removeDesktopIcon = removeDesktopIcon;

  // ─── Icon context menu ────────────────────────────────────────────────────
  function showIconContextMenu(e, id) {
    closeContextMenu();
    const menu = document.createElement('div');
    menu.id = 'desk-context-menu';
    menu.classList.add('context-menu');
    menu.style.left = `${e.clientX}px`;
    menu.style.top  = `${e.clientY}px`;
    menu.innerHTML = `
      <div class="ctx-item" data-action="open">Open</div>
      <div class="ctx-item" data-action="pin">Pin to Dock</div>
      <div class="ctx-item" data-action="remove">Remove from Desktop</div>
    `;

    menu.addEventListener('click', (ev) => {
      const action = ev.target.dataset.action;
      if (action === 'open')   openApp(id);
      if (action === 'pin')    pinToDock(id);
      if (action === 'remove') removeDesktopIcon(id);
      closeContextMenu();
    });

    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener('click', closeContextMenu, { once: true }), 50);
  }

  // ─── Desktop right-click context menu ────────────────────────────────────
  function showDesktopContextMenu(e) {
    closeContextMenu();
    const menu = document.createElement('div');
    menu.id = 'desk-context-menu';
    menu.classList.add('context-menu');
    menu.style.left = `${e.clientX}px`;
    menu.style.top  = `${e.clientY}px`;
    menu.innerHTML = `
      <div class="ctx-item" data-action="refresh">Refresh Desktop</div>
      <div class="ctx-item" data-action="about">About Freezy-OS</div>
    `;

    menu.addEventListener('click', (ev) => {
      const action = ev.target.dataset.action;
      if (action === 'refresh') buildDesktopIcons();
      if (action === 'about')   showAbout();
      closeContextMenu();
    });

    document.body.appendChild(menu);
    setTimeout(() => document.addEventListener('click', closeContextMenu, { once: true }), 50);
  }

  function closeContextMenu() {
    const existing = document.getElementById('desk-context-menu');
    if (existing) existing.remove();
  }

  // ─── Build dock ───────────────────────────────────────────────────────────
  /**
   * Renders the bottom dock from saved dock icon list.
   */
  function buildDock() {
    const dock = document.getElementById('dock');
    if (!dock) return;

    const icons = loadDockIcons();
    dock.innerHTML = '';

    icons.forEach(id => {
      const app = window.ALL_APPS.find(a => a.id === id);
      if (!app) return;

      const el = document.createElement('div');
      el.classList.add('dock-icon');
      el.dataset.id = app.id;
      el.title = app.name;
      el.innerHTML = `<span class="dock-emoji">${app.icon}</span>`;
      el.addEventListener('click', () => openApp(app.id));
      dock.appendChild(el);
    });
  }
  window.buildDock = buildDock;

  // ─── Pin to dock ──────────────────────────────────────────────────────────
  /**
   * Adds an app to the dock if not already present.
   * @param {string} id - App id
   */
  function pinToDock(id) {
    const icons = loadDockIcons();
    if (icons.includes(id)) {
      if (typeof window.notify === 'function') {
        window.notify('info', 'Already pinned', 'This app is already in the dock.');
      }
      return;
    }
    icons.push(id);
    saveDockIcons(icons);
    buildDock();
    if (typeof window.notify === 'function') {
      const app = window.ALL_APPS.find(a => a.id === id);
      window.notify('success', 'Pinned to Dock', `${app?.name || id} added to dock.`);
    }
  }
  window.pinToDock = pinToDock;

  // ─── Set dock active ──────────────────────────────────────────────────────
  /**
   * Marks a dock icon as active (app open).
   * @param {string} id - App id
   */
  function setDockActive(id) {
    document.querySelectorAll('.dock-icon').forEach(el => {
      el.classList.toggle('active', el.dataset.id === id);
    });
  }
  window.setDockActive = setDockActive;

  // ─── Build app drawer ─────────────────────────────────────────────────────
  /**
   * Renders the app drawer with all apps grouped by category.
   */
  function buildDrawer() {
    const drawer = document.getElementById('app-drawer-content');
    if (!drawer) return;

    drawer.innerHTML = '';

    window.CATEGORIES.forEach(cat => {
      const apps = window.ALL_APPS.filter(a => a.category === cat);
      if (!apps.length) return;

      const section = document.createElement('div');
      section.classList.add('drawer-category');
      section.innerHTML = `<div class="drawer-cat-title">${cat}</div>`;

      const grid = document.createElement('div');
      grid.classList.add('drawer-app-grid');

      apps.forEach(app => {
        const el = document.createElement('div');
        el.classList.add('drawer-app-item');
        el.dataset.id  = app.id;
        el.dataset.cat = app.category;
        el.innerHTML = `
          <div class="drawer-app-icon">${app.icon}</div>
          <div class="drawer-app-name">${app.name}</div>
        `;
        el.addEventListener('click', () => {
          openApp(app.id);
          closeDrawer();
        });
        grid.appendChild(el);
      });

      section.appendChild(grid);
      drawer.appendChild(section);
    });
  }
  window.buildDrawer = buildDrawer;

  // ─── Toggle drawer ────────────────────────────────────────────────────────
  let drawerOpen = false;

  function openDrawer() {
    const drawer = document.getElementById('app-drawer');
    if (!drawer) return;
    drawer.classList.add('open');
    drawerOpen = true;
    const searchEl = document.getElementById('drawer-search');
    if (searchEl) { searchEl.value = ''; filterDrawerApps(''); searchEl.focus(); }
  }

  function closeDrawer() {
    const drawer = document.getElementById('app-drawer');
    if (!drawer) return;
    drawer.classList.remove('open');
    drawerOpen = false;
  }

  /**
   * Toggles the app drawer open/closed.
   */
  function toggleDrawer() {
    drawerOpen ? closeDrawer() : openDrawer();
  }
  window.toggleDrawer = toggleDrawer;

  // ─── Filter drawer apps ───────────────────────────────────────────────────
  /**
   * Filters visible app drawer items by search query.
   * @param {string} query
   */
  function filterDrawerApps(query) {
    const q = query.toLowerCase().trim();
    const items = document.querySelectorAll('.drawer-app-item');
    items.forEach(el => {
      const name = (el.querySelector('.drawer-app-name')?.textContent || '').toLowerCase();
      el.style.display = (!q || name.includes(q)) ? '' : 'none';
    });

    // Hide empty category sections
    document.querySelectorAll('.drawer-category').forEach(sec => {
      const visible = sec.querySelectorAll('.drawer-app-item:not([style*="display: none"])');
      sec.style.display = visible.length ? '' : 'none';
    });
  }
  window.filterDrawerApps = filterDrawerApps;

  // ─── Show About ───────────────────────────────────────────────────────────
  /**
   * Opens the About Freezy-OS dialog window.
   */
  function showAbout() {
    if (typeof window.openWindow === 'function') {
      window.openWindow('about', 'About Freezy-OS', 'ℹ️', `
        <div style="padding:24px;text-align:center">
          <div style="font-size:48px;margin-bottom:12px">🖥️</div>
          <h2 style="margin:0 0 8px">Freezy-OS</h2>
          <p style="opacity:.7;margin:0 0 16px">A web-based operating system by FRZ Generations</p>
          <p style="opacity:.5;font-size:13px">Version 1.0.0 · Built with Firebase + Vanilla JS</p>
          <p style="opacity:.5;font-size:12px;margin-top:12px">© FRZ Generations · frzgenerations@gmail.com</p>
        </div>
      `, { w: 380, h: 280 });
    }
  }
  window.showAbout = showAbout;

  // ─── openApp helper (delegates to window-manager) ─────────────────────────
  /**
   * Opens an app by id. Delegates to window.openApp from window-manager.js.
   * Defined here as a no-op fallback — window-manager.js overrides it.
   * @param {string} id
   */
  function openApp(id) {
    if (typeof window._wmOpenApp === 'function') {
      window._wmOpenApp(id);
    } else {
      console.warn('[desktop] window-manager not ready for app:', id);
    }
  }

  // ─── initDesktop ─────────────────────────────────────────────────────────
  /**
   * Called once when the OS desktop loads. Builds all desktop UI elements.
   */
  function initDesktop() {
    buildDesktopIcons();
    buildDock();
    buildDrawer();

    // Desktop right-click
    const desktopEl = document.getElementById('desktop');
    if (desktopEl) {
      desktopEl.addEventListener('contextmenu', (e) => {
        // Only if clicking on the desktop itself, not an icon
        if (e.target === desktopEl || e.target.id === 'desktop-icons') {
          e.preventDefault();
          showDesktopContextMenu(e);
        }
      });
    }

    // Drawer search input
    const searchEl = document.getElementById('drawer-search');
    if (searchEl) {
      searchEl.addEventListener('input', () => filterDrawerApps(searchEl.value));
    }

    // Close drawer on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawerOpen) closeDrawer();
    });

    console.log('[desktop] Desktop initialized');
  }
  window.initDesktop = initDesktop;
})();
