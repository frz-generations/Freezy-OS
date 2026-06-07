// ============================================================
// music-player.js — Local Audio File Player with Playlist
// Exposes: window.buildMusic, window.initMusicPlayer,
//          window.loadMusicFiles, window.playTrack,
//          window.toggleMusic, window.prevTrack, window.nextTrack,
//          window.shuffleMusic, window.repeatMusic,
//          window.seekMusic, window.updateMusicProgress
// ============================================================

let musicAudio = null;
let musicTracks = [];
let musicIdx = 0;
let musicRepeat = false;
let musicShuffle = false;

window.buildMusic = function () {
  return `
    <div class="mp-wrap">
      <div class="mp-art-wrap">
        <div class="mp-art" id="mpArt">🎵</div>
      </div>

      <div class="mp-info">
        <div class="mp-title" id="mpTitle">No track loaded</div>
        <div class="mp-artist" id="mpArtist">—</div>
      </div>

      <div class="mp-progress-row">
        <span class="mp-time" id="mpCurrent">0:00</span>
        <div class="mp-progress" id="mpProgress" onclick="seekMusic(event)">
          <div class="mp-progress-fill" id="mpProgressFill" style="width:0%"></div>
        </div>
        <span class="mp-time" id="mpDuration">0:00</span>
      </div>

      <div class="mp-controls">
        <button class="mp-ctrl-btn" id="mpShuffleBtn" onclick="shuffleMusic()" title="Shuffle">⇀</button>
        <button class="mp-ctrl-btn" onclick="prevTrack()" title="Previous">⏮</button>
        <button class="mp-ctrl-btn mp-play-btn" id="mpPlayBtn" onclick="toggleMusic()" title="Play/Pause">▶</button>
        <button class="mp-ctrl-btn" onclick="nextTrack()" title="Next">⏭</button>
        <button class="mp-ctrl-btn" id="mpRepeatBtn" onclick="repeatMusic()" title="Repeat">↻</button>
      </div>

      <div class="mp-playlist-header">
        <span>Playlist (${musicTracks.length > 0 ? musicTracks.length : 0} tracks)</span>
        <label class="mp-load-btn" for="mpFileInput">+ Load Music</label>
        <input type="file" id="mpFileInput" accept="audio/*" multiple style="display:none" onchange="loadMusicFiles(this)" />
      </div>

      <div class="mp-playlist" id="mpPlaylist">
        ${musicTracks.length === 0 ? '<div class="mp-playlist-empty">No tracks. Click "Load Music" to add files.</div>' : ''}
      </div>
    </div>

    <style>
      .mp-wrap { display:flex; flex-direction:column; height:100%; padding:14px; box-sizing:border-box; gap:10px; }
      .mp-art-wrap { display:flex; justify-content:center; }
      .mp-art { width:100px; height:100px; border-radius:50%; background:var(--surface2,#1e1e2e); border:3px solid var(--border,#333); display:flex; align-items:center; justify-content:center; font-size:40px; transition:border-color 0.3s; }
      .mp-art.playing { border-color:var(--accent,#00d4ff); animation:mpSpin 4s linear infinite; }
      @keyframes mpSpin { to { transform:rotate(360deg); } }
      .mp-info { text-align:center; }
      .mp-title { font-size:15px; font-weight:600; color:var(--text,#cdd6f4); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .mp-artist { font-size:12px; color:var(--text2,#888); }
      .mp-progress-row { display:flex; align-items:center; gap:8px; }
      .mp-time { font-size:11px; color:var(--text2,#888); font-family:monospace; min-width:34px; }
      .mp-progress { flex:1; height:6px; background:var(--surface2,#1e1e2e); border-radius:3px; cursor:pointer; position:relative; overflow:hidden; }
      .mp-progress-fill { height:100%; background:var(--accent,#00d4ff); border-radius:3px; transition:width 0.2s linear; pointer-events:none; }
      .mp-controls { display:flex; justify-content:center; align-items:center; gap:12px; }
      .mp-ctrl-btn { background:var(--surface2,#1e1e2e); border:1px solid var(--border,#333); color:var(--text,#cdd6f4); width:38px; height:38px; border-radius:50%; font-size:16px; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.15s; }
      .mp-ctrl-btn:hover { background:var(--surface3,#2a2a3e); }
      .mp-ctrl-btn.active { color:var(--accent,#00d4ff); border-color:var(--accent,#00d4ff); }
      .mp-play-btn { width:50px; height:50px; font-size:20px; background:var(--accent,#00d4ff); color:#000; border:none; }
      .mp-play-btn:hover { background:var(--accent2,#00b8d9); }
      .mp-playlist-header { display:flex; align-items:center; justify-content:space-between; font-size:12px; color:var(--text2,#888); }
      .mp-load-btn { background:var(--surface2,#1e1e2e); border:1px solid var(--border,#333); color:var(--accent,#00d4ff); padding:4px 10px; border-radius:6px; font-size:11px; cursor:pointer; transition:background 0.15s; }
      .mp-load-btn:hover { background:var(--accent,#00d4ff); color:#000; }
      .mp-playlist { flex:1; overflow-y:auto; background:var(--surface2,#1e1e2e); border-radius:8px; min-height:0; }
      .mp-playlist-empty { padding:16px; text-align:center; color:var(--text2,#666); font-size:13px; }
      .mp-track { padding:8px 12px; cursor:pointer; font-size:12px; color:var(--text,#cdd6f4); border-bottom:1px solid var(--border,#1a1a2e); display:flex; align-items:center; gap:8px; transition:background 0.1s; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .mp-track:hover { background:var(--surface3,#2a2a3e); }
      .mp-track.active { color:var(--accent,#00d4ff); background:rgba(0,212,255,0.08); }
      .mp-track-num { min-width:20px; color:var(--text2,#555); font-family:monospace; font-size:11px; }
    </style>
  `;
};

