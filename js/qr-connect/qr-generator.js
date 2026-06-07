// ============================================================
// qr-generator.js — QR Connect: PC/TV Side
// Generates session code + QR, listens for phone connection
// Exposes: window.buildQRConnect, window.initQRConnect,
//          window.refreshQR, window.connectWithCode
// ============================================================

const QR_SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const QR_CODE_TTL   = 60; // seconds

let _qrCode       = '';
let _qrTimer      = QR_CODE_TTL;
let _qrInterval   = null;
let _qrListener   = null;
let _qrQRInstance = null;
let _qrSessionRef = null;

window.buildQRConnect = function () {
  return `
    <div class="qr-wrap">
      <div class="qr-top">
        <div class="qr-title">QR CONNECT</div>
        <div class="qr-sub">Scan QR or enter the code on your phone to mirror your session</div>
      </div>

      <div class="qr-box-section">
        <div class="qr-code-box" id="qrCodeBox">
          <div id="qrCanvasWrap"></div>
        </div>

        <div class="qr-or">— OR ENTER THIS CODE ON YOUR PHONE —</div>

        <div class="qr-code-display" id="qrCodeDisplay">——————</div>
        <div class="qr-timer-row">
          <div class="qr-timer-bar-wrap"><div class="qr-timer-bar" id="qrTimerBar"></div></div>
          <span class="qr-timer-label" id="qrTimerLabel">60s</span>
        </div>

        <div class="qr-status" id="qrStatus">⏳ Waiting for connection...</div>

        <button class="qr-refresh-btn" onclick="refreshQR()">🔄 Refresh Code</button>
      </div>

      <div class="qr-info-box">
        <div class="qr-info-item">📱 Open Freezy-OS on your phone</div>
        <div class="qr-info-item">📷 Tap "QR Connect" and scan, or enter the code</div>
        <div class="qr-info-item">✅ Your phone session instantly mirrors here</div>
      </div>

      <div class="qr-connect-section">
        <div class="qr-connect-title">CONNECTING FROM ANOTHER DEVICE?</div>
        <div class="qr-connect-sub">Enter a code shown on another Freezy-OS device to load their session here.</div>
        <div class="qr-connect-row">
          <input class="qr-code-input" id="qrManualInput" type="text" maxlength="6"
            placeholder="e.g. FRZ4K9"
            oninput="this.value=this.value.toUpperCase().replace(/[^A-Z0-9]/g,'')"
            onkeydown="if(event.key==='Enter')connectWithCode()" />
          <button class="qr-connect-btn" onclick="connectWithCode()">Connect →</button>
        </div>
      </div>
    </div>

    <style>
      .qr-wrap { display:flex; flex-direction:column; gap:14px; padding:16px; height:100%; box-sizing:border-box; overflow-y:auto; align-items:center; }
      .qr-top { text-align:center; }
      .qr-title { font-size:22px; font-weight:900; color:var(--accent,#00d4ff); letter-spacing:3px; }
      .qr-sub { font-size:12px; color:var(--text2,#888); margin-top:4px; }
      .qr-box-section { display:flex; flex-direction:column; align-items:center; gap:10px; width:100%; max-width:320px; }
      .qr-code-box { background:#fff; border-radius:14px; padding:14px; display:flex; align-items:center; justify-content:center; min-width:160px; min-height:160px; }
      .qr-or { font-size:11px; color:var(--text2,#888); text-transform:uppercase; letter-spacing:1px; }
      .qr-code-display { font-size:32px; font-family:monospace; font-weight:900; color:var(--accent,#00d4ff); letter-spacing:8px; text-align:center; min-height:44px; }
      .qr-timer-row { display:flex; align-items:center; gap:8px; width:100%; }
      .qr-timer-bar-wrap { flex:1; height:5px; background:var(--surface2,#1e1e2e); border-radius:3px; overflow:hidden; }
      .qr-timer-bar { height:100%; background:var(--accent,#00d4ff); border-radius:3px; transition:width 1s linear; width:100%; }
      .qr-timer-label { font-size:12px; font-family:monospace; color:var(--text2,#888); min-width:26px; }
      .qr-status { font-size:13px; color:var(--text2,#888); text-align:center; min-height:20px; }
      .qr-status.success { color:#a6e3a1; font-weight:700; }
      .qr-refresh-btn { background:var(--surface2,#1e1e2e); border:1px solid var(--border,#333); color:var(--text,#cdd6f4); padding:7px 18px; border-radius:8px; font-size:12px; cursor:pointer; transition:background 0.15s; }
      .qr-refresh-btn:hover { background:var(--surface3,#2a2a3e); }
      .qr-info-box { background:var(--surface2,#1e1e2e); border-radius:12px; padding:12px 16px; width:100%; max-width:320px; display:flex; flex-direction:column; gap:7px; box-sizing:border-box; }
      .qr-info-item { font-size:12px; color:var(--text,#cdd6f4); }
      .qr-connect-section { background:var(--surface2,#1e1e2e); border-radius:12px; padding:14px 16px; width:100%; max-width:320px; box-sizing:border-box; display:flex; flex-direction:column; gap:8px; }
      .qr-connect-title { font-size:11px; text-transform:uppercase; letter-spacing:1px; color:var(--text2,#888); font-weight:700; }
      .qr-connect-sub { font-size:11px; color:var(--text2,#777); line-height:1.4; }
      .qr-connect-row { display:flex; gap:6px; }
      .qr-code-input { flex:1; background:var(--surface,#12121e); border:1px solid var(--border,#333); color:var(--accent,#00d4ff); padding:8px 12px; border-radius:8px; font-size:16px; font-family:monospace; font-weight:700; letter-spacing:4px; text-transform:uppercase; text-align:center; }
      .qr-code-input:focus { outline:none; border-color:var(--accent,#00d4ff); }
      .qr-connect-btn { background:var(--accent,#00d4ff); color:#000; border:none; padding:8px 16px; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; transition:background 0.15s; white-space:nowrap; }
      .qr-connect-btn:hover { background:var(--accent2,#00b8d9); }
    </style>
  `;
};

