// ============================================================
// how-to.js — User Guide / Help Center
// Exposes: window.buildHowTo, window.initHowTo,
//          window.showHowToSection
// ============================================================

const HOWTO_SECTIONS = {
  'Getting Started': `
    <h3>Welcome to Freezy-OS 👋</h3>
    <p>Freezy-OS is a web-based operating system you can run right in your browser. No installation needed.</p>
    <h4>First steps:</h4>
    <ul>
      <li>Sign in with your Google account to unlock file storage and personalization.</li>
      <li>Click any app icon on the desktop or use the App Drawer (grid icon) to open apps.</li>
      <li>Drag windows by their title bar. Resize by dragging edges. Minimize, maximize, or close with the top-right buttons.</li>
      <li>Right-click the desktop for quick actions.</li>
    </ul>
    <p>Freezy-OS saves your settings and preferences automatically so everything is ready next time you visit.</p>
  `,

  'Keyboard Shortcuts': `
    <h3>Keyboard Shortcuts ⌨️</h3>
    <table class="ht-table">
      <thead><tr><th>Shortcut</th><th>Action</th></tr></thead>
      <tbody>
        <tr><td>Alt + Tab</td><td>Switch between open windows</td></tr>
        <tr><td>Alt + F4 / Alt + W</td><td>Close focused window</td></tr>
        <tr><td>Alt + M</td><td>Minimize focused window</td></tr>
        <tr><td>Alt + Enter</td><td>Toggle maximize</td></tr>
        <tr><td>Ctrl + Alt + T</td><td>Open Code Editor</td></tr>
        <tr><td>Win / Meta</td><td>Toggle App Drawer</td></tr>
        <tr><td>Escape</td><td>Close dialogs / deselect</td></tr>
        <tr><td>Ctrl + Enter</td><td>Run code (Code Editor)</td></tr>
        <tr><td>Tab</td><td>Indent (Code Editor)</td></tr>
        <tr><td>Shift + Tab</td><td>Outdent (Code Editor)</td></tr>
      </tbody>
    </table>
  `,

  'Using Windows': `
    <h3>Using Windows 🪟</h3>
    <p>Every app opens in its own window. Here's how to manage them:</p>
    <ul>
      <li><strong>Move:</strong> Drag the title bar anywhere on the desktop.</li>
      <li><strong>Resize:</strong> Drag any edge or corner of the window.</li>
      <li><strong>Minimize:</strong> Click the − button. The window stays in the taskbar.</li>
      <li><strong>Maximize:</strong> Click the ⬜ button. Click again to restore.</li>
      <li><strong>Close:</strong> Click the × button. Some apps (Music, Prayer Times) continue running minimized.</li>
      <li><strong>Focus:</strong> Click any part of a window to bring it to front.</li>
      <li><strong>Stack:</strong> Multiple windows can be open simultaneously. They stack by z-order.</li>
    </ul>
  `,

  'App Drawer': `
    <h3>App Drawer 📱</h3>
    <p>The App Drawer shows all installed apps in one place.</p>
    <ul>
      <li>Click the <strong>grid icon</strong> in the taskbar (or press the Win key) to open it.</li>
      <li>Type to search for an app instantly.</li>
      <li>Click any app to open it. Click outside to close the drawer.</li>
      <li>Apps are grouped by category: Productivity, Tools, Media, and more.</li>
    </ul>
    <p>You can also access apps by right-clicking the desktop.</p>
  `,

  'QR Connect': `
    <h3>QR Connect 📷</h3>
    <p>QR Connect lets you mirror your Freezy-OS session from your phone to your PC, tablet, or TV — instantly.</p>
    <h4>On your PC / TV:</h4>
    <ol>
      <li>Open the <strong>QR Connect</strong> app from the app drawer.</li>
      <li>A QR code and 6-character code will appear. It expires in 60 seconds.</li>
    </ol>
    <h4>On your phone:</h4>
    <ol>
      <li>Open <strong>Freezy-OS</strong> on your phone's browser.</li>
      <li>Tap <strong>Scan QR</strong> and point your camera at the PC screen — or enter the 6-character code manually.</li>
      <li>Your phone session transfers to the PC instantly.</li>
    </ol>
    <p>Sessions expire after 60 seconds and are deleted from the server immediately after use. Your Google Drive is not accessible from the receiving device.</p>
  `,

  'File Manager': `
    <h3>File Manager ☁️</h3>
    <p>The File Manager connects to your Google Drive to browse and manage files.</p>
    <ul>
      <li>Your files are stored in your own Google Drive — not on FRZ servers.</li>
      <li>Use the sidebar to navigate: My Drive, Software, Documents, Music, Images, Whiteboards, Code.</li>
      <li>Double-click a file to open it (in the relevant app or in Google Drive).</li>
      <li>Use <strong>New Folder</strong> and <strong>Upload</strong> to manage files.</li>
      <li>Use the search bar to filter files by name.</li>
    </ul>
    <p>If Drive is not connected, click <strong>Open Google Drive</strong> to sign in and grant access.</p>
  `,

  'Settings': `
    <h3>Settings ⚙️</h3>
    <p>Access Settings from the app drawer or taskbar.</p>
    <ul>
      <li><strong>Appearance:</strong> Set a wallpaper (paste a direct image URL), switch between Dark and Light theme.</li>
      <li><strong>System:</strong> Adjust brightness, volume, lock screen password, and auto-lock timeout.</li>
      <li><strong>Permissions:</strong> Toggle location, notifications, camera, microphone, and storage access.</li>
      <li><strong>Power:</strong> Lock screen, log out, or (in desktop app) sleep/shutdown.</li>
      <li><strong>About:</strong> Version info, terms, privacy policy.</li>
    </ul>
    <p>All settings are saved automatically to your browser's local storage.</p>
  `,

  'Lock Screen': `
    <h3>Lock Screen 🔒</h3>
    <p>Protect your Freezy-OS session with a lock screen password.</p>
    <ul>
      <li>Go to <strong>Settings → System</strong> and set a password.</li>
      <li>Click <strong>Settings → Power → Lock Screen</strong> to lock immediately.</li>
      <li>Auto-lock activates after your chosen timeout (5–60 min, or never).</li>
      <li>Enter your password on the lock screen to resume your session.</li>
    </ul>
    <p>If you forget your password, clearing browser storage (DevTools → Application → Clear site data) will reset it.</p>
  `,

  'Wallpaper': `
    <h3>Wallpaper 🖼️</h3>
    <p>Set any image as your desktop background.</p>
    <ol>
      <li>Go to <strong>Settings → Appearance → Wallpaper</strong>.</li>
      <li>Paste a <strong>direct image URL</strong> (ending in .jpg, .png, .webp, etc.).</li>
      <li>Click <strong>Apply</strong>. The wallpaper previews immediately.</li>
      <li>To remove it, click <strong>Clear</strong>.</li>
    </ol>
    <p>Need to host your own image? Use <a href="https://frzimage.xo.je" target="_blank" style="color:var(--accent,#00d4ff);">frzimage.xo.je</a> — it's free and gives you a direct URL instantly.</p>
  `,

  'Code Editor': `
    <h3>Code Editor 💻</h3>
    <p>Write and run code in 24+ languages right inside Freezy-OS.</p>
    <ul>
      <li>Select a language from the dropdown at the top.</li>
      <li>Press <strong>▶ Run</strong> or <strong>Ctrl + Enter</strong> to execute.</li>
      <li><strong>JavaScript:</strong> Runs instantly in the browser. console.log() output appears in the output panel.</li>
      <li><strong>HTML:</strong> Renders as a live preview in the output panel.</li>
      <li><strong>Other languages:</strong> Requires a Judge0 server. Set <code>VITE_JUDGE0_URL</code> in your .env file. Judge0 can be self-hosted free on Railway or Render.</li>
      <li>Use <strong>Tab</strong> to indent, <strong>Shift+Tab</strong> to outdent.</li>
      <li>History shows your last 20 runs — click any item to reload it.</li>
    </ul>
  `,

  'Music Player': `
    <h3>Music Player 🎵</h3>
    <p>Play local audio files right in Freezy-OS.</p>
    <ul>
      <li>Click <strong>+ Load Music</strong> to select audio files from your device.</li>
      <li>Supported formats: MP3, WAV, OGG, FLAC, M4A, AAC.</li>
      <li>Click a track in the playlist to play it.</li>
      <li>Use the controls: Shuffle (⇀), Previous (⏮), Play/Pause, Next (⏭), Repeat (↻).</li>
      <li>Click the progress bar to seek to any position.</li>
      <li>Closing the Music Player window does <strong>not</strong> stop playback — music continues and your queue is saved.</li>
    </ul>
  `,

  'Install as App (PWA)': `
    <h3>Install as App (PWA) 📲</h3>
    <p>Install Freezy-OS on your device for a native app-like experience — no app store needed.</p>
    <h4>On desktop (Chrome / Edge):</h4>
    <ol>
      <li>Open Freezy-OS in your browser.</li>
      <li>Click the <strong>install icon</strong> (⊕) in the address bar, or go to browser menu → <strong>Install Freezy-OS</strong>.</li>
      <li>Click Install. Freezy-OS opens in its own window without browser UI.</li>
    </ol>
    <h4>On mobile (Android):</h4>
    <ol>
      <li>Open Freezy-OS in Chrome.</li>
      <li>Tap the menu (⋮) → <strong>Add to Home Screen</strong>.</li>
    </ol>
    <h4>On iOS (Safari):</h4>
    <ol>
      <li>Open Freezy-OS in Safari.</li>
      <li>Tap the Share button → <strong>Add to Home Screen</strong>.</li>
    </ol>
  `,

  'How to Remove Your Data': `
    <h3>How to Remove Your Data 🗑️</h3>
    <p>You have full control over your data. Here's how to remove everything:</p>
    <ol>
      <li><strong>Google Drive files:</strong> Delete the <code>Software/[YourUsername]/</code> folder from your Google Drive. This removes all files stored by Freezy-OS.</li>
      <li><strong>Firestore account data:</strong> Email us at <a href="mailto:frzgenerations@gmail.com" style="color:var(--accent,#00d4ff);">frzgenerations@gmail.com</a> with the subject "Data Deletion Request". We'll remove your Firestore data within 7 days.</li>
      <li><strong>Revoke Google Drive access:</strong> Go to <a href="https://myaccount.google.com/permissions" target="_blank" style="color:var(--accent,#00d4ff);">myaccount.google.com → Security → Third-party apps</a> and revoke access for Freezy-OS.</li>
      <li><strong>Clear local browser data:</strong> Open DevTools (F12) → Application tab → Storage → Clear site data. This removes all localStorage settings.</li>
    </ol>
    <p>We respond to all data deletion requests within 7 business days.</p>
  `,

  'Contact & Support': `
    <h3>Contact & Support 💬</h3>
    <p>We're here to help. Reach out through any of these channels:</p>
    <ul>
      <li><strong>Email:</strong> <a href="mailto:frzgenerations@gmail.com" style="color:var(--accent,#00d4ff);">frzgenerations@gmail.com</a></li>
      <li><strong>Website:</strong> <a href="https://frzgenerations.com" target="_blank" style="color:var(--accent,#00d4ff);">frzgenerations.com</a></li>
      <li><strong>Submit a bug or feature request:</strong> Email us with the subject "Bug Report" or "Feature Request".</li>
    </ul>
    <p>Response time: typically within 1–3 business days.</p>
    <p>For data deletion requests, see the <strong>How to Remove Your Data</strong> section.</p>
  `,
};

