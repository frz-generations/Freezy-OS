/**
 * js/core/auth.js
 * Purpose: All Firebase Authentication logic. Login with Google, Email/Password,
 * Phone/OTP. Handle auth state changes. Check suspension on login. Save user to
 * Firestore after login. Log login to Apps Script.
 */

(function () {
  'use strict';

  // ─── Friendly error messages ───────────────────────────────────────────────
  const FRIENDLY_ERRORS = {
    'auth/user-not-found':        'No account found with this email.',
    'auth/wrong-password':        'Incorrect password. Please try again.',
    'auth/email-already-in-use':  'An account already exists with this email.',
    'auth/weak-password':         'Password must be at least 6 characters.',
    'auth/invalid-email':         'Please enter a valid email address.',
    'auth/popup-closed-by-user':  'Sign-in was cancelled.',
    'auth/network-request-failed':'Network error. Check your connection.',
    'auth/too-many-requests':     'Too many attempts. Please wait.',
    'auth/invalid-phone-number':  'Invalid phone number. Use format: +91...',
    'auth/invalid-verification-code': 'Invalid OTP code. Please try again.',
    'auth/code-expired':          'OTP has expired. Please request a new one.',
  };

  // Recaptcha verifier holder for phone auth
  let recaptchaVerifier = null;
  let confirmationResult = null;

  // ─── Helper: show error in element ────────────────────────────────────────
  /**
   * Displays a friendly error message in the .error-msg element matching selector.
   * @param {string} selector - CSS selector for error element
   * @param {string} code - Firebase error code or plain message
   */
  function showError(selector, code) {
    const el = document.querySelector(selector);
    if (!el) return;
    el.textContent = FRIENDLY_ERRORS[code] || code || 'An error occurred.';
    el.style.display = 'block';
  }

  // ─── Check suspension (Firestore + Realtime DB) ────────────────────────────
  /**
   * Checks if a user is suspended via Firestore and Realtime Database.
   * @param {string} uid
   * @returns {Promise<boolean>}
   */
  async function checkUserSuspension(uid) {
    try {
      // Check Firestore
      const db = firebase.firestore();
      const doc = await db.collection('users').doc(uid).get();
      if (doc.exists && doc.data().suspended === true) return true;
    } catch (e) {
      console.warn('[auth] Firestore suspension check failed:', e);
    }

    try {
      // Check Realtime DB blacklist
      const rtdb = firebase.database();
      const snap = await rtdb.ref(`frz_blacklist/${uid}`).once('value');
      if (snap.val() === true) return true;
    } catch (e) {
      console.warn('[auth] Realtime DB blacklist check failed:', e);
    }

    return false;
  }

  // ─── Show suspension screen ────────────────────────────────────────────────
  /**
   * Shows the suspension screen and hides all other screens.
   * @param {object} user - Firebase user object
   */
  function showSuspensionScreen(user) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(s => s.style.display = 'none');

    const susScreen = document.getElementById('suspension-screen');
    if (!susScreen) {
      console.warn('[auth] No #suspension-screen element found');
      return;
    }
    susScreen.style.display = 'flex';

    const nameEl = document.getElementById('sus-user-name');
    const emailEl = document.getElementById('sus-user-email');
    if (nameEl)  nameEl.textContent  = user.displayName || user.email || 'User';
    if (emailEl) emailEl.textContent = user.email || '';
  }
  window.showSuspensionScreen = showSuspensionScreen;

  // ─── Save user to Firestore ────────────────────────────────────────────────
  /**
   * Creates or updates the Firestore user document after successful login.
   * @param {object} user - Firebase user object
   * @param {string} method - 'Google' | 'Email' | 'Phone'
   */
  async function saveUserToFirestore(user, method) {
    try {
      const db = firebase.firestore();
      const ref = db.collection('users').doc(user.uid);
      const doc = await ref.get();

      const data = {
        email:       user.email || '',
        name:        user.displayName || user.email || 'User',
        photoURL:    user.photoURL || '',
        loginMethod: method,
        lastLogin:   new Date().toISOString(),
        suspended:   false,
        permissions: JSON.parse(localStorage.getItem('freezy_permissions') || '{}'),
      };

      if (!doc.exists) {
        data.createdAt = new Date().toISOString();
      }

      await ref.set(data, { merge: true });
    } catch (e) {
      console.warn('[auth] Could not save user to Firestore:', e);
    }
  }

  // ─── Log login to Apps Script ──────────────────────────────────────────────
  /**
   * Logs the login event to the Apps Script web app.
   * @param {object} user - Firebase user object
   * @param {string} method - Login method string
   */
  async function logLoginToAppsScript(user, method) {
    try {
      if (typeof window.appsScriptLog === 'function') {
        await window.appsScriptLog({
          action:  'log_login',
          email:   user.email || '',
          name:    user.displayName || '',
          uid:     user.uid,
          method:  method,
          device:  window.DEVICE_TYPE || 'unknown',
        });
      }
    } catch (e) {
      console.warn('[auth] Apps Script login log failed:', e);
    }
  }

  // ─── Handle login success ─────────────────────────────────────────────────
  /**
   * Called after any successful login. Checks suspension, saves user,
   * logs to Apps Script, marks onboarding complete, starts boot sequence.
   * @param {object} user - Firebase user object
   * @param {string} method - 'Google' | 'Email' | 'Phone'
   */
  async function handleLoginSuccess(user, method) {
    try {
      // 1. Check suspension
      const isSuspended = await checkUserSuspension(user.uid);
      if (isSuspended) {
        showSuspensionScreen(user);
        await firebase.auth().signOut();
        return;
      }

      // 2. Save/update Firestore user document
      await saveUserToFirestore(user, method);

      // 3. Log login to Apps Script
      await logLoginToAppsScript(user, method);

      // 4. Mark onboarding complete
      localStorage.setItem('freezy_onboarding_complete', 'true');

      // 5. Start boot sequence
      if (typeof window.startBootSequence === 'function') {
        window.startBootSequence(user);
      } else {
        console.warn('[auth] startBootSequence not available');
      }
    } catch (e) {
      console.warn('[auth] handleLoginSuccess error:', e);
    }
  }
  window.handleLoginSuccess = handleLoginSuccess;

  // ─── Login with Google ────────────────────────────────────────────────────
  /**
   * Opens Google popup authentication.
   */
  async function loginWithGoogle() {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await firebase.auth().signInWithPopup(provider);
      await handleLoginSuccess(result.user, 'Google');
    } catch (e) {
      console.warn('[auth] Google login failed:', e.code);
      showError('#google-error', e.code);
    }
  }
  window.loginWithGoogle = loginWithGoogle;

  // ─── Login with Email ─────────────────────────────────────────────────────
  /**
   * Signs in with email and password from form fields #login-email and #login-pass.
   */
  async function loginWithEmail() {
    const emailEl = document.getElementById('login-email');
    const passEl  = document.getElementById('login-pass');
    if (!emailEl || !passEl) return;

    const email    = emailEl.value.trim();
    const password = passEl.value;

    if (!email || !password) {
      showError('#email-error', 'Please enter your email and password.');
      return;
    }

    try {
      const result = await firebase.auth().signInWithEmailAndPassword(email, password);
      await handleLoginSuccess(result.user, 'Email');
    } catch (e) {
      console.warn('[auth] Email login failed:', e.code);
      showError('#email-error', e.code);
    }
  }
  window.loginWithEmail = loginWithEmail;

  // ─── Register with Email ──────────────────────────────────────────────────
  /**
   * Creates a new account with email and password from #reg-email and #reg-pass.
   */
  async function registerWithEmail() {
    const emailEl = document.getElementById('reg-email');
    const passEl  = document.getElementById('reg-pass');
    if (!emailEl || !passEl) return;

    const email    = emailEl.value.trim();
    const password = passEl.value;

    if (!email || !password) {
      showError('#reg-error', 'Please enter your email and password.');
      return;
    }

    try {
      const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
      await handleLoginSuccess(result.user, 'Email');
    } catch (e) {
      console.warn('[auth] Registration failed:', e.code);
      showError('#reg-error', e.code);
    }
  }
  window.registerWithEmail = registerWithEmail;

  // ─── Send OTP ─────────────────────────────────────────────────────────────
  /**
   * Sends an SMS OTP to the phone number in #phone-input using reCAPTCHA.
   */
  async function sendOTP() {
    const phoneEl = document.getElementById('phone-input');
    if (!phoneEl) return;

    const phone = phoneEl.value.trim();
    if (!phone) {
      showError('#phone-error', 'Please enter your phone number.');
      return;
    }

    try {
      if (!recaptchaVerifier) {
        recaptchaVerifier = new firebase.auth.RecaptchaVerifier('recaptcha-container', {
          size: 'invisible',
        });
      }
      confirmationResult = await firebase.auth().signInWithPhoneNumber(phone, recaptchaVerifier);

      // Show OTP input panel
      const otpPanel = document.getElementById('otp-panel');
      if (otpPanel) otpPanel.style.display = 'block';
    } catch (e) {
      console.warn('[auth] OTP send failed:', e.code);
      showError('#phone-error', e.code);
      if (recaptchaVerifier) {
        recaptchaVerifier.clear();
        recaptchaVerifier = null;
      }
    }
  }
  window.sendOTP = sendOTP;

  // ─── Verify OTP ───────────────────────────────────────────────────────────
  /**
   * Verifies the OTP code entered across #otp-1 through #otp-6.
   */
  async function verifyOTP() {
    if (!confirmationResult) {
      showError('#otp-error', 'Please request an OTP first.');
      return;
    }

    const digits = [1,2,3,4,5,6].map(i => {
      const el = document.getElementById(`otp-${i}`);
      return el ? el.value.trim() : '';
    });
    const code = digits.join('');

    if (code.length !== 6) {
      showError('#otp-error', 'Please enter the full 6-digit code.');
      return;
    }

    try {
      const result = await confirmationResult.confirm(code);
      await handleLoginSuccess(result.user, 'Phone');
    } catch (e) {
      console.warn('[auth] OTP verify failed:', e.code);
      showError('#otp-error', e.code);
    }
  }
  window.verifyOTP = verifyOTP;

  // ─── OTP input auto-advance ───────────────────────────────────────────────
  /**
   * Auto-advances focus to the next OTP input field on input.
   * @param {HTMLInputElement} input - Current OTP input
   * @param {string} nextId - ID of the next input to focus
   */
  function otpNext(input, nextId) {
    if (!input) return;
    if (input.value.length >= 1 && nextId) {
      const next = document.getElementById(nextId);
      if (next) next.focus();
    }
  }
  window.otpNext = otpNext;

  // ─── Logout ───────────────────────────────────────────────────────────────
  /**
   * Signs out the current user, clears session, and redirects to index.
   */
  async function logout() {
    try {
      await firebase.auth().signOut();
    } catch (e) {
      console.warn('[auth] Sign out error:', e);
    }
    sessionStorage.removeItem('freezy_user');
    window.location.href = 'index.html';
  }
  window.logout = logout;

  // ─── Auth state listener ──────────────────────────────────────────────────
  // Runs on load — handles existing sessions
  try {
    firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) return;

      try {
        const isSuspended = await checkUserSuspension(user.uid);
        if (isSuspended) {
          showSuspensionScreen(user);
          return;
        }

        if (localStorage.getItem('freezy_onboarding_complete') === 'true') {
          if (typeof window.startBootSequence === 'function') {
            window.startBootSequence(user);
          }
        }
      } catch (e) {
        console.warn('[auth] Auth state handler error:', e);
      }
    });
  } catch (e) {
    console.warn('[auth] onAuthStateChanged setup failed:', e);
  }
})();
