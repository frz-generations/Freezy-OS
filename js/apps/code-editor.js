// ============================================================
// code-editor.js — In-browser Code Editor with Execution
// Exposes: window.buildCodeEditor, window.initCodeEditor,
//          window.runCode, window.clearCode, window.handleCodeKey
// ============================================================

let codeHistory = [];
let currentLanguage = 'javascript';

const LANGUAGES = [
  'javascript','python','c','cpp','java','rust','go','php',
  'ruby','bash','html','css','sql','typescript','kotlin',
  'swift','r','perl','scala','dart','lua','haskell',
  'assembly','brainfuck'
];

window.buildCodeEditor = function () {
  return `
    <div class="ce-wrap">
      <div class="ce-toolbar">
        <select class="ce-lang-select" id="ceLangSelect" onchange="ceLangChange()">
          ${LANGUAGES.map(l => `<option value="${l}" ${l === 'javascript' ? 'selected' : ''}>${l}</option>`).join('')}
        </select>
        <button class="ce-btn ce-run-btn" onclick="runCode()">▶ Run</button>
        <button class="ce-btn" onclick="clearCode()">🗑 Clear</button>
        <button class="ce-btn" onclick="ceToggleHistory()">📋 History</button>
        <button class="ce-btn" onclick="ceCopyCode()">⎘ Copy</button>
      </div>

      <div class="ce-body">
        <div class="ce-editor-pane">
          <div class="ce-line-nums" id="ceLineNums">1</div>
          <textarea class="ce-editor" id="ceEditor"
            placeholder="// Write your code here..."
            onkeydown="handleCodeKey(event)"
            oninput="ceUpdateLines()"
            spellcheck="false"
          ></textarea>
        </div>
        <div class="ce-divider"></div>
        <div class="ce-output-pane">
          <div class="ce-output-header">
            <span>Output</span>
            <button class="ce-btn-sm" onclick="ceClearOutput()">Clear</button>
          </div>
          <div class="ce-output" id="ceOutput">
            <span style="color:#555;">// Run your code to see output here</span>
          </div>
        </div>
      </div>

      <div class="ce-history-panel" id="ceHistoryPanel" style="display:none;">
        <div class="ce-history-header">Recent Runs <button class="ce-btn-sm" onclick="ceToggleHistory()">Close</button></div>
        <div id="ceHistoryList"></div>
      </div>
    </div>

    <style>
      .ce-wrap { display:flex; flex-direction:column; height:100%; overflow:hidden; font-family:monospace; }
      .ce-toolbar { display:flex; gap:5px; padding:7px; background:var(--surface,#12121e); border-bottom:1px solid var(--border,#222); flex-shrink:0; align-items:center; flex-wrap:wrap; }
      .ce-lang-select { background:var(--surface2,#1e1e2e); border:1px solid var(--border,#333); color:var(--text,#cdd6f4); padding:5px 8px; border-radius:7px; font-size:12px; cursor:pointer; }
      .ce-btn { background:var(--surface2,#1e1e2e); border:1px solid var(--border,#333); color:var(--text,#cdd6f4); padding:5px 10px; border-radius:7px; font-size:12px; cursor:pointer; transition:background 0.15s; white-space:nowrap; }
      .ce-btn:hover { background:var(--surface3,#2a2a3e); }
      .ce-run-btn { background:var(--accent,#00d4ff); color:#000; border-color:var(--accent,#00d4ff); font-weight:700; }
      .ce-run-btn:hover { background:var(--accent2,#00b8d9); }
      .ce-btn-sm { background:var(--surface2,#1e1e2e); border:1px solid var(--border,#333); color:var(--text2,#888); padding:2px 7px; border-radius:5px; font-size:11px; cursor:pointer; }
      .ce-body { flex:1; display:flex; min-height:0; }
      .ce-editor-pane { flex:1; display:flex; min-height:0; overflow:hidden; }
      .ce-line-nums { background:var(--surface,#12121e); color:var(--text2,#444); padding:8px 8px 8px 6px; font-size:12px; line-height:1.6; text-align:right; min-width:32px; overflow:hidden; flex-shrink:0; border-right:1px solid var(--border,#222); user-select:none; white-space:pre; }
      .ce-editor { flex:1; background:var(--surface,#12121e); color:#a6e3a1; padding:8px 10px; font-size:13px; line-height:1.6; border:none; outline:none; resize:none; tab-size:2; font-family:'Courier New',monospace; }
      .ce-divider { width:1px; background:var(--border,#222); flex-shrink:0; }
      .ce-output-pane { flex:1; display:flex; flex-direction:column; min-height:0; overflow:hidden; }
      .ce-output-header { display:flex; justify-content:space-between; align-items:center; padding:5px 10px; background:var(--surface,#12121e); border-bottom:1px solid var(--border,#222); font-size:11px; color:var(--text2,#888); flex-shrink:0; }
      .ce-output { flex:1; overflow-y:auto; padding:8px 10px; font-size:12px; line-height:1.6; background:var(--surface,#12121e); color:var(--text,#cdd6f4); white-space:pre-wrap; word-break:break-word; }
      .ce-out-log { color:#a6e3a1; }
      .ce-out-warn { color:#f9e2af; }
      .ce-out-err { color:#f38ba8; }
      .ce-out-info { color:var(--accent,#00d4ff); }
      .ce-history-panel { position:absolute; bottom:0; left:0; right:0; background:var(--surface2,#1e1e2e); border-top:1px solid var(--border,#333); max-height:200px; overflow-y:auto; padding:8px; z-index:10; }
      .ce-history-header { display:flex; justify-content:space-between; font-size:11px; color:var(--text2,#888); margin-bottom:6px; }
      .ce-history-item { padding:5px 8px; font-size:11px; color:var(--text2,#888); border-bottom:1px solid var(--border,#1a1a2e); cursor:pointer; }
      .ce-history-item:hover { color:var(--text,#cdd6f4); background:var(--surface,#12121e); }
    </style>
  `;
};

