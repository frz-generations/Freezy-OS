// ============================================================
// whiteboard.js — Canvas Drawing App
// Exposes: window.buildWhiteboard, window.initWhiteboard,
//          window.setWbTool, window.undoWb, window.clearWb,
//          window.downloadWb, window.downloadWbPDF,
//          window.cleanupWhiteboard
// ============================================================

let wbCanvas = null;
let wbCtx = null;
let wbDrawing = false;
let wbTool = 'pen';
let wbHistory = [];
let wbStart = { x:0, y:0 };
let wbColor = '#00d4ff';
let wbSize = 4;
let wbSnapshotBeforeDraw = null;

window.buildWhiteboard = function () {
  return `
    <div class="wb-wrap">
      <div class="wb-toolbar">
        <div class="wb-tool-group">
          <button class="wb-tool-btn active" id="wbToolPen"    onclick="setWbTool('pen',this)"    title="Pen">✏️</button>
          <button class="wb-tool-btn"        id="wbToolEraser" onclick="setWbTool('eraser',this)" title="Eraser">⬜</button>
          <button class="wb-tool-btn"        id="wbToolLine"   onclick="setWbTool('line',this)"   title="Line">╱</button>
          <button class="wb-tool-btn"        id="wbToolRect"   onclick="setWbTool('rect',this)"   title="Rectangle">▭</button>
          <button class="wb-tool-btn"        id="wbToolCircle" onclick="setWbTool('circle',this)" title="Ellipse">◯</button>
          <button class="wb-tool-btn"        id="wbToolText"   onclick="setWbTool('text',this)"   title="Text">T</button>
        </div>

        <div class="wb-tool-group">
          <input type="color" class="wb-color-pick" id="wbColorPick" value="#00d4ff" oninput="wbSetColor(this.value)" title="Color" />
          <input type="range" class="wb-size-range" id="wbSizeRange" min="1" max="30" value="4" oninput="wbSetSize(this.value)" title="Brush size" />
          <span class="wb-size-label" id="wbSizeLabel">4px</span>
        </div>

        <div class="wb-tool-group">
          <button class="wb-action-btn" onclick="undoWb()"       title="Undo">↩ Undo</button>
          <button class="wb-action-btn" onclick="clearWb()"      title="Clear">🗑 Clear</button>
          <button class="wb-action-btn" onclick="downloadWb()"   title="Download PNG">⬇ PNG</button>
          <button class="wb-action-btn" onclick="downloadWbPDF()" title="Download PDF">⬇ PDF</button>
        </div>
      </div>

      <canvas id="wbCanvas" style="display:block;cursor:crosshair;touch-action:none;"></canvas>
    </div>

    <style>
      .wb-wrap { display:flex; flex-direction:column; height:100%; overflow:hidden; background:var(--surface,#12121e); }
      .wb-toolbar { display:flex; flex-wrap:wrap; gap:6px; padding:6px 8px; background:var(--surface2,#1e1e2e); border-bottom:1px solid var(--border,#333); flex-shrink:0; align-items:center; }
      .wb-tool-group { display:flex; align-items:center; gap:3px; }
      .wb-tool-btn { background:transparent; border:1px solid transparent; color:var(--text,#cdd6f4); width:30px; height:28px; border-radius:6px; font-size:14px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.12s; }
      .wb-tool-btn:hover { background:var(--surface3,#2a2a3e); border-color:var(--border,#333); }
      .wb-tool-btn.active { background:var(--accent,#00d4ff); color:#000; border-color:var(--accent,#00d4ff); }
      .wb-color-pick { width:28px; height:28px; border-radius:6px; border:1px solid var(--border,#333); padding:0; cursor:pointer; background:none; }
      .wb-size-range { width:70px; cursor:pointer; accent-color:var(--accent,#00d4ff); }
      .wb-size-label { font-size:11px; color:var(--text2,#888); min-width:24px; }
      .wb-action-btn { background:var(--surface,#12121e); border:1px solid var(--border,#333); color:var(--text,#cdd6f4); padding:4px 8px; border-radius:6px; font-size:11px; cursor:pointer; transition:background 0.12s; white-space:nowrap; }
      .wb-action-btn:hover { background:var(--surface3,#2a2a3e); }
    </style>
  `;
};

window.initWhiteboard = function () {
  wbCanvas = document.getElementById('wbCanvas');
  if (!wbCanvas) return;
  wbCtx = wbCanvas.getContext('2d');
  _wbResize();
  _wbAttachEvents();
};

window.setWbTool = function (tool, el) {
  wbTool = tool;
  document.querySelectorAll('.wb-tool-btn').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');
};

function wbSetColor(c) { wbColor = c; }
window.wbSetColor = wbSetColor;

function wbSetSize(s) {
  wbSize = parseInt(s);
  const lbl = document.getElementById('wbSizeLabel');
  if (lbl) lbl.textContent = s + 'px';
}
window.wbSetSize = wbSetSize;

window.undoWb = function () {
  if (wbHistory.length === 0) return;
  const prev = wbHistory.pop();
  wbCtx.putImageData(prev, 0, 0);
};

window.clearWb = function () {
  wbHistory = [];
  wbCtx.fillStyle = '#1a1a2e';
  wbCtx.fillRect(0, 0, wbCanvas.width, wbCanvas.height);
};

window.downloadWb = function () {
  const a = document.createElement('a');
  a.download = 'whiteboard.png';
  a.href = wbCanvas.toDataURL('image/png');
  a.click();
};

