// ============================================================
// office-word.js — Rich Text Document Editor
// Exposes: window.buildWord, window.initWord,
//          window.execCmd, window.downloadDocx, window.printWord
// ============================================================

window.buildWord = function () {
  return `
    <div class="wd-wrap">
      <div class="wd-toolbar" id="wdToolbar">
        <!-- Text style -->
        <button class="wd-tb-btn" onclick="execCmd('bold')" title="Bold"><b>B</b></button>
        <button class="wd-tb-btn" onclick="execCmd('italic')" title="Italic"><i>I</i></button>
        <button class="wd-tb-btn" onclick="execCmd('underline')" title="Underline"><u>U</u></button>
        <button class="wd-tb-btn" onclick="execCmd('strikeThrough')" title="Strikethrough"><s>S</s></button>
        <div class="wd-sep"></div>
        <!-- Align -->
        <button class="wd-tb-btn" onclick="execCmd('justifyLeft')" title="Align Left">⬅</button>
        <button class="wd-tb-btn" onclick="execCmd('justifyCenter')" title="Center">≡</button>
        <button class="wd-tb-btn" onclick="execCmd('justifyRight')" title="Align Right">➡</button>
        <button class="wd-tb-btn" onclick="execCmd('justifyFull')" title="Justify">⇔</button>
        <div class="wd-sep"></div>
        <!-- Lists -->
        <button class="wd-tb-btn" onclick="execCmd('insertUnorderedList')" title="Bullet List">• List</button>
        <button class="wd-tb-btn" onclick="execCmd('insertOrderedList')" title="Numbered List">1. List</button>
        <button class="wd-tb-btn" onclick="execCmd('indent')" title="Indent">→|</button>
        <button class="wd-tb-btn" onclick="execCmd('outdent')" title="Outdent">|←</button>
        <div class="wd-sep"></div>
        <!-- Font size -->
        <select class="wd-select" onchange="execCmd('fontSize',this.value); this.value=''" title="Font Size">
          <option value="">Size</option>
          <option value="1">Small</option>
          <option value="3">Normal</option>
          <option value="5">Large</option>
          <option value="7">Huge</option>
        </select>
        <!-- Font family -->
        <select class="wd-select" onchange="execCmd('fontName',this.value); this.value=''" title="Font Family">
          <option value="">Font</option>
          <option value="Arial, sans-serif">Sans</option>
          <option value="Georgia, serif">Serif</option>
          <option value="Courier New, monospace">Mono</option>
        </select>
        <div class="wd-sep"></div>
        <!-- Colors -->
        <label class="wd-color-label" title="Text Color">A
          <input type="color" class="wd-color-input" value="#000000" oninput="execCmd('foreColor',this.value)" />
        </label>
        <label class="wd-color-label wd-highlight" title="Highlight">H
          <input type="color" class="wd-color-input" value="#ffff00" oninput="execCmd('hiliteColor',this.value)" />
        </label>
        <div class="wd-sep"></div>
        <!-- Insert -->
        <button class="wd-tb-btn" onclick="wdInsertLink()" title="Insert Link">🔗</button>
        <button class="wd-tb-btn" onclick="execCmd('insertHorizontalRule')" title="Horizontal Rule">—</button>
        <button class="wd-tb-btn" onclick="execCmd('removeFormat')" title="Clear Formatting">✕fmt</button>
        <div class="wd-sep"></div>
        <!-- File -->
        <button class="wd-tb-btn wd-btn-accent" onclick="downloadDocx()" title="Download as DOCX">⬇ DOCX</button>
        <button class="wd-tb-btn" onclick="printWord()" title="Print">🖨</button>
      </div>

      <div class="wd-page-wrap" id="wdPageWrap">
        <div class="wd-page">
          <div class="wd-editor" id="wdEditor" contenteditable="true"
            onpaste="wdSanitizePaste(event)"
            placeholder="Start typing your document...">
          </div>
        </div>
      </div>

      <div class="wd-status-bar">
        <span id="wdWordCount">Words: 0</span>
        <span id="wdCharCount">Chars: 0</span>
        <span>A4 Document</span>
      </div>
    </div>

    <style>
      .wd-wrap { display:flex; flex-direction:column; height:100%; overflow:hidden; background:var(--surface,#12121e); }
      .wd-toolbar { display:flex; flex-wrap:wrap; gap:3px; padding:6px 8px; background:var(--surface2,#1e1e2e); border-bottom:1px solid var(--border,#333); flex-shrink:0; align-items:center; }
      .wd-tb-btn { background:transparent; border:1px solid transparent; color:var(--text,#cdd6f4); padding:4px 7px; border-radius:5px; font-size:12px; cursor:pointer; transition:background 0.12s; white-space:nowrap; }
      .wd-tb-btn:hover { background:var(--surface3,#2a2a3e); border-color:var(--border,#333); }
      .wd-btn-accent { background:var(--accent,#00d4ff); color:#000; font-weight:600; border-color:var(--accent,#00d4ff); }
      .wd-btn-accent:hover { background:var(--accent2,#00b8d9); }
      .wd-select { background:var(--surface,#12121e); border:1px solid var(--border,#333); color:var(--text,#cdd6f4); padding:3px 5px; border-radius:5px; font-size:11px; cursor:pointer; }
      .wd-sep { width:1px; height:18px; background:var(--border,#333); margin:0 2px; flex-shrink:0; }
      .wd-color-label { display:flex; align-items:center; justify-content:center; width:28px; height:26px; border-radius:5px; border:1px solid var(--border,#333); cursor:pointer; font-size:12px; font-weight:700; color:var(--text,#cdd6f4); position:relative; overflow:hidden; }
      .wd-color-label:hover { background:var(--surface3,#2a2a3e); }
      .wd-highlight { color:#ffcc00; }
      .wd-color-input { position:absolute; width:200%; height:200%; opacity:0; cursor:pointer; }
      .wd-page-wrap { flex:1; overflow-y:auto; background:#555; padding:20px; display:flex; justify-content:center; }
      .wd-page { width:210mm; max-width:100%; min-height:297mm; background:#fff; padding:25mm 20mm; box-shadow:0 2px 20px rgba(0,0,0,0.4); border-radius:2px; }
      .wd-editor { min-height:200px; outline:none; font-size:12pt; font-family:Georgia, serif; line-height:1.6; color:#111; }
      .wd-editor:empty:before { content:attr(placeholder); color:#aaa; pointer-events:none; }
      .wd-status-bar { display:flex; gap:16px; padding:4px 12px; background:var(--surface2,#1e1e2e); border-top:1px solid var(--border,#333); font-size:11px; color:var(--text2,#888); flex-shrink:0; }
    </style>
  `;
};

