// ============================================================
// maps.js — Interactive Maps via Leaflet + OpenStreetMap
// Exposes: window.buildMaps, window.initMaps,
//          window.mapSearch, window.mapLocate, window.cleanupMaps
// ============================================================

let leafletMap = null;
let mapMarkers = [];

window.buildMaps = function () {
  return `
    <div class="map-wrap">
      <div class="map-toolbar">
        <input class="map-input" id="mapInput" type="text" placeholder="Search for a place..." onkeydown="if(event.key==='Enter')mapSearch()" />
        <button class="map-btn" onclick="mapSearch()">🔍</button>
        <button class="map-btn" onclick="mapLocate()" title="My location">📍</button>
        <button class="map-btn" onclick="mapClearMarkers()" title="Clear markers">🗑️</button>
      </div>
      <div class="map-results" id="mapResults"></div>
      <div id="mapContainer" style="flex:1; min-height:0;"></div>
    </div>

    <style>
      .map-wrap { display:flex; flex-direction:column; height:100%; }
      .map-toolbar { display:flex; gap:5px; padding:8px; background:var(--surface,#12121e); border-bottom:1px solid var(--border,#222); flex-shrink:0; }
      .map-input { flex:1; background:var(--surface2,#1e1e2e); border:1px solid var(--border,#333); color:var(--text,#cdd6f4); padding:8px 12px; border-radius:8px; font-size:13px; }
      .map-input:focus { outline:none; border-color:var(--accent,#00d4ff); }
      .map-btn { background:var(--surface2,#1e1e2e); border:1px solid var(--border,#333); color:var(--text,#cdd6f4); padding:8px 12px; border-radius:8px; cursor:pointer; font-size:15px; transition:background 0.15s; }
      .map-btn:hover { background:var(--accent,#00d4ff); color:#000; }
      .map-results { background:var(--surface,#12121e); border-bottom:1px solid var(--border,#222); max-height:150px; overflow-y:auto; flex-shrink:0; }
      .map-result-item { padding:8px 12px; cursor:pointer; font-size:13px; color:var(--text,#cdd6f4); border-bottom:1px solid var(--border,#1a1a2e); transition:background 0.1s; }
      .map-result-item:hover { background:var(--surface2,#1e1e2e); }
      #mapContainer { flex:1; }
      #mapContainer .leaflet-container { height:100% !important; background:#1a1a2e; }
    </style>
  `;
};

window.initMaps = function () {
  setTimeout(_mapInit, 80);
};

function _mapInit() {
  const container = document.getElementById('mapContainer');
  if (!container) return;

  if (leafletMap) { try { leafletMap.remove(); } catch(e){} leafletMap = null; }

  if (typeof L === 'undefined') {
    container.innerHTML = '<div style="padding:20px;color:#888;">Leaflet not loaded. Ensure Leaflet CSS+JS are in &lt;head&gt;.</div>';
    return;
  }

  leafletMap = L.map('mapContainer', { zoomControl: true }).setView([20, 0], 2);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://openstreetmap.org">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(leafletMap);
}

window.mapSearch = function () {
  const q = document.getElementById('mapInput').value.trim();
  if (!q) return;
  const resultsEl = document.getElementById('mapResults');
  resultsEl.innerHTML = '<div style="padding:8px 12px;color:#888;font-size:13px;">Searching...</div>';

  fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`, {
    headers: { 'User-Agent': 'FreezyOS/1.0' }
  })
    .then(r => r.json())
    .then(data => {
      if (!data || data.length === 0) {
        resultsEl.innerHTML = '<div style="padding:8px 12px;color:#888;font-size:13px;">No results found.</div>';
        return;
      }
      if (data.length === 1) {
        resultsEl.innerHTML = '';
        _mapFlyTo(parseFloat(data[0].lat), parseFloat(data[0].lon), data[0].display_name);
        return;
      }
      resultsEl.innerHTML = data.map((item, i) =>
        `<div class="map-result-item" onclick="mapSelectResult(${i},'${encodeURIComponent(JSON.stringify(item))}')">${item.display_name}</div>`
      ).join('');
      window._mapLastResults = data;
    })
    .catch(() => {
      resultsEl.innerHTML = '<div style="padding:8px 12px;color:#f38ba8;font-size:13px;">Search failed. Check your connection.</div>';
    });
};

window.mapSelectResult = function (i, encoded) {
  const data = window._mapLastResults;
  if (!data || !data[i]) return;
  document.getElementById('mapResults').innerHTML = '';
  _mapFlyTo(parseFloat(data[i].lat), parseFloat(data[i].lon), data[i].display_name);
};

window.mapLocate = function () {
  if (!navigator.geolocation) {
    if (window.notify) window.notify('Geolocation not supported.');
    return;
  }
  navigator.geolocation.getCurrentPosition(pos => {
    _mapFlyTo(pos.coords.latitude, pos.coords.longitude, 'My Location');
  }, () => {
    if (window.notify) window.notify('Location access denied.');
  });
};

window.mapClearMarkers = function () {
  mapMarkers.forEach(m => { try { leafletMap.removeLayer(m); } catch(e){} });
  mapMarkers = [];
};

function _mapFlyTo(lat, lon, label) {
  if (!leafletMap) return;
  leafletMap.flyTo([lat, lon], 13, { animate: true, duration: 1.2 });
  const marker = L.marker([lat, lon]).addTo(leafletMap);
  marker.bindPopup(`<b>${label}</b>`).openPopup();
  mapMarkers.push(marker);
}

window.cleanupMaps = function () {
  if (leafletMap) {
    try { leafletMap.remove(); } catch(e){}
    leafletMap = null;
  }
  mapMarkers = [];
};