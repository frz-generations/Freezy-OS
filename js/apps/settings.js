// ============================================================
// settings.js — OS Settings Panel
// Exposes: window.buildSettings, window.initSettings,
//          window.showSettingsPanel, window.applyWallpaperSetting,
//          window.clearWallpaper, window.setLockPass,
//          window.switchTheme, window.applyIconTheme
// ============================================================

window.buildSettings = function () {
  return `
    <div class="st-wrap">
      <div class="st-sidebar">
        <div class="st-sidebar-title">Settings</div>
        <div class="st-nav-item active" id="stNav-appearance" onclick="showSettingsPanel('appearance',this)">🎨 Appearance</div>
        <div class="st-nav-item" id="stNav-system"     onclick="showSettingsPanel('system',this)">⚙️ System</div>
        <div class="st-nav-item" id="stNav-permissions" onclick="showSettingsPanel('permissions',this)">🔒 Permissions</div>
        <div class="st-nav-item" id="stNav-power"      onclick="showSettingsPanel('power',this)">⏻ Power</div>
        <div class="st-nav-item" id="stNav-about"      onclick="showSettingsPanel('about',this)">ℹ️ About</div>
      </div>

      <div class="st-content" id="stContent">
        <!-- Panels injected here -->
      </div>
    </div>

    <style>
      .st-wrap { display:flex; height:100%; overflow:hidden; }
      .st-sidebar { width:170px; flex-shrink:0; background:var(--surface,#12121e); border-right:1px solid var(--border,#222); display:flex; flex-direction:column; padding:8px 0; overflow-y:auto; }
      .st-sidebar-title { font-size:10px; text-transform:uppercase; letter-spacing:1px; color:var(--text2,#555); padding:6px 14px 10px; }
      .st-nav-item { padding:9px 14px; font-size:13px; color:var(--text,#aaa); cursor:pointer; transition:background 0.1s; }
      .st-nav-item:hover { background:var(--surface2,#1e1e2e); color:var(--text,#cdd6f4); }
      .st-nav-item.active { background:var(--surface2,#1e1e2e); color:var(--accent,#00d4ff); border-left:2px solid var(--accent,#00d4ff); }
      .st-content { flex:1; overflow-y:auto; padding:20px; }
      .st-section { margin-bottom:28px; }
      .st-section-title { font-size:11px; text-transform:uppercase; letter-spacing:1px; color:var(--text2,#888); margin-bottom:12px; border-bottom:1px solid var(--border,#222); padding-bottom:6px; }
      .st-row { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:14px; }
      .st-label { font-size:13px; color:var(--text,#cdd6f4); }
      .st-sublabel { font-size:11px; color:var(--text2,#888); margin-top:2px; }
      .st-input { background:var(--surface,#12121e); border:1px solid var(--border,#333); color:var(--text,#cdd6f4); padding:7px 10px; border-radius:7px; font-size:13px; flex:1; max-width:220px; }
      .st-input:focus { outline:none; border-color:var(--accent,#00d4ff); }
      .st-btn { background:var(--surface2,#1e1e2e); border:1px solid var(--border,#333); color:var(--text,#cdd6f4); padding:7px 14px; border-radius:7px; font-size:12px; cursor:pointer; transition:background 0.15s; white-space:nowrap; }
      .st-btn:hover { background:var(--surface3,#2a2a3e); }
      .st-btn-accent { background:var(--accent,#00d4ff); color:#000; border-color:var(--accent,#00d4ff); font-weight:600; }
      .st-btn-accent:hover { background:var(--accent2,#00b8d9); }
      .st-btn-danger { color:#f38ba8; border-color:#f38ba8; }
      .st-btn-danger:hover { background:#f38ba8; color:#000; }
      .st-slider { width:140px; accent-color:var(--accent,#00d4ff); cursor:pointer; }
      .st-preview { width:100%; height:70px; border-radius:8px; border:1px solid var(--border,#333); background-size:cover; background-position:center; background-color:var(--surface2,#1e1e2e); margin-bottom:8px; display:flex; align-items:center; justify-content:center; color:var(--text2,#555); font-size:12px; }
      .st-theme-cards { display:flex; gap:10px; flex-wrap:wrap; }
      .st-theme-card { width:110px; height:70px; border-radius:10px; border:2px solid var(--border,#333); cursor:pointer; display:flex; align-items:flex-end; padding:6px 8px; font-size:11px; font-weight:600; transition:border-color 0.15s; }
      .st-theme-card:hover { border-color:var(--accent,#00d4ff); }
      .st-theme-card.active { border-color:var(--accent,#00d4ff); }
      .st-theme-dark { background:linear-gradient(135deg,#12121e,#1e1e2e); color:#cdd6f4; }
      .st-theme-light { background:linear-gradient(135deg,#f0f0f5,#e0e0ea); color:#222; }
      .st-toggle-wrap { display:flex; align-items:center; gap:10px; }
      .st-toggle { position:relative; width:42px; height:24px; }
      .st-toggle input { opacity:0; width:0; height:0; }
      .st-toggle-slider { position:absolute; inset:0; background:var(--surface,#12121e); border-radius:24px; cursor:pointer; border:1px solid var(--border,#333); transition:background 0.2s; }
      .st-toggle input:checked + .st-toggle-slider { background:var(--accent,#00d4ff); border-color:var(--accent,#00d4ff); }
      .st-toggle-slider:before { content:''; position:absolute; width:18px; height:18px; left:2px; top:2px; background:#fff; border-radius:50%; transition:transform 0.2s; }
      .st-toggle input:checked + .st-toggle-slider:before { transform:translateX(18px); }
      .st-power-btn { width:100%; padding:12px; border-radius:10px; font-size:14px; font-weight:600; cursor:pointer; border:1px solid var(--border,#333); background:var(--surface2,#1e1e2e); color:var(--text,#cdd6f4); margin-bottom:10px; display:flex; align-items:center; gap:10px; transition:all 0.15s; }
      .st-power-btn:hover { background:var(--surface3,#2a2a3e); }
      .st-power-btn.danger:hover { background:#f38ba8; color:#000; border-color:#f38ba8; }
      .st-about-logo { font-size:48px; text-align:center; margin-bottom:10px; }
      .st-about-name { font-size:22px; font-weight:700; color:var(--accent,#00d4ff); text-align:center; }
      .st-about-ver  { font-size:13px; color:var(--text2,#888); text-align:center; margin-bottom:16px; }
      .st-about-desc { font-size:13px; color:var(--text,#cdd6f4); line-height:1.6; margin-bottom:16px; text-align:center; }
      .st-about-links { display:flex; justify-content:center; gap:12px; flex-wrap:wrap; }
      .st-about-link { color:var(--accent,#00d4ff); font-size:12px; text-decoration:none; }
      .st-about-link:hover { text-decoration:underline; }
      .st-select { background:var(--surface,#12121e); border:1px solid var(--border,#333); color:var(--text,#cdd6f4); padding:7px 10px; border-radius:7px; font-size:13px; cursor:pointer; }
      .st-perm-row { display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border,#1a1a2e); }
      .st-perm-info { flex:1; }
      .st-perm-name { font-size:13px; font-weight:600; color:var(--text,#cdd6f4); }
      .st-perm-desc { font-size:11px; color:var(--text2,#888); margin-top:2px; }
    </style>
  `;
};

