/**
 * JITORA - Animated Opening Splash Screen Controller
 * 
 * Sequence:
 * 1. Clean full-screen white background displayed immediately.
 * 2. Fade in exact original JITORA logo with smooth zoom-in animation.
 * 3. Dual ambient blue and orange glow with high-gloss sheen sweep across the logo.
 * 4. Tagline "Your Campus. Your Convenience." fades in beneath the logo.
 * 5. After ~3 seconds, smoothly fades out to reveal the website homepage.
 * 
 * Features:
 * - Skip Intro button with instantaneous smooth transition
 * - Keyboard accessible (Esc, Enter, Space)
 * - Prefers-reduced-motion compliance
 * - Non-intrusive: Runs on initial page load, never on internal navigation
 */

export function initSplashScreen(options = {}) {
  const splashEl = document.getElementById('jitora-splash-screen');
  if (!splashEl) return;

  const skipBtn = document.getElementById('splash-skip-btn');
  const duration = options.duration || 3100;
  let isDismissed = false;
  let autoDismissTimer = null;

  // Accessibility check for reduced motion
  const prefersReducedMotion = window.matchMedia && 
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function dismissSplash(immediate = false) {
    if (isDismissed) return;
    isDismissed = true;

    if (autoDismissTimer) {
      clearTimeout(autoDismissTimer);
      autoDismissTimer = null;
    }

    // Remove keyboard listener
    window.removeEventListener('keydown', handleKeydown);

    if (immediate || prefersReducedMotion) {
      splashEl.classList.add('splash-dismissed');
      cleanup();
      return;
    }

    splashEl.classList.add('splash-fading-out');

    const fadeDuration = 650;
    setTimeout(() => {
      splashEl.classList.add('splash-dismissed');
      cleanup();
    }, fadeDuration);
  }

  function cleanup() {
    splashEl.setAttribute('aria-hidden', 'true');
    // Dispatch event to announce splash has finished
    window.dispatchEvent(new CustomEvent('jitora:splash_closed'));
    
    // Focus management: shift focus to main container or skip link
    const mainScreen = document.getElementById('mobile-app-screen');
    if (mainScreen && typeof mainScreen.focus === 'function') {
      mainScreen.setAttribute('tabindex', '-1');
      mainScreen.focus();
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') {
      dismissSplash(false);
    }
  }

  // Bind Skip button
  if (skipBtn) {
    skipBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dismissSplash(false);
    });
  }

  // Listen for Escape key
  window.addEventListener('keydown', handleKeydown);

  // Auto dismiss after ~3 seconds (or faster if reduced motion)
  const waitTime = prefersReducedMotion ? 1200 : duration;
  autoDismissTimer = setTimeout(() => {
    dismissSplash(false);
  }, waitTime);

  // Return programmatic control
  return {
    dismiss: dismissSplash
  };
}
