// ============================================================
// calculator.js — Scientific Calculator with History
// Exposes: window.buildCalculator, window.initCalculator, window.calcPress
// ============================================================

let calcExpr = '';
let calcResult = '';
let calcHistory = [];
let calcMode = 'basic';
let calcKeyListener = null;

window.buildCalculator = function () {
  return `
    <div class="calc-wrap" id="calcWrap">
      <div class="calc-mode-bar">
        <button class="calc-mode-btn active" id="calcModeBasic" onclick="calcSetMode('basic')">Basic</button>
        <button class="calc-mode-btn" id="calcModeSci" onclick="calcSetMode('scientific')">Scientific</button>
      </div>

      <div class="calc-display">
        <div class="calc-expr" id="calcExprDisplay">&nbsp;</div>
        <div class="calc-result" id="calcResultDisplay">0</div>
      </div>

      <div id="calcSciPanel" class="calc-sci-panel" style="display:none;">
        <button class="calc-btn calc-fn" onclick="calcPress('sin(')">sin</button>
        <button class="calc-btn calc-fn" onclick="calcPress('cos(')">cos</button>
        <button class="calc-btn calc-fn" onclick="calcPress('tan(')">tan</button>
        <button class="calc-btn calc-fn" onclick="calcPress('log(')">log</button>
        <button class="calc-btn calc-fn" onclick="calcPress('ln(')">ln</button>
        <button class="calc-btn calc-fn" onclick="calcPress('√(')">√</button>
        <button class="calc-btn calc-fn" onclick="calcPress('^2')">x²</button>
        <button class="calc-btn calc-fn" onclick="calcPress('^3')">x³</button>
        <button class="calc-btn calc-fn" onclick="calcPress('π')">π</button>
        <button class="calc-btn calc-fn" onclick="calcPress('e')">e</button>
        <button class="calc-btn calc-fn" onclick="calcPress('(')">(</button>
        <button class="calc-btn calc-fn" onclick="calcPress(')')">)</button>
      </div>

      <div class="calc-buttons" id="calcButtons">
        <button class="calc-btn calc-clear span2" onclick="calcPress('AC')">AC</button>
        <button class="calc-btn calc-clear" onclick="calcPress('DEL')">⌫</button>
        <button class="calc-btn calc-op" onclick="calcPress('÷')">÷</button>

        <button class="calc-btn" onclick="calcPress('7')">7</button>
        <button class="calc-btn" onclick="calcPress('8')">8</button>
        <button class="calc-btn" onclick="calcPress('9')">9</button>
        <button class="calc-btn calc-op" onclick="calcPress('×')">×</button>

        <button class="calc-btn" onclick="calcPress('4')">4</button>
        <button class="calc-btn" onclick="calcPress('5')">5</button>
        <button class="calc-btn" onclick="calcPress('6')">6</button>
        <button class="calc-btn calc-op" onclick="calcPress('−')">−</button>

        <button class="calc-btn" onclick="calcPress('1')">1</button>
        <button class="calc-btn" onclick="calcPress('2')">2</button>
        <button class="calc-btn" onclick="calcPress('3')">3</button>
        <button class="calc-btn calc-op" onclick="calcPress('+')">+</button>

        <button class="calc-btn" onclick="calcPress('+/−')">+/−</button>
        <button class="calc-btn" onclick="calcPress('0')">0</button>
        <button class="calc-btn" onclick="calcPress('.')">.</button>
        <button class="calc-btn calc-eq" onclick="calcPress('=')">=</button>
      </div>

      <div class="calc-history" id="calcHistory">
        <div class="calc-history-title">History</div>
        <div id="calcHistoryList"></div>
      </div>
    </div>

    <style>
      .calc-wrap { display:flex; flex-direction:column; height:100%; background:transparent; padding:8px; box-sizing:border-box; gap:6px; }
      .calc-mode-bar { display:flex; gap:4px; }
      .calc-mode-btn { flex:1; padding:5px; background:var(--surface2,#1e1e2e); border:1px solid var(--border,#333); color:var(--text,#cdd6f4); border-radius:6px; cursor:pointer; font-size:12px; }
      .calc-mode-btn.active { background:var(--accent,#00d4ff); color:#000; }
      .calc-display { background:var(--surface2,#1e1e2e); border-radius:8px; padding:10px 14px; min-height:70px; display:flex; flex-direction:column; justify-content:flex-end; align-items:flex-end; }
      .calc-expr { font-size:12px; color:var(--text2,#888); font-family:monospace; min-height:18px; word-break:break-all; }
      .calc-result { font-size:32px; color:var(--text,#cdd6f4); font-family:monospace; font-weight:600; word-break:break-all; }
      .calc-sci-panel { display:grid; grid-template-columns:repeat(6,1fr); gap:4px; }
      .calc-buttons { display:grid; grid-template-columns:repeat(4,1fr); gap:4px; }
      .calc-btn { padding:12px 4px; background:var(--surface2,#1e1e2e); border:1px solid var(--border,#2a2a3e); color:var(--text,#cdd6f4); border-radius:8px; cursor:pointer; font-size:15px; transition:background 0.1s; }
      .calc-btn:hover { background:var(--surface3,#2a2a3e); }
      .calc-btn:active { background:var(--accent,#00d4ff); color:#000; }
      .calc-btn.span2 { grid-column:span 2; }
      .calc-op { color:var(--accent,#00d4ff); }
      .calc-eq { background:var(--accent,#00d4ff); color:#000; font-weight:700; }
      .calc-eq:hover { background:var(--accent2,#00b8d9); }
      .calc-clear { color:#f38ba8; }
      .calc-fn { font-size:12px; padding:8px 2px; }
      .calc-history { background:var(--surface2,#1e1e2e); border-radius:8px; padding:8px; max-height:100px; overflow-y:auto; flex-shrink:0; }
      .calc-history-title { font-size:10px; color:var(--text2,#888); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; }
      .calc-history-item { font-size:12px; color:var(--text2,#888); font-family:monospace; padding:2px 0; border-bottom:1px solid var(--border,#222); }
      .calc-history-item:last-child { border-bottom:none; }
      .calc-history-item span { color:var(--accent,#00d4ff); float:right; }
    </style>
  `;
};

