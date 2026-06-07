// ============================================================
// library.js — Public Files Library via Google Sheets
// Exposes: window.buildLibrary, window.initLibrary,
//          window.filterLibrary, window.loadLibraryData
// ============================================================

// GOOGLE SHEETS PUBLIC LIBRARY:
// - Sheet must be shared as "Anyone with link can view"
// - Published to web for API access (File → Share → Publish to web)
// - Columns: #, Title, Category, Direct Download Link
// - Admin manually adds rows — no user uploads from this app
// - Read-only, no auth needed

let _libData = [];        // Cached rows for current session
let _libLoaded = false;

window.buildLibrary = function () {
  return `
    <div class="lb-wrap">
      <div class="lb-header">
        <div class="lb-header-left">
          <div class="lb-title">📚 Public Library</div>
          <div class="lb-sub">Free files shared by FRZ Generations</div>
        </div>
        <div class="lb-header-right">
          <input class="lb-search" id="lbSearch" type="text" placeholder="Search files..." oninput="filterLibrary(this.value)" />
          <button class="lb-refresh-btn" onclick="loadLibraryData(true)" title="Refresh">⟳</button>
        </div>
      </div>

      <div class="lb-filter-bar" id="lbFilterBar" style="display:none;">
        <span class="lb-filter-label">Category:</span>
        <div id="lbCategoryBtns" class="lb-category-btns"></div>
      </div>

      <div class="lb-table-wrap">
        <table class="lb-table">
          <thead>
            <tr>
              <th style="width:40px">#</th>
              <th>Title</th>
              <th style="width:110px">Category</th>
              <th style="width:90px">Download</th>
            </tr>
          </thead>
          <tbody id="lbTableBody">
            <tr><td colspan="4" class="lb-status-row">
              <div class="lb-spinner-wrap"><div class="lb-spinner"></div> Loading library...</div>
            </td></tr>
          </tbody>
        </table>
      </div>

      <div class="lb-footer" id="lbFooter"></div>
    </div>

    <style>
      .lb-wrap { display:flex; flex-direction:column; height:100%; overflow:hidden; }
      .lb-header { display:flex; align-items:center; justify-content:space-between; padding:12px 14px; background:var(--surface,#12121e); border-bottom:1px solid var(--border,#222); flex-shrink:0; gap:10px; flex-wrap:wrap; }
      .lb-title { font-size:16px; font-weight:700; color:var(--text,#cdd6f4); }
      .lb-sub { font-size:11px; color:var(--text2,#888); }
      .lb-header-right { display:flex; gap:6px; align-items:center; }
      .lb-search { background:var(--surface2,#1e1e2e); border:1px solid var(--border,#333); color:var(--text,#cdd6f4); padding:7px 11px; border-radius:8px; font-size:13px; width:180px; }
      .lb-search:focus { outline:none; border-color:var(--accent,#00d4ff); }
      .lb-refresh-btn { background:var(--surface2,#1e1e2e); border:1px solid var(--border,#333); color:var(--text,#cdd6f4); width:32px; height:32px; border-radius:8px; cursor:pointer; font-size:16px; transition:background 0.15s; }
      .lb-refresh-btn:hover { background:var(--accent,#00d4ff); color:#000; }
      .lb-filter-bar { display:flex; align-items:center; gap:8px; padding:7px 14px; background:var(--surface,#12121e); border-bottom:1px solid var(--border,#222); flex-shrink:0; flex-wrap:wrap; }
      .lb-filter-label { font-size:11px; color:var(--text2,#888); text-transform:uppercase; letter-spacing:0.5px; }
      .lb-category-btns { display:flex; gap:5px; flex-wrap:wrap; }
      .lb-cat-btn { background:var(--surface2,#1e1e2e); border:1px solid var(--border,#333); color:var(--text2,#888); padding:3px 10px; border-radius:20px; font-size:11px; cursor:pointer; transition:all 0.12s; }
      .lb-cat-btn:hover { color:var(--text,#cdd6f4); border-color:var(--text2,#888); }
      .lb-cat-btn.active { background:var(--accent,#00d4ff); color:#000; border-color:var(--accent,#00d4ff); }
      .lb-table-wrap { flex:1; overflow:auto; }
      .lb-table { width:100%; border-collapse:collapse; font-size:13px; }
      .lb-table thead th { background:var(--surface2,#1e1e2e); color:var(--text2,#888); padding:9px 12px; text-align:left; border-bottom:1px solid var(--border,#2a2a3e); position:sticky; top:0; z-index:1; font-size:11px; text-transform:uppercase; letter-spacing:0.5px; }
      .lb-table tbody td { padding:9px 12px; border-bottom:1px solid var(--border,#1a1a2e); color:var(--text,#cdd6f4); vertical-align:middle; }
      .lb-table tbody tr:hover td { background:var(--surface2,#1e1e2e); }
      .lb-table tbody tr.hidden { display:none; }
      .lb-num { color:var(--text2,#555); font-family:monospace; font-size:12px; }
      .lb-cat-badge { background:var(--surface2,#1e1e2e); border:1px solid var(--border,#2a2a3e); padding:2px 8px; border-radius:12px; font-size:11px; color:var(--text2,#888); white-space:nowrap; }
      .lb-dl-btn { background:var(--accent,#00d4ff); color:#000; border:none; padding:5px 12px; border-radius:6px; font-size:11px; font-weight:700; cursor:pointer; transition:background 0.15s; white-space:nowrap; }
      .lb-dl-btn:hover { background:var(--accent2,#00b8d9); }
      .lb-status-row { text-align:center; padding:30px; color:var(--text2,#888); }
      .lb-spinner-wrap { display:flex; align-items:center; justify-content:center; gap:10px; }
      .lb-spinner { width:18px; height:18px; border:2px solid var(--border,#333); border-top-color:var(--accent,#00d4ff); border-radius:50%; animation:lbSpin 0.8s linear infinite; }
      @keyframes lbSpin { to { transform:rotate(360deg); } }
      .lb-footer { padding:6px 14px; font-size:11px; color:var(--text2,#666); border-top:1px solid var(--border,#222); flex-shrink:0; }
    </style>
  `;
};

