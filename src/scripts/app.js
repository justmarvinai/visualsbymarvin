/**
 * ANIMATION ENGINE
 * ------------------------------------------------------------
 * Smooth scroll (Lenis) + all motion (GSAP). Everything respects
 * `prefers-reduced-motion` and the site works fully without JS.
 *
 * Hooks you can use in any .astro file:
 *   data-enter            → animates in on page load (staggered)
 *   data-rule             → hairline that draws itself in on page load
 *   data-reveal           → fades/slides up when scrolled into view
 *   data-mask   + .mask/.mi → masked line reveal on scroll
 *   .gate-mi              → masked word/line revealed by the load timeline
 *   data-card             → project plate: rule, title, cover reveal +
 *     data-card-img         parallax + hover zoom (crop marks snap in)
 *   data-cover            → big cover image clip reveal on page load
 *                           (data-cover="pill" opens like the hero pill)
 *   data-zoom             → images inside open full size in the lightbox
 *   data-count-to         → number counts up to that value in view
 *   data-time             → live clock (Europe/Berlin)
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const html = document.documentElement;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

let lenis = null;
let pageCtl = null; // aborts per-page listeners on navigation
let firstLoad = true; // the full load choreography runs once per visit

/* ============================================================
   SMOOTH SCROLL — lifecycle + user toggle
   ------------------------------------------------------------
   The top-bar toggle switches Lenis smooth scrolling on/off.
   Smooth is the standard default; a visitor's own choice is then
   remembered in localStorage. (The OS "reduce motion" setting is
   respected — those users default to instant.)
   ============================================================ */
// bump the suffix if you ever want to reset everyone back to the default
const SCROLL_KEY = 'scrollMode-v2';

/* ============================================================
   COLOR THEME — light / dark
   ------------------------------------------------------------
   The theme is applied before first paint by the inline script in
   Base.astro. Here we only handle the toggle + keeping the choice
   across page navigations.
   ============================================================ */
const THEME_KEY = 'theme';
let theme = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';

function applyTheme(next, persist) {
  theme = next === 'dark' ? 'dark' : 'light';
  if (persist) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
    // crossfade the colours (skipped on first paint / navigation)
    html.classList.add('theme-anim');
    clearTimeout(applyTheme.t);
    applyTheme.t = setTimeout(() => html.classList.remove('theme-anim'), 400);
  }
  html.dataset.theme = theme;
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', theme === 'dark' ? '#0c0c0c' : '#ffffff');
  $$('[data-theme-mode]').forEach((b) =>
    b.setAttribute('aria-pressed', b.dataset.themeMode === theme ? 'true' : 'false')
  );
}

function initTheme(signal) {
  applyTheme(theme, false);
  $$('[data-theme-mode]').forEach((btn) => {
    btn.addEventListener('click', () => applyTheme(btn.dataset.themeMode, true), { signal });
  });
  // follow the OS while the visitor hasn't picked a theme themselves
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  mq.addEventListener(
    'change',
    (e) => {
      let stored = null;
      try {
        stored = localStorage.getItem(THEME_KEY);
      } catch {}
      if (!stored) applyTheme(e.matches ? 'dark' : 'light', false);
    },
    { signal }
  );
}

function readScrollPref() {
  let stored = null;
  try {
    stored = localStorage.getItem(SCROLL_KEY);
  } catch {}
  if (stored === 'smooth') return true;
  if (stored === 'instant') return false;
  return !reduced; // default: smooth (unless the OS asks to reduce motion)
}

function lenisRaf(time) {
  lenis && lenis.raf(time * 1000);
}

