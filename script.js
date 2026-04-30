/* =============================================================
   WEDDING INVITATION  —  script.js
   =============================================================
   Responsibilities
   ─────────────────
   1. Door opening animation (scroll · wheel · touch · keyboard)
   2. Auto-scroll to Page 2 after doors open
   3. IntersectionObserver → fade-in sections when they enter view
   4. Floating-petal generator for Page 3
   5. Active-page tracking (for future nav dots, analytics, etc.)
   ============================================================= */

(function () {
  'use strict';

  /* ───────────────────────────────────────────────────────────
     DOM REFERENCES
     ─────────────────────────────────────────────────────────── */
  const scrollContainer  = document.getElementById('scrollContainer');
  const doorLeft         = document.getElementById('doorLeft');
  const doorRight        = document.getElementById('doorRight');
  const doorFrame        = doorLeft && doorLeft.closest('.door-frame');
  const doorScrollPrompt = document.getElementById('doorScrollPrompt');
  const petalsContainer  = document.getElementById('petalsContainer');
  const sections         = document.querySelectorAll('.section');

  /* ───────────────────────────────────────────────────────────
     STATE
     ─────────────────────────────────────────────────────────── */
  let doorsOpen   = false;   // true once door-open sequence completes
  let isAnimating = false;   // true while animation is in progress
  let activePage  = 0;       // 0 | 1 | 2 – index of current snap section

  /* ───────────────────────────────────────────────────────────
     HELPER: scroll the container to a specific section index
     ─────────────────────────────────────────────────────────── */
  function scrollToSection(index) {
    const targetSection = sections[index];
    if (!targetSection) return;
    scrollContainer.scrollTo({
      top:      targetSection.offsetTop,
      behavior: 'smooth'
    });
  }

  /* ───────────────────────────────────────────────────────────
     DOOR ANIMATION
     ─────────────────────────────────────────────────────────── */
  function openDoors() {
    if (doorsOpen || isAnimating) return;
    isAnimating = true;

    /* Disable snap so the container doesn't jump while animating */
    scrollContainer.classList.add('no-snap');

    /* Apply 3-D CSS transforms via class (defined in style.css) */
    doorLeft.classList.add('open');
    doorRight.classList.add('open');
    doorFrame && doorFrame.classList.add('doors-open');

    /* Fade out the scroll prompt */
    if (doorScrollPrompt) {
      doorScrollPrompt.style.opacity = '0';
      doorScrollPrompt.style.pointerEvents = 'none';
    }

    /*
     * After the door CSS transition finishes (≈ 1.35 s),
     * wait a short extra moment so the user can read the
     * revealed text, then auto-advance to page 2.
     *
     * ── Change the delay (ms) below to taste ──
     */
    setTimeout(function () {
      doorsOpen   = true;
      isAnimating = false;
      scrollContainer.classList.remove('no-snap');

      /* Advance to Page 2 */
      scrollToSection(1);
    }, 2000);   /* 1 350 ms door CSS + 650 ms pause */
  }

  /* ── Wheel (mouse / trackpad) ── */
  scrollContainer.addEventListener('wheel', function (e) {
    if (activePage === 0 && e.deltaY > 0 && !doorsOpen && !isAnimating) {
      e.preventDefault();
      openDoors();
    }
  }, { passive: false });

  /* ── Touch swipe up ── */
  var _touchStartY = 0;

  scrollContainer.addEventListener('touchstart', function (e) {
    _touchStartY = e.touches[0].clientY;
  }, { passive: true });

  scrollContainer.addEventListener('touchend', function (e) {
    var dy = _touchStartY - e.changedTouches[0].clientY;
    if (activePage === 0 && dy > 35 && !doorsOpen && !isAnimating) {
      openDoors();
    }
  }, { passive: true });

  /* ── Keyboard (ArrowDown / Space / PageDown) ── */
  document.addEventListener('keydown', function (e) {
    var downKeys = ['ArrowDown', 'PageDown', ' '];
    if (activePage === 0 && downKeys.includes(e.key) && !doorsOpen && !isAnimating) {
      e.preventDefault();
      openDoors();
    }
  });

  /* ───────────────────────────────────────────────────────────
     PAGE TRACKING  (keeps activePage in sync with scroll pos)
     ─────────────────────────────────────────────────────────── */
  scrollContainer.addEventListener('scroll', function () {
    var st = scrollContainer.scrollTop;
    var vh = window.innerHeight;
    var newPage = Math.round(st / vh);

    if (newPage !== activePage) {
      activePage = newPage;
      /* Optional: dispatch a custom event for future extensions */
      document.dispatchEvent(
        new CustomEvent('weddingPageChange', { detail: { page: activePage } })
      );
    }
  }, { passive: true });

  /* ───────────────────────────────────────────────────────────
     FADE-IN SECTIONS  (IntersectionObserver)
     Each element with class .fade-in-section gets class
     .is-visible when it enters the scroll container's viewport.
     Opacity / transform transition is declared in style.css.
     ─────────────────────────────────────────────────────────── */
  var fadeEls = document.querySelectorAll('.fade-in-section');

  var fadeObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          /* Unobserve so the fade only triggers once */
          fadeObserver.unobserve(entry.target);
        }
      });
    },
    {
      root:      scrollContainer,
      threshold: 0.12          /* fire when 12 % of element is visible */
    }
  );

  fadeEls.forEach(function (el) { fadeObserver.observe(el); });

  /* ───────────────────────────────────────────────────────────
     FLOATING PETALS  (Page 3)
     ─────────────────────────────────────────────────────────── */

  /*
   * ── Customise petals below ──────────────────────────────
   * PETAL_COUNT   : total petals in DOM (increase for denser shower)
   * PETAL_COLORS  : array of CSS colours; add/remove values freely
   * MIN_SIZE / MAX_SIZE  : petal size in px
   * MIN_DUR / MAX_DUR    : fall duration in seconds
   */
  var PETAL_COUNT  = 26;
  var PETAL_COLORS = [
    '#f9cad8', '#f2b5c8', '#fde8ec',
    '#fce4ec', '#f8bbd0', '#ffd8cc',
    '#e8d5a3', '#fde68a', '#ffffff'
  ];
  var MIN_SIZE = 7;
  var MAX_SIZE = 17;
  var MIN_DUR  = 6;
  var MAX_DUR  = 14;

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function createPetal() {
    var el      = document.createElement('div');
    var size    = rand(MIN_SIZE, MAX_SIZE);
    var color   = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
    var left    = rand(0, 100);          /* % from left */
    var dur     = rand(MIN_DUR, MAX_DUR);
    var delay   = rand(0, MAX_DUR);      /* stagger so not all fall at once */
    var rot     = rand(0, 360);

    /* Alternate between two petal shapes */
    var br = Math.random() > 0.5
      ? '0 50% 50% 50%'   /* teardrop right */
      : '50% 0 50% 50%';  /* teardrop left  */

    el.classList.add('petal');
    el.style.cssText = [
      'left:'                     + left    + '%;',
      'width:'                    + size    + 'px;',
      'height:'                   + size    + 'px;',
      'background:'               + color   + ';',
      'border-radius:'            + br      + ';',
      'animation-duration:'       + dur     + 's;',
      'animation-delay:'          + delay   + 's;',
      'transform: rotate('        + rot     + 'deg);',
      'filter: blur('             + (Math.random() > 0.65 ? '0.6px' : '0') + ');'
    ].join(' ');

    return el;
  }

  function initPetals() {
    if (!petalsContainer) return;
    var fragment = document.createDocumentFragment();
    for (var i = 0; i < PETAL_COUNT; i++) {
      fragment.appendChild(createPetal());
    }
    petalsContainer.appendChild(fragment);
  }

  initPetals();

  /* ───────────────────────────────────────────────────────────
     BACKGROUND MUSIC
     ─────────────────────────────────────────────────────────── */
  var bgMusic     = document.getElementById('bgMusic');
  var musicToggle = document.getElementById('musicToggle');
  var musicIcon   = document.getElementById('musicIcon');
  var musicPopup  = document.getElementById('musicPopup');
  var mpYes       = document.getElementById('mpYes');
  var mpNo        = document.getElementById('mpNo');
  var musicStarted = false;

  function startMusic() {
    if (musicStarted || !bgMusic) return;
    bgMusic.volume = 0.45;
    bgMusic.play().then(function () {
      musicStarted = true;
      if (musicToggle) {
        musicToggle.classList.add('playing');
        musicToggle.setAttribute('aria-label', 'Pause music');
      }
      if (musicIcon) musicIcon.innerHTML = '&#10074;&#10074;';
    }).catch(function () { /* blocked */ });
  }

  function dismissPopup() {
    if (!musicPopup) return;
    musicPopup.classList.add('mp-hide');
  }

  /* Show popup after a short delay */
  if (musicPopup) {
    setTimeout(function () {
      musicPopup.classList.add('mp-show');
    }, 1200);
  }

  if (mpYes) {
    mpYes.addEventListener('click', function () {
      startMusic();
      dismissPopup();
    });
  }
  if (mpNo) {
    mpNo.addEventListener('click', function () {
      dismissPopup();
    });
  }

  /* Also start on first scroll (silent, no popup needed) */
  function onFirstScroll() {
    startMusic();
    dismissPopup();
    scrollContainer.removeEventListener('wheel',      onFirstScroll);
    scrollContainer.removeEventListener('touchstart', onFirstScroll);
  }
  scrollContainer.addEventListener('wheel',      onFirstScroll, { once: true, passive: true });
  scrollContainer.addEventListener('touchstart', onFirstScroll, { once: true, passive: true });

  /* Toggle button */
  if (musicToggle && bgMusic) {
    musicToggle.addEventListener('click', function () {
      if (bgMusic.paused) {
        bgMusic.volume = 0.45;
        bgMusic.play();
        musicStarted = true;
        musicToggle.classList.add('playing');
        musicToggle.setAttribute('aria-label', 'Pause music');
        musicIcon.innerHTML = '&#10074;&#10074;';
      } else {
        bgMusic.pause();
        musicToggle.classList.remove('playing');
        musicToggle.setAttribute('aria-label', 'Play music');
        musicIcon.innerHTML = '&#9654;';
      }
    });
  }

  /* ───────────────────────────────────────────────────────────
     COUNTDOWN TIMER
     Target date : 29 May 2026 (change if needed)
     ─────────────────────────────────────────────────────────── */
  var WEDDING  = new Date('2026-05-29T04:30:00');
  var CD_DOTS  = 40;  /* dots per ring — keep even for symmetry */

  /* Build static dot circles once; update only their fill colour on tick */
  function initRing(id) {
    var svg = document.getElementById(id);
    if (!svg) return;
    var cx = 60, cy = 60, r = 50, dotR = 2.6;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < CD_DOTS; i++) {
      var angle = (i / CD_DOTS) * 2 * Math.PI - Math.PI / 2;
      var dot   = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      dot.setAttribute('cx', (cx + r * Math.cos(angle)).toFixed(2));
      dot.setAttribute('cy', (cy + r * Math.sin(angle)).toFixed(2));
      dot.setAttribute('r',  dotR);
      dot.setAttribute('fill', 'rgba(201,168,76,0.18)');
      frag.appendChild(dot);
    }
    svg.appendChild(frag);
  }

  function setRingLit(id, lit) {
    var svg = document.getElementById(id);
    if (!svg) return;
    var dots = svg.querySelectorAll('circle');
    for (var i = 0; i < dots.length; i++) {
      dots[i].setAttribute('fill',
        i < lit ? '#c9a84c' : 'rgba(201,168,76,0.18)');
    }
  }

  ['ringDays','ringHours','ringMinutes','ringSeconds'].forEach(initRing);

  function tickCountdown() {
    var diff    = WEDDING - new Date();
    var days, hours, minutes, seconds;
    if (diff <= 0) {
      days = hours = minutes = seconds = 0;
    } else {
      days    = Math.floor(diff / 86400000);
      hours   = Math.floor((diff % 86400000) / 3600000);
      minutes = Math.floor((diff % 3600000)  / 60000);
      seconds = Math.floor((diff % 60000)    / 1000);
    }

    document.getElementById('cdDays').textContent    = String(days).padStart(2,'0');
    document.getElementById('cdHours').textContent   = String(hours).padStart(2,'0');
    document.getElementById('cdMinutes').textContent = String(minutes).padStart(2,'0');
    document.getElementById('cdSeconds').textContent = String(seconds).padStart(2,'0');

    /* Ring fill: lit dots = proportional to value / max */
    setRingLit('ringDays',    Math.round(Math.min(days,30) / 30 * CD_DOTS));
    setRingLit('ringHours',   Math.round(hours   / 24 * CD_DOTS));
    setRingLit('ringMinutes', Math.round(minutes / 60 * CD_DOTS));
    setRingLit('ringSeconds', Math.round(seconds / 60 * CD_DOTS));
  }

  tickCountdown();
  setInterval(tickCountdown, 1000);

  /* ───────────────────────────────────────────────────────────
     RESIZE HANDLER  (recalculate page index on window resize)
     ─────────────────────────────────────────────────────────── */
  window.addEventListener('resize', function () {
    var st = scrollContainer.scrollTop;
    var vh = window.innerHeight;
    activePage = Math.round(st / vh);
  }, { passive: true });

  /* ───────────────────────────────────────────────────────────
     VENUE MAP  — click / tap to toggle map popup
     ─────────────────────────────────────────────────────────── */
  var mapWraps = document.querySelectorAll('.venue-map-wrap');

  mapWraps.forEach(function (wrap) {
    wrap.addEventListener('click', function (e) {
      /* Don't close when clicking the directions link or iframe */
      if (e.target.closest('.map-directions-btn') || e.target.closest('iframe')) return;
      var isOpen = wrap.classList.contains('map-open');
      /* Close all others first */
      mapWraps.forEach(function (w) { w.classList.remove('map-open'); });
      if (!isOpen) wrap.classList.add('map-open');
    });
  });

  /* Tap anywhere outside to close */
  document.addEventListener('click', function (e) {
    if (!e.target.closest('.venue-map-wrap')) {
      mapWraps.forEach(function (w) { w.classList.remove('map-open'); });
    }
  });

})(); /* end IIFE */
