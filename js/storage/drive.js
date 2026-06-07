/**
 * js/storage/drive.js
 * Purpose: All Google Drive API interactions. Create user folder structure,
 * upload files, list files, download files. All Drive operations go through here.
 * Uses drive.file scope only — cannot see user's other Drive files.
 */

(function () {
  'use strict';

  window.DRIVE_ROOT_FOLDER = 'Software';

  const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3';
  const UPLOAD_BASE    = 'https://www.googleapis.com/upload/drive/v3';

  let _accessToken   = null;
  let _userFolderId  = null;  // Cached ID of Software/[Username]/

  // ─── driveInit ────────────────────────────────────────────────────────────
  /**
   * Initializes Drive API access using the Google OAuth access token.
   * Call after user logs in with Google.
   */
  function driveInit() {
    try {
      const auth = firebase.auth();
      auth.currentUser?.getIdToken(false).then(() => {
        // Use Firebase token for Drive if available, else rely on Google auth
        // In most cases Google OAuth flow provides access via gapi
        if (window.gapi?.auth2) {
          const authInst = window.gapi.auth2.getAuthInstance();
          if (authInst?.isSignedIn?.get()) {
            _accessToken = authInst.currentUser.get().getAuthResponse().access_token;
          }
        }
      }).catch(e => console.warn('[drive] Token refresh failed:', e));
    } catch (e) {
      console.warn('[drive] driveInit failed:', e);
    }
  }
  window.driveInit = driveInit;

  // ─── getToken (internal) ─────────────────────────────────────────────────
  function getToken() {
    if (_accessToken) return _accessToken;
    try {
      if (window.gapi?.auth2) {
        const inst = window.gapi.auth2.getAuthInstance();
        if (inst?.isSignedIn?.get()) {
          _accessToken = inst.currentUser.get().getAuthResponse().access_token;
          return _accessToken;
        }
      }
    } catch (e) {
      console.warn('[drive] Could not retrieve access token:', e);
    }
    return null;
  }

  // ─── driveHeaders ────────────────────────────────────────────────────────
  function driveHeaders(extra = {}) {
    const token = getToken();
    if (!token) throw new Error('Not authenticated with Google Drive.');
    return { Authorization: `Bearer ${token}`, ...extra };
  }

  // ─── driveGetUserFolder ───────────────────────────────────────────────────
  /**
   * Gets or creates the user's root folder: Software/[Username]/
   * @returns {Promise<string>} - Folder ID
   */
  async function driveGetUserFolder() {
    if (_userFolderId) return _userFolderId;

    try {
      const user = firebase.auth().currentUser;
      const username = user?.displayName || user?.email?.split('@')[0] || 'User';

      // Get or create root "Software" folder
      const rootId = await getOrCreateFolder(window.DRIVE_ROOT_FOLDER, null);

      // Get or create user folder inside Software
      const userId = await getOrCreateFolder(username, rootId);
      _userFolderId = userId;

      // Create subfolders if they don't exist
      const subfolders = ['Documents','Music','Images','Whiteboards','Code'];
      await Promise.allSettled(subfolders.map(name => getOrCreateFolder(name, userId)));

      return userId;
    } catch (e) {
      console.warn('[drive] driveGetUserFolder failed:', e);
      throw e;
    }
  }
  window.driveGetUserFolder = driveGetUserFolder;

  // ─── driveCreateUserFolder ───────────────────────────────────────────────
  /**
   * Creates the user's folder structure in Google Drive.
   * Calls driveGetUserFolder internally.
   */
  async function driveCreateUserFolder() {
    try {
      await driveGetUserFolder();
    } catch (e) {
      console.warn('[drive] driveCreateUserFolder failed:', e);
      if (typeof window.notify === 'function') {
        window.notify('error', 'Drive Error', 'Could not set up your Drive folder.');
      }
    }
  }
  window.driveCreateUserFolder = driveCreateUserFolder;

  // ─── getOrCreateFolder (internal) ────────────────────────────────────────
  /**
   * Finds an existing folder by name + parent, or creates it.
   * @param {string}      name     - Folder name
   * @param {string|null} parentId - Parent folder ID, null for root
   * @returns {Promise<string>} - Folder ID
   */
  async function getOrCreateFolder(name, parentId) {
    const headers = driveHeaders({ 'Content-Type': 'application/json' });

    // Search for existing
    let q = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
    if (parentId) q += ` and '${parentId}' in parents`;

    const searchResp = await fetch(
      `${DRIVE_API_BASE}/files?q=${encodeURIComponent(q)}&fields=files(id,name)`,
      { headers }
    );
    if (!searchResp.ok) throw new Error(`Drive search failed: ${searchResp.status}`);

    const searchData = await searchResp.json();
    if (searchData.files?.length) return searchData.files[0].id;

    // Create new folder
    const meta = { name, mimeType: 'application/vnd.google-apps.folder' };
    if (parentId) meta.parents = [parentId];

    const createResp = await fetch(`${DRIVE_API_BASE}/files`, {
      method:  'POST',
      headers,
      body:    JSON.stringify(meta),
    });
    if (!createResp.ok) throw new Error(`Drive create folder failed: ${createResp.status}`);

    const created = await createResp.json();
    return created.id;
  }

  // ─── driveListFiles ───────────────────────────────────────────────────────
  /**
   * Lists files in a Drive folder.
   * @param {string} folderId
   * @returns {Promise<Array>} - Array of file objects
   */
  async function driveListFiles(folderId) {
    try {
      const headers = driveHeaders();
      const q = `'${folderId}' in parents and trashed=false`;
      const resp = await fetch(
        `${DRIVE_API_BASE}/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,size,modifiedTime)&orderBy=name`,
        { headers }
      );
      if (!resp.ok) throw new Error(`Drive list failed: ${resp.status}`);
      const data = await resp.json();
      return data.files || [];
    } catch (e) {
      console.warn('[drive] driveListFiles failed:', e);
      if (typeof window.notify === 'function') {
        window.notify('error', 'Drive Error', 'Could not list files.');
      }
      return [];
    }
  }
  window.driveListFiles = driveListFiles;

  // ─── driveUploadFile ─────────────────────────────────────────────────────
  /**
   * Uploads a file to a Drive folder using multipart upload.
   * @param {File}   file     - File object to upload
   * @param {string} folderId - Destination folder ID
   * @returns {Promise<object|null>} - Uploaded file metadata or null on error
   */
  async function driveUploadFile(file, folderId) {
    try {
      const token = getToken();
      if (!token) throw new Error('Not authenticated');

      const meta = JSON.stringify({ name: file.name, parents: [folderId] });
      const body = new FormData();
      body.append('metadata', new Blob([meta], { type: 'application/json' }));
      body.append('file', file);

      const resp = await fetch(
        `${UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,mimeType,size`,
        {
          method:  'POST',
          headers: { Authorization: `Bearer ${token}` },
          body,
        }
      );
      if (!resp.ok) throw new Error(`Upload failed: ${resp.status}`);
      return await resp.json();
    } catch (e) {
      console.warn('[drive] driveUploadFile failed:', e);
      if (typeof window.notify === 'function') {
        window.notify('error', 'Upload Failed', `Could not upload "${file.name}".`);
      }
      return null;
    }
  }
  window.driveUploadFile = driveUploadFile;

  // ─── driveDownloadFile ───────────────────────────────────────────────────
  /**
   * Gets the download URL for a Drive file.
   * @param {string} fileId
   * @returns {Promise<string>} - Download URL
   */
  async function driveDownloadFile(fileId) {
    try {
      const token = getToken();
      if (!token) throw new Error('Not authenticated');
      return `${DRIVE_API_BASE}/files/${fileId}?alt=media&access_token=${encodeURIComponent(token)}`;
    } catch (e) {
      console.warn('[drive] driveDownloadFile failed:', e);
      return '';
    }
  }
  window.driveDownloadFile = driveDownloadFile;

  // ─── driveDeleteFile ─────────────────────────────────────────────────────
  /**
   * Permanently deletes a file from Drive (moves to trash first).
   * @param {string} fileId
   * @returns {Promise<boolean>}
   */
  async function driveDeleteFile(fileId) {
    try {
      const headers = driveHeaders();
      const resp = await fetch(`${DRIVE_API_BASE}/files/${fileId}/trash`, {
        method: 'POST',
        headers,
      });
      if (!resp.ok) throw new Error(`Delete failed: ${resp.status}`);
      return true;
    } catch (e) {
      console.warn('[drive] driveDeleteFile failed:', e);
      if (typeof window.notify === 'function') {
        window.notify('error', 'Delete Failed', 'Could not delete the file.');
      }
      return false;
    }
  }
  window.driveDeleteFile = driveDeleteFile;

  // ─── driveCreateFolder ───────────────────────────────────────────────────
  /**
   * Creates a subfolder inside a given parent folder.
   * @param {string} name     - Folder name
   * @param {string} parentId - Parent folder ID
   * @returns {Promise<string|null>} - New folder ID or null on error
   */
  async function driveCreateFolder(name, parentId) {
    try {
      return await getOrCreateFolder(name, parentId);
    } catch (e) {
      console.warn('[drive] driveCreateFolder failed:', e);
      if (typeof window.notify === 'function') {
        window.notify('error', 'Drive Error', `Could not create folder "${name}".`);
      }
      return null;
    }
  }
  window.driveCreateFolder = driveCreateFolder;
})();