function enableSmooth() {
  if (lenis) return;
  lenis = new Lenis({ lerp: 0.115 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add(lenisRaf);
  gsap.ticker.lagSmoothing(0);
  lenis.scrollTo(window.scrollY, { immediate: true, force: true });
}

function disableSmooth() {
  if (!lenis) return;
  gsap.ticker.remove(lenisRaf);
  lenis.destroy();
  lenis = null;
  ScrollTrigger.refresh();
}

function applyScrollMode(smooth, persist) {
  if (persist) {
    try {
      localStorage.setItem(SCROLL_KEY, smooth ? 'smooth' : 'instant');
    } catch {}
  }
  if (smooth) enableSmooth();
  else disableSmooth();
  // reflect the state on every toggle currently in the DOM
  $$('.scroll-toggle').forEach((t) => (t.dataset.active = smooth ? 'smooth' : 'instant'));
  $$('.scroll-toggle [data-scroll-mode]').forEach((b) =>
    b.setAttribute(
      'aria-pressed',
      b.dataset.scrollMode === (smooth ? 'smooth' : 'instant') ? 'true' : 'false'
    )
  );
}

/* ============================================================
   PAGE LIFECYCLE (works with Astro view transitions)
   ============================================================ */
document.addEventListener('astro:page-load', initPage);
document.addEventListener('astro:before-swap', () => {
  pageCtl?.abort();
  ScrollTrigger.getAll().forEach((t) => t.kill());
});
document.addEventListener('astro:after-swap', () => {
  // Astro resets <html>'s classes to the server-rendered set on every swap,
  // dropping the classes our client code owns. Re-apply them before paint so
  // e.g. the toggles (gated on `.js`) stay visible on every page. `booted` is
  // left off on purpose: the new page stays hidden behind the CSS gate until
  // its own entrance has set the start states. `is-nav` exempts the top bar
  // from that gate, so it stays put while the page underneath changes.
  const cl = document.documentElement.classList;
  cl.add('js', 'is-nav');
  if (lenis) cl.add('lenis', 'lenis-smooth');
  document.documentElement.dataset.theme = theme; // attributes are reset too
  // keep Lenis in sync with the scroll position Astro restored
  lenis?.scrollTo(window.scrollY, { immediate: true, force: true });
});

function initPage() {
  pageCtl = new AbortController();
  const { signal } = pageCtl;

  initClock(signal);
  initAnchors(signal);
  initScrollToggle(signal);
  initTheme(signal);
  initLightbox(signal);

  if (reduced) {
    html.classList.add('booted');
    // no motion → everything simply sits in its final state
    $$('.crop').forEach((c) => c.classList.add('is-in'));
    return;
  }

  initMast(signal);
  entrance();
  initReveals();
  initMasks();
  initCards(signal);
  initCounters();

  requestAnimationFrame(() => ScrollTrigger.refresh());
}

/* ============================================================
   LOAD CHOREOGRAPHY
   ------------------------------------------------------------
   First visit: the rules draw, the headline rises word by word,
   the portrait pill opens from a sliver. Later page changes get
   a shorter version (the view transition already crossfades).
   ============================================================ */
function whenFontsReady(maxWait) {
  if (!document.fonts?.ready) return Promise.resolve();
  return Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, maxWait))]);
}

