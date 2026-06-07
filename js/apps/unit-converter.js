// ============================================================
// unit-converter.js — Unit Conversion Across Multiple Categories
// Exposes: window.buildConverter, window.initConverter,
//          window.updateConvUnits, window.doConvert, window.swapConv
// ============================================================

const CONV_UNITS = {
  Length:      { m:1, km:0.001, cm:100, mm:1000, in:39.3701, ft:3.28084, mi:0.000621371, yd:1.09361, nm:1e9 },
  Weight:      { kg:1, g:1000, mg:1e6, lb:2.20462, oz:35.274, t:0.001, stone:0.157473 },
  Temperature: { C:'C', F:'F', K:'K' },
  Speed:       { 'km/h':1, mph:0.621371, mps:0.277778, knot:0.539957 },
  Area:        { m2:1, km2:1e-6, cm2:1e4, ft2:10.7639, acre:0.000247105, hectare:0.0001 },
  Volume:      { L:1, mL:1000, m3:0.001, ft3:0.0353147, gallon:0.264172, cup:4.22675 },
  Data:        { B:1, KB:1/1024, MB:1/1048576, GB:1/1073741824, TB:1/1.099e12 },
  Time:        { s:1, ms:1000, min:1/60, h:1/3600, day:1/86400, week:1/604800 },
  Pressure:    { Pa:1, kPa:0.001, bar:1e-5, psi:0.000145038, atm:9.869e-6 },
};

window.buildConverter = function () {
  const categories = Object.keys(CONV_UNITS);
  return `
    <div class="conv-wrap">
      <div class="conv-category-row">
        <label class="conv-label">Category</label>
        <select class="conv-select" id="convCategory" onchange="updateConvUnits()">
          ${categories.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
      </div>

      <div class="conv-input-row">
        <div class="conv-field">
          <label class="conv-label">From</label>
          <select class="conv-select" id="convFrom" onchange="doConvert()"></select>
          <input class="conv-input" id="convValue" type="number" value="1" oninput="doConvert()" placeholder="Enter value" />
        </div>
        <button class="conv-swap" onclick="swapConv()" title="Swap units">⇄</button>
        <div class="conv-field">
          <label class="conv-label">To</label>
          <select class="conv-select" id="convTo" onchange="doConvert()"></select>
          <div class="conv-result" id="convResult">—</div>
        </div>
      </div>

      <div class="conv-result-big" id="convResultBig">Enter a value to convert</div>

      <div class="conv-info" id="convInfo"></div>
    </div>

    <style>
      .conv-wrap { display:flex; flex-direction:column; gap:16px; padding:16px; height:100%; box-sizing:border-box; }
      .conv-category-row { display:flex; align-items:center; gap:12px; }
      .conv-label { font-size:11px; color:var(--text2,#888); text-transform:uppercase; letter-spacing:1px; white-space:nowrap; min-width:60px; }
      .conv-select { flex:1; background:var(--surface2,#1e1e2e); border:1px solid var(--border,#333); color:var(--text,#cdd6f4); padding:8px 10px; border-radius:8px; font-size:13px; cursor:pointer; }
      .conv-input-row { display:flex; align-items:flex-end; gap:8px; }
      .conv-field { flex:1; display:flex; flex-direction:column; gap:6px; }
      .conv-input { background:var(--surface2,#1e1e2e); border:1px solid var(--border,#333); color:var(--text,#cdd6f4); padding:10px 12px; border-radius:8px; font-size:16px; font-family:monospace; width:100%; box-sizing:border-box; }
      .conv-input:focus { outline:none; border-color:var(--accent,#00d4ff); }
      .conv-result { background:var(--surface2,#1e1e2e); border:1px solid var(--border,#333); color:var(--accent,#00d4ff); padding:10px 12px; border-radius:8px; font-size:16px; font-family:monospace; min-height:42px; display:flex; align-items:center; }
      .conv-swap { background:var(--surface2,#1e1e2e); border:1px solid var(--border,#333); color:var(--accent,#00d4ff); width:40px; height:40px; border-radius:50%; font-size:20px; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-bottom:2px; transition:background 0.15s; }
      .conv-swap:hover { background:var(--accent,#00d4ff); color:#000; }
      .conv-result-big { background:var(--surface2,#1e1e2e); border-radius:12px; padding:20px; text-align:center; font-size:22px; font-family:monospace; color:var(--text,#cdd6f4); border:1px solid var(--border,#333); }
      .conv-info { font-size:12px; color:var(--text2,#666); text-align:center; }
    </style>
  `;
};

window.initConverter = function () {
  updateConvUnits();
};

window.updateConvUnits = function () {
  const cat = document.getElementById('convCategory').value;
  const units = Object.keys(CONV_UNITS[cat]);
  const fromSel = document.getElementById('convFrom');
  const toSel = document.getElementById('convTo');
  fromSel.innerHTML = units.map(u => `<option value="${u}">${u}</option>`).join('');
  toSel.innerHTML = units.map(u => `<option value="${u}">${u}</option>`).join('');
  if (units.length > 1) toSel.selectedIndex = 1;
  doConvert();
};

window.doConvert = function () {
  const cat = document.getElementById('convCategory').value;
  const from = document.getElementById('convFrom').value;
  const to = document.getElementById('convTo').value;
  const rawVal = document.getElementById('convValue').value;
  const val = parseFloat(rawVal);

  if (isNaN(val)) {
    document.getElementById('convResult').textContent = '—';
    document.getElementById('convResultBig').textContent = 'Enter a value to convert';
    return;
  }

  let result;
  if (cat === 'Temperature') {
    result = _convertTemp(val, from, to);
  } else {
    const table = CONV_UNITS[cat];
    const inBase = val / table[from];
    result = inBase * table[to];
  }

  const formatted = _convFormat(result);
  document.getElementById('convResult').textContent = formatted + ' ' + to;
  document.getElementById('convResultBig').textContent = `${val} ${from} = ${formatted} ${to}`;
};

window.swapConv = function () {
  const fromSel = document.getElementById('convFrom');
  const toSel = document.getElementById('convTo');
  const tmp = fromSel.value;
  fromSel.value = toSel.value;
  toSel.value = tmp;
  doConvert();
};

function _convertTemp(val, from, to) {
  let celsius;
  if (from === 'C') celsius = val;
  else if (from === 'F') celsius = (val - 32) * 5 / 9;
  else if (from === 'K') celsius = val - 273.15;

  if (to === 'C') return celsius;
  if (to === 'F') return celsius * 9 / 5 + 32;
  if (to === 'K') return celsius + 273.15;
}

function _convFormat(n) {
  if (Math.abs(n) >= 1e15 || (Math.abs(n) < 1e-6 && n !== 0)) {
    return n.toExponential(4);
  }
  return parseFloat(n.toPrecision(6)).toString();
}