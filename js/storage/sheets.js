/**
 * js/storage/sheets.js
 * Purpose: Google Sheets API interactions (read-only public library).
 * Log IP violations and login activity via Apps Script.
 * Submit suspension appeals via Apps Script.
 * Never writes directly to Sheets from the browser — only via Apps Script.
 */

(function () {
  'use strict';

  // ─── Apps Script URL ──────────────────────────────────────────────────────
  // Set this to the deployed Apps Script web app URL.
  // Leave as placeholder — the OS will silently skip logging if not set.
  window.APPS_SCRIPT_URL = 'YOUR_APPS_SCRIPT_URL_HERE';

  // Public Library Google Sheets export URL
  // Format: https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?tqx=out:json&sheet={SHEET_NAME}
  const LIBRARY_SHEET_URL = 'YOUR_LIBRARY_SHEET_URL_HERE';

  // In-memory cache for library data during session
  let _libraryCache = null;

  // ─── appsScriptLog ────────────────────────────────────────────────────────
  /**
   * Sends log data to the Apps Script web app.
   * Never crashes the OS on failure.
   * @param {object} data - Log payload (action, email, uid, etc.)
   */
  async function appsScriptLog(data) {
    const url = window.APPS_SCRIPT_URL;
    if (!url || url === 'YOUR_APPS_SCRIPT_URL_HERE') return;

    try {
      await fetch(url, {
        method: 'POST',
        body:   JSON.stringify(data),
        // No Content-Type header — Apps Script handles both
      });
    } catch (e) {
      console.warn('[sheets] appsScriptLog failed (non-critical):', e);
    }
  }
  window.appsScriptLog = appsScriptLog;

  // ─── appsScriptSubmitAppeal ───────────────────────────────────────────────
  /**
   * Submits a suspension appeal via Apps Script.
   * @param {object} data - { email, name, uid, message }
   * @returns {Promise<boolean>} - true if submitted successfully
   */
  async function appsScriptSubmitAppeal(data) {
    const url = window.APPS_SCRIPT_URL;
    if (!url || url === 'YOUR_APPS_SCRIPT_URL_HERE') {
      if (typeof window.notify === 'function') {
        window.notify('error', 'Appeal Failed', 'Appeals system is not configured.');
      }
      return false;
    }

    try {
      const payload = {
        action:  'submit_appeal',
        email:   data.email  || '',
        name:    data.name   || '',
        uid:     data.uid    || '',
        message: data.message || '',
      };

      const resp = await fetch(url, {
        method: 'POST',
        body:   JSON.stringify(payload),
      });

      if (resp.ok) {
        if (typeof window.notify === 'function') {
          window.notify('success', 'Appeal Submitted', 'Your appeal has been received. We will review it shortly.');
        }
        return true;
      } else {
        throw new Error(`HTTP ${resp.status}`);
      }
    } catch (e) {
      console.warn('[sheets] appsScriptSubmitAppeal failed:', e);
      if (typeof window.notify === 'function') {
        window.notify('error', 'Appeal Failed', 'Could not submit your appeal. Please email frzgenerations@gmail.com directly.');
      }
      return false;
    }
  }
  window.appsScriptSubmitAppeal = appsScriptSubmitAppeal;

  // ─── sheetsLoadLibrary ────────────────────────────────────────────────────
  /**
   * Fetches public library data from Google Sheets.
   * Renders results into #library-content.
   * Caches in memory for the session.
   */
  async function sheetsLoadLibrary() {
    const container = document.getElementById('library-content');
    if (!container) return;

    // Use cache if available
    if (_libraryCache) {
      renderLibrary(_libraryCache, container);
      return;
    }

    container.innerHTML = '<div class="loading-msg">📚 Loading library...</div>';

    if (!LIBRARY_SHEET_URL || LIBRARY_SHEET_URL === 'YOUR_LIBRARY_SHEET_URL_HERE') {
      container.innerHTML = '<div class="loading-msg">📚 Library not configured.</div>';
      return;
    }

    try {
      const resp = await fetch(LIBRARY_SHEET_URL);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const text = await resp.text();

      // Google Sheets gviz response: /*O_o*/\ngoogle.visualization.Query.setResponse({...})
      const jsonStr = text.match(/google\.visualization\.Query\.setResponse\(([\s\S]*)\)/)?.[1];
      if (!jsonStr) throw new Error('Could not parse Sheets response');

      const data = JSON.parse(jsonStr);
      const rows = data?.table?.rows || [];

      const entries = rows.map(row => ({
        serial:   row.c[0]?.v || '',
        title:    row.c[1]?.v || '',
        category: row.c[2]?.v || '',
        url:      row.c[3]?.v || '',
      })).filter(e => e.title && e.url);

      _libraryCache = entries;
      renderLibrary(entries, container);
    } catch (e) {
      console.warn('[sheets] sheetsLoadLibrary failed:', e);
      container.innerHTML = `
        <div class="loading-msg" style="color:#f44336">
          ⚠️ Library temporarily unavailable. Please try again later.
        </div>
      `;
    }
  }
  window.sheetsLoadLibrary = sheetsLoadLibrary;

  // ─── renderLibrary (internal) ────────────────────────────────────────────
  /**
   * Renders library entries into the container element.
   * @param {Array}       entries   - Array of { serial, title, category, url }
   * @param {HTMLElement} container - Target container element
   */
  function renderLibrary(entries, container) {
    if (!entries.length) {
      container.innerHTML = '<div class="loading-msg">No items found in the library.</div>';
      return;
    }

    // Build search + table
    container.innerHTML = `
      <div class="library-search-bar">
        <input
          type="text"
          id="library-search"
          placeholder="🔍 Search library..."
          oninput="filterLibrary(this.value)"
        />
      </div>
      <table class="library-table" id="library-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Title</th>
            <th>Category</th>
            <th>Download</th>
          </tr>
        </thead>
        <tbody id="library-tbody">
          ${entries.map((e, i) => `
            <tr class="library-row" data-title="${escapeAttr(e.title)}" data-cat="${escapeAttr(e.category)}">
              <td>${i + 1}</td>
              <td>${escapeHtml(e.title)}</td>
              <td><span class="lib-category-tag">${escapeHtml(e.category)}</span></td>
              <td>
                <a href="${escapeAttr(e.url)}" target="_blank" rel="noopener" class="lib-dl-btn">
                  ⬇ Download
                </a>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    // Expose filter function globally for inline handler
    window.filterLibrary = function (query) {
      const q = query.toLowerCase().trim();
      document.querySelectorAll('.library-row').forEach(row => {
        const title = row.dataset.title.toLowerCase();
        const cat   = row.dataset.cat.toLowerCase();
        row.style.display = (!q || title.includes(q) || cat.includes(q)) ? '' : 'none';
      });
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(str) {
    return escapeHtml(str).replace(/'/g, '&#39;');
  }
})();