window.initMusicPlayer = function () {
  if (musicTracks.length > 0) {
    _mpRenderPlaylist();
    _mpUpdateInfo();
    if (musicAudio) {
      musicAudio.ontimeupdate = updateMusicProgress;
      musicAudio.onended = _mpOnEnded;
      document.getElementById('mpPlayBtn').textContent = musicAudio.paused ? '▶' : '⏸';
      document.getElementById('mpArt').classList.toggle('playing', !musicAudio.paused);
    }
  }
};

window.loadMusicFiles = function (input) {
  const files = Array.from(input.files).filter(f => /\.(mp3|wav|ogg|flac|m4a|aac)$/i.test(f.name));
  if (files.length === 0) return;
  musicTracks = files;
  musicIdx = 0;
  _mpRenderPlaylist();
  playTrack(0);
};

window.playTrack = function (idx) {
  if (idx < 0 || idx >= musicTracks.length) return;
  musicIdx = idx;

  if (musicAudio) {
    musicAudio.pause();
    try { URL.revokeObjectURL(musicAudio.src); } catch(e){}
    musicAudio.ontimeupdate = null;
    musicAudio.onended = null;
  }

  musicAudio = new Audio();
  musicAudio.src = URL.createObjectURL(musicTracks[idx]);
  musicAudio.ontimeupdate = updateMusicProgress;
  musicAudio.onended = _mpOnEnded;
  musicAudio.play().catch(() => {});

  _mpUpdateInfo();
  _mpRenderPlaylist();
  document.getElementById('mpPlayBtn').textContent = '⏸';
  document.getElementById('mpArt').classList.add('playing');
};

window.toggleMusic = function () {
  if (!musicAudio) return;
  if (musicAudio.paused) {
    musicAudio.play();
    document.getElementById('mpPlayBtn').textContent = '⏸';
    document.getElementById('mpArt').classList.add('playing');
  } else {
    musicAudio.pause();
    document.getElementById('mpPlayBtn').textContent = '▶';
    document.getElementById('mpArt').classList.remove('playing');
  }
};

window.prevTrack = function () {
  if (musicTracks.length === 0) return;
  playTrack((musicIdx - 1 + musicTracks.length) % musicTracks.length);
};

window.nextTrack = function () {
  if (musicTracks.length === 0) return;
  if (musicShuffle) {
    let r = Math.floor(Math.random() * musicTracks.length);
    while (r === musicIdx && musicTracks.length > 1) r = Math.floor(Math.random() * musicTracks.length);
    playTrack(r);
  } else {
    playTrack((musicIdx + 1) % musicTracks.length);
  }
};

window.shuffleMusic = function () {
  musicShuffle = !musicShuffle;
  const btn = document.getElementById('mpShuffleBtn');
  if (btn) btn.classList.toggle('active', musicShuffle);
};

window.repeatMusic = function () {
  musicRepeat = !musicRepeat;
  const btn = document.getElementById('mpRepeatBtn');
  if (btn) btn.classList.toggle('active', musicRepeat);
};

window.seekMusic = function (e) {
  if (!musicAudio || !musicAudio.duration) return;
  const bar = document.getElementById('mpProgress');
  const rect = bar.getBoundingClientRect();
  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
  musicAudio.currentTime = pct * musicAudio.duration;
};

window.updateMusicProgress = function () {
  if (!musicAudio) return;
  const cur = musicAudio.currentTime || 0;
  const dur = musicAudio.duration || 0;
  const pct = dur > 0 ? (cur / dur) * 100 : 0;
  const fillEl = document.getElementById('mpProgressFill');
  const curEl  = document.getElementById('mpCurrent');
  const durEl  = document.getElementById('mpDuration');
  if (fillEl) fillEl.style.width = pct + '%';
  if (curEl)  curEl.textContent  = _mpFmtTime(cur);
  if (durEl)  durEl.textContent  = _mpFmtTime(dur);
};

function _mpOnEnded() {
  if (musicRepeat) {
    musicAudio.currentTime = 0;
    musicAudio.play();
  } else {
    nextTrack();
  }
}

function _mpUpdateInfo() {
  if (musicTracks.length === 0) return;
  const raw = musicTracks[musicIdx].name.replace(/\.[^.]+$/, '');
  const parts = raw.split(/\s*[-–—]\s*/);
  const titleEl  = document.getElementById('mpTitle');
  const artistEl = document.getElementById('mpArtist');
  if (titleEl)  titleEl.textContent  = parts[parts.length - 1] || raw;
  if (artistEl) artistEl.textContent = parts.length > 1 ? parts[0] : '—';
}

function _mpRenderPlaylist() {
  const pl = document.getElementById('mpPlaylist');
  if (!pl) return;
  if (musicTracks.length === 0) {
    pl.innerHTML = '<div class="mp-playlist-empty">No tracks. Click "Load Music" to add files.</div>';
    return;
  }
  pl.innerHTML = musicTracks.map((t, i) =>
    `<div class="mp-track ${i === musicIdx ? 'active' : ''}" onclick="playTrack(${i})">
      <span class="mp-track-num">${i + 1}</span>
      <span>${t.name.replace(/\.[^.]+$/, '')}</span>
    </div>`
  ).join('');
}

function _mpFmtTime(s) {
  if (!s || isNaN(s)) return '0:00';
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}