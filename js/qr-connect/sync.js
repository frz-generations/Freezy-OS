// ============================================================
// sync.js — QR Connect: Firebase Realtime DB Bridge
// Manages session creation, listening, transfer, and cleanup
// Exposes: window.connectToSession, window.listenForConnection,
//          window.transferSession, window.endQRSession,
//          window.validateQRCode
// ============================================================

// ── Firebase DB reference helper ────────────────────────────
function _syncRef(path) {
  if (window._firebaseRTDB) return window._firebaseRTDB.ref(path);
  if (window.firebase && window.firebase.database) return window.firebase.database().ref(path);
  return null;
}

// ── connectToSession (Phone → connects to PC's session) ─────
window.connectToSession = function (code) {
  if (!code || code.length !== 6) {
    _syncNotify('Invalid session code.', false);
    return;
  }

  const sessionRef = _syncRef('qr_sessions/' + code);
  if (!sessionRef) {
    _syncFallbackConnect(code);
    return;
  }

  sessionRef.once('value').then(snap => {
    const data = snap.val();

    if (!data) {
      _syncNotify('Code not found. It may have expired — ask for a new code.', false);
      _syncShowResult('Code not found or expired. Please refresh the QR on the other device.', false);
      return;
    }

    if (data.expires && Date.now() > data.expires) {
      sessionRef.remove();
      _syncNotify('Session expired. Please generate a new code.', false);
      _syncShowResult('Session expired. Ask the other device to refresh its QR code.', false);
      return;
    }

    if (data.connected) {
      _syncNotify('This code has already been used.', false);
      _syncShowResult('This code was already used. Ask for a new code.', false);
      return;
    }

    // Mark as connected — the PC side is listening for this
    const currentUser = _syncGetCurrentUser();
    sessionRef.update({
      connected: true,
      connectedAt: Date.now(),
      phoneUid: currentUser ? currentUser.uid : 'unknown',
      phoneName: currentUser ? (currentUser.displayName || 'Phone user') : 'Phone user'
    }).then(() => {
      _syncNotify('✅ Connected! Your session is being transferred.', true);
      _syncShowResult('✅ Connected to session ' + code + '. Transferring...', true);

      // Auto-remove session after 5s (PC side also removes it)
      setTimeout(() => {
        try { sessionRef.remove(); } catch(e){}
      }, 5000);
    }).catch(err => {
      _syncNotify('Connection failed: ' + err.message, false);
      _syncShowResult('Connection failed. Please try again.', false);
    });

  }).catch(err => {
    _syncNotify('Could not reach server. Check your connection.', false);
    _syncShowResult('Network error. Check your connection and try again.', false);
  });
};

// ── listenForConnection (PC → waits for phone to connect) ────
window.listenForConnection = function (code, callback) {
  const sessionRef = _syncRef('qr_sessions/' + code);
  if (!sessionRef) return;

  const connectedRef = sessionRef.child('connected');

  const handler = connectedRef.on('value', snap => {
    const val = snap.val();
    if (val === true) {
      connectedRef.off('value', handler);

      // Get full session data to know who connected
      sessionRef.once('value').then(fullSnap => {
        const data = fullSnap.val() || {};
        if (callback) callback(true, data);

        // Load connecting user's OS data if uid is present
        if (data.phoneUid && data.phoneUid !== 'unknown') {
          _syncLoadUserSession(data.phoneUid, data.phoneName || 'Connected user');
        }

        // Remove session after use
        setTimeout(() => {
          try { sessionRef.remove(); } catch(e){}
        }, 3000);
      });
    }
  });

  // Return unsubscribe function
  return () => connectedRef.off('value', handler);
};

// ── transferSession (Load another user's OS settings) ────────
window.transferSession = function (sessionData) {
  if (!sessionData) return;

  const name = sessionData.phoneName || sessionData.name || 'Transferred user';

  // Update session storage to reflect the transferred user
  try {
    const stored = JSON.parse(sessionStorage.getItem('freezy_user') || '{}');
    sessionStorage.setItem('freezy_user', JSON.stringify({
      ...stored,
      transferredFrom: stored.uid,
      ...sessionData,
    }));
  } catch(e){}

  if (window.notify) window.notify('✅ Session transferred from ' + name);

  // Apply their OS settings if available
  if (sessionData.osSettings) {
    _syncApplyOSSettings(sessionData.osSettings);
  }
};

