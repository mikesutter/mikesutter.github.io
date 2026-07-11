/**
 * Photography subsite — mikesutter.com v2.0
 *
 * - Hash-routed set switching (single page):  /photography/#<handle>
 * - Desktop menu: left-edge hover-expand (CSS) + active link sync
 * - Mobile menu: hamburger toggle
 * - Desktop masonry: custom justified-rows packer (target row height ≈ 0.85 * vh)
 * - Mobile: single horizontal scroll-snap row
 * - Lightbox: PhotoSwipe v5 (vendored) — open, circular nav, keyboard, swipe, close.
 *   Native pinch-to-zoom and double-tap zoom enabled with gentle settings.
 *
 * PhotoSwipe 5.4.4 API notes (verified against the vendored source):
 *   - loadAndOpen(index, dataSource, pointerPos?)   // 2nd arg becomes options.dataSource
 *   - no slide.imageEl; query img.pswp__img on currSlide.holderElement
 *   - lightbox.pswp is the core instance after init
 *   - pswp.template == pswp.element == the .pswp root
 */

import PhotoSwipeLightbox from '/assets/vendor/photoswipe/photoswipe-lightbox.esm.min.js';
import PhotoSwipe from '/assets/vendor/photoswipe/photoswipe.esm.min.js';

(function () {
  'use strict';

  const MQ_DESKTOP = '(min-width: 990px)';
  const ROW_TARGET_RATIO = 0.85;   // desktop row height as a fraction of viewport height
  const MOBILE_ROW_RATIO = 0.70;   // mobile image height as a fraction of viewport height
  const GAP = 12;

  const sets = Array.prototype.slice.call(document.querySelectorAll('.photo-set'));
  const nav = document.getElementById('photoSetNav');
  const toggle = document.querySelector('.photo-nav-toggle');
  const isDesktop = () => window.matchMedia(MQ_DESKTOP).matches;

  if (!sets.length) return;

  /* ------------------------------------------------------------------ *
   * Set activation + hash routing
   * ------------------------------------------------------------------ */
  function handleFromHash() {
    return (location.hash || '').replace(/^#\/?/, '').trim();
  }

  function activate(handle, options) {
    options = options || {};
    const target = sets.filter(s => s.dataset.handle === handle)[0] || sets[0];
    const changed = !target.classList.contains('is-active');

    sets.forEach(s => s.classList.toggle('is-active', s === target));
    Array.prototype.forEach.call(
      document.querySelectorAll('.photo-set-nav__link'),
      a => a.classList.toggle('is-active', a.dataset.handle === target.dataset.handle)
    );

    if (!options.keepMenuOpen) closeMenu();
    if (changed || options.forceLayout) layoutActive();
    if (changed) window.scrollTo(0, 0);
    document.title = (target.dataset.title || 'Photography') + ' — Mike Sutter Photography';
  }

  /* ------------------------------------------------------------------ *
   * Layout
   * ------------------------------------------------------------------ */
  function layoutActive() {
    const target = document.querySelector('.photo-set.is-active');
    if (!target) return;
    const grid = target.querySelector('.photo-grid');
    if (!grid) return;

    const run = () => {
      if (isDesktop()) layoutJustified(grid, window.innerHeight * ROW_TARGET_RATIO);
      else layoutRow(grid, window.innerHeight * MOBILE_ROW_RATIO);
      grid.classList.add('is-ready');
    };

    if (window.imagesLoaded) {
      const inst = window.imagesLoaded(grid);
      inst.on('always', run);
      if (!grid.querySelectorAll('img').length) run();
    } else {
      run();
    }
  }

  // Justified-rows packer — ABSOLUTE positioning (pixel-perfect; avoids the
  // flexbox "exact-fit wraps the last item" subpixel rounding bug). Packs images
  // into rows scaled to fill the container width; the last (incomplete) row is
  // left at the target height (not stretched).
  function layoutJustified(grid, targetRowHeight) {
    const items = gridItems(grid);
    const cw = grid.clientWidth;
    if (!cw || !items.length) return;

    grid.style.position = 'relative';
    let row = [];
    let ratioSum = 0;
    let y = 0;
    const placed = [];

    const placeRow = (h) => {
      let x = 0;
      row.forEach(it => {
        const w = it.ratio * h;
        placed.push({ el: it.el, x: x, y: y, w: w, h: h });
        x += w + GAP;
      });
      y += h + GAP;
    };

    items.forEach(it => {
      row.push(it);
      ratioSum += it.ratio;
      const estWidth = ratioSum * targetRowHeight + GAP * (row.length - 1);
      if (estWidth >= cw) {
        placeRow((cw - GAP * (row.length - 1)) / ratioSum);  // scale row to fill width
        row = [];
        ratioSum = 0;
      }
    });
    if (row.length) placeRow(targetRowHeight);  // last row: natural target height

    grid.style.height = Math.max(0, y - GAP) + 'px';
    placed.forEach(p => {
      p.el.style.position = 'absolute';
      p.el.style.left = Math.round(p.x) + 'px';
      p.el.style.top = Math.round(p.y) + 'px';
      p.el.style.width = Math.round(p.w) + 'px';
      p.el.style.height = Math.round(p.h) + 'px';
    });
  }

  // Mobile: single horizontal row at a fixed height (flex nowrap).
  function layoutRow(grid, height) {
    grid.style.position = '';
    grid.style.height = '';
    var cw = grid.clientWidth;
    gridItems(grid).forEach(it => {
      var w = Math.round(it.ratio * height);
      var h = height;
      // If the image at target height is wider than the container, cap the
      // width and reduce the height proportionally so the photo fits without
      // cropping (aspect ratio preserved).
      if (cw > 0 && w > cw) { w = cw; h = Math.round(cw / it.ratio); }
      it.el.style.position = '';
      it.el.style.left = '';
      it.el.style.top = '';
      it.el.style.width = w + 'px';
      it.el.style.height = h + 'px';
    });
  }

  function gridItems(grid) {
    const out = [];
    Array.prototype.forEach.call(grid.querySelectorAll('.photo-grid__item'), el => {
      const img = el.querySelector('img');
      const nw = img && img.naturalWidth;
      const nh = img && img.naturalHeight;
      if (!nw || !nh) {
        // unloaded/erroring image: clear any layout styles so it doesn't overlap
        el.style.position = '';
        el.style.left = el.style.top = el.style.width = el.style.height = '';
        return;
      }
      out.push({ el: el, ratio: nw / nh });
    });
    return out;
  }

  /* ------------------------------------------------------------------ *
   * Mobile menu
   * ------------------------------------------------------------------ */
  function openMenu() {
    if (!nav) return;
    nav.classList.add('is-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'true');
  }
  function closeMenu() {
    if (!nav) return;
    nav.classList.remove('is-open');
    if (toggle) toggle.setAttribute('aria-expanded', 'false');
  }
  if (toggle) {
    toggle.addEventListener('click', () => {
      nav.classList.contains('is-open') ? closeMenu() : openMenu();
    });
  }

  /* ------------------------------------------------------------------ *
   * Lightbox (PhotoSwipe v5)
   * ------------------------------------------------------------------ */

  const lightbox = new PhotoSwipeLightbox({
    pswpModule: PhotoSwipe,
    bgOpacity: 0.96,
    showHideAnimationType: 'fade',
    zoom: true,
    close: true,
    arrowKeys: true,
    loop: true,           // circular: last -> first and first -> last
    initialZoomLevel: 'fit',
    secondaryZoomLevel: 1.25,    /* gentle zoom on double-tap */
    maxZoomLevel: 1.75,
    wheelToZoom: false
  });
  lightbox.init();

  // Probe a 2x image URL; resolves with {src,w,h} on success, rejects on error.
  function probeImage(url, timeoutMs) {
    timeoutMs = timeoutMs || 4000;
    return new Promise(function (resolve, reject) {
      var img = new Image();
      var timer = setTimeout(function () { reject(new Error('timeout')); }, timeoutMs);
      img.onload = function () {
        clearTimeout(timer);
        resolve({ src: url, w: img.naturalWidth, h: img.naturalHeight });
      };
      img.onerror = function () { clearTimeout(timer); reject(new Error('not found')); };
      img.src = url;
    });
  }

  // Build the lightbox dataSource for the given set.  For each image, tries a
  // "-2x" high-resolution variant (<handle>-NN-2x.jpg); silently falls back to
  // the original masonry source if no 2x file exists yet.
  function dataSourceFor(setEl) {
    var imgs = Array.prototype.slice.call(setEl.querySelectorAll('.photo-grid__item img'));
    return Promise.all(imgs.map(function (img) {
      var original = img.currentSrc || img.getAttribute('src');
      // Insert '-2x' before the extension: /assets/…/los-angeles-covid-01.jpg  →  …-01-2x.jpg
      var twoX = original.replace(/\.\w+$/, '-2x$&');
      return probeImage(twoX).catch(function () {
        return { src: original, w: img.naturalWidth, h: img.naturalHeight };
      });
    }));
  }

  async function openLightbox(setEl, startIndex) {
    try {
      var dataSource = await dataSourceFor(setEl);
    } catch (e) {
      return;   // probe timeout / all failed — don't open a broken lightbox
    }
    if (!dataSource.length) return;
    lightbox.loadAndOpen(Math.max(0, startIndex), dataSource);
  }

  // Wire grid clicks + keyboard
  document.querySelectorAll('.photo-grid').forEach(grid => {
    grid.addEventListener('click', e => {
      const item = e.target.closest('.photo-grid__item');
      if (!item) return;
      e.preventDefault();
      const setEl = item.closest('.photo-set');
      const idx = Array.prototype.indexOf.call(setEl.querySelectorAll('.photo-grid__item'), item);
      openLightbox(setEl, idx);
    });
    grid.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const item = e.target.closest && e.target.closest('.photo-grid__item');
      if (!item) return;
      e.preventDefault();
      const setEl = item.closest('.photo-set');
      const idx = Array.prototype.indexOf.call(setEl.querySelectorAll('.photo-grid__item'), item);
      openLightbox(setEl, idx);
    });
  });


  /* ------------------------------------------------------------------ *
   * Resize
   * ------------------------------------------------------------------ */
  let resizeTimer;
  let lastMode = isDesktop();
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const mode = isDesktop();
      if (mode !== lastMode) {
        lastMode = mode;
        document.querySelectorAll('.photo-grid').forEach(g => { g.style.position = ''; g.style.height = ''; });
        document.querySelectorAll('.photo-grid__item').forEach(el => {
          el.style.position = '';
          el.style.left = el.style.top = el.style.width = el.style.height = '';
        });
      }
      layoutActive();
    }, 150);
  });

  /* ------------------------------------------------------------------ *
   * Init
   * ------------------------------------------------------------------ */
  window.addEventListener('hashchange', () => activate(handleFromHash()));
  activate(handleFromHash(), { forceLayout: true });
})();
