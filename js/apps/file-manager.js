// ============================================================
// file-manager.js — Google Drive File Browser
// Exposes: window.buildFileManager, window.initFileManager,
//          window.loadDriveFolder, window.showDriveInfo,
//          window.createDriveFolder, window.uploadToDrive
// ============================================================

const FILE_ICONS = {
  pdf:'📄',doc:'📝',docx:'📝',xls:'📊',xlsx:'📊',
  jpg:'🖼️',jpeg:'🖼️',png:'🖼️',gif:'🖼️',webp:'🖼️',
  mp3:'🎵',wav:'🎵',ogg:'🎵',flac:'🎵',
  mp4:'🎬',mov:'🎬',avi:'🎬',
  zip:'🗜️',rar:'🗜️',
  js:'💻',html:'💻',css:'💻',py:'💻',
  txt:'📃',md:'📃',
  default:'📁'
};

let _fmCurrentFolderId = null;
let _fmBreadcrumb = [];

window.buildFileManager = function () {
  return `
    <div class="fm-wrap">
      <div class="fm-sidebar">
        <div class="fm-sidebar-title">My Drive</div>
        <div class="fm-sidebar-item active" onclick="fmNavFolder('root','My Drive')">🏠 My Drive</div>
        <div class="fm-sidebar-item" onclick="fmNavFolder('software','Software')">💾 Software</div>
        <div class="fm-sidebar-item" onclick="fmNavFolder('documents','Documents')">📁 Documents</div>
        <div class="fm-sidebar-item" onclick="fmNavFolder('music','Music')">🎵 Music</div>
        <div class="fm-sidebar-item" onclick="fmNavFolder('images','Images')">🖼️ Images</div>
        <div class="fm-sidebar-item" onclick="fmNavFolder('whiteboards','Whiteboards')">✏️ Whiteboards</div>
        <div class="fm-sidebar-item" onclick="fmNavFolder('code','Code')">💻 Code</div>
        <div class="fm-sidebar-sep"></div>
        <div class="fm-sidebar-item" onclick="window.open('https://drive.google.com','_blank')">↗ Open Drive</div>
      </div>

      <div class="fm-main">
        <div class="fm-toolbar">
          <button class="fm-tb-btn" onclick="createDriveFolder()">📁 New Folder</button>
          <button class="fm-tb-btn" onclick="uploadToDrive()">⬆ Upload</button>
          <input class="fm-search" id="fmSearch" type="text" placeholder="Search files..." oninput="fmFilterFiles()" />
        </div>
        <div class="fm-breadcrumb" id="fmBreadcrumb">My Drive</div>
        <div class="fm-files" id="fmFiles">
          <div class="fm-connect-msg" id="fmConnectMsg">
            <div style="font-size:48px;">☁️</div>
            <div class="fm-connect-title">Google Drive Not Connected</div>
            <div class="fm-connect-desc">Connect Google Drive to browse, upload and manage your files from within Freezy-OS.</div>
            <button class="fm-connect-btn" onclick="window.open('https://drive.google.com','_blank')">Open Google Drive ↗</button>
          </div>
        </div>
      </div>
    </div>

    <style>
      .fm-wrap { display:flex; height:100%; overflow:hidden; }
      .fm-sidebar { width:160px; flex-shrink:0; background:var(--surface,#12121e); border-right:1px solid var(--border,#222); display:flex; flex-direction:column; padding:8px 0; overflow-y:auto; }
      .fm-sidebar-title { font-size:10px; text-transform:uppercase; letter-spacing:1px; color:var(--text2,#555); padding:4px 12px 8px; }
      .fm-sidebar-item { padding:7px 12px; font-size:12px; color:var(--text,#aaa); cursor:pointer; border-radius:0; transition:background 0.1s; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .fm-sidebar-item:hover { background:var(--surface2,#1e1e2e); color:var(--text,#cdd6f4); }
      .fm-sidebar-item.active { background:var(--surface2,#1e1e2e); color:var(--accent,#00d4ff); }
      .fm-sidebar-sep { height:1px; background:var(--border,#222); margin:6px 0; }
      .fm-main { flex:1; display:flex; flex-direction:column; min-width:0; }
      .fm-toolbar { display:flex; gap:6px; padding:8px; border-bottom:1px solid var(--border,#222); flex-shrink:0; }
      .fm-tb-btn { background:var(--surface2,#1e1e2e); border:1px solid var(--border,#333); color:var(--text,#cdd6f4); padding:6px 10px; border-radius:7px; font-size:12px; cursor:pointer; transition:background 0.15s; white-space:nowrap; }
      .fm-tb-btn:hover { background:var(--accent,#00d4ff); color:#000; }
      .fm-search { flex:1; background:var(--surface2,#1e1e2e); border:1px solid var(--border,#333); color:var(--text,#cdd6f4); padding:6px 10px; border-radius:7px; font-size:12px; }
      .fm-search:focus { outline:none; border-color:var(--accent,#00d4ff); }
      .fm-breadcrumb { padding:6px 12px; font-size:11px; color:var(--text2,#888); border-bottom:1px solid var(--border,#1a1a2e); flex-shrink:0; }
      .fm-files { flex:1; overflow-y:auto; padding:8px; display:grid; grid-template-columns:repeat(auto-fill,minmax(80px,1fr)); gap:8px; align-content:start; }
      .fm-file-item { display:flex; flex-direction:column; align-items:center; gap:4px; padding:8px 4px; border-radius:8px; cursor:pointer; transition:background 0.1s; border:1px solid transparent; }
      .fm-file-item:hover { background:var(--surface2,#1e1e2e); border-color:var(--border,#333); }
      .fm-file-icon { font-size:28px; }
      .fm-file-name { font-size:10px; color:var(--text,#cdd6f4); text-align:center; word-break:break-word; line-height:1.3; max-height:30px; overflow:hidden; }
      .fm-connect-msg { grid-column:1/-1; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:40px 20px; text-align:center; }
      .fm-connect-title { font-size:16px; font-weight:600; color:var(--text,#cdd6f4); }
      .fm-connect-desc { font-size:13px; color:var(--text2,#888); max-width:280px; line-height:1.5; }
      .fm-connect-btn { background:var(--accent,#00d4ff); color:#000; border:none; padding:9px 20px; border-radius:8px; font-size:13px; font-weight:600; cursor:pointer; }
    </style>
  `;
};