// ── endQRSession (Cleanup) ───────────────────────────────────
window.endQRSession = function (code) {
  if (!code) return;
  const ref = _syncRef('qr_sessions/' + code);
  if (ref) try { ref.remove(); } catch(e){}
};

// ── validateQRCode ───────────────────────────────────────────
window.validateQRCode = function (code) {
  return new Promise((resolve, reject) => {
    if (!code || code.length !== 6) { reject('Invalid code format'); return; }
    const ref = _syncRef('qr_sessions/' + code);
    if (!ref) { reject('Firebase not available'); return; }
    ref.once('value').then(snap => {
      const data = snap.val();
      if (!data)                          { reject('Code not found'); return; }
      if (Date.now() > (data.expires||0)) { reject('Code expired');   return; }
      if (data.connected)                 { reject('Code already used'); return; }
      resolve(data);
    }).catch(reject);
  });
};

// ── Internal helpers ─────────────────────────────────────────

function _syncLoadUserSession(uid, displayName) {
  // Load OS settings from Firestore for the connecting user
  if (!window.firebase || !window.firebase.firestore) {
    // No Firestore — just show notification
    if (window.notify) window.notify('📱 ' + displayName + ' connected.');
    return;
  }

  const db = window.firebase.firestore();
  db.collection('users').doc(uid).get().then(doc => {
    if (!doc.exists) {
      if (window.notify) window.notify('📱 ' + displayName + ' connected.');
      return;
    }
    const data = doc.data() || {};
    window.transferSession({ ...data, phoneName: displayName, phoneUid: uid });
  }).catch(() => {
    if (window.notify) window.notify('📱 ' + displayName + ' connected.');
  });
}

function _syncApplyOSSettings(settings) {
  if (!settings) return;
  try {
    // Apply wallpaper
    if (settings.wallpaper && window.applyWallpaper) {
      window.applyWallpaper(settings.wallpaper);
    }
    // Apply theme
    if (settings.theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    // Merge settings into localStorage
    const current = JSON.parse(localStorage.getItem('freezy_settings') || '{}');
    localStorage.setItem('freezy_settings', JSON.stringify({ ...current, ...settings }));
  } catch(e){}
}

function _syncGetCurrentUser() {
  try {
    if (window.firebase && window.firebase.auth && window.firebase.auth().currentUser) {
      return window.firebase.auth().currentUser;
    }
    return JSON.parse(sessionStorage.getItem('freezy_user') || 'null');
  } catch(e) { return null; }
}

function _syncNotify(msg, success) {
  if (window.notify) window.notify((success ? '' : '⚠️ ') + msg);
}

function _syncShowResult(msg, success) {
  // Update QR scanner result panel if visible
  const el = document.getElementById('qsResult');
  if (el) {
    el.style.display = 'block';
    el.className     = 'qs-result ' + (success ? 'success' : 'error');
    el.textContent   = msg;
  }
  // Update QR generator status if visible
  const statusEl = document.getElementById('qrStatus');
  if (statusEl) {
    statusEl.textContent = msg;
    statusEl.className   = 'qr-status' + (success ? ' success' : '');
  }
}

// Fallback when Firebase is unavailable (demo mode)
function _syncFallbackConnect(code) {
  _syncNotify('Firebase not configured. QR Connect requires Firebase Realtime Database.', false);
  _syncShowResult(
    'Firebase not set up. Configure Firebase in your environment to enable QR Connect cross-device sync.',
    false
  );
}

// ── Firebase Realtime DB Security Rules (for reference) ──────
// Place these rules in your Firebase console → Realtime Database → Rules:
//
// {
//   "rules": {
//     "qr_sessions": {
//       "$code": {
//         ".read":     "auth != null",
//         ".write":    "auth != null",
//         ".validate": "newData.child('uid').isString() && newData.child('expires').isNumber()"
//       }
//     }
//   }
// }
//
// Only authenticated users can create or read sessions.
// Sessions must include a uid string and an expires timestamp.
