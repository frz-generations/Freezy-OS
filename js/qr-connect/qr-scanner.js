// ============================================================
// qr-scanner.js — QR Connect: Phone/Scanner Side
// Camera-based QR scan + manual code entry
// Exposes: window.buildQRScanner, window.initQRScanner,
//          window.startQRScan, window.stopQRScan,
//          window.processQRCode, window.submitManualCode
// ============================================================

let _scanStream     = null;
let _scanAnimFrame  = null;
let _scanActive     = false;
let _scanVideo      = null;
let _scanCanvas     = null;
let _scanCtx        = null;

window.buildQRScanner = function () {
  return `
    <div class="qs-wrap">
      <div class="qs-top">
        <div class="qs-title">QR CONNECT</div>
        <div class="qs-sub">Scan the code on your PC / TV screen</div>
      </div>

      <!-- Manual code entry — shown first as primary method -->
      <div class="qs-manual-section">
        <div class="qs-manual-title">ENTER CODE FROM YOUR SCREEN</div>
        <div class="qs-manual-sub">Open QR Connect on your PC or TV, then enter the 6-character code shown.</div>
        <input class="qs-code-input" id="qsManualCode" type="text" maxlength="6"
          placeholder="e.g. FRZ4K9"
          oninput="this.value=this.value.toUpperCase().replace(/[^A-Z0-9]/g,'')"
          onkeydown="if(event.key==='Enter')submitManualCode()" />
        <button class="qs-connect-btn" onclick="submitManualCode()">Connect →</button>
      </div>

      <div class="qs-or">— OR SCAN THE QR CODE —</div>

      <!-- Camera section -->
      <div class="qs-camera-section" id="qsCameraSection">
        <div class="qs-viewfinder" id="qsViewfinder">
          <video id="qsScanVideo" autoplay playsinline muted style="width:100%;height:100%;object-fit:cover;border-radius:10px;"></video>
          <div class="qs-scan-line" id="qsScanLine"></div>
          <div class="qs-scan-corners">
            <div class="qs-corner tl"></div>
            <div class="qs-corner tr"></div>
            <div class="qs-corner bl"></div>
            <div class="qs-corner br"></div>
          </div>
        </div>
        <canvas id="qsScanCanvas" style="display:none;"></canvas>

        <div class="qs-cam-controls">
          <button class="qs-cam-btn" id="qsStartBtn" onclick="startQRScan()">📷 Start Camera</button>
          <button class="qs-cam-btn" id="qsStopBtn"  onclick="stopQRScan()"  style="display:none;">⏹ Stop Camera</button>
        </div>

        <div class="qs-cam-status" id="qsCamStatus">Camera is off. Tap "Start Camera" to scan.</div>
        <div class="qs-cam-denied" id="qsCamDenied" style="display:none;">
          ⚠️ Camera access denied. Please allow camera access in your browser settings, or use the code entry above.
        </div>
      </div>

      <div class="qs-result" id="qsResult" style="display:none;"></div>

      <div class="qs-help">
        <details class="qs-details">
          <summary class="qs-details-summary">What is QR Connect?</summary>
          <div class="qs-details-body">
            QR Connect lets you mirror your Freezy-OS session from your phone to a PC, tablet, or TV in seconds.
            Open QR Connect on the receiving device and either scan the QR code with this scanner, or type the 6-character code shown on screen.
            Sessions expire in 60 seconds and are deleted immediately after use for your security.
          </div>
        </details>
      </div>
    </div>

    <style>
      .qs-wrap { display:flex; flex-direction:column; gap:14px; padding:16px; height:100%; box-sizing:border-box; overflow-y:auto; align-items:center; }
      .qs-top { text-align:center; }
      .qs-title { font-size:22px; font-weight:900; color:var(--accent,#00d4ff); letter-spacing:3px; }
      .qs-sub { font-size:12px; color:var(--text2,#888); margin-top:4px; }
      .qs-manual-section { background:var(--surface2,#1e1e2e); border-radius:14px; padding:16px; width:100%; max-width:320px; box-sizing:border-box; display:flex; flex-direction:column; gap:10px; align-items:center; border:1px solid var(--accent,#00d4ff); }
      .qs-manual-title { font-size:11px; text-transform:uppercase; letter-spacing:1px; color:var(--accent,#00d4ff); font-weight:700; }
      .qs-manual-sub { font-size:12px; color:var(--text2,#888); text-align:center; line-height:1.4; }
      .qs-code-input { background:var(--surface,#12121e); border:2px solid var(--accent,#00d4ff); color:var(--accent,#00d4ff); padding:12px 16px; border-radius:10px; font-size:28px; font-family:monospace; font-weight:900; letter-spacing:8px; text-align:center; text-transform:uppercase; width:100%; box-sizing:border-box; }
      .qs-code-input:focus { outline:none; }
      .qs-connect-btn { background:var(--accent,#00d4ff); color:#000; border:none; padding:11px 30px; border-radius:10px; font-size:15px; font-weight:800; cursor:pointer; width:100%; transition:background 0.15s; }
      .qs-connect-btn:hover { background:var(--accent2,#00b8d9); }
      .qs-or { font-size:11px; color:var(--text2,#888); text-transform:uppercase; letter-spacing:1px; }
      .qs-camera-section { width:100%; max-width:320px; display:flex; flex-direction:column; gap:10px; align-items:center; }
      .qs-viewfinder { width:220px; height:220px; border-radius:12px; overflow:hidden; background:#000; position:relative; flex-shrink:0; }
      .qs-scan-line { position:absolute; left:10px; right:10px; height:2px; background:var(--accent,#00d4ff); top:50%; transform:translateY(-50%); animation:qsScan 2s ease-in-out infinite; box-shadow:0 0 8px var(--accent,#00d4ff); pointer-events:none; }
      @keyframes qsScan { 0%,100%{top:15%} 50%{top:85%} }
      .qs-scan-corners { position:absolute; inset:0; pointer-events:none; }
      .qs-corner { position:absolute; width:22px; height:22px; border-color:var(--accent,#00d4ff); border-style:solid; }
      .qs-corner.tl { top:6px;    left:6px;    border-width:3px 0 0 3px; border-radius:4px 0 0 0; }
      .qs-corner.tr { top:6px;    right:6px;   border-width:3px 3px 0 0; border-radius:0 4px 0 0; }
      .qs-corner.bl { bottom:6px; left:6px;    border-width:0 0 3px 3px; border-radius:0 0 0 4px; }
      .qs-corner.br { bottom:6px; right:6px;   border-width:0 3px 3px 0; border-radius:0 0 4px 0; }
      .qs-cam-controls { display:flex; gap:8px; }
      .qs-cam-btn { background:var(--surface2,#1e1e2e); border:1px solid var(--border,#333); color:var(--text,#cdd6f4); padding:7px 16px; border-radius:8px; font-size:12px; cursor:pointer; transition:background 0.15s; }
      .qs-cam-btn:hover { background:var(--surface3,#2a2a3e); }
      .qs-cam-status { font-size:12px; color:var(--text2,#888); text-align:center; }
      .qs-cam-denied { font-size:12px; color:#f38ba8; text-align:center; line-height:1.4; }
      .qs-result { width:100%; max-width:320px; padding:12px 16px; border-radius:10px; font-size:13px; font-weight:600; text-align:center; }
      .qs-result.success { background:rgba(166,227,161,0.15); border:1px solid #a6e3a1; color:#a6e3a1; }
      .qs-result.error   { background:rgba(243,139,168,0.12); border:1px solid #f38ba8; color:#f38ba8; }
      .qs-help { width:100%; max-width:320px; }
      .qs-details { background:var(--surface2,#1e1e2e); border-radius:10px; border:1px solid var(--border,#2a2a3e); overflow:hidden; }
      .qs-details-summary { padding:10px 14px; font-size:12px; color:var(--text2,#888); cursor:pointer; list-style:none; }
      .qs-details-summary:hover { color:var(--text,#cdd6f4); }
      .qs-details-body { padding:10px 14px; font-size:12px; color:var(--text2,#888); line-height:1.6; border-top:1px solid var(--border,#2a2a3e); }
    </style>
  `;
};