window.initFileManager = function () {
  _fmBreadcrumb = ['My Drive'];
  _renderBreadcrumb();
  if (window.gapi && window.gapi.client && window.gapi.client.drive) {
    loadDriveFolder('root');
  } else {
    showDriveInfo();
  }
};

window.loadDriveFolder = function (folderId) {
  _fmCurrentFolderId = folderId;
  const filesEl = document.getElementById('fmFiles');
  filesEl.innerHTML = '<div style="padding:20px;color:#888;font-size:13px;grid-column:1/-1;">Loading...</div>';

  if (!window.gapi || !window.gapi.client || !window.gapi.client.drive) {
    showDriveInfo();
    return;
  }

  window.gapi.client.drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'files(id,name,mimeType,size,modifiedTime)',
    orderBy: 'folder,name',
    pageSize: 100
  }).then(resp => {
    const files = resp.result.files || [];
    _fmRenderFiles(files);
  }).catch(() => showDriveInfo());
};

window.showDriveInfo = function () {
  const el = document.getElementById('fmFiles');
  el.innerHTML = `
    <div class="fm-connect-msg">
      <div style="font-size:48px;">☁️</div>
      <div class="fm-connect-title">Google Drive Not Connected</div>
      <div class="fm-connect-desc">Connect Google Drive to browse, upload and manage your files from within Freezy-OS.</div>
      <button class="fm-connect-btn" onclick="window.open('https://drive.google.com','_blank')">Open Google Drive ↗</button>
    </div>
  `;
};

window.createDriveFolder = function () {
  if (!window.gapi || !window.gapi.client || !window.gapi.client.drive) {
    if (window.notify) window.notify('Google Drive not connected.');
    return;
  }
  const name = prompt('Folder name:');
  if (!name || !name.trim()) return;
  window.gapi.client.drive.files.create({
    resource: { name: name.trim(), mimeType: 'application/vnd.google-apps.folder', parents: [_fmCurrentFolderId || 'root'] }
  }).then(() => {
    if (window.notify) window.notify('Folder created: ' + name);
    loadDriveFolder(_fmCurrentFolderId || 'root');
  }).catch(() => {
    if (window.notify) window.notify('Could not create folder.');
  });
};

window.uploadToDrive = function () {
  if (!window.gapi || !window.gapi.client || !window.gapi.client.drive) {
    if (window.notify) window.notify('Google Drive not connected.');
    return;
  }
  if (window.notify) window.notify('Use the Google Drive web interface to upload files.');
  window.open('https://drive.google.com', '_blank');
};

function fmNavFolder(id, label) {
  document.querySelectorAll('.fm-sidebar-item').forEach(el => el.classList.remove('active'));
  event && event.target && event.target.classList.add('active');
  _fmBreadcrumb = ['My Drive', label];
  _renderBreadcrumb();
  loadDriveFolder(id);
}
window.fmNavFolder = fmNavFolder;

function _fmRenderFiles(files) {
  const el = document.getElementById('fmFiles');
  if (!files.length) {
    el.innerHTML = '<div style="padding:20px;color:#666;font-size:13px;grid-column:1/-1;text-align:center;">This folder is empty.</div>';
    return;
  }
  el.innerHTML = files.map(f => {
    const isFolder = f.mimeType === 'application/vnd.google-apps.folder';
    const ext = f.name.split('.').pop().toLowerCase();
    const icon = isFolder ? '📁' : (FILE_ICONS[ext] || FILE_ICONS.default);
    return `<div class="fm-file-item" ondblclick="fmOpenFile('${f.id}','${encodeURIComponent(f.name)}','${f.mimeType}')">
      <div class="fm-file-icon">${icon}</div>
      <div class="fm-file-name">${f.name}</div>
    </div>`;
  }).join('');
  window._fmLastFiles = files;
}

function fmFilterFiles() {
  const q = document.getElementById('fmSearch').value.toLowerCase();
  const items = document.querySelectorAll('.fm-file-item');
  items.forEach(el => {
    const name = el.querySelector('.fm-file-name').textContent.toLowerCase();
    el.style.display = name.includes(q) ? '' : 'none';
  });
}
window.fmFilterFiles = fmFilterFiles;

function fmOpenFile(id, encodedName, mime) {
  const name = decodeURIComponent(encodedName);
  if (mime === 'application/vnd.google-apps.folder') {
    _fmBreadcrumb.push(name);
    _renderBreadcrumb();
    loadDriveFolder(id);
  } else {
    window.open(`https://drive.google.com/file/d/${id}/view`, '_blank');
  }
}
window.fmOpenFile = fmOpenFile;

function _renderBreadcrumb() {
  const el = document.getElementById('fmBreadcrumb');
  if (el) el.textContent = _fmBreadcrumb.join(' › ');
}