// ============================================================
// calendar.js — Gregorian Calendar Month View
// Exposes: window.buildCalendar, window.initCalendar,
//          window.renderCalendar, window.calNav
// ============================================================

let calCurrentMonth = new Date().getMonth();
let calCurrentYear  = new Date().getFullYear();
const CAL_DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const CAL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

window.buildCalendar = function () {
  return `
    <div class="cal-wrap">
      <div class="cal-header">
        <button class="cal-nav-btn" onclick="calNav(-1)">‹</button>
        <div class="cal-title" id="calTitle">—</div>
        <button class="cal-nav-btn" onclick="calNav(1)">›</button>
      </div>
      <div class="cal-today-btn-row">
        <button class="cal-today-btn" onclick="calGoToday()">Today</button>
      </div>
      <div class="cal-days-header">
        ${CAL_DAYS.map(d => `<div class="cal-day-name">${d}</div>`).join('')}
      </div>
      <div class="cal-grid" id="calGrid"></div>
    </div>

    <style>
      .cal-wrap { display:flex; flex-direction:column; gap:8px; padding:14px; height:100%; box-sizing:border-box; }
      .cal-header { display:flex; align-items:center; justify-content:space-between; }
      .cal-nav-btn { background:var(--surface2,#1e1e2e); border:1px solid var(--border,#333); color:var(--text,#cdd6f4); width:36px; height:36px; border-radius:8px; font-size:20px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.15s; }
      .cal-nav-btn:hover { background:var(--accent,#00d4ff); color:#000; }
      .cal-title { font-size:18px; font-weight:700; color:var(--text,#cdd6f4); }
      .cal-today-btn-row { display:flex; justify-content:center; }
      .cal-today-btn { background:transparent; border:1px solid var(--accent,#00d4ff); color:var(--accent,#00d4ff); padding:4px 18px; border-radius:20px; font-size:12px; cursor:pointer; transition:all 0.15s; }
      .cal-today-btn:hover { background:var(--accent,#00d4ff); color:#000; }
      .cal-days-header { display:grid; grid-template-columns:repeat(7,1fr); gap:2px; }
      .cal-day-name { text-align:center; font-size:11px; color:var(--text2,#888); text-transform:uppercase; letter-spacing:0.5px; padding:4px 0; }
      .cal-grid { display:grid; grid-template-columns:repeat(7,1fr); gap:3px; flex:1; }
      .cal-cell { aspect-ratio:1; display:flex; align-items:center; justify-content:center; border-radius:8px; font-size:13px; color:var(--text,#cdd6f4); cursor:pointer; transition:background 0.12s; border:1px solid transparent; }
      .cal-cell:hover { background:var(--surface2,#1e1e2e); }
      .cal-cell.dimmed { color:var(--text2,#444); cursor:default; }
      .cal-cell.dimmed:hover { background:transparent; }
      .cal-cell.today { background:var(--accent,#00d4ff); color:#000; font-weight:700; border-color:var(--accent,#00d4ff); }
      .cal-cell.today:hover { background:var(--accent,#00d4ff); }
      .cal-cell.selected { border-color:var(--accent,#00d4ff); }
    </style>
  `;
};

window.initCalendar = function () {
  calCurrentMonth = new Date().getMonth();
  calCurrentYear  = new Date().getFullYear();
  renderCalendar();
};

window.renderCalendar = function () {
  if (calCurrentYear < 1900) { calCurrentYear = 1900; calCurrentMonth = 0; }
  if (calCurrentYear > 2100) { calCurrentYear = 2100; calCurrentMonth = 11; }

  document.getElementById('calTitle').textContent = `${CAL_MONTHS[calCurrentMonth]} ${calCurrentYear}`;

  const firstDay = new Date(calCurrentYear, calCurrentMonth, 1).getDay();
  const daysInMonth = new Date(calCurrentYear, calCurrentMonth + 1, 0).getDate();
  const daysInPrev  = new Date(calCurrentYear, calCurrentMonth, 0).getDate();

  const today = new Date();
  const todayD = today.getDate(), todayM = today.getMonth(), todayY = today.getFullYear();

  let cells = '';

  // Prev month filler
  for (let i = firstDay - 1; i >= 0; i--) {
    cells += `<div class="cal-cell dimmed">${daysInPrev - i}</div>`;
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const isToday = (d === todayD && calCurrentMonth === todayM && calCurrentYear === todayY);
    cells += `<div class="cal-cell ${isToday ? 'today' : ''}" onclick="calSelectDay(${d})">${d}</div>`;
  }

  // Next month filler
  const total = firstDay + daysInMonth;
  const remaining = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let d = 1; d <= remaining; d++) {
    cells += `<div class="cal-cell dimmed">${d}</div>`;
  }

  document.getElementById('calGrid').innerHTML = cells;
};

window.calNav = function (dir) {
  calCurrentMonth += dir;
  if (calCurrentMonth > 11) { calCurrentMonth = 0; calCurrentYear++; }
  if (calCurrentMonth < 0)  { calCurrentMonth = 11; calCurrentYear--; }
  renderCalendar();
};

function calGoToday() {
  calCurrentMonth = new Date().getMonth();
  calCurrentYear  = new Date().getFullYear();
  renderCalendar();
}
window.calGoToday = calGoToday;

function calSelectDay(d) {
  const date = new Date(calCurrentYear, calCurrentMonth, d);
  const opts = { weekday:'long', year:'numeric', month:'long', day:'numeric' };
  if (window.notify) window.notify(date.toLocaleDateString(undefined, opts));
}
window.calSelectDay = calSelectDay;