window.initCalculator = function () {
  calcExpr = '';
  calcResult = '';
  _calcUpdateDisplay();
  _calcAttachKeyboard();
};

window.calcPress = function (key) {
  if (key === 'AC') {
    calcExpr = '';
    calcResult = '';
  } else if (key === 'DEL') {
    calcExpr = calcExpr.slice(0, -1);
  } else if (key === '=') {
    _calcEvaluate();
    return;
  } else if (key === '+/−') {
    if (calcExpr.startsWith('−')) calcExpr = calcExpr.slice(1);
    else if (calcExpr.startsWith('-')) calcExpr = calcExpr.slice(1);
    else calcExpr = '−' + calcExpr;
  } else {
    calcExpr += key;
  }
  calcResult = '';
  _calcUpdateDisplay();
};

function calcSetMode(mode) {
  calcMode = mode;
  const sci = document.getElementById('calcSciPanel');
  const basic = document.getElementById('calcModeBasic');
  const sciBtn = document.getElementById('calcModeSci');
  if (mode === 'scientific') {
    if (sci) sci.style.display = 'grid';
    if (basic) basic.classList.remove('active');
    if (sciBtn) sciBtn.classList.add('active');
  } else {
    if (sci) sci.style.display = 'none';
    if (basic) basic.classList.add('active');
    if (sciBtn) sciBtn.classList.remove('active');
  }
}
window.calcSetMode = calcSetMode;

function _calcEvaluate() {
  if (!calcExpr.trim()) return;
  try {
    let expr = calcExpr;
    expr = expr.replace(/÷/g, '/');
    expr = expr.replace(/×/g, '*');
    expr = expr.replace(/−/g, '-');
    expr = expr.replace(/π/g, '(' + Math.PI + ')');
    expr = expr.replace(/e(?![0-9])/g, '(' + Math.E + ')');
    expr = expr.replace(/√\(/g, 'Math.sqrt(');
    expr = expr.replace(/sin\(/g, 'Math.sin(');
    expr = expr.replace(/cos\(/g, 'Math.cos(');
    expr = expr.replace(/tan\(/g, 'Math.tan(');
    expr = expr.replace(/log\(/g, 'Math.log10(');
    expr = expr.replace(/ln\(/g, 'Math.log(');
    expr = expr.replace(/\^2/g, '**2');
    expr = expr.replace(/\^3/g, '**3');

    const result = Function('"use strict";return(' + expr + ')')();

    if (!isFinite(result)) {
      calcResult = 'Error';
    } else {
      calcResult = _calcFormat(result);
      const histItem = { expr: calcExpr, result: calcResult };
      calcHistory.unshift(histItem);
      if (calcHistory.length > 10) calcHistory.pop();
      calcExpr = calcResult;
      _calcRenderHistory();
    }
  } catch (e) {
    calcResult = 'Error';
  }
  _calcUpdateDisplay();
}

function _calcFormat(n) {
  if (Number.isInteger(n)) return String(n);
  return parseFloat(n.toPrecision(10)).toString();
}

function _calcUpdateDisplay() {
  const exprEl = document.getElementById('calcExprDisplay');
  const resEl = document.getElementById('calcResultDisplay');
  if (exprEl) exprEl.textContent = calcExpr || '\u00a0';
  if (resEl) resEl.textContent = calcResult || (calcExpr ? '' : '0');
}

function _calcRenderHistory() {
  const list = document.getElementById('calcHistoryList');
  if (!list) return;
  list.innerHTML = calcHistory.slice(0, 5).map(h =>
    `<div class="calc-history-item">${h.expr} <span>${h.result}</span></div>`
  ).join('');
}

function _calcAttachKeyboard() {
  if (calcKeyListener) document.removeEventListener('keydown', calcKeyListener);
  calcKeyListener = function (e) {
    const focused = document.activeElement;
    if (focused && (focused.tagName === 'INPUT' || focused.tagName === 'TEXTAREA')) return;
    if (!document.getElementById('calcWrap')) {
      document.removeEventListener('keydown', calcKeyListener);
      return;
    }
    const keyMap = {
      'Enter': '=', 'Escape': 'AC', 'Backspace': 'DEL',
      '+': '+', '-': '−', '*': '×', '/': '÷', '.': '.'
    };
    if (keyMap[e.key]) { e.preventDefault(); calcPress(keyMap[e.key]); }
    else if (/^[0-9]$/.test(e.key)) calcPress(e.key);
  };
  document.addEventListener('keydown', calcKeyListener);
}