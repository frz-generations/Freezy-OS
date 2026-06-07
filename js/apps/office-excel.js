// ============================================================
// office-excel.js — Basic Spreadsheet with Formula Support
// Exposes: window.buildExcel, window.initExcel,
//          window.excelSelectCell, window.excelInput,
//          window.evaluateFormula, window.downloadXlsx,
//          window.addSheet
// ============================================================

const XL_COLS = 26;
const XL_ROWS = 50;
let xlData = {};          // { 'A1': rawValue, ... }
let xlSelected = { r:1, c:1 };
let xlSheets = ['Sheet1'];
let xlCurrentSheet = 'Sheet1';

window.buildExcel = function () {
  return `
    <div class="xl-wrap">
      <div class="xl-formula-bar">
        <span class="xl-cell-ref" id="xlCellRef">A1</span>
        <div class="xl-sep"></div>
        <input class="xl-formula-input" id="xlFormulaInput" type="text"
          placeholder="Cell value or =formula"
          onkeydown="xlFormulaKey(event)"
          oninput="xlFormulaLiveInput()" />
      </div>
      <div class="xl-toolbar">
        <button class="xl-btn" onclick="downloadXlsx()">⬇ XLSX</button>
        <button class="xl-btn" onclick="xlClearSelected()">✕ Clear</button>
        <button class="xl-btn" onclick="xlClearAll()">🗑 Clear All</button>
      </div>
      <div class="xl-table-wrap" id="xlTableWrap"></div>
      <div class="xl-sheet-bar" id="xlSheetBar">
        <div class="xl-sheet-tab active" id="xlTab0">Sheet1</div>
        <button class="xl-add-sheet" onclick="addSheet()">+</button>
      </div>
    </div>

    <style>
      .xl-wrap { display:flex; flex-direction:column; height:100%; overflow:hidden; font-family:monospace; }
      .xl-formula-bar { display:flex; align-items:center; gap:0; background:var(--surface2,#1e1e2e); border-bottom:1px solid var(--border,#333); flex-shrink:0; }
      .xl-cell-ref { padding:6px 10px; font-size:12px; color:var(--accent,#00d4ff); min-width:40px; font-weight:700; }
      .xl-sep { width:1px; height:28px; background:var(--border,#333); }
      .xl-formula-input { flex:1; background:var(--surface,#12121e); border:none; color:var(--text,#cdd6f4); padding:6px 10px; font-size:12px; font-family:monospace; outline:none; }
      .xl-toolbar { display:flex; gap:4px; padding:5px 8px; background:var(--surface,#12121e); border-bottom:1px solid var(--border,#222); flex-shrink:0; }
      .xl-btn { background:var(--surface2,#1e1e2e); border:1px solid var(--border,#333); color:var(--text,#cdd6f4); padding:4px 9px; border-radius:6px; font-size:11px; cursor:pointer; transition:background 0.15s; }
      .xl-btn:hover { background:var(--surface3,#2a2a3e); }
      .xl-table-wrap { flex:1; overflow:auto; }
      table.xl-table { border-collapse:collapse; min-width:100%; font-size:12px; }
      table.xl-table th { background:var(--surface2,#1e1e2e); color:var(--text2,#888); padding:3px 6px; text-align:center; border:1px solid var(--border,#2a2a3e); position:sticky; top:0; z-index:2; min-width:28px; font-weight:600; font-size:11px; }
      table.xl-table th:first-child { position:sticky; left:0; z-index:3; min-width:30px; }
      table.xl-table td { border:1px solid var(--border,#2a2a3e); padding:0; min-width:72px; height:24px; position:relative; }
      table.xl-table td.row-header { background:var(--surface2,#1e1e2e); color:var(--text2,#888); text-align:center; font-size:11px; position:sticky; left:0; z-index:1; padding:3px 5px; min-width:30px; }
      .xl-cell { width:100%; height:100%; padding:2px 5px; background:transparent; border:none; color:var(--text,#cdd6f4); font-size:12px; font-family:monospace; cursor:cell; display:flex; align-items:center; overflow:hidden; white-space:nowrap; }
      td.xl-selected .xl-cell, td.xl-selected { outline:2px solid var(--accent,#00d4ff); outline-offset:-1px; }
      td.xl-selected { background:rgba(0,212,255,0.06); }
      .xl-sheet-bar { display:flex; align-items:center; background:var(--surface2,#1e1e2e); border-top:1px solid var(--border,#333); flex-shrink:0; overflow-x:auto; }
      .xl-sheet-tab { padding:5px 14px; font-size:12px; color:var(--text2,#888); cursor:pointer; border-right:1px solid var(--border,#333); white-space:nowrap; }
      .xl-sheet-tab.active { color:var(--accent,#00d4ff); background:var(--surface,#12121e); }
      .xl-sheet-tab:hover { color:var(--text,#cdd6f4); }
      .xl-add-sheet { background:transparent; border:none; color:var(--accent,#00d4ff); font-size:18px; padding:2px 10px; cursor:pointer; }
    </style>
  `;
};

