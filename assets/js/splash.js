/**
 * Splash Page Interactions — mikesutter.com v2.0
 *
 * Desktop (≥ 990px):
 *   Hover (or keyboard focus) on a panel reveals its CTA + swaps the info
 *   section below (cross-fade) and shrinks the hero. The reveal persists until
 *   the other panel is hovered/focused.
 *
 * Mobile (< 990px):
 *   Each info section is relocated to sit right below its panel. A scroll
 *   handler marks the panel nearest the viewport center "active", which expands
 *   its CTA then its info section (layered via CSS transition-delays); leaving
 *   center collapses the info first, then the CTA — matching the brief.
 *
 * Accessibility:
 *   - Info sections toggle aria-hidden to match visibility (their CTAs become
 *     non-focusable when collapsed via visibility:hidden in CSS).
 *   - Panel CTAs are always focusable and expand on :focus-within (keyboard).
 *   - prefers-reduced-motion snaps all transitions (CSS), and mobile still
 *     toggles content on/off (no continuous animation).
 */

(function () {
  'use strict';

  var MQ_MOBILE = '(max-width: 989px)';

  var isMobile = function () { return window.matchMedia(MQ_MOBILE).matches; };
  var prefersReduced = function () {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  };

  var photoPanel = document.querySelector('.splash-panel--photo');
  var studioPanel = document.querySelector('.splash-panel--studio');
  var photoInfo = document.getElementById('splash-info-photography');
  var studioInfo = document.getElementById('splash-info-studio');
  var splashHero = document.querySelector('.splash-hero');
  var infoContainer = document.querySelector('.splash-info-container');

  if (!photoPanel || !studioPanel || !photoInfo || !studioInfo) return;

  var currentDevice = isMobile();
  var mobilePlaced = false;     // are info sections relocated next to panels?
  var rafId = 0;

  /* ---------------------------------------------------------------- *
   * Helpers
   * ---------------------------------------------------------------- */
  function setInfoVisible(info, visible) {
    info.classList.toggle('splash-info--visible', visible);
    info.setAttribute('aria-hidden', visible ? 'false' : 'true');
  }

  function clearInline(el) {
    if (!el) return;
    el.style.cssText = '';
  }

  /* ---------------------------------------------------------------- *
   * Desktop
   * ---------------------------------------------------------------- */
  function showPhoto() {
    if (isMobile()) return;
    if (splashHero) splashHero.classList.add('splash-hero--shrunken');
    setInfoVisible(photoInfo, true);
    setInfoVisible(studioInfo, false);
  }

  function showStudio() {
    if (isMobile()) return;
    if (splashHero) splashHero.classList.add('splash-hero--shrunken');
    setInfoVisible(studioInfo, true);
    setInfoVisible(photoInfo, false);
  }

  function bindDesktop() {
    unbindMobile();

    // Reset to a clean desktop state.
    if (splashHero) splashHero.classList.remove('splash-hero--shrunken');
    setInfoVisible(photoInfo, false);
    setInfoVisible(studioInfo, false);

    // Mouse + keyboard reveal (focus-within lets keyboard users trigger it).
    photoPanel.addEventListener('mouseenter', showPhoto);
    studioPanel.addEventListener('mouseenter', showStudio);
    photoPanel.addEventListener('focusin', showPhoto);
    studioPanel.addEventListener('focusin', showStudio);
  }

  function unbindDesktop() {
    if (splashHero) splashHero.classList.remove('splash-hero--shrunken');
    photoPanel.removeEventListener('mouseenter', showPhoto);
    studioPanel.removeEventListener('mouseenter', showStudio);
    photoPanel.removeEventListener('focusin', showPhoto);
    studioPanel.removeEventListener('focusin', showStudio);
    setInfoVisible(photoInfo, false);
    setInfoVisible(studioInfo, false);
  }

  /* ---------------------------------------------------------------- *
   * Mobile
   * ---------------------------------------------------------------- */
  function placeMobile() {
    if (mobilePlaced) return;
    // Move each info section to sit directly after its panel (inside the hero,
    // which is a vertical flex column on mobile).
    photoPanel.insertAdjacentElement('afterend', photoInfo);
    studioPanel.insertAdjacentElement('afterend', studioInfo);
    mobilePlaced = true;
    measureInfoHeights();
  }

  function placeDesktop() {
    if (!mobilePlaced) return;
    // Restore original order (photo before studio) inside the container.
    if (infoContainer) {
      infoContainer.appendChild(photoInfo);
      infoContainer.appendChild(studioInfo);
    }
    mobilePlaced = false;
  }

  function measureInfoHeights() {
    [photoInfo, studioInfo].forEach(function (info) {
      // scrollHeight ignores the max-height clamp, so it yields full content height.
      info.style.setProperty('--splash-info-h', info.scrollHeight + 'px');
    });
  }

  function updateMobile() {
    rafId = 0;
    // Trigger-line model: a panel becomes active once its top scrolls past a
    // line ~40% down the viewport, and stays active until the NEXT panel's top
    // crosses that line. So the Photography content collapses exactly as the
    // Studio panel arrives (per the spec), and the last panel stays expanded
    // to the end of the page. Default to the first panel before any crossing.
    var triggerY = window.innerHeight * 0.40;
    var active = photoPanel;
    if (studioPanel.getBoundingClientRect().top <= triggerY) active = studioPanel;

    photoPanel.classList.toggle('splash-panel--active', active === photoPanel);
    studioPanel.classList.toggle('splash-panel--active', active === studioPanel);
    setInfoVisible(photoInfo, active === photoPanel);
    setInfoVisible(studioInfo, active === studioPanel);
  }

  function scheduleUpdate() {
    if (rafId) return;
    rafId = requestAnimationFrame(updateMobile);
  }

  function bindMobile() {
    unbindDesktop();
    placeMobile();

    // Initial state + listeners
    updateMobile();
    window.addEventListener('scroll', scheduleUpdate, { passive: true });
    window.addEventListener('resize', onMobileResize, { passive: true });
  }

  function unbindMobile() {
    window.removeEventListener('scroll', scheduleUpdate);
    window.removeEventListener('resize', onMobileResize);
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }

    photoPanel.classList.remove('splash-panel--active');
    studioPanel.classList.remove('splash-panel--active');
    setInfoVisible(photoInfo, false);
    setInfoVisible(studioInfo, false);

    placeDesktop();
  }

  // Re-measure info heights on resize while in mobile (content can reflow).
  var resizeMeasureTimer;
  function onMobileResize() {
    clearTimeout(resizeMeasureTimer);
    resizeMeasureTimer = setTimeout(measureInfoHeights, 150);
    scheduleUpdate();
  }

  /* ---------------------------------------------------------------- *
   * Init & breakpoint crossing
   * ---------------------------------------------------------------- */
  function init() {
    currentDevice = isMobile();
    if (currentDevice) bindMobile(); else bindDesktop();
    wirePanelClicks();
  }

  // Click anywhere on a panel (not just its CTA) navigates to that section.
  // The CTA's own anchor still works; clicks on it bubble here to the same href.
  function wirePanelClicks() {
    [photoPanel, studioPanel].forEach(function (panel) {
      if (!panel) return;
      panel.addEventListener('click', function (e) {
        var cta = panel.querySelector('.splash-panel__cta');
        var href = cta && cta.getAttribute('href');
        if (!href) return;
        // Let a click directly on the CTA use its native anchor navigation.
        if (e.target.closest && e.target.closest('.splash-panel__cta')) return;
        window.location.href = href;
      });
    });
  }

  var crossTimer;
  window.addEventListener('resize', function () {
    clearTimeout(crossTimer);
    crossTimer = setTimeout(function () {
      var nowMobile = isMobile();
      if (nowMobile !== currentDevice) {
        currentDevice = nowMobile;
        if (nowMobile) bindMobile(); else bindDesktop();
      }
    }, 200);
  });

  init();
})();
