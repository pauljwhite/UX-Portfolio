/* ============================================================
   Paul White — UX Portfolio
   Interactions & Animations
   ============================================================ */

(function () {
  'use strict';

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
     Scroll event (combined)
     ------------------------- */
  window.addEventListener('scroll', function () {
    updateProgress();
    updateNav();
  }, { passive: true });

  // Run once on load
  updateProgress();
  updateNav();

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
  document.querySelectorAll('.case-card').forEach(function (card) {
    card.addEventListener('mouseenter', function () {
      this.querySelectorAll('.metric-val').forEach(function (v) {
        v.style.color = 'var(--accent)';
      });
    });
    card.addEventListener('mouseleave', function () {
      this.querySelectorAll('.metric-val').forEach(function (v) {
        v.style.color = '';
      });
    });
  });

})();