window.initExcel = function () {
  xlData = {};
  xlSelected = { r:1, c:1 };
  _xlRenderTable();
};

function _xlRenderTable() {
  const wrap = document.getElementById('xlTableWrap');
  if (!wrap) return;

  const colLabels = Array.from({ length: XL_COLS }, (_, i) => String.fromCharCode(65 + i));

  let html = '<table class="xl-table"><thead><tr><th></th>';
  colLabels.forEach(c => html += `<th>${c}</th>`);
  html += '</tr></thead><tbody>';

  for (let r = 1; r <= XL_ROWS; r++) {
    html += `<tr><td class="row-header">${r}</td>`;
    for (let c = 1; c <= XL_COLS; c++) {
      const ref = _xlRef(r, c);
      const sel = (xlSelected.r === r && xlSelected.c === c) ? 'xl-selected' : '';
      const raw = xlData[ref] || '';
      const display = raw.startsWith('=') ? _xlEval(raw, ref) : raw;
      html += `<td class="${sel}" onclick="excelSelectCell(${r},${c})" ondblclick="xlStartEdit(${r},${c})">
        <div class="xl-cell" id="xlCell${ref}">${_xlEscape(display)}</div></td>`;
    }
    html += '</tr>';
  }
  html += '</tbody></table>';
  wrap.innerHTML = html;

  const fInput = document.getElementById('xlFormulaInput');
  if (fInput) fInput.value = xlData[_xlRef(xlSelected.r, xlSelected.c)] || '';
  const refEl = document.getElementById('xlCellRef');
  if (refEl) refEl.textContent = _xlRef(xlSelected.r, xlSelected.c);
}

window.excelSelectCell = function (r, c) {
  xlSelected = { r, c };
  const ref = _xlRef(r, c);
  document.querySelectorAll('td.xl-selected').forEach(el => el.classList.remove('xl-selected'));
  const td = document.querySelector(`[onclick="excelSelectCell(${r},${c})"]`);
  if (td) td.classList.add('xl-selected');
  const fInput = document.getElementById('xlFormulaInput');
  if (fInput) { fInput.value = xlData[ref] || ''; fInput.focus(); }
  const refEl = document.getElementById('xlCellRef');
  if (refEl) refEl.textContent = ref;
};

window.excelInput = function (r, c, val) {
  const ref = _xlRef(r, c);
  xlData[ref] = val;
  _xlRefreshCell(ref);
};

function xlFormulaKey(e) {
  if (e.key === 'Enter') {
    const ref = _xlRef(xlSelected.r, xlSelected.c);
    xlData[ref] = e.target.value;
    _xlRefreshCell(ref);
    excelSelectCell(Math.min(xlSelected.r + 1, XL_ROWS), xlSelected.c);
  } else if (e.key === 'Escape') {
    const ref = _xlRef(xlSelected.r, xlSelected.c);
    e.target.value = xlData[ref] || '';
  } else if (e.key === 'Tab') {
    e.preventDefault();
    const ref = _xlRef(xlSelected.r, xlSelected.c);
    xlData[ref] = e.target.value;
    _xlRefreshCell(ref);
    excelSelectCell(xlSelected.r, Math.min(xlSelected.c + 1, XL_COLS));
  }
}
window.xlFormulaKey = xlFormulaKey;

function xlFormulaLiveInput() {
  const ref = _xlRef(xlSelected.r, xlSelected.c);
  xlData[ref] = document.getElementById('xlFormulaInput').value;
  _xlRefreshCell(ref);
}
window.xlFormulaLiveInput = xlFormulaLiveInput;

function xlStartEdit(r, c) {
  excelSelectCell(r, c);
  document.getElementById('xlFormulaInput').focus();
  document.getElementById('xlFormulaInput').select();
}
window.xlStartEdit = xlStartEdit;

function _xlRefreshCell(ref) {
  const el = document.getElementById('xlCell' + ref);
  if (!el) return;
  const raw = xlData[ref] || '';
  el.textContent = raw.startsWith('=') ? _xlEval(raw, ref) : raw;
}

window.evaluateFormula = function (expr, selfRef) {
  return _xlEval(expr, selfRef);
};

function _xlEval(expr, selfRef) {
  if (!expr.startsWith('=')) return expr;
  const formula = expr.slice(1).trim();
  try {
    return String(_xlParse(formula, selfRef));
  } catch (e) {
    return '#ERR';
  }
}

