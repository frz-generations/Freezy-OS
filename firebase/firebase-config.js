// ============================================================
// FREEZY-OS FIREBASE CONFIGURATION
// FRZ Generations © 2026
// ============================================================
// WHAT THIS FILE DOES:
// - Initializes Firebase app
// - Exposes Firestore, Realtime DB, Auth as global variables
// - All other files use window.db, window.rtdb, window.fbAuth
//
// FIREBASE PROJECT: freezy-os
// CONSOLE: console.firebase.google.com
//
// FIRESTORE COLLECTIONS:
//   users/{uid} — user profile, settings, suspension status
//   To delete a user's data: delete document users/{uid}
//
// REALTIME DATABASE PATHS:
//   qr_sessions/{code} — temporary QR connect tokens (60s TTL)
//   frz_blacklist/{uid} — cross-platform suspension (admin writes only)
//
// GOOGLE DRIVE:
//   Files stored in Software/[Username]/ in user's OWN Google Drive
//   Freezy-OS uses scope: drive.file (only files it creates)
//   To remove user data: delete Software/[Username]/ folder from Drive
//   User can revoke: myaccount.google.com > Security > Third-party apps
//
// APPS SCRIPT:
//   Logs: IP violations, login activity, suspensions, appeals
//   Sheets: IP Logs, Suspensions, Appeals, Login Logs, Public Library
//   No sensitive data (passwords etc.) ever stored in Sheets
// ============================================================

const firebaseConfig = {
  apiKey:            "AIzaSyCS_uM3Z54Cgw1E_ZEC_Wmfg5_vu1v9Blw",
  authDomain:        "freezy-os.firebaseapp.com",
  databaseURL:       "https://freezy-os-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId:         "freezy-os",
  storageBucket:     "freezy-os.firebasestorage.app",
  messagingSenderId: "756915684931",
  appId:             "1:756915684931:web:1377b5538832b84031f6f6"
};

// Initialize Firebase
// compat SDK used — no build tool needed, works with plain HTML
let fbApp, db, rtdb, fbAuth;

try {
  fbApp  = firebase.initializeApp(firebaseConfig);
  db     = firebase.firestore();
  rtdb   = firebase.database();
  fbAuth = firebase.auth();

  // Expose globally — all other JS files use these
  window.fbApp  = fbApp;
  window.db     = db;
  window.rtdb   = rtdb;
  window.fbAuth = fbAuth;

  console.log('✅ Firebase initialized — Freezy-OS ready');
} catch(e) {
  console.warn('⚠️ Firebase initialization failed:', e.message);
  console.warn('Running in offline/demo mode');
  // Set nulls so other files can safely check: if (!window.db) ...
  window.fbApp  = null;
  window.db     = null;
  window.rtdb   = null;
  window.fbAuth = null;
}

// ============================================================
// APPS SCRIPT URL
// Replace with your deployed Google Apps Script web app URL
// Deploy: Extensions > Apps Script > Deploy > New Deployment
// Type: Web App, Execute as: Me, Access: Anyone
// ============================================================
window.APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyjlyYrHG2uLX8WzGB0jr3REc6iRwck4arVfdq44OdDnnss-ouCtKjEgEDhhV70iOHG/exec';

// ============================================================
// GOOGLE OAUTH CLIENT ID
// Used for Google Drive API access
// Set in Google Cloud Console > APIs > Credentials
// ============================================================
window.GOOGLE_CLIENT_ID = '756915684931-oa4um0kma4ej8aom5jaod3211uam9igq.apps.googleusercontent.com';

// ============================================================
// API KEYS
// Replace placeholders with your actual keys from .env
// These are safe to be in client-side code IF you restrict them
// in Google Cloud Console > APIs > Credentials > API Key > Restrictions
// Restrict: HTTP referrers (your Netlify domain only)
// ============================================================
window.WEATHER_API_KEY = '1fbe84bbca0ebbc22fe13cdc3ee8dba2';
window.MAPS_API_KEY    = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjVjZTUyZDEzYTkwZDRmM2U5NDc2ZmQ3OWE3Nzc1OGVlIiwiaCI6Im11cm11cjY0In0=';
window.SEARCH_API_KEY  = 'AlzaSyArmHS_K0thezlka8UcwUeWx4hHeHZ9p-4';
window.SEARCH_CX       = '462c6830bae224f54';