function entrance() {
  const first = firstLoad;
  firstLoad = false;

  const mast = $('.mast');
  const rules = $$('[data-rule]').filter((r) => !r.closest('[data-card]'));
  const words = $$('.gate-mi');
  const enters = $$('[data-enter]');
  const pill = $('.hero-pill');
  const pillImg = pill && $('img', pill);
  const cover = $('[data-cover]');
  const coverImg = cover && $('img', cover);
  const isPill = cover?.dataset.cover === 'pill';
  const crop = cover?.closest('.crop');

  const shut = isPill ? 'inset(0% 50% 0% 50% round 999px)' : 'inset(10% 6% 10% 6%)';
  const open = isPill ? 'inset(0% 0% 0% 0% round 999px)' : 'inset(0% 0% 0% 0%)';

  // explicit start states, then release the CSS gate
  // (y:0 clears the px offset gsap parses from the CSS gate transform,
  // otherwise it would stay as a residual translate under yPercent)
  gsap.set(rules, { scaleX: 0, transformOrigin: '0% 50%' });
  gsap.set(words, { y: 0, yPercent: 140 });
  gsap.set(enters, { y: 24, opacity: 0 });
  if (pill) {
    gsap.set(pill, { clipPath: 'inset(0% 50% 0% 50% round 999px)' });
    gsap.set(pillImg, { scale: 1.4 });
  }
  if (cover) {
    gsap.set(cover, { clipPath: shut });
    if (coverImg && !isPill) gsap.set(coverImg, { scale: 1.18 });
  }
  if (first && mast) gsap.set(mast, { opacity: 0, y: -12 });
  html.classList.add('booted');

  const k = first ? 1 : 0.7; // later pages: same moves, quicker
  const play = () => {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    if (first && mast) tl.to(mast, { opacity: 1, y: 0, duration: 0.9, clearProps: 'transform' }, 0.1);
    tl.to(rules, { scaleX: 1, duration: 1.4 * k, ease: 'expo.inOut' }, 0);
    tl.to(words, { yPercent: 0, duration: 1.2 * k, stagger: 0.09 * k }, 0.2 * k);
    if (pill) {
      tl.to(pill, { clipPath: 'inset(0% 0% 0% 0% round 999px)', duration: 1.3 * k }, 0.5 * k);
      // cleared at the end so the CSS hover zoom can take over
      tl.to(pillImg, { scale: 1, duration: 1.6 * k, clearProps: 'transform' }, 0.5 * k);
    }
    if (cover) {
      tl.to(cover, { clipPath: open, duration: 1.3 * k }, 0.45 * k);
      if (coverImg && !isPill) tl.to(coverImg, { scale: 1, duration: 1.6 * k, clearProps: 'transform' }, 0.45 * k);
      if (crop) tl.add(() => crop.classList.add('is-in'), 0.9 * k);
    }
    tl.to(enters, { y: 0, opacity: 1, duration: 0.9 * k, stagger: 0.07 * k, clearProps: 'transform' }, 0.55 * k);
  };

  // wait (briefly) for Archivo, so the headline never rises in a fallback font
  if (first) whenFontsReady(800).then(play);
  else play();
}

/* ============================================================
   MASTHEAD — hides on the way down, returns on the way up
   ============================================================ */
function initMast(signal) {
  const mast = $('.mast');
  if (!mast) return;
  let lastY = window.scrollY;
  let queued = false;

  const update = () => {
    queued = false;
    const y = Math.max(0, window.scrollY);
    mast.classList.toggle('is-scrolled', y > 4);
    const dy = y - lastY;
    if (Math.abs(dy) < 6) return;
    // never hide while something inside it has keyboard focus
    const hide = dy > 0 && y > 240 && !mast.contains(document.activeElement);
    mast.classList.toggle('is-hidden', hide);
    lastY = y;
  };

  window.addEventListener(
    'scroll',
    () => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(update);
    },
    { passive: true, signal }
  );
  mast.addEventListener('focusin', () => mast.classList.remove('is-hidden'), { signal });
  update();
}

/* ============================================================
   SCROLL REVEALS
   ============================================================ */
function initReveals() {
  $$('[data-reveal]').forEach((el) => {
    gsap.fromTo(
      el,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1,
        ease: 'power3.out',
        clearProps: 'transform',
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      }
    );
  });
}

function initMasks() {
  $$('[data-mask]').forEach((group) => {
    const lines = $$('.mi', group);
    if (!lines.length) return;
    gsap.fromTo(
      lines,
      { y: 0, yPercent: 140 },
      {
        yPercent: 0,
        duration: 1.2,
        ease: 'expo.out',
        stagger: 0.1,
        scrollTrigger: { trigger: group, start: 'top 88%', once: true },
      }
    );
  });
}

/* ============================================================
   PROJECT PLATES — rule draws, title rises, the cover wipes up
   inside its crop marks, then drifts gently while it scrolls by
   ============================================================ */
