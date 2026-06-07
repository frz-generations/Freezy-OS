// ============================================================
// FREEZY-OS SERVICE WORKER
// FRZ Generations © 2026
// ============================================================
// WHAT THIS CACHES (works offline after first load):
//   - index.html, os.html, terms.html
//   - css/ folder (all CSS files)
//   - js/ folder (all JS files)
//   - assets/ folder (icons, wallpapers)
//   - apps/ folder (JSON config files)
//   - Google Fonts (cached after first load)
//
// WHAT REQUIRES INTERNET (cannot work offline):
//   - Firebase Auth (login)
//   - Firestore (settings sync)
//   - Realtime Database (QR connect, suspension)
//   - Weather API
//   - Prayer Times API
//   - Maps / Nominatim
//   - Google Search API
//   - Google Drive API
//   - Iframed tools
// ============================================================

const CACHE_NAME = 'freezy-os-v1.0.0';

// Files to cache on install
const STATIC_CACHE = [
  '/',
  '/index.html',
  '/os.html',
  '/terms.html',
  '/css/main.css',
  '/css/desktop.css',
  '/css/windows.css',
  '/css/apps.css',
  '/css/themes/dark-frz.css',
  '/css/themes/light-frz.css',
  '/js/core/detect.js',
  '/js/core/boot.js',
  '/js/core/auth.js',
  '/js/core/desktop.js',
  '/js/core/window-manager.js',
  '/js/core/taskbar.js',
  '/js/system/volume.js',
  '/js/system/brightness.js',
  '/js/system/sleep.js',
  '/js/system/shortcuts.js',
  '/js/system/permissions.js',
  '/js/system/notifications.js',
  '/js/storage/drive.js',
  '/js/storage/firestore.js',
  '/js/storage/sheets.js',
  '/js/apps/calculator.js',
  '/js/apps/unit-converter.js',
  '/js/apps/weather.js',
  '/js/apps/prayer-times.js',
  '/js/apps/calendar.js',
  '/js/apps/maps.js',
  '/js/apps/music-player.js',
  '/js/apps/file-manager.js',
  '/js/apps/code-editor.js',
  '/js/apps/office-word.js',
  '/js/apps/office-excel.js',
  '/js/apps/whiteboard.js',
  '/js/apps/settings.js',
  '/js/apps/how-to.js',
  '/js/apps/search.js',
  '/js/apps/browser.js',
  '/js/apps/community.js',
  '/js/apps/library.js',
  '/js/apps/hijri.js',
  '/js/apps/religious-cal.js',
  '/js/qr-connect/qr-generator.js',
  '/js/qr-connect/qr-scanner.js',
  '/js/qr-connect/sync.js',
  '/firebase/firebase-config.js',
  '/apps/iframe-apps.json',
  '/apps/app-manifest.json',
  '/assets/icons/apps/freezy-os.png',
  '/assets/wallpapers/default-frz.jpg',
  '/public/manifest.json',
];

// ============================================================
// INSTALL — Cache static files
// ============================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Freezy-OS SW: Caching static files');
      // Use addAll but don't fail if some files missing
      return Promise.allSettled(
        STATIC_CACHE.map(url =>
          cache.add(url).catch(err =>
            console.warn('SW: Could not cache:', url, err.message)
          )
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ============================================================
// ACTIVATE — Clean old caches
// ============================================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => {
            console.log('Freezy-OS SW: Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// ============================================================
// FETCH — Serve from cache, fall back to network
// ============================================================
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Always go network-first for Firebase, APIs, external URLs
  const networkFirstDomains = [
    'firebaseapp.com',
    'firebase.google.com',
    'googleapis.com',
    'gstatic.com',
    'openweathermap.org',
    'aladhan.com',
    'nominatim.openstreetmap.org',
    'openrouteservice.org',
    'ipify.org',
    'ui-avatars.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com',
    'netlify.app',
    'xo.je',
  ];

  const isNetworkFirst = networkFirstDomains.some(domain =>
    url.hostname.includes(domain)
  );

  if (isNetworkFirst) {
    // Network first — don't cache API responses
    event.respondWith(
      fetch(event.request).catch(() => {
        // If network fails and it's a page request — show offline page
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503 });
      })
    );
    return;
  }

  // Cache first for static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) return cachedResponse;

      // Not in cache — fetch from network and cache it
      return fetch(event.request).then((response) => {
        // Only cache successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        // Network failed — return offline fallback for HTML
        if (event.request.destination === 'document') {
          return caches.match('/index.html');
        }
      });
    })
  );
});