window.downloadWbPDF = function () {
  if (typeof jspdf === 'undefined' && typeof jsPDF === 'undefined') {
    if (window.notify) window.notify('jsPDF not loaded — downloading as PNG instead.');
    downloadWb();
    return;
  }
  const PDF = (typeof jsPDF !== 'undefined') ? jsPDF : jspdf.jsPDF;
  const pdf = new PDF({ orientation: wbCanvas.width > wbCanvas.height ? 'landscape' : 'portrait', unit: 'px', format: [wbCanvas.width, wbCanvas.height] });
  pdf.addImage(wbCanvas.toDataURL('image/png'), 'PNG', 0, 0, wbCanvas.width, wbCanvas.height);
  pdf.save('whiteboard.pdf');
};

function _wbResize() {
  const wrap = wbCanvas.parentElement;
  const toolbar = document.querySelector('.wb-toolbar');
  const tbH = toolbar ? toolbar.offsetHeight : 46;
  const newW = wrap.offsetWidth;
  const newH = wrap.offsetHeight - tbH;

  // Save current drawing
  let saved = null;
  if (wbCanvas.width > 0 && wbCanvas.height > 0) {
    try { saved = wbCtx.getImageData(0, 0, wbCanvas.width, wbCanvas.height); } catch(e){}
  }

  wbCanvas.width  = newW;
  wbCanvas.height = Math.max(newH, 100);

  // Background
  wbCtx.fillStyle = '#1a1a2e';
  wbCtx.fillRect(0, 0, wbCanvas.width, wbCanvas.height);

  // Restore drawing
  if (saved) { try { wbCtx.putImageData(saved, 0, 0); } catch(e){} }
}

function _wbAttachEvents() {
  wbCanvas.addEventListener('mousedown', _wbDown);
  wbCanvas.addEventListener('mousemove', _wbMove);
  wbCanvas.addEventListener('mouseup',   _wbUp);
  wbCanvas.addEventListener('mouseleave',_wbUp);

  wbCanvas.addEventListener('touchstart', e => { e.preventDefault(); _wbDown(_wbTouch(e)); }, { passive:false });
  wbCanvas.addEventListener('touchmove',  e => { e.preventDefault(); _wbMove(_wbTouch(e)); }, { passive:false });
  wbCanvas.addEventListener('touchend',   e => { e.preventDefault(); _wbUp(); },   { passive:false });

  window.addEventListener('resize', () => { if (document.getElementById('wbCanvas')) _wbResize(); });
}

function _wbTouch(e) {
  const t = e.touches[0] || e.changedTouches[0];
  return { clientX: t.clientX, clientY: t.clientY };
}

function _wbPos(e) {
  const r = wbCanvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}

function _wbDown(e) {
  wbDrawing = true;
  const p = _wbPos(e);
  wbStart = p;

  // Save snapshot for shape preview
  wbSnapshotBeforeDraw = wbCtx.getImageData(0, 0, wbCanvas.width, wbCanvas.height);

  if (wbTool === 'pen' || wbTool === 'eraser') {
    wbCtx.beginPath();
    wbCtx.moveTo(p.x, p.y);
  } else if (wbTool === 'text') {
    const text = prompt('Enter text:');
    if (text) {
      _wbSaveHistory();
      wbCtx.font = `${Math.max(wbSize * 4, 16)}px sans-serif`;
      wbCtx.fillStyle = wbColor;
      wbCtx.fillText(text, p.x, p.y);
    }
    wbDrawing = false;
  }
}

function _wbMove(e) {
  if (!wbDrawing) return;
  const p = _wbPos(e);

  if (wbTool === 'pen') {
    wbCtx.lineWidth = wbSize;
    wbCtx.strokeStyle = wbColor;
    wbCtx.lineCap = 'round';
    wbCtx.lineJoin = 'round';
    wbCtx.lineTo(p.x, p.y);
    wbCtx.stroke();
  } else if (wbTool === 'eraser') {
    wbCtx.lineWidth = wbSize * 3;
    wbCtx.strokeStyle = '#1a1a2e';
    wbCtx.lineCap = 'round';
    wbCtx.lineTo(p.x, p.y);
    wbCtx.stroke();
  } else if (wbTool === 'line' || wbTool === 'rect' || wbTool === 'circle') {
    // Restore snapshot and redraw preview
    wbCtx.putImageData(wbSnapshotBeforeDraw, 0, 0);
    wbCtx.lineWidth = wbSize;
    wbCtx.strokeStyle = wbColor;
    wbCtx.lineCap = 'round';
    wbCtx.beginPath();
    if (wbTool === 'line') {
      wbCtx.moveTo(wbStart.x, wbStart.y);
      wbCtx.lineTo(p.x, p.y);
    } else if (wbTool === 'rect') {
      wbCtx.rect(wbStart.x, wbStart.y, p.x - wbStart.x, p.y - wbStart.y);
    } else if (wbTool === 'circle') {
      const rx = Math.abs(p.x - wbStart.x) / 2;
      const ry = Math.abs(p.y - wbStart.y) / 2;
      const cx = (wbStart.x + p.x) / 2;
      const cy = (wbStart.y + p.y) / 2;
      wbCtx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    }
    wbCtx.stroke();
  }
}

function _wbUp() {
  if (!wbDrawing) return;
  wbDrawing = false;
  _wbSaveHistory();
  if (wbTool === 'pen' || wbTool === 'eraser') {
    wbCtx.closePath();
  }
  wbSnapshotBeforeDraw = null;
}

function _wbSaveHistory() {
  wbHistory.push(wbCtx.getImageData(0, 0, wbCanvas.width, wbCanvas.height));
  if (wbHistory.length > 30) wbHistory.shift();
}

window.cleanupWhiteboard = function () {
  wbHistory = [];
  wbCanvas = null;
  wbCtx = null;
};