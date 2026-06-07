// ============================================================
// community.js — Community Tools Grid + Submit Form
// Exposes: window.buildCommunity, window.initCommunity,
//          window.submitCommunityTool
// ============================================================

const COMMUNITY_TOOLS = [
  { name:'QR Generator',  desc:'Generate QR codes instantly',    url:'https://qrfrz.xo.je',            icon:'📷' },
  { name:'URL Shortener', desc:'Shorten long URLs fast',          url:'https://turl.xo.je',             icon:'🔗' },
  { name:'WA Converter',  desc:'Format WhatsApp click-to-chat links', url:'https://wame-frz.netlify.app', icon:'💬' },
  { name:'Image Host',    desc:'Host and share images online',    url:'https://frzimage.xo.je',         icon:'🖼️' },
  { name:'PDF Host',      desc:'Host and share PDF files',        url:'https://frzpdf.xo.je',           icon:'📄' },
  { name:'Media Host',    desc:'Host media files online',         url:'https://frzmedia.xo.je',         icon:'🎞️' },
];

window.buildCommunity = function () {
  return `
    <div class="cm-wrap">
      <div class="cm-header">
        <div class="cm-header-title">🌐 Community Tools</div>
        <div class="cm-header-sub">Free tools built by FRZ Generations for everyone</div>
      </div>

      <div class="cm-tools-grid" id="cmToolsGrid">
        ${COMMUNITY_TOOLS.map(t => `
          <div class="cm-tool-card" onclick="cmOpenTool('${encodeURIComponent(t.url)}','${encodeURIComponent(t.name)}')">
            <div class="cm-tool-icon">${t.icon}</div>
            <div class="cm-tool-name">${t.name}</div>
            <div class="cm-tool-desc">${t.desc}</div>
            <div class="cm-tool-arrow">↗</div>
          </div>
        `).join('')}
      </div>

      <div class="cm-divider">
        <div class="cm-divider-line"></div>
        <span class="cm-divider-text">Submit Your Tool</span>
        <div class="cm-divider-line"></div>
      </div>

      <div class="cm-submit-form" id="cmSubmitForm">
        <div class="cm-form-title">📬 Submit a Community Tool</div>
        <div class="cm-form-sub">Have a free tool to share? Submit it for review and it may be featured here.</div>

        <div class="cm-field-group">
          <div class="cm-field">
            <label class="cm-label">Tool Name <span class="cm-req">*</span></label>
            <input class="cm-input" id="cmName" type="text" placeholder="My Awesome Tool" maxlength="60" />
          </div>
          <div class="cm-field">
            <label class="cm-label">Tool URL <span class="cm-req">*</span></label>
            <input class="cm-input" id="cmUrl" type="url" placeholder="https://mytool.example.com" />
          </div>
        </div>

        <div class="cm-field">
          <label class="cm-label">Description <span class="cm-req">*</span></label>
          <input class="cm-input" id="cmDesc" type="text" placeholder="What does this tool do? (max 100 chars)" maxlength="100" />
        </div>

        <div class="cm-field-group">
          <div class="cm-field">
            <label class="cm-label">Your Name / Credits <span class="cm-req">*</span></label>
            <input class="cm-input" id="cmCredit" type="text" placeholder="Your name or handle" maxlength="60" />
          </div>
          <div class="cm-field">
            <label class="cm-label">API Keys Needed?</label>
            <input class="cm-input" id="cmApiKeys" type="text" placeholder="e.g. None / OpenAI key" maxlength="100" />
          </div>
        </div>

        <div class="cm-field cm-icon-field">
          <label class="cm-label">Icon (emoji)</label>
          <input class="cm-input cm-icon-input" id="cmIcon" type="text" placeholder="🛠️" maxlength="4" />
        </div>

        <div class="cm-form-footer">
          <span class="cm-form-note">⚠️ Submitted tools are reviewed before being featured. HTTPS only.</span>
          <button class="cm-submit-btn" onclick="submitCommunityTool()">Submit Tool →</button>
        </div>
      </div>
    </div>

    <style>
      .cm-wrap { display:flex; flex-direction:column; gap:16px; padding:16px; height:100%; box-sizing:border-box; overflow-y:auto; }
      .cm-header { text-align:center; }
      .cm-header-title { font-size:20px; font-weight:700; color:var(--text,#cdd6f4); }
      .cm-header-sub { font-size:12px; color:var(--text2,#888); margin-top:2px; }
      .cm-tools-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(150px,1fr)); gap:10px; }
      .cm-tool-card { background:var(--surface2,#1e1e2e); border:1px solid var(--border,#2a2a3e); border-radius:12px; padding:14px 12px; cursor:pointer; display:flex; flex-direction:column; gap:4px; transition:all 0.15s; position:relative; }
      .cm-tool-card:hover { border-color:var(--accent,#00d4ff); transform:translateY(-2px); box-shadow:0 4px 16px rgba(0,212,255,0.1); }
      .cm-tool-icon { font-size:28px; }
      .cm-tool-name { font-size:13px; font-weight:700; color:var(--text,#cdd6f4); }
      .cm-tool-desc { font-size:11px; color:var(--text2,#888); line-height:1.4; }
      .cm-tool-arrow { position:absolute; top:10px; right:12px; color:var(--accent,#00d4ff); font-size:14px; opacity:0; transition:opacity 0.15s; }
      .cm-tool-card:hover .cm-tool-arrow { opacity:1; }
      .cm-divider { display:flex; align-items:center; gap:10px; }
      .cm-divider-line { flex:1; height:1px; background:var(--border,#2a2a3e); }
      .cm-divider-text { font-size:11px; color:var(--text2,#888); text-transform:uppercase; letter-spacing:1px; white-space:nowrap; }
      .cm-submit-form { background:var(--surface2,#1e1e2e); border:1px solid var(--border,#2a2a3e); border-radius:14px; padding:18px; display:flex; flex-direction:column; gap:12px; }
      .cm-form-title { font-size:15px; font-weight:700; color:var(--text,#cdd6f4); }
      .cm-form-sub { font-size:12px; color:var(--text2,#888); line-height:1.4; }
      .cm-field-group { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
      .cm-field { display:flex; flex-direction:column; gap:4px; }
      .cm-label { font-size:11px; color:var(--text2,#888); text-transform:uppercase; letter-spacing:0.5px; }
      .cm-req { color:#f38ba8; }
      .cm-input { background:var(--surface,#12121e); border:1px solid var(--border,#333); color:var(--text,#cdd6f4); padding:8px 10px; border-radius:7px; font-size:13px; width:100%; box-sizing:border-box; }
      .cm-input:focus { outline:none; border-color:var(--accent,#00d4ff); }
      .cm-icon-field { max-width:120px; }
      .cm-icon-input { text-align:center; font-size:20px; }
      .cm-form-footer { display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
      .cm-form-note { font-size:11px; color:var(--text2,#777); flex:1; }
      .cm-submit-btn { background:var(--accent,#00d4ff); color:#000; border:none; padding:9px 20px; border-radius:8px; font-size:13px; font-weight:700; cursor:pointer; white-space:nowrap; transition:background 0.15s; }
      .cm-submit-btn:hover { background:var(--accent2,#00b8d9); }
    </style>
  `;
};

