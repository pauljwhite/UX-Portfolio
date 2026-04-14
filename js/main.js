/* ============================================================
   Paul White — UX Portfolio
   Interactions & Animations
   ============================================================ */

(function () {
  'use strict';

  const STORAGE_KEY = 'ux-portfolio-theme';
  const docEl = document.documentElement;
  const body = document.body;
  const themeToggle = document.getElementById('themeToggle');
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');

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
  const nav = document.getElementById('nav');

  function updateNav() {
    if (window.scrollY > 24) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
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
    setActiveCaseCard();
  }, { passive: true });

  // Run once on load
  updateProgress();
  updateNav();
  setActiveCaseCard();
  window.addEventListener('resize', setActiveCaseCard);

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      const nextTheme = body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
      applyTheme(nextTheme);
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
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