window.initQRConnect = function () {
  refreshQR();
};

window.refreshQR = function () {
  // Clean up old session
  if (_qrSessionRef) {
    try { _qrSessionRef.remove(); } catch(e){}
    _qrSessionRef = null;
  }
  if (_qrListener) {
    try { _qrListener(); } catch(e){}
    _qrListener = null;
  }
  if (_qrInterval) { clearInterval(_qrInterval); _qrInterval = null; }

  _qrCode  = _qrGenCode();
  _qrTimer = QR_CODE_TTL;

  _qrRenderQR(_qrCode);
  _qrUpdateCodeDisplay(_qrCode);
  _qrSetStatus('⏳ Waiting for connection...');
  _qrStartTimer();
  _qrCreateSession(_qrCode);
};

window.connectWithCode = function () {
  const inp = document.getElementById('qrManualInput');
  const code = inp ? inp.value.trim().toUpperCase() : '';
  if (code.length !== 6) {
    if (window.notify) window.notify('Enter a valid 6-character code.');
    return;
  }
  if (window.connectToSession) {
    window.connectToSession(code);
  } else {
    if (window.notify) window.notify('QR Connect sync not available.');
  }
};

// ── Internals ────────────────────────────────────────────────

function _qrGenCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += QR_SAFE_CHARS[Math.floor(Math.random() * QR_SAFE_CHARS.length)];
  }
  return code;
}

function _qrRenderQR(code) {
  const wrap = document.getElementById('qrCanvasWrap');
  if (!wrap) return;
  wrap.innerHTML = '';
  _qrQRInstance = null;

  const content = 'freezyos-connect:' + code;

  if (typeof QRCode !== 'undefined') {
    try {
      _qrQRInstance = new QRCode(wrap, {
        text: content,
        width: 160,
        height: 160,
        colorDark: '#000000',
        colorLight: '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
      });
    } catch(e) {
      wrap.innerHTML = `<div style="font-size:11px;color:#888;text-align:center;padding:10px;">QR library error.<br>Use the code below.</div>`;
    }
  } else {
    wrap.innerHTML = `<div style="font-size:11px;color:#888;text-align:center;padding:10px;">QRCode.js not loaded.<br>Use the code below.</div>`;
  }
}

function _qrUpdateCodeDisplay(code) {
  const el = document.getElementById('qrCodeDisplay');
  if (el) el.textContent = code;
}

function _qrSetStatus(msg, success) {
  const el = document.getElementById('qrStatus');
  if (!el) return;
  el.textContent = msg;
  el.className = 'qr-status' + (success ? ' success' : '');
}

function _qrStartTimer() {
  const bar   = document.getElementById('qrTimerBar');
  const label = document.getElementById('qrTimerLabel');

  _qrInterval = setInterval(() => {
    _qrTimer--;
    const pct = (_qrTimer / QR_CODE_TTL) * 100;
    if (bar)   bar.style.width = pct + '%';
    if (label) label.textContent = _qrTimer + 's';

    if (_qrTimer <= 10 && bar) bar.style.background = '#f38ba8';
    if (_qrTimer <= 0) {
      clearInterval(_qrInterval);
      _qrInterval = null;
      refreshQR();
    }
  }, 1000);
}

function _qrCreateSession(code) {
  if (!window._firebaseRTDB) return; // Firebase not available

  const user = _qrGetCurrentUser();
  if (!user) return;

  const sessionData = {
    uid:       user.uid,
    name:      user.displayName || 'Unknown',
    email:     user.email || '',
    expires:   Date.now() + (QR_CODE_TTL * 1000),
    connected: false
  };

  try {
    _qrSessionRef = window._firebaseRTDB.ref('qr_sessions/' + code);
    _qrSessionRef.set(sessionData);

    // Auto-cleanup on disconnect
    _qrSessionRef.onDisconnect().remove();

    // Listen for connection
    if (window.listenForConnection) {
      window.listenForConnection(code, (connected) => {
        if (connected) {
          _qrSetStatus('✅ Connected! Transferring session...', true);
          if (window.notify) window.notify('📱 Device connected via QR!');
          setTimeout(() => {
            if (_qrSessionRef) { try { _qrSessionRef.remove(); } catch(e){} _qrSessionRef = null; }
            if (_qrInterval)   { clearInterval(_qrInterval); _qrInterval = null; }
          }, 3000);
        }
      });
    }
  } catch(e) {
    // Firebase unavailable — QR code still shows for manual use
  }
}

function _qrGetCurrentUser() {
  // Try Firebase auth
  if (window.firebase && window.firebase.auth && window.firebase.auth().currentUser) {
    return window.firebase.auth().currentUser;
  }
  // Try session storage fallback
  try {
    const u = JSON.parse(sessionStorage.getItem('freezy_user') || 'null');
    return u;
  } catch(e) { return null; }
}

// Cleanup when QR Connect window is closed
window.cleanupQRConnect = function () {
  if (_qrSessionRef) { try { _qrSessionRef.remove(); } catch(e){} _qrSessionRef = null; }
  if (_qrInterval)   { clearInterval(_qrInterval); _qrInterval = null; }
  if (_qrListener)   { try { _qrListener(); } catch(e){} _qrListener = null; }
};
