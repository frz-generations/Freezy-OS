// ============================================================
// prayer-times.js — Islamic Prayer Times with Countdown
// Exposes: window.buildPrayer, window.initPrayer, window.loadPrayer
//          window.cleanupPrayer
// ============================================================

let prayerCountdownInterval = null;
let currentPrayerTimes = null;
let currentNextIdx = -1;

const PRAYER_METHODS = [
  { value:'1', label:'MWL — Muslim World League' },
  { value:'2', label:'ISNA — Islamic Society of North America' },
  { value:'3', label:'Karachi — University of Islamic Sciences' },
  { value:'4', label:'Makkah — Umm Al-Qura University' },
  { value:'5', label:'Egypt — Egyptian General Authority' },
  { value:'7', label:'Tehran — Institute of Geophysics' },
  { value:'8', label:'Jafari — Shia Ithna Ashari' },
];

const PRAYER_NAMES = ['Fajr','Sunrise','Dhuhr','Asr','Maghrib','Isha'];
const PRAYER_KEYS  = ['Fajr','Sunrise','Dhuhr','Asr','Maghrib','Isha'];

window.buildPrayer = function () {
  return `
    <div class="pr-wrap">
      <div class="pr-top-bar">
        <div class="pr-hijri" id="prHijri">—</div>
        <div class="pr-controls">
          <select class="pr-select" id="prMethod" onchange="loadPrayer()">
            ${PRAYER_METHODS.map(m => `<option value="${m.value}">${m.label}</option>`).join('')}
          </select>
          <button class="pr-locate-btn" onclick="prDetectLocation()" title="Detect location">📍 Detect</button>
        </div>
      </div>

      <div class="pr-countdown-box" id="prCountdownBox">
        <div class="pr-countdown-label" id="prCountdownLabel">Next Prayer</div>
        <div class="pr-countdown" id="prCountdown">--:--:--</div>
        <div class="pr-next-name" id="prNextName">—</div>
      </div>

      <div class="pr-loading" id="prLoading" style="display:none;">
        <div class="pr-spinner"></div> Loading prayer times...
      </div>

      <div class="pr-error" id="prError" style="display:none;"></div>

      <div class="pr-grid" id="prGrid"></div>

      <div class="pr-placeholder" id="prPlaceholder">
        <div style="font-size:40px;">🕌</div>
        <div>Tap "Detect" to get prayer times for your location</div>
      </div>
    </div>

    <style>
      .pr-wrap { display:flex; flex-direction:column; gap:12px; padding:14px; height:100%; box-sizing:border-box; overflow-y:auto; }
      .pr-top-bar { display:flex; flex-direction:column; gap:8px; }
      .pr-hijri { font-size:13px; color:var(--accent,#00d4ff); text-align:center; font-weight:600; }
      .pr-controls { display:flex; gap:6px; }
      .pr-select { flex:1; background:var(--surface2,#1e1e2e); border:1px solid var(--border,#333); color:var(--text,#cdd6f4); padding:7px 10px; border-radius:8px; font-size:12px; cursor:pointer; }
      .pr-locate-btn { background:var(--surface2,#1e1e2e); border:1px solid var(--border,#333); color:var(--text,#cdd6f4); padding:7px 12px; border-radius:8px; font-size:12px; cursor:pointer; white-space:nowrap; transition:background 0.15s; }
      .pr-locate-btn:hover { background:var(--accent,#00d4ff); color:#000; }
      .pr-countdown-box { background:var(--surface2,#1e1e2e); border-radius:14px; padding:20px; text-align:center; border:1px solid var(--border,#333); }
      .pr-countdown-label { font-size:11px; color:var(--text2,#888); text-transform:uppercase; letter-spacing:1px; margin-bottom:4px; }
      .pr-countdown { font-size:36px; font-family:monospace; color:var(--accent,#00d4ff); font-weight:700; letter-spacing:2px; }
      .pr-next-name { font-size:16px; color:var(--text,#cdd6f4); margin-top:4px; font-weight:600; }
      .pr-loading { display:flex; align-items:center; gap:10px; color:var(--text2,#888); justify-content:center; padding:20px; }
      .pr-spinner { width:18px; height:18px; border:2px solid var(--border,#333); border-top-color:var(--accent,#00d4ff); border-radius:50%; animation:prSpin 0.8s linear infinite; flex-shrink:0; }
      @keyframes prSpin { to { transform:rotate(360deg); } }
      .pr-error { background:#2d1b1b; border:1px solid #f38ba8; color:#f38ba8; padding:10px 14px; border-radius:8px; font-size:13px; }
      .pr-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
      .pr-prayer-card { background:var(--surface2,#1e1e2e); border-radius:10px; padding:12px 14px; border:1px solid var(--border,#2a2a3e); display:flex; justify-content:space-between; align-items:center; }
      .pr-prayer-card.next-prayer { border-color:var(--accent,#00d4ff); box-shadow:0 0 10px rgba(0,212,255,0.15); }
      .pr-prayer-name { font-size:13px; font-weight:600; color:var(--text,#cdd6f4); }
      .pr-prayer-time { font-size:14px; font-family:monospace; color:var(--accent,#00d4ff); }
      .pr-placeholder { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; flex:1; color:var(--text2,#666); font-size:13px; text-align:center; padding:20px; }
    </style>
  `;
};