window.initSettings = function () {
  showSettingsPanel('appearance', document.getElementById('stNav-appearance'));
};

window.showSettingsPanel = function (id, el) {
  document.querySelectorAll('.st-nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');

  const panels = {
    appearance: _stAppearancePanel,
    system:     _stSystemPanel,
    permissions:_stPermissionsPanel,
    power:      _stPowerPanel,
    about:      _stAboutPanel,
  };

  const fn = panels[id];
  if (fn) document.getElementById('stContent').innerHTML = fn();
  _stAfterRender(id);
};

// ── Appearance ──────────────────────────────────────────────
function _stAppearancePanel() {
  const settings = _stGetSettings();
  const wallpaper = settings.wallpaper || '';
  return `
    <div class="st-section">
      <div class="st-section-title">Wallpaper</div>
      <div class="st-preview" id="stWallPreview" style="background-image:${wallpaper ? 'url('+wallpaper+')' : 'none'}">
        ${wallpaper ? '' : 'No wallpaper set'}
      </div>
      <div class="st-row">
        <input class="st-input" id="stWallInput" type="text" placeholder="Direct image URL..." value="${wallpaper}" style="max-width:100%;flex:1;" />
      </div>
      <div class="st-row">
        <button class="st-btn st-btn-accent" onclick="applyWallpaperSetting()">Apply</button>
        <button class="st-btn" onclick="clearWallpaper()">Clear</button>
        <span style="font-size:11px;color:var(--text2,#888);">Host images at <a href="https://frzimage.xo.je" target="_blank" style="color:var(--accent,#00d4ff);">frzimage.xo.je</a></span>
      </div>
    </div>

    <div class="st-section">
      <div class="st-section-title">Theme</div>
      <div class="st-theme-cards">
        <div class="st-theme-card st-theme-dark ${settings.theme !== 'light' ? 'active' : ''}" onclick="switchTheme('dark')">
          Dark FRZ
        </div>
        <div class="st-theme-card st-theme-light ${settings.theme === 'light' ? 'active' : ''}" onclick="switchTheme('light')">
          Light FRZ
        </div>
      </div>
    </div>

    <div class="st-section">
      <div class="st-section-title">Dock Position</div>
      <div class="st-row">
        <span class="st-label">Position</span>
        <select class="st-select" onchange="stSetDockPos(this.value)">
          <option value="bottom" ${(settings.dockPos||'bottom')==='bottom'?'selected':''}>Bottom</option>
          <option value="left"   disabled>Left (coming soon)</option>
          <option value="right"  disabled>Right (coming soon)</option>
        </select>
      </div>
    </div>
  `;
}