function initCards(signal) {
  $$('[data-card]').forEach((card) => {
    const rule = $('[data-rule]', card);
    const head = $$('[data-plate-head] > *', card);
    const foot = $('[data-plate-foot]', card);
    const crop = $('.crop', card);
    const media = $('[data-card-img]', card);
    const img = media && $('img', media);

    const tl = gsap.timeline({
      defaults: { ease: 'expo.out' },
      scrollTrigger: { trigger: card, start: 'top 86%', once: true },
    });
    if (rule) tl.fromTo(rule, { scaleX: 0, transformOrigin: '0% 50%' }, { scaleX: 1, duration: 1.3, ease: 'expo.inOut' }, 0);
    if (head.length)
      tl.fromTo(head, { y: 36, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1, stagger: 0.06 }, 0.1);
    if (media) tl.fromTo(media, { clipPath: 'inset(100% 0% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.4 }, 0.2);
    if (img) tl.fromTo(img, { scale: 1.32 }, { scale: 1.08, duration: 1.8 }, 0.2);
    if (crop) tl.add(() => crop.classList.add('is-in'), 0.75);
    if (foot) tl.fromTo(foot, { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1, clearProps: 'transform' }, 0.5);

    if (!img) return;

    // gentle drift while the plate passes through the viewport — the
    // 1.08 baseline scale gives it the headroom, so no edge ever shows
    gsap.fromTo(
      img,
      { yPercent: -3 },
      {
        yPercent: 3,
        ease: 'none',
        scrollTrigger: { trigger: media, start: 'top bottom', end: 'bottom top', scrub: true },
      }
    );

    if (finePointer) {
      card.addEventListener('mouseenter', () => gsap.to(img, { scale: 1.12, duration: 0.8, ease: 'power3.out' }), {
        signal,
      });
      card.addEventListener('mouseleave', () => gsap.to(img, { scale: 1.08, duration: 0.8, ease: 'power3.out' }), {
        signal,
      });
    }
  });
}

/* ============================================================
   SMOOTH ANCHORS + CLOCK
   ============================================================ */
function initAnchors(signal) {
  $$('a[href*="#"]').forEach((a) => {
    a.addEventListener(
      'click',
      (e) => {
        const href = a.getAttribute('href') || '';
        const [path, hash] = href.split('#');
        if (!hash) return;
        // only intercept when we're already on the target page
        if (path && path !== window.location.pathname) return;
        const target = hash === 'top' ? 0 : document.getElementById(hash);
        if (target === null) return;
        e.preventDefault();
        // smooth mode → eased Lenis scroll (honouring the CSS scroll-margin);
        // instant/reduced → jump
        if (lenis) {
          const margin = target === 0 ? 0 : parseFloat(getComputedStyle(target).scrollMarginTop) || 0;
          lenis.scrollTo(target, { duration: 1.4, offset: -margin });
        } else if (target === 0) {
          window.scrollTo({ top: 0, behavior: 'instant' });
        } else {
          target.scrollIntoView({ behavior: 'instant' });
        }
      },
      { signal }
    );
  });
}

function initScrollToggle(signal) {
  // apply the saved (or default) mode, then bind the buttons
  applyScrollMode(readScrollPref(), false);
  $$('.scroll-toggle [data-scroll-mode]').forEach((btn) => {
    btn.addEventListener(
      'click',
      () => applyScrollMode(btn.dataset.scrollMode === 'smooth', true),
      { signal }
    );
  });
}

function initClock(signal) {
  const els = $$('[data-time]');
  if (!els.length) return;
  const fmt = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Berlin',
  });
  const tick = () => {
    const now = fmt.format(new Date());
    els.forEach((el) => (el.textContent = now));
  };
  tick();
  const id = setInterval(tick, 10_000);
  signal.addEventListener('abort', () => clearInterval(id));
}

/* ============================================================
   LIGHTBOX — click a project image to view it at full size
   ------------------------------------------------------------
   Project images ship at their full resolution but are shown small
   inside the article grid, so opening one is a real upgrade. The
   viewer fits the image to the screen first and can switch to 1:1
   actual pixels (drag or scroll to pan) for close inspection.
   Runs for reduced-motion visitors too — it's a feature, not motion.
   ============================================================ */