window.initCommunity = function () {
  // Tools grid is rendered statically in buildCommunity
};

function cmOpenTool(encodedUrl, encodedName) {
  const url  = decodeURIComponent(encodedUrl);
  const name = decodeURIComponent(encodedName);
  if (window.openIframeApp) {
    window.openIframeApp(url, name);
  } else {
    window.open(url, '_blank');
  }
}
window.cmOpenTool = cmOpenTool;

window.submitCommunityTool = function () {
  const name    = document.getElementById('cmName').value.trim();
  const url     = document.getElementById('cmUrl').value.trim();
  const desc    = document.getElementById('cmDesc').value.trim();
  const credit  = document.getElementById('cmCredit').value.trim();
  const apiKeys = document.getElementById('cmApiKeys').value.trim();
  const icon    = document.getElementById('cmIcon').value.trim() || '🛠️';

  // Validation
  if (!name)   { _cmError('cmName',   'Tool name is required.'); return; }
  if (!url)    { _cmError('cmUrl',    'Tool URL is required.'); return; }
  if (!url.startsWith('https://')) { _cmError('cmUrl', 'URL must start with https://'); return; }
  if (!desc)   { _cmError('cmDesc',   'Description is required.'); return; }
  if (!credit) { _cmError('cmCredit', 'Your name / credits are required.'); return; }

  const payload = { action: 'submit_community_tool', name, url, desc, credit, apiKeys, icon, timestamp: new Date().toISOString() };

  // Log to Apps Script if available
  if (window.logToAppsScript) {
    window.logToAppsScript(payload);
  }

  // Clear form
  ['cmName','cmUrl','cmDesc','cmCredit','cmApiKeys','cmIcon'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  if (window.notify) window.notify('✅ Tool submitted! It will be reviewed before being featured. Thank you!');
};

function _cmError(fieldId, msg) {
  const el = document.getElementById(fieldId);
  if (el) {
    el.style.borderColor = '#f38ba8';
    el.focus();
    setTimeout(() => { el.style.borderColor = ''; }, 2500);
  }
  if (window.notify) window.notify('⚠️ ' + msg);
}