window.initQRScanner = function () {
  _scanVideo  = document.getElementById('qsScanVideo');
  _scanCanvas = document.getElementById('qsScanCanvas');
  if (_scanCanvas) _scanCtx = _scanCanvas.getContext('2d');
};

window.startQRScan = function () {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    _qsShowDenied('Camera API not supported in this browser.');
    return;
  }

  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    .then(stream => {
      _scanStream  = stream;
      _scanActive  = true;
      _scanVideo   = document.getElementById('qsScanVideo');
      _scanCanvas  = document.getElementById('qsScanCanvas');
      if (_scanCanvas) _scanCtx = _scanCanvas.getContext('2d');

      if (_scanVideo) {
        _scanVideo.srcObject = stream;
        _scanVideo.play();
      }

      document.getElementById('qsStartBtn').style.display = 'none';
      document.getElementById('qsStopBtn').style.display  = '';
      document.getElementById('qsCamStatus').textContent   = '📷 Scanning... Point camera at the QR code.';
      document.getElementById('qsCamDenied').style.display = 'none';

      _qsScanLoop();
    })
    .catch(err => {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        _qsShowDenied();
      } else {
        _qsShowDenied('Camera not available: ' + err.message);
      }
    });
};

window.stopQRScan = function () {
  _scanActive = false;
  if (_scanAnimFrame) { cancelAnimationFrame(_scanAnimFrame); _scanAnimFrame = null; }
  if (_scanStream) {
    _scanStream.getTracks().forEach(t => t.stop());
    _scanStream = null;
  }
  if (_scanVideo) { _scanVideo.srcObject = null; }
  document.getElementById('qsStartBtn').style.display = '';
  document.getElementById('qsStopBtn').style.display  = 'none';
  document.getElementById('qsCamStatus').textContent   = 'Camera stopped.';
};