function _xlParse(formula, selfRef) {
  const up = formula.toUpperCase();

  // Range functions
  const rangeMatch = up.match(/^(SUM|AVG|AVERAGE|MIN|MAX|COUNT)\(([A-Z]+\d+):([A-Z]+\d+)\)$/);
  if (rangeMatch) {
    const fn = rangeMatch[1];
    const vals = _xlRangeVals(rangeMatch[2], rangeMatch[3], selfRef).map(Number).filter(n => !isNaN(n));
    if (fn === 'SUM') return vals.reduce((a, b) => a + b, 0);
    if (fn === 'AVG' || fn === 'AVERAGE') return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    if (fn === 'MIN') return vals.length ? Math.min(...vals) : 0;
    if (fn === 'MAX') return vals.length ? Math.max(...vals) : 0;
    if (fn === 'COUNT') return vals.length;
  }

  // IF function
  const ifMatch = up.match(/^IF\((.+),(.+),(.+)\)$/);
  if (ifMatch) {
    const cond = _xlParse(ifMatch[1].trim(), selfRef);
    return cond ? _xlParse(ifMatch[2].trim(), selfRef) : _xlParse(ifMatch[3].trim(), selfRef);
  }

  // Replace cell refs with values
  let parsed = formula.replace(/([A-Z]+)(\d+)/gi, (_, col, row) => {
    const ref = col.toUpperCase() + row;
    if (ref === selfRef) throw new Error('Circular ref');
    const v = xlData[ref] || '0';
    return isNaN(Number(v)) ? '0' : v;
  });

  return Function('"use strict";return(' + parsed + ')')();
}

function _xlRangeVals(from, to, selfRef) {
  const fc = _xlColIdx(from.replace(/\d/g, '')), fr = parseInt(from.replace(/[A-Z]/g, ''));
  const tc = _xlColIdx(to.replace(/\d/g, '')),   tr = parseInt(to.replace(/[A-Z]/g, ''));
  const vals = [];
  for (let r = fr; r <= tr; r++) {
    for (let c = fc; c <= tc; c++) {
      const ref = String.fromCharCode(64 + c) + r;
      vals.push(xlData[ref] || '');
    }
  }
  return vals;
}

function _xlColIdx(col) {
  let n = 0;
  for (let i = 0; i < col.length; i++) n = n * 26 + (col.charCodeAt(i) - 64);
  return n;
}

window.downloadXlsx = function () {
  if (typeof XLSX === 'undefined') {
    if (window.notify) window.notify('SheetJS not loaded. Add it to <head>.');
    return;
  }
  const ws_data = [];
  const headers = ['', ...Array.from({ length: XL_COLS }, (_, i) => String.fromCharCode(65 + i))];
  ws_data.push(headers);
  for (let r = 1; r <= XL_ROWS; r++) {
    const row = [r];
    for (let c = 1; c <= XL_COLS; c++) {
      const ref = _xlRef(r, c);
      const raw = xlData[ref] || '';
      row.push(raw.startsWith('=') ? _xlEval(raw, ref) : raw);
    }
    ws_data.push(row);
  }
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  XLSX.utils.book_append_sheet(wb, ws, xlCurrentSheet);
  XLSX.writeFile(wb, 'Spreadsheet.xlsx');
};

window.addSheet = function () {
  const name = 'Sheet' + (xlSheets.length + 1);
  xlSheets.push(name);
  const bar = document.getElementById('xlSheetBar');
  const tab = document.createElement('div');
  tab.className = 'xl-sheet-tab';
  tab.textContent = name;
  tab.onclick = () => xlSwitchSheet(name, tab);
  const addBtn = bar.querySelector('.xl-add-sheet');
  bar.insertBefore(tab, addBtn);
  xlSwitchSheet(name, tab);
};

function xlSwitchSheet(name, el) {
  xlCurrentSheet = name;
  document.querySelectorAll('.xl-sheet-tab').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  xlData = {};
  _xlRenderTable();
}
window.xlSwitchSheet = xlSwitchSheet;

function xlClearSelected() {
  const ref = _xlRef(xlSelected.r, xlSelected.c);
  delete xlData[ref];
  _xlRefreshCell(ref);
  document.getElementById('xlFormulaInput').value = '';
}
window.xlClearSelected = xlClearSelected;

function xlClearAll() {
  if (!confirm('Clear all cell data?')) return;
  xlData = {};
  _xlRenderTable();
}
window.xlClearAll = xlClearAll;

function _xlRef(r, c) {
  return String.fromCharCode(64 + c) + r;
}

function _xlEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}