// ============================================================
// weather.js — Real-time Weather via OpenWeatherMap
// Exposes: window.buildWeather, window.initWeather,
//          window.fetchWeather, window.detectWeatherLocation,
//          window.fetchWeatherByCoords
// ============================================================

const WEATHER_ICONS = {
  '01d':'☀️','01n':'🌙','02d':'⛅','02n':'🌥️','03d':'☁️','03n':'☁️',
  '04d':'☁️','04n':'☁️','09d':'🌧️','09n':'🌧️','10d':'🌦️','10n':'🌧️',
  '11d':'⛈️','11n':'⛈️','13d':'❄️','13n':'❄️','50d':'🌫️','50n':'🌫️',
};
let _weatherCache = null;
let _weatherCacheTime = 0;
const WEATHER_CACHE_MS = 10 * 60 * 1000;

window.buildWeather = function () {
  return `
    <div class="wx-wrap">
      <div class="wx-search-row">
        <input class="wx-input" id="wxCityInput" type="text" placeholder="Enter city name..." onkeydown="if(event.key==='Enter')fetchWeather()" />
        <button class="wx-btn" onclick="fetchWeather()">🔍</button>
        <button class="wx-btn" onclick="detectWeatherLocation()" title="Detect my location">📍</button>
      </div>

      <div class="wx-loading" id="wxLoading" style="display:none;">
        <div class="wx-spinner"></div>
        <span>Fetching weather...</span>
      </div>

      <div class="wx-error" id="wxError" style="display:none;"></div>

      <div class="wx-main" id="wxMain" style="display:none;">
        <div class="wx-icon" id="wxIcon">☀️</div>
        <div class="wx-city" id="wxCity">—</div>
        <div class="wx-temp" id="wxTemp">—°C</div>
        <div class="wx-desc" id="wxDesc">—</div>

        <div class="wx-details">
          <div class="wx-detail-card">
            <span class="wx-detail-icon">💧</span>
            <span class="wx-detail-val" id="wxHumidity">—</span>
            <span class="wx-detail-label">Humidity</span>
          </div>
          <div class="wx-detail-card">
            <span class="wx-detail-icon">🌬️</span>
            <span class="wx-detail-val" id="wxWind">—</span>
            <span class="wx-detail-label">Wind m/s</span>
          </div>
          <div class="wx-detail-card">
            <span class="wx-detail-icon">🌡️</span>
            <span class="wx-detail-val" id="wxFeels">—</span>
            <span class="wx-detail-label">Feels Like</span>
          </div>
          <div class="wx-detail-card">
            <span class="wx-detail-icon">🔵</span>
            <span class="wx-detail-val" id="wxPressure">—</span>
            <span class="wx-detail-label">hPa</span>
          </div>
          <div class="wx-detail-card">
            <span class="wx-detail-icon">👁️</span>
            <span class="wx-detail-val" id="wxVis">—</span>
            <span class="wx-detail-label">Visibility</span>
          </div>
          <div class="wx-detail-card">
            <span class="wx-detail-icon">☁️</span>
            <span class="wx-detail-val" id="wxClouds">—</span>
            <span class="wx-detail-label">Clouds</span>
          </div>
        </div>
      </div>

      <div class="wx-placeholder" id="wxPlaceholder">
        <div class="wx-placeholder-icon">🌍</div>
        <div>Enter a city name or detect your location</div>
      </div>
    </div>

    <style>
      .wx-wrap { display:flex; flex-direction:column; gap:12px; padding:16px; height:100%; box-sizing:border-box; }
      .wx-search-row { display:flex; gap:6px; }
      .wx-input { flex:1; background:var(--surface2,#1e1e2e); border:1px solid var(--border,#333); color:var(--text,#cdd6f4); padding:9px 12px; border-radius:8px; font-size:14px; }
      .wx-input:focus { outline:none; border-color:var(--accent,#00d4ff); }
      .wx-btn { background:var(--surface2,#1e1e2e); border:1px solid var(--border,#333); color:var(--text,#cdd6f4); padding:9px 14px; border-radius:8px; cursor:pointer; font-size:16px; transition:background 0.15s; }
      .wx-btn:hover { background:var(--accent,#00d4ff); color:#000; }
      .wx-loading { display:flex; align-items:center; gap:10px; color:var(--text2,#888); padding:20px; justify-content:center; }
      .wx-spinner { width:20px; height:20px; border:2px solid var(--border,#333); border-top-color:var(--accent,#00d4ff); border-radius:50%; animation:wxSpin 0.8s linear infinite; }
      @keyframes wxSpin { to { transform:rotate(360deg); } }
      .wx-error { background:#2d1b1b; border:1px solid #f38ba8; color:#f38ba8; padding:10px 14px; border-radius:8px; font-size:13px; }
      .wx-main { display:flex; flex-direction:column; align-items:center; gap:4px; flex:1; }
      .wx-icon { font-size:64px; line-height:1; margin-bottom:4px; }
      .wx-city { font-size:20px; font-weight:600; color:var(--text,#cdd6f4); }
      .wx-temp { font-size:48px; font-weight:700; color:var(--accent,#00d4ff); font-family:monospace; }
      .wx-desc { font-size:14px; color:var(--text2,#888); text-transform:capitalize; margin-bottom:8px; }
      .wx-details { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; width:100%; }
      .wx-detail-card { background:var(--surface2,#1e1e2e); border-radius:10px; padding:10px 8px; display:flex; flex-direction:column; align-items:center; gap:2px; border:1px solid var(--border,#2a2a3e); }
      .wx-detail-icon { font-size:18px; }
      .wx-detail-val { font-size:15px; font-weight:600; color:var(--text,#cdd6f4); font-family:monospace; }
      .wx-detail-label { font-size:10px; color:var(--text2,#888); text-transform:uppercase; letter-spacing:0.5px; }
      .wx-placeholder { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; flex:1; color:var(--text2,#666); font-size:14px; }
      .wx-placeholder-icon { font-size:48px; }
    </style>
  `;
};

