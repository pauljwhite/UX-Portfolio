/* ============================================================
   Paul White — UX Portfolio
   Interactions & Animations
   ============================================================ */

(function () {
  'use strict';

  const STORAGE_KEY = 'ux-portfolio-theme';
  const docEl = document.documentElement;
  const body = document.body;
  const nav = document.getElementById('nav');
  const heroPhoto = document.querySelector('.hero-photo');
  const themeToggle = document.getElementById('themeToggle');
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  let menuCloseTimer = null;

  function getPreferredTheme() {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY);
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }

    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }

  function syncThemeUi(theme) {
    if (themeColorMeta) {
      themeColorMeta.setAttribute('content', theme === 'light' ? '#ffffff' : '#000000');
    }

    if (themeToggle) {
      const nextTheme = theme === 'light' ? 'dark' : 'light';
      themeToggle.setAttribute('aria-pressed', String(theme === 'light'));
      themeToggle.setAttribute('aria-label', 'Switch to ' + nextTheme + ' mode');
    }
  }

  function applyTheme(theme) {
    body.setAttribute('data-theme', theme);
    docEl.style.colorScheme = theme;
    syncThemeUi(theme);
  }

  applyTheme(getPreferredTheme());

  function closeMenu(immediate) {
    if (!nav || !menuToggle) {
      return;
    }

    if (menuCloseTimer) {
      window.clearTimeout(menuCloseTimer);
      menuCloseTimer = null;
    }

    if (immediate) {
      nav.classList.remove('is-open', 'is-closing');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation menu');
      return;
    }

    if (!nav.classList.contains('is-open')) {
      return;
    }

    nav.classList.add('is-closing');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Open navigation menu');

    menuCloseTimer = window.setTimeout(function () {
      nav.classList.remove('is-open', 'is-closing');
      menuCloseTimer = null;
    }, 380);
  }

  /* -------------------------
     Scroll Progress Bar
     ------------------------- */
  const progressBar = document.getElementById('progressBar');

  function updateProgress() {
    const scrolled = window.scrollY;
    const total = document.documentElement.scrollHeight - window.innerHeight;
    const pct = total > 0 ? (scrolled / total) * 100 : 0;
    progressBar.style.width = pct + '%';
  }

  /* -------------------------
     Nav — scroll state
     ------------------------- */
  function updateNav() {
    if (window.scrollY > 24) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }

  function updateNavAvatar() {
    if (!nav) {
      return;
    }

    if (!heroPhoto) {
      nav.style.setProperty('--nav-avatar-progress', '1');
      return;
    }

    const heroRect = heroPhoto.getBoundingClientRect();
    const navRect = nav.getBoundingClientRect();
    const start = navRect.bottom + 56;
    const end = navRect.bottom - 48;
    const progress = (start - heroRect.bottom) / (start - end);
    const clamped = Math.max(0, Math.min(1, progress));

    nav.style.setProperty('--nav-avatar-progress', clamped.toFixed(3));
    heroPhoto.classList.toggle('is-transitioning', clamped > 0 && clamped < 1);
  }

  /* -------------------------
     Selected work
     Expand card nearest viewport center
     ------------------------- */
  const caseCards = Array.from(document.querySelectorAll('.case-card'));

  function setActiveCaseCard() {
    if (!caseCards.length) {
      return;
    }

    const viewportCenter = window.innerHeight * 0.5;
    let activeCard = caseCards[0];
    let closestDistance = Number.POSITIVE_INFINITY;

    caseCards.forEach(function (card) {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.top + (rect.height / 2);
      const distance = Math.abs(cardCenter - viewportCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        activeCard = card;
      }
    });

    caseCards.forEach(function (card) {
      card.classList.toggle('is-active', card === activeCard);
    });
  }

  /* -------------------------
     Scroll event (combined)
     ------------------------- */
  window.addEventListener('scroll', function () {
    updateProgress();
    updateNav();
    updateNavAvatar();
    setActiveCaseCard();
  }, { passive: true });

  // Run once on load
  updateProgress();
  updateNav();
  updateNavAvatar();
  setActiveCaseCard();
  window.addEventListener('resize', function () {
    setActiveCaseCard();
    updateNavAvatar();

    if (window.innerWidth > 768 && nav) {
      closeMenu(true);
    }
  });

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      const nextTheme = body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(nextTheme);
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    });
  }

  if (menuToggle && nav) {
    menuToggle.addEventListener('click', function () {
      if (nav.classList.contains('is-open') && !nav.classList.contains('is-closing')) {
        closeMenu(false);
        return;
      }

      if (menuCloseTimer) {
        window.clearTimeout(menuCloseTimer);
        menuCloseTimer = null;
      }

      nav.classList.remove('is-closing');
      nav.classList.add('is-open');
      menuToggle.setAttribute('aria-expanded', 'true');
      menuToggle.setAttribute('aria-label', 'Close navigation menu');
    });
  }

  /* -------------------------
     Intersection Observer
     Fade-in on scroll
     ------------------------- */
  const animEls = document.querySelectorAll('.animate-in');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.08,
      rootMargin: '0px 0px -48px 0px'
    });

    animEls.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    // Fallback: show all immediately
    animEls.forEach(function (el) {
      el.classList.add('visible');
    });
  }

  /* -------------------------
     Smooth Anchor Scrolling
     ------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      if (nav && nav.classList.contains('is-open') && navLinks && navLinks.contains(this)) {
        closeMenu(true);
      }
      const navH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--nav-h'), 10) || 56;
      const top = target.getBoundingClientRect().top + window.scrollY - navH;
      window.scrollTo({ top: top, behavior: 'smooth' });
    });
  });

  /* -------------------------
     Case card hover — subtle
     lift on metrics
     ------------------------- */
})();