window.initLibrary = function () {
  // Use session cache if available
  const cached = sessionStorage.getItem('freezy_library_cache');
  if (cached) {
    try {
      _libData = JSON.parse(cached);
      _libLoaded = true;
      _lbRender(_libData);
      return;
    } catch(e) {}
  }
  loadLibraryData(false);
};

window.loadLibraryData = function (force) {
  if (_libLoaded && !force) return;

  _lbSetStatus('<div class="lb-spinner-wrap"><div class="lb-spinner"></div> Loading library...</div>');

  const sheetId  = (window.ENV && window.ENV.LIBRARY_SHEET_ID)  || '';
  const apiKey   = (window.ENV && window.ENV.GOOGLE_API_KEY)    || '';

  if (!sheetId || !apiKey) {
    _lbSetStatus('Library temporarily unavailable. (Sheet ID or API key not configured.)');
    return;
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1?key=${apiKey}`;

  fetch(url)
    .then(r => r.json())
    .then(data => {
      const rows = data.values || [];
      if (rows.length <= 1) { _lbSetStatus('No files in the library yet.'); return; }
      // Skip header row
      _libData = rows.slice(1).map((r, i) => ({
        num:      r[0] || (i + 1),
        title:    r[1] || 'Untitled',
        category: r[2] || 'General',
        url:      r[3] || '',
      }));
      _libLoaded = true;
      sessionStorage.setItem('freezy_library_cache', JSON.stringify(_libData));
      _lbRender(_libData);
    })
    .catch(() => {
      _lbSetStatus('Library temporarily unavailable. Please try again later.');
    });
};

window.filterLibrary = function (q) {
  const query = q.toLowerCase();
  document.querySelectorAll('.lb-table tbody tr.lb-row').forEach(row => {
    const text = row.dataset.search || '';
    row.classList.toggle('hidden', !text.includes(query));
  });
  _lbUpdateFooter();
};

let _lbActiveCategory = 'All';

function _lbRender(rows) {
  const tbody = document.getElementById('lbTableBody');
  const filterBar = document.getElementById('lbFilterBar');

  if (!rows.length) { _lbSetStatus('No files in the library yet.'); return; }

  // Build category list
  const categories = ['All', ...new Set(rows.map(r => r.category).filter(Boolean))];
  _lbActiveCategory = 'All';
  const catBtns = document.getElementById('lbCategoryBtns');
  if (catBtns) {
    catBtns.innerHTML = categories.map(c =>
      `<button class="lb-cat-btn ${c === 'All' ? 'active' : ''}" onclick="lbSetCategory('${c}',this)">${c}</button>`
    ).join('');
  }
  if (filterBar) filterBar.style.display = 'flex';

  tbody.innerHTML = rows.map(r => `
    <tr class="lb-row" data-search="${(r.title + ' ' + r.category).toLowerCase()}" data-category="${r.category}">
      <td class="lb-num">${r.num}</td>
      <td>${_lbEscape(r.title)}</td>
      <td><span class="lb-cat-badge">${_lbEscape(r.category)}</span></td>
      <td>${r.url ? `<button class="lb-dl-btn" onclick="window.open('${_lbEscape(r.url)}','_blank')">⬇ Download</button>` : '—'}</td>
    </tr>
  `).join('');

  _lbUpdateFooter();
}

function lbSetCategory(cat, el) {
  _lbActiveCategory = cat;
  document.querySelectorAll('.lb-cat-btn').forEach(b => b.classList.remove('active'));
  if (el) el.classList.add('active');

  document.querySelectorAll('.lb-table tbody tr.lb-row').forEach(row => {
    const matches = cat === 'All' || row.dataset.category === cat;
    const q = (document.getElementById('lbSearch') || {}).value || '';
    const searchMatch = !q || (row.dataset.search || '').includes(q.toLowerCase());
    row.classList.toggle('hidden', !(matches && searchMatch));
  });
  _lbUpdateFooter();
}
window.lbSetCategory = lbSetCategory;

function _lbSetStatus(html) {
  const tbody = document.getElementById('lbTableBody');
  if (tbody) tbody.innerHTML = `<tr><td colspan="4" class="lb-status-row">${html}</td></tr>`;
}

function _lbUpdateFooter() {
  const footer = document.getElementById('lbFooter');
  if (!footer) return;
  const visible = document.querySelectorAll('.lb-table tbody tr.lb-row:not(.hidden)').length;
  footer.textContent = `Showing ${visible} of ${_libData.length} file${_libData.length !== 1 ? 's' : ''}`;
}

function _lbEscape(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