window.initCodeEditor = function () {
  ceUpdateLines();
};

window.runCode = function () {
  const code = document.getElementById('ceEditor').value;
  const lang = document.getElementById('ceLangSelect').value;

  if (lang === 'javascript') {
    _runJavaScript(code);
  } else if (lang === 'html') {
    _runHTML(code);
  } else {
    _runExternal(code, lang);
  }

  codeHistory.unshift({ lang, code: code.slice(0, 100), time: new Date().toLocaleTimeString() });
  if (codeHistory.length > 20) codeHistory.pop();
};

window.clearCode = function () {
  document.getElementById('ceEditor').value = '';
  ceClearOutput();
  ceUpdateLines();
};

window.handleCodeKey = function (e) {
  const ta = e.target;
  if (e.key === 'Tab') {
    e.preventDefault();
    if (e.shiftKey) {
      const start = ta.selectionStart;
      const lineStart = ta.value.lastIndexOf('\n', start - 1) + 1;
      if (ta.value.slice(lineStart, lineStart + 2) === '  ') {
        ta.value = ta.value.slice(0, lineStart) + ta.value.slice(lineStart + 2);
        ta.selectionStart = ta.selectionEnd = Math.max(lineStart, start - 2);
      }
    } else {
      const s = ta.selectionStart, e2 = ta.selectionEnd;
      ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(e2);
      ta.selectionStart = ta.selectionEnd = s + 2;
    }
    ceUpdateLines();
  } else if (e.ctrlKey && e.key === 'Enter') {
    e.preventDefault();
    runCode();
  }
};

function ceLangChange() {
  currentLanguage = document.getElementById('ceLangSelect').value;
}
window.ceLangChange = ceLangChange;

function ceUpdateLines() {
  const ta = document.getElementById('ceEditor');
  const ln = document.getElementById('ceLineNums');
  if (!ta || !ln) return;
  const lines = ta.value.split('\n').length;
  ln.textContent = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
}
window.ceUpdateLines = ceUpdateLines;

function ceClearOutput() {
  const el = document.getElementById('ceOutput');
  if (el) el.innerHTML = '<span style="color:#555;">// Run your code to see output here</span>';
}
window.ceClearOutput = ceClearOutput;

function ceCopyCode() {
  const code = document.getElementById('ceEditor').value;
  navigator.clipboard && navigator.clipboard.writeText(code).then(() => {
    if (window.notify) window.notify('Code copied to clipboard.');
  });
}
window.ceCopyCode = ceCopyCode;

function ceToggleHistory() {
  const panel = document.getElementById('ceHistoryPanel');
  if (!panel) return;
  const show = panel.style.display === 'none';
  panel.style.display = show ? 'block' : 'none';
  if (show) _ceRenderHistory();
}
window.ceToggleHistory = ceToggleHistory;