window.initPrayer = function () {
  if (navigator.geolocation) {
    navigator.permissions && navigator.permissions.query({ name: 'geolocation' }).then(r => {
      if (r.state === 'granted') prDetectLocation();
    }).catch(() => {});
  }
};

window.loadPrayer = function (lat, lon) {
  if (!lat || !lon) {
    const stored = sessionStorage.getItem('freezy_pr_coords');
    if (stored) { const c = JSON.parse(stored); lat = c.lat; lon = c.lon; }
    else return;
  }
  const method = document.getElementById('prMethod') ? document.getElementById('prMethod').value : '4';
  _prShowLoading();
  const today = new Date();
  const dd = today.getDate(), mm = today.getMonth() + 1, yyyy = today.getFullYear();
  fetch(`https://api.aladhan.com/v1/timings/${dd}-${mm}-${yyyy}?latitude=${lat}&longitude=${lon}&method=${method}`)
    .then(r => r.json())
    .then(data => {
      if (data.code !== 200) throw new Error(data.status || 'API error');
      currentPrayerTimes = data.data.timings;
      const hijri = data.data.date.hijri;
      _prRender(currentPrayerTimes, hijri);
    })
    .catch(e => {
      document.getElementById('prLoading').style.display = 'none';
      const el = document.getElementById('prError');
      el.style.display = 'block';
      el.textContent = '⚠️ Could not load prayer times. Please check your connection.';
    });
};

function prDetectLocation() {
  if (!navigator.geolocation) {
    const el = document.getElementById('prError');
    el.style.display = 'block';
    el.textContent = '⚠️ Geolocation not supported.';
    return;
  }
  _prShowLoading();
  navigator.geolocation.getCurrentPosition(pos => {
    sessionStorage.setItem('freezy_pr_coords', JSON.stringify({ lat: pos.coords.latitude, lon: pos.coords.longitude }));
    window.loadPrayer(pos.coords.latitude, pos.coords.longitude);
  }, () => {
    document.getElementById('prLoading').style.display = 'none';
    const el = document.getElementById('prError');
    el.style.display = 'block';
    el.textContent = '⚠️ Location access denied.';
  });
}
window.prDetectLocation = prDetectLocation;

function _prRender(timings, hijri) {
  document.getElementById('prLoading').style.display = 'none';
  document.getElementById('prError').style.display = 'none';
  document.getElementById('prPlaceholder').style.display = 'none';

  if (hijri) {
    document.getElementById('prHijri').textContent =
      `${hijri.day} ${hijri.month.en} ${hijri.year} AH`;
  }

  const nowMins = _prNowMins();
  let nextIdx = -1;
  const prayerMins = PRAYER_KEYS.map(k => _prTimeToMins(timings[k]));

  for (let i = 0; i < prayerMins.length; i++) {
    if (prayerMins[i] > nowMins) { nextIdx = i; break; }
  }
  if (nextIdx === -1) nextIdx = 0; // Fajr tomorrow
  currentNextIdx = nextIdx;

  const grid = document.getElementById('prGrid');
  grid.innerHTML = PRAYER_NAMES.map((name, i) => `
    <div class="pr-prayer-card ${i === nextIdx ? 'next-prayer' : ''}">
      <span class="pr-prayer-name">${name}</span>
      <span class="pr-prayer-time">${timings[PRAYER_KEYS[i]] || '—'}</span>
    </div>
  `).join('');

  document.getElementById('prNextName').textContent = PRAYER_NAMES[nextIdx] + ' prayer';

  if (prayerCountdownInterval) clearInterval(prayerCountdownInterval);
  _prTickCountdown(timings, nextIdx, prayerMins);
  prayerCountdownInterval = setInterval(() => _prTickCountdown(timings, nextIdx, prayerMins), 1000);
}

function _prTickCountdown(timings, nextIdx, prayerMins) {
  const nowMins = _prNowMins();
  const nowSecs = Math.floor(Date.now() / 1000) % 60;
  let diffMins;
  if (prayerMins[nextIdx] > nowMins) {
    diffMins = prayerMins[nextIdx] - nowMins;
  } else {
    diffMins = (24 * 60 - nowMins) + prayerMins[0];
  }
  const totalSecs = diffMins * 60 - nowSecs;
  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;
  const el = document.getElementById('prCountdown');
  if (el) el.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
}

function _prTimeToMins(timeStr) {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function _prNowMins() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function _prShowLoading() {
  document.getElementById('prLoading').style.display = 'flex';
  document.getElementById('prError').style.display = 'none';
  document.getElementById('prGrid').innerHTML = '';
  document.getElementById('prPlaceholder').style.display = 'none';
}

window.cleanupPrayer = function () {
  if (prayerCountdownInterval) {
    clearInterval(prayerCountdownInterval);
    prayerCountdownInterval = null;
  }
};