const LB_ICON = {
  close:
    '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  prev: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 12H4m0 0 6-6m-6 6 6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h16m0 0-6-6m6 6-6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

/** Markdown images carry one full-res src; the cover carries a srcset —
 *  take its widest candidate so the viewer always shows the biggest file. */
function widestSrc(img) {
  const set = img.getAttribute('srcset');
  if (!set) return img.currentSrc || img.src;
  let best = { url: img.currentSrc || img.src, w: 0 };
  for (const cand of set.split(',')) {
    const [url, desc] = cand.trim().split(/\s+/);
    const w = parseInt(desc, 10) || 0;
    if (url && w > best.w) best = { url, w };
  }
  return best.url;
}

function initLightbox(signal) {
  const shots = $$('[data-zoom] [data-cover] img, [data-zoom] .article img');
  if (!shots.length) return;

  const lb = document.createElement('div');
  lb.className = 'lb';
  lb.hidden = true;
  lb.setAttribute('role', 'dialog');
  lb.setAttribute('aria-modal', 'true');
  lb.setAttribute('aria-label', 'Image viewer');
  lb.innerHTML = `
    <div class="lb-bar">
      <p class="lb-count" aria-live="polite"></p>
      <div class="lb-actions">
        <button type="button" class="lb-btn lb-size"></button>
        <button type="button" class="lb-btn lb-icon lb-close" aria-label="Close viewer">${LB_ICON.close}</button>
      </div>
    </div>
    <div class="lb-stage"><div class="lb-frame"><img class="lb-img" alt="" draggable="false"></div></div>
    <div class="lb-foot">
      <button type="button" class="lb-btn lb-icon lb-prev" aria-label="Previous image">${LB_ICON.prev}</button>
      <p class="lb-cap"></p>
      <button type="button" class="lb-btn lb-icon lb-next" aria-label="Next image">${LB_ICON.next}</button>
    </div>`;
  document.body.append(lb);

  const stage = $('.lb-stage', lb);
  const view = $('.lb-img', lb);
  const cap = $('.lb-cap', lb);
  const count = $('.lb-count', lb);
  const sizeBtn = $('.lb-size', lb);
  const prevBtn = $('.lb-prev', lb);
  const nextBtn = $('.lb-next', lb);
  const single = shots.length < 2;

  count.hidden = single;
  prevBtn.hidden = single;
  nextBtn.hidden = single;

  let index = -1;
  let opener = null;
  let actual = false;

  /* ---- the trigger images ---- */
  shots.forEach((img, i) => {
    img.classList.add('zoomable');
    img.tabIndex = 0;
    img.setAttribute('role', 'button');
    img.setAttribute('aria-label', img.alt ? `${img.alt} — view full size` : 'View image full size');
    img.addEventListener('click', () => open(i), { signal });
    img.addEventListener(
      'keydown',
      (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        e.preventDefault();
        open(i);
      },
      { signal }
    );
  });

  /* ---- fit ⇄ actual size ---- */
  function fits() {
    return view.naturalWidth <= stage.clientWidth && view.naturalHeight <= stage.clientHeight;
  }

  function setActual(on) {
    actual = on && !fits();
    stage.classList.toggle('is-actual', actual);
    view.style.width = actual ? `${view.naturalWidth}px` : '';
    sizeBtn.textContent = actual ? 'Fit to screen' : 'Actual size';
    sizeBtn.hidden = fits();
    if (actual) {
      // start the pan in the middle of the image
      stage.scrollLeft = (stage.scrollWidth - stage.clientWidth) / 2;
      stage.scrollTop = (stage.scrollHeight - stage.clientHeight) / 2;
    }
  }

  function show(i) {
    index = (i + shots.length) % shots.length;
    const img = shots[index];
    lb.classList.add('is-loading');
    view.src = widestSrc(img);
    view.alt = img.alt || '';
    cap.textContent = img.alt || '';
    count.textContent = `${index + 1} / ${shots.length}`;
    const done = () => {
      lb.classList.remove('is-loading');
      setActual(false);
    };
    view.complete ? done() : view.addEventListener('load', done, { once: true });
  }

  /* ---- open / close ---- */
  function open(i) {
    opener = shots[i];
    lb.hidden = false;
    show(i);
    lockScroll(true);
    requestAnimationFrame(() => lb.classList.add('is-open'));
    $('.lb-close', lb).focus();
  }

  function close(immediate) {
    if (lb.hidden) return;
    lb.classList.remove('is-open');
    lockScroll(false);
    const finish = () => {
      lb.hidden = true;
      view.removeAttribute('src');
      opener?.focus({ preventScroll: true });
      opener = null;
    };
    if (immediate || reduced) finish();
    else setTimeout(finish, 260);
  }

  let padded = false;
  function lockScroll(on) {
    if (on) {
      const bar = window.innerWidth - html.clientWidth;
      if (bar > 0) {
        html.style.paddingRight = `${bar}px`;
        padded = true;
      }
      html.style.overflow = 'hidden';
      lenis?.stop();
    } else {
      html.style.overflow = '';
      if (padded) html.style.paddingRight = '';
      padded = false;
      lenis?.start();
    }
  }

  /* ---- controls ---- */
  const on = (el, ev, fn) => el.addEventListener(ev, fn, { signal });

  on($('.lb-close', lb), 'click', () => close());
  on(prevBtn, 'click', () => show(index - 1));
  on(nextBtn, 'click', () => show(index + 1));
  on(sizeBtn, 'click', () => setActual(!actual));

  on(document, 'keydown', (e) => {
    if (lb.hidden) return;
    if (e.key === 'Escape') return close();
    // at 1:1 the arrows pan the image instead of changing it
    if (!actual && !single && e.key === 'ArrowLeft') return show(index - 1);
    if (!actual && !single && e.key === 'ArrowRight') return show(index + 1);
    if (e.key !== 'Tab') return;
    // keep focus inside the dialog
    const focusable = $$('.lb-btn', lb).filter((b) => !b.hidden);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  /* ---- pointer gestures on the stage: pan, toggle 1:1, close ----
     Driven from the gesture rather than from `click`: pointer capture
     retargets the follow-up click to the stage, so a click on the zoomed
     image would otherwise read as a click on the backdrop and close. */
  let pan = null;
  on(stage, 'pointerdown', (e) => {
    if (e.button !== 0) return;
    pan = {
      x: e.clientX,
      y: e.clientY,
      left: stage.scrollLeft,
      top: stage.scrollTop,
      onImage: e.target === view,
      moved: false,
    };
    if (!actual) return;
    stage.setPointerCapture(e.pointerId);
    stage.classList.add('is-panning');
  });
  on(stage, 'pointermove', (e) => {
    if (!pan) return;
    const dx = e.clientX - pan.x;
    const dy = e.clientY - pan.y;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) pan.moved = true;
    if (!actual) return;
    stage.scrollLeft = pan.left - dx;
    stage.scrollTop = pan.top - dy;
  });
  on(stage, 'pointerup', () => {
    const gesture = pan;
    pan = null;
    stage.classList.remove('is-panning');
    if (!gesture || gesture.moved) return; // a drag pans, it never clicks through
    gesture.onImage ? setActual(!actual) : close();
  });
  // touch panning is handled natively (touch-action), which cancels the pointer
  on(stage, 'pointercancel', () => {
    pan = null;
    stage.classList.remove('is-panning');
  });

  on(window, 'resize', () => {
    if (!lb.hidden) setActual(actual);
  });

  signal.addEventListener('abort', () => {
    close(true);
    lb.remove();
  });
}


/* ============================================================
   COUNTERS
   ------------------------------------------------------------
   Numbers count up the first time they scroll into view. The
   final value is already in the HTML, so no-JS and reduced-motion
   visitors read the right number and only the animation is skipped.
   ============================================================ */
function initCounters() {
  $$('[data-count-to]').forEach((el) => {
    const to = Number(el.dataset.countTo);
    if (!Number.isFinite(to)) return;
    const pad = Number(el.dataset.countPad) || 0;
    const n = { v: 0 };
    const draw = () => (el.textContent = String(Math.round(n.v)).padStart(pad, '0'));
    gsap.fromTo(
      n,
      { v: 0 },
      {
        v: to,
        // big numbers get a little longer, but never a boring long crawl
        duration: Math.min(2.1, 0.8 + to / 500),
        ease: 'power2.out',
        onUpdate: draw,
        // without this the counter would blank to 0 on load and only read
        // correctly once it happened to be scrolled past
        immediateRender: false,
        scrollTrigger: { trigger: el, start: 'top 92%', once: true },
      }
    );
  });
}