window.processQRCode = function (data) {
  if (!data || !data.startsWith('freezyos-connect:')) {
    _qsShowResult('Not a valid Freezy-OS QR code. Try again.', false);
    return;
  }
  const code = data.replace('freezyos-connect:', '').trim().toUpperCase();
  if (code.length !== 6) {
    _qsShowResult('Invalid code format. Try again.', false);
    return;
  }

  stopQRScan(); // Stop camera immediately after successful scan

  _qsShowResult('✅ Code detected: ' + code + '. Connecting...', true);

  if (window.connectToSession) {
    window.connectToSession(code);
  } else {
    _qsShowResult('Sync module not loaded. Please reload.', false);
  }
};

window.submitManualCode = function () {
  const inp  = document.getElementById('qsManualCode');
  const code = inp ? inp.value.trim().toUpperCase() : '';
  if (code.length !== 6) {
    if (window.notify) window.notify('Enter the full 6-character code.');
    if (inp) { inp.style.borderColor = '#f38ba8'; setTimeout(() => { inp.style.borderColor = ''; }, 2000); }
    return;
  }
  _qsShowResult('⏳ Connecting to session ' + code + '...', true);
  if (window.connectToSession) {
    window.connectToSession(code);
  } else {
    _qsShowResult('Sync module not loaded. Please reload.', false);
  }
};

// ── Internals ────────────────────────────────────────────────

function _qsScanLoop() {
  if (!_scanActive) return;

  const video  = document.getElementById('qsScanVideo');
  const canvas = document.getElementById('qsScanCanvas');
  if (!video || !canvas || video.readyState < 2) {
    _scanAnimFrame = requestAnimationFrame(_qsScanLoop);
    return;
  }

  const ctx = canvas.getContext('2d');
  canvas.width  = video.videoWidth;
  canvas.height = video.videoHeight;
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  try {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    if (typeof jsQR !== 'undefined') {
      const result = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });
      if (result && result.data) {
        processQRCode(result.data);
        return; // Stop loop after finding code
      }
    }
  } catch(e) {}

  _scanAnimFrame = requestAnimationFrame(_qsScanLoop);
}

function _qsShowDenied(msg) {
  const el = document.getElementById('qsCamDenied');
  if (el) {
    el.style.display = 'block';
    el.textContent   = '⚠️ ' + (msg || 'Camera access denied. Allow camera in browser settings, or use the code field above.');
  }
  document.getElementById('qsCamStatus').style.display = 'none';
}

function _qsShowResult(msg, success) {
  const el = document.getElementById('qsResult');
  if (!el) return;
  el.style.display = 'block';
  el.className     = 'qs-result ' + (success ? 'success' : 'error');
  el.textContent   = msg;
}

// Cleanup on window close
window.cleanupQRScanner = function () {
  stopQRScan();
};