function _ceRenderHistory() {
  const list = document.getElementById('ceHistoryList');
  if (!list) return;
  if (!codeHistory.length) { list.innerHTML = '<div style="color:#555;font-size:12px;padding:4px;">No history yet.</div>'; return; }
  list.innerHTML = codeHistory.map((h, i) =>
    `<div class="ce-history-item" onclick="ceLoadHistory(${i})">[${h.time}] ${h.lang}: ${h.code}...</div>`
  ).join('');
}

function ceLoadHistory(i) {
  const h = codeHistory[i];
  if (!h) return;
  document.getElementById('ceEditor').value = h.code;
  document.getElementById('ceLangSelect').value = h.lang;
  currentLanguage = h.lang;
  ceUpdateLines();
  ceToggleHistory();
}
window.ceLoadHistory = ceLoadHistory;

function _runJavaScript(code) {
  const logs = [];
  const origLog   = console.log;
  const origWarn  = console.warn;
  const origError = console.error;
  console.log   = (...a) => logs.push({ type:'log',   msg: a.map(String).join(' ') });
  console.warn  = (...a) => logs.push({ type:'warn',  msg: a.map(String).join(' ') });
  console.error = (...a) => logs.push({ type:'error', msg: a.map(String).join(' ') });

  let result = undefined, error = null;
  const timeout = setTimeout(() => { error = 'Execution timed out (5s)'; }, 5000);

  try {
    result = new Function(code)();
  } catch (e) {
    error = e.message;
  } finally {
    clearTimeout(timeout);
    console.log   = origLog;
    console.warn  = origWarn;
    console.error = origError;
  }

  const outEl = document.getElementById('ceOutput');
  let html = '';
  logs.forEach(l => {
    const cls = l.type === 'warn' ? 'ce-out-warn' : l.type === 'error' ? 'ce-out-err' : 'ce-out-log';
    html += `<div class="${cls}">${_ceEscape(l.msg)}</div>`;
  });
  if (error) html += `<div class="ce-out-err">⚠ ${_ceEscape(error)}</div>`;
  else if (result !== undefined) html += `<div class="ce-out-info">→ ${_ceEscape(String(result))}</div>`;
  if (!html) html = '<div class="ce-out-info">✓ Executed with no output.</div>';
  outEl.innerHTML = html;
}

function _runHTML(code) {
  const outEl = document.getElementById('ceOutput');
  const blob = new Blob([code], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  outEl.innerHTML = `<iframe src="${url}" style="width:100%;height:100%;border:none;background:#fff;" sandbox="allow-scripts allow-same-origin"></iframe>`;
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function _runExternal(code, lang) {
  const judgeUrl = window.ENV && window.ENV.JUDGE0_URL;
  if (!judgeUrl) {
    document.getElementById('ceOutput').innerHTML =
      `<div class="ce-out-info">ℹ️ Server-side execution requires Judge0.</div>
       <div style="color:#888;margin-top:8px;font-size:12px;">Set VITE_JUDGE0_URL in your .env to enable execution for: ${lang}<br><br>Self-host Judge0 on Railway or Render (free tier available).</div>`;
    return;
  }

  const langIds = { python:71, c:50, cpp:54, java:62, rust:73, go:60, php:68, ruby:72, bash:46, sql:82, typescript:74, kotlin:78, swift:83, r:80, perl:85, scala:81, dart:90, lua:64, haskell:61 };
  const langId = langIds[lang];
  if (!langId) { document.getElementById('ceOutput').innerHTML = `<div class="ce-out-warn">Language "${lang}" not supported by Judge0.</div>`; return; }

  document.getElementById('ceOutput').innerHTML = '<div style="color:#888;">⏳ Running on server...</div>';
  fetch(`${judgeUrl}/submissions?base64_encoded=false&wait=true`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source_code: code, language_id: langId })
  })
    .then(r => r.json())
    .then(data => {
      const out = data.stdout || data.stderr || data.compile_output || 'No output.';
      document.getElementById('ceOutput').innerHTML = `<div class="${data.stderr ? 'ce-out-err' : 'ce-out-log'}">${_ceEscape(out)}</div>`;
    })
    .catch(() => {
      document.getElementById('ceOutput').innerHTML = '<div class="ce-out-err">⚠ Could not reach execution server.</div>';
    });
}

function _ceEscape(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}