window.applyWallpaperSetting = function () {
  const url = document.getElementById('stWallInput').value.trim();
  if (!url) return;
  const prev = document.getElementById('stWallPreview');
  if (prev) { prev.style.backgroundImage = 'url(' + url + ')'; prev.textContent = ''; }
  const settings = _stGetSettings();
  settings.wallpaper = url;
  _stSaveSettings(settings);
  if (window.applyWallpaper) window.applyWallpaper(url);
  else document.body.style.backgroundImage = 'url(' + url + ')';
  if (window.notify) window.notify('Wallpaper applied.');
};

window.clearWallpaper = function () {
  const prev = document.getElementById('stWallPreview');
  if (prev) { prev.style.backgroundImage = 'none'; prev.textContent = 'No wallpaper set'; }
  const inp = document.getElementById('stWallInput');
  if (inp) inp.value = '';
  const settings = _stGetSettings();
  settings.wallpaper = '';
  _stSaveSettings(settings);
  document.body.style.backgroundImage = '';
  if (window.notify) window.notify('Wallpaper cleared.');
};

window.switchTheme = function (themeId) {
  const settings = _stGetSettings();
  settings.theme = themeId;
  _stSaveSettings(settings);
  document.querySelectorAll('.st-theme-card').forEach(c => c.classList.remove('active'));
  if (themeId === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  if (window.notify) window.notify('Theme switched to ' + themeId + '.');
};

window.applyIconTheme = function (themeId) {
  const settings = _stGetSettings();
  settings.iconTheme = themeId;
  _stSaveSettings(settings);
  if (window.notify) window.notify('Icon theme applied.');
};

function stSetDockPos(pos) {
  const settings = _stGetSettings();
  settings.dockPos = pos;
  _stSaveSettings(settings);
  if (window.notify) window.notify('Dock position set to ' + pos + '.');
}
window.stSetDockPos = stSetDockPos;

// ── System ───────────────────────────────────────────────────
function _stSystemPanel() {
  const settings = _stGetSettings();
  return `
    <div class="st-section">
      <div class="st-section-title">Display</div>
      <div class="st-row">
        <div><div class="st-label">Brightness</div><div class="st-sublabel">Overlay dimming</div></div>
        <input class="st-slider" type="range" min="10" max="100" value="${settings.brightness||100}"
          oninput="stSetBrightness(this.value)" />
        <span class="st-label" id="stBrightVal">${settings.brightness||100}%</span>
      </div>
    </div>

    <div class="st-section">
      <div class="st-section-title">Audio</div>
      <div class="st-row">
        <div><div class="st-label">Volume</div><div class="st-sublabel">System volume</div></div>
        <input class="st-slider" type="range" min="0" max="100" value="${settings.volume||80}"
          oninput="stSetVolume(this.value)" />
        <span class="st-label" id="stVolVal">${settings.volume||80}%</span>
      </div>
    </div>

    <div class="st-section">
      <div class="st-section-title">Lock Screen</div>
      <div class="st-row">
        <span class="st-label">Password</span>
        <input class="st-input" id="stLockPassInput" type="password" placeholder="New password..." maxlength="32" />
        <button class="st-btn st-btn-accent" onclick="setLockPass()">Set</button>
      </div>
      <div class="st-row">
        <span class="st-label">Auto-lock</span>
        <select class="st-select" onchange="stSetAutoLock(this.value)">
          <option value="5"   ${settings.autoLock==5?'selected':''}>5 min</option>
          <option value="10"  ${settings.autoLock==10?'selected':''}>10 min</option>
          <option value="15"  ${(settings.autoLock==15||!settings.autoLock)?'selected':''}>15 min</option>
          <option value="30"  ${settings.autoLock==30?'selected':''}>30 min</option>
          <option value="60"  ${settings.autoLock==60?'selected':''}>60 min</option>
          <option value="0"   ${settings.autoLock==0?'selected':''}>Never</option>
        </select>
      </div>
    </div>
  `;
}

window.setLockPass = function () {
  const inp = document.getElementById('stLockPassInput');
  if (!inp) return;
  const pass = inp.value.trim();
  if (!pass) { if (window.notify) window.notify('Password cannot be empty.'); return; }
  const settings = _stGetSettings();
  settings.lockPass = btoa(pass);
  _stSaveSettings(settings);
  inp.value = '';
  if (window.notify) window.notify('Lock screen password updated.');
};

function stSetBrightness(val) {
  document.getElementById('stBrightVal').textContent = val + '%';
  const settings = _stGetSettings();
  settings.brightness = parseInt(val);
  _stSaveSettings(settings);
  if (window.setBrightness) window.setBrightness(val);
}
window.stSetBrightness = stSetBrightness;

function stSetVolume(val) {
  document.getElementById('stVolVal').textContent = val + '%';
  const settings = _stGetSettings();
  settings.volume = parseInt(val);
  _stSaveSettings(settings);
  if (window.setVolume) window.setVolume(val);
}
window.stSetVolume = stSetVolume;

function stSetAutoLock(val) {
  const settings = _stGetSettings();
  settings.autoLock = parseInt(val);
  _stSaveSettings(settings);
  if (window.notify) window.notify('Auto-lock set to ' + (val == 0 ? 'Never' : val + ' min') + '.');
}
window.stSetAutoLock = stSetAutoLock;

// ── Permissions ──────────────────────────────────────────────
function _stPermissionsPanel() {
  const perms = _stGetPerms();
  const PERMS = [
    { key:'location',      name:'Location',      desc:'Used for prayer times, weather, and maps.', icon:'📍' },
    { key:'notifications', name:'Notifications',  desc:'System and app notifications.',             icon:'🔔' },
    { key:'camera',        name:'Camera',         desc:'Used for QR Connect scanning.',             icon:'📷' },
    { key:'microphone',    name:'Microphone',     desc:'Reserved for future voice features.',       icon:'🎤' },
    { key:'storage',       name:'Local Storage',  desc:'Stores OS settings and preferences.',       icon:'💾' },
  ];
  return `
    <div class="st-section">
      <div class="st-section-title">App Permissions</div>
      ${PERMS.map(p => `
        <div class="st-perm-row">
          <div class="st-perm-info">
            <div class="st-perm-name">${p.icon} ${p.name}</div>
            <div class="st-perm-desc">${p.desc}</div>
          </div>
          <label class="st-toggle">
            <input type="checkbox" ${perms[p.key] ? 'checked' : ''} onchange="stTogglePerm('${p.key}',this.checked)" />
            <span class="st-toggle-slider"></span>
          </label>
        </div>
      `).join('')}
    </div>
  `;
}

function stTogglePerm(key, val) {
  const perms = _stGetPerms();
  perms[key] = val;
  localStorage.setItem('freezy_permissions', JSON.stringify(perms));
  if (val && key === 'notifications' && 'Notification' in window) {
    Notification.requestPermission();
  }
  if (window.notify) window.notify((val ? '✅' : '❌') + ' ' + key + ' permission ' + (val ? 'enabled' : 'disabled') + '.');
}
window.stTogglePerm = stTogglePerm;

// ── Power ────────────────────────────────────────────────────
function _stPowerPanel() {
  return `
    <div class="st-section">
      <div class="st-section-title">Power Options</div>
      <button class="st-power-btn" onclick="if(window.lockScreen)lockScreen()">
        🔒 <span><div style="font-weight:600">Lock Screen</div><div style="font-size:11px;font-weight:400;color:#888">Requires password to unlock</div></span>
      </button>
      <button class="st-power-btn" onclick="if(window.logout)logout()">
        🚪 <span><div style="font-weight:600">Log Out</div><div style="font-size:11px;font-weight:400;color:#888">Return to login screen</div></span>
      </button>
      <button class="st-power-btn" disabled title="Desktop app only" style="opacity:0.4;cursor:not-allowed;">
        💤 <span><div style="font-weight:600">Sleep</div><div style="font-size:11px;font-weight:400;color:#888">Available in desktop app (.exe) only</div></span>
      </button>
      <button class="st-power-btn danger" disabled title="Desktop app only" style="opacity:0.4;cursor:not-allowed;">
        ⏻ <span><div style="font-weight:600">Shutdown</div><div style="font-size:11px;font-weight:400;color:#888">Available in desktop app (.exe) only</div></span>
      </button>
      <div style="font-size:11px;color:var(--text2,#888);margin-top:8px;">
        💡 Sleep and Shutdown are available in the Freezy-OS desktop application only.
      </div>
    </div>
  `;
}

// ── About ────────────────────────────────────────────────────
function _stAboutPanel() {
  return `
    <div class="st-section">
      <div class="st-about-logo">❄️</div>
      <div class="st-about-name">Freezy-OS</div>
      <div class="st-about-ver">Version 1.0.0 · Build 2026</div>
      <div class="st-about-desc">
        A modern web-based operating system experience, built for everyone.<br>
        Run apps, manage files, connect devices — all in your browser.
      </div>
      <div class="st-about-links">
        <a class="st-about-link" href="terms.html" target="_blank">Terms of Service</a>
        <a class="st-about-link" href="privacy.html" target="_blank">Privacy Policy</a>
        <a class="st-about-link" href="https://frzgenerations.com" target="_blank">FRZ Generations</a>
      </div>
      <div style="margin-top:24px;font-size:11px;color:var(--text2,#666);text-align:center;">
        Designed and Developed under FRZ Generations © 2026
      </div>
    </div>
  `;
}

// ── After-render hooks ───────────────────────────────────────
function _stAfterRender(id) {
  // Nothing needed for most panels — sliders already use oninput
}

// ── Helpers ──────────────────────────────────────────────────
function _stGetSettings() {
  try { return JSON.parse(localStorage.getItem('freezy_settings') || '{}'); } catch(e) { return {}; }
}
function _stSaveSettings(s) {
  localStorage.setItem('freezy_settings', JSON.stringify(s));
  if (window.saveSettings) window.saveSettings(s);
}
function _stGetPerms() {
  try { return JSON.parse(localStorage.getItem('freezy_permissions') || '{}'); } catch(e) { return {}; }
}