window.buildHowTo = function () {
  const keys = Object.keys(HOWTO_SECTIONS);
  return `
    <div class="ht-wrap">
      <div class="ht-sidebar">
        <div class="ht-sidebar-title">Help Center</div>
        ${keys.map((k, i) => `
          <div class="ht-nav-item ${i === 0 ? 'active' : ''}" id="htNav${i}" onclick="showHowToSection('${encodeURIComponent(k)}',this)">
            ${k}
          </div>
        `).join('')}
      </div>
      <div class="ht-content" id="htContent"></div>
    </div>

    <style>
      .ht-wrap { display:flex; height:100%; overflow:hidden; }
      .ht-sidebar { width:190px; flex-shrink:0; background:var(--surface,#12121e); border-right:1px solid var(--border,#222); overflow-y:auto; padding:8px 0; }
      .ht-sidebar-title { font-size:10px; text-transform:uppercase; letter-spacing:1px; color:var(--text2,#555); padding:6px 12px 10px; }
      .ht-nav-item { padding:8px 12px; font-size:12px; color:var(--text,#aaa); cursor:pointer; transition:background 0.1s; line-height:1.3; }
      .ht-nav-item:hover { background:var(--surface2,#1e1e2e); color:var(--text,#cdd6f4); }
      .ht-nav-item.active { background:var(--surface2,#1e1e2e); color:var(--accent,#00d4ff); border-left:2px solid var(--accent,#00d4ff); }
      .ht-content { flex:1; overflow-y:auto; padding:24px; }
      .ht-content h3 { font-size:18px; color:var(--accent,#00d4ff); margin:0 0 12px; }
      .ht-content h4 { font-size:14px; color:var(--text,#cdd6f4); margin:16px 0 6px; }
      .ht-content p  { font-size:13px; color:var(--text,#cdd6f4); line-height:1.7; margin:0 0 10px; }
      .ht-content ul, .ht-content ol { padding-left:20px; margin:0 0 12px; }
      .ht-content li { font-size:13px; color:var(--text,#cdd6f4); line-height:1.7; margin-bottom:4px; }
      .ht-content code { background:var(--surface2,#1e1e2e); padding:1px 6px; border-radius:4px; font-family:monospace; font-size:12px; color:var(--accent,#00d4ff); }
      .ht-table { width:100%; border-collapse:collapse; font-size:12px; margin-top:8px; }
      .ht-table th { background:var(--surface2,#1e1e2e); color:var(--text2,#888); padding:7px 10px; text-align:left; border:1px solid var(--border,#2a2a3e); }
      .ht-table td { padding:7px 10px; border:1px solid var(--border,#2a2a3e); color:var(--text,#cdd6f4); }
      .ht-table tr:nth-child(even) td { background:rgba(255,255,255,0.02); }
    </style>
  `;
};

window.initHowTo = function () {
  const firstKey = Object.keys(HOWTO_SECTIONS)[0];
  showHowToSection(encodeURIComponent(firstKey), document.getElementById('htNav0'));
};

window.showHowToSection = function (encodedKey, el) {
  const key = decodeURIComponent(encodedKey);
  document.querySelectorAll('.ht-nav-item').forEach(n => n.classList.remove('active'));
  if (el) el.classList.add('active');
  const content = HOWTO_SECTIONS[key] || '<p>Section not found.</p>';
  document.getElementById('htContent').innerHTML = content;
};
