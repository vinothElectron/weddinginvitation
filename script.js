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
     RESIZE HANDLER  (recalculate page index on window resize)
     ─────────────────────────────────────────────────────────── */
  window.addEventListener('resize', function () {
    var st = scrollContainer.scrollTop;
    var vh = window.innerHeight;
    activePage = Math.round(st / vh);
  }, { passive: true });

})(); /* end IIFE */