window.initWord = function () {
  const editor = document.getElementById('wdEditor');
  if (!editor) return;
  editor.addEventListener('input', _wdUpdateCount);
  editor.addEventListener('keydown', function (e) {
    if (e.key === 'Tab') { e.preventDefault(); execCmd('insertText', '    '); }
  });
  _wdUpdateCount();
};

window.execCmd = function (cmd, val) {
  const editor = document.getElementById('wdEditor');
  if (!editor) return;
  editor.focus();
  try {
    document.execCommand(cmd, false, val || null);
  } catch (e) {}
  _wdUpdateCount();
};

window.downloadDocx = function () {
  const editor = document.getElementById('wdEditor');
  if (!editor) return;

  if (typeof docx !== 'undefined') {
    _wdDownloadDocx(editor);
  } else {
    // Fallback: download as HTML
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Document</title>
    <style>body{font-family:Georgia,serif;font-size:12pt;line-height:1.6;padding:40px;max-width:800px;margin:auto;}</style>
    </head><body>${editor.innerHTML}</body></html>`;
    const blob = new Blob([html], { type: 'text/html' });
    _wdDownloadBlob(blob, 'Document.html');
    if (window.notify) window.notify('DOCX library not loaded — saved as HTML instead.');
  }
};

function _wdDownloadDocx(editor) {
  try {
    const { Document, Packer, Paragraph, TextRun } = docx;
    const text = editor.innerText || '';
    const lines = text.split('\n');
    const paras = lines.map(line => new Paragraph({ children: [new TextRun(line)] }));
    const doc = new Document({ sections: [{ children: paras }] });
    Packer.toBlob(doc).then(blob => _wdDownloadBlob(blob, 'Document.docx'));
  } catch (e) {
    if (window.notify) window.notify('Error generating DOCX. Downloading as HTML.');
    window.downloadDocx();
  }
}

function _wdDownloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

window.printWord = function () {
  const editor = document.getElementById('wdEditor');
  if (!editor) return;
  const w = window.open('', '_blank', 'width=800,height=600');
  w.document.write(`<!DOCTYPE html><html><head><title>Print Document</title>
    <style>body{font-family:Georgia,serif;font-size:12pt;line-height:1.6;padding:40px;}</style>
    </head><body>${editor.innerHTML}</body></html>`);
  w.document.close();
  w.focus();
  w.print();
  w.close();
};

function wdInsertLink() {
  const url = prompt('Enter URL:');
  if (!url) return;
  const text = prompt('Link text (leave blank to use URL):') || url;
  execCmd('insertHTML', `<a href="${url}" target="_blank">${text}</a>`);
}
window.wdInsertLink = wdInsertLink;

function wdSanitizePaste(e) {
  e.preventDefault();
  const text = (e.clipboardData || window.clipboardData).getData('text/plain');
  document.execCommand('insertText', false, text);
}
window.wdSanitizePaste = wdSanitizePaste;

function _wdUpdateCount() {
  const editor = document.getElementById('wdEditor');
  if (!editor) return;
  const text = editor.innerText || '';
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.replace(/\s/g, '').length;
  const wc = document.getElementById('wdWordCount');
  const cc = document.getElementById('wdCharCount');
  if (wc) wc.textContent = 'Words: ' + words;
  if (cc) cc.textContent = 'Chars: ' + chars;
}