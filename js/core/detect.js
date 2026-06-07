/**
 * js/core/detect.js
 * Purpose: Detect the environment the OS is running in — browser vs Electron (.exe),
 * device type, screen size category. Expose detection results as global constants.
 * No Firebase calls. No DOM modification. Pure detection only.
 */

(function () {
  'use strict';

  // ─── Electron detection ────────────────────────────────────────────────────
  const IS_ELECTRON = (
    typeof window !== 'undefined' &&
    typeof window.process === 'object' &&
    window.process?.type === 'renderer'
  );

  // ─── PWA detection ─────────────────────────────────────────────────────────
  const IS_PWA = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;

  // ─── Touch detection ───────────────────────────────────────────────────────
  const IS_TOUCH = (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );

  // ─── Online status ─────────────────────────────────────────────────────────
  window.IS_ONLINE = navigator.onLine;
  window.addEventListener('online',  () => { window.IS_ONLINE = true;  });
  window.addEventListener('offline', () => { window.IS_ONLINE = false; });

  // ─── OS platform detection ─────────────────────────────────────────────────
  function detectPlatform() {
    const ua = navigator.userAgent.toLowerCase();
    if (/android/.test(ua))             return 'android';
    if (/iphone|ipad|ipod/.test(ua))    return 'ios';
    if (/win/.test(navigator.platform)) return 'windows';
    if (/mac/.test(navigator.platform)) return 'mac';
    if (/linux/.test(navigator.platform)) return 'linux';
    return 'unknown';
  }

  // ─── Screen size evaluation ────────────────────────────────────────────────
  /**
   * Evaluates current viewport width and returns device type constants.
   * @returns {{ IS_MOBILE, IS_TABLET, IS_DESKTOP, IS_TV, DEVICE_TYPE }}
   */
  function evaluateScreenSize() {
    const w = window.innerWidth;
    const IS_MOBILE  = w <= 768;
    const IS_TABLET  = w >= 769  && w <= 1199;
    const IS_DESKTOP = w >= 1200 && w <= 1919;
    const IS_TV      = w >= 1920;
    let DEVICE_TYPE  = 'desktop';
    if (IS_MOBILE)  DEVICE_TYPE = 'mobile';
    else if (IS_TABLET)  DEVICE_TYPE = 'tablet';
    else if (IS_TV)      DEVICE_TYPE = 'tv';
    return { IS_MOBILE, IS_TABLET, IS_DESKTOP, IS_TV, DEVICE_TYPE };
  }

  // ─── Apply to window ───────────────────────────────────────────────────────
  function applyDetections() {
    const sizes = evaluateScreenSize();
    window.IS_MOBILE   = sizes.IS_MOBILE;
    window.IS_TABLET   = sizes.IS_TABLET;
    window.IS_DESKTOP  = sizes.IS_DESKTOP;
    window.IS_TV       = sizes.IS_TV;
    window.DEVICE_TYPE = sizes.DEVICE_TYPE;
  }

  // ─── Set all globals ───────────────────────────────────────────────────────
  window.IS_ELECTRON  = IS_ELECTRON;
  window.IS_PWA       = IS_PWA;
  window.IS_TOUCH     = IS_TOUCH;
  window.OS_PLATFORM  = detectPlatform();
  applyDetections();

  // ─── Resize listener ───────────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    applyDetections();
    window.dispatchEvent(new CustomEvent('freezy-resize', {
      detail: { type: window.DEVICE_TYPE }
    }));
  });

  console.log(
    `[detect] Platform: ${window.OS_PLATFORM} | Device: ${window.DEVICE_TYPE} | ` +
    `Electron: ${IS_ELECTRON} | PWA: ${IS_PWA} | Touch: ${IS_TOUCH}`
  );
})();