window.initWeather = function () {
  if (navigator.geolocation) {
    navigator.permissions && navigator.permissions.query({ name: 'geolocation' }).then(result => {
      if (result.state === 'granted') detectWeatherLocation();
    }).catch(() => {});
  }
};

window.fetchWeather = function () {
  const city = document.getElementById('wxCityInput').value.trim();
  if (!city) return;
  const apiKey = (window.ENV && window.ENV.WEATHER_API_KEY) || '';
  if (!apiKey) { _wxShowError('Weather API key not configured. Set VITE_WEATHER_API_KEY in environment.'); return; }
  _wxShowLoading();
  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`)
    .then(r => r.json())
    .then(data => {
      if (data.cod !== 200) throw new Error(data.message || 'City not found');
      _wxRender(data);
    })
    .catch(e => _wxShowError(_wxFriendlyError(e.message)));
};

window.detectWeatherLocation = function () {
  if (!navigator.geolocation) { _wxShowError('Geolocation is not supported by your browser.'); return; }
  _wxShowLoading();
  navigator.geolocation.getCurrentPosition(
    pos => fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
    () => _wxShowError('Location access denied. Please enter a city name instead.')
  );
};

window.fetchWeatherByCoords = function (lat, lon) {
  const apiKey = (window.ENV && window.ENV.WEATHER_API_KEY) || '';
  if (!apiKey) { _wxShowError('Weather API key not configured.'); return; }
  _wxShowLoading();
  fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`)
    .then(r => r.json())
    .then(data => {
      if (data.cod !== 200) throw new Error(data.message || 'Could not fetch weather');
      _wxRender(data);
    })
    .catch(e => _wxShowError(_wxFriendlyError(e.message)));
};

function _wxRender(data) {
  _weatherCache = data;
  _weatherCacheTime = Date.now();
  document.getElementById('wxLoading').style.display = 'none';
  document.getElementById('wxError').style.display = 'none';
  document.getElementById('wxPlaceholder').style.display = 'none';
  document.getElementById('wxMain').style.display = 'flex';

  const icon = data.weather[0].icon;
  document.getElementById('wxIcon').textContent = WEATHER_ICONS[icon] || '🌡️';
  document.getElementById('wxCity').textContent = data.name + ', ' + data.sys.country;
  document.getElementById('wxTemp').textContent = Math.round(data.main.temp) + '°C';
  document.getElementById('wxDesc').textContent = data.weather[0].description;
  document.getElementById('wxHumidity').textContent = data.main.humidity + '%';
  document.getElementById('wxWind').textContent = data.wind.speed.toFixed(1);
  document.getElementById('wxFeels').textContent = Math.round(data.main.feels_like) + '°C';
  document.getElementById('wxPressure').textContent = data.main.pressure;
  document.getElementById('wxVis').textContent = data.visibility ? (data.visibility / 1000).toFixed(1) + 'km' : '—';
  document.getElementById('wxClouds').textContent = data.clouds.all + '%';
}

function _wxShowLoading() {
  document.getElementById('wxLoading').style.display = 'flex';
  document.getElementById('wxError').style.display = 'none';
  document.getElementById('wxMain').style.display = 'none';
  document.getElementById('wxPlaceholder').style.display = 'none';
}

function _wxShowError(msg) {
  document.getElementById('wxLoading').style.display = 'none';
  document.getElementById('wxMain').style.display = 'none';
  document.getElementById('wxPlaceholder').style.display = 'none';
  const el = document.getElementById('wxError');
  el.style.display = 'block';
  el.textContent = '⚠️ ' + msg;
}

function _wxFriendlyError(msg) {
  if (!msg) return 'Could not fetch weather. Please try again.';
  if (msg.toLowerCase().includes('not found')) return 'City not found. Check the spelling and try again.';
  if (msg.toLowerCase().includes('401') || msg.toLowerCase().includes('invalid')) return 'Invalid API key. Check your weather API configuration.';
  if (msg.toLowerCase().includes('429')) return 'Too many requests. Please wait a moment and try again.';
  return 'Could not fetch weather. Please check your connection and try again.';
}