/* ============================================================
   Paul White - UX Portfolio
   Interactions & Animations
   ============================================================ */

(function () {
  'use strict';

  const STORAGE_KEY = 'ux-portfolio-theme';
  const PASSWORD_KEY = 'ux-portfolio-unlocked-v8';
  const PORTFOLIO_PASSWORD_HASH = '2516158c39e80d6a6a06298f007fd35a8fb3984dbe14285025fdc32db94b9b35';
  const docEl = document.documentElement;
  const body = document.body;
  const nav = document.getElementById('nav');
  const heroPhoto = document.querySelector('.hero-photo');
  const themeToggle = document.getElementById('themeToggle');
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');
  const WORK_VIEW_KEY = 'ux-portfolio-work-view';
  const workList = document.querySelector('.work-list');
  const workCarouselShell = document.querySelector('.work-carousel-shell');
  const workArrowPrev = document.querySelector('.work-carousel-arrow--prev');
  const workArrowNext = document.querySelector('.work-carousel-arrow--next');
  const workViewButtons = Array.from(document.querySelectorAll('.work-view-btn'));
  const caseStudyCount = document.querySelector('[data-case-study-count]');
  const CAROUSEL_SLIDE_DURATION = 980;
  const CAROUSEL_ACTIVE_PROGRESS = 0.5;
  const WORK_VIEW_TRANSITION_DURATION = 940;
  const WORK_VIEW_TRANSITION_STAGGER = 58;
  let carouselScrollFrame = null;
  let suppressCarouselActiveSync = false;
  let isWorkViewTransitioning = false;
  let menuCloseTimer = null;

  function hashPassword(value) {
    if (!window.crypto || !window.crypto.subtle || !window.TextEncoder) {
      return Promise.resolve('');
    }

    const encodedValue = new TextEncoder().encode(value);

    return window.crypto.subtle.digest('SHA-256', encodedValue).then(function (buffer) {
      return Array.from(new Uint8Array(buffer)).map(function (byte) {
        return byte.toString(16).padStart(2, '0');
      }).join('');
    });
  }

  function initPasswordGate(forceLock) {
    if (document.querySelector('.password-gate')) {
      return;
    }

    let isUnlocked = false;

    try {
      if (forceLock) {
        window.sessionStorage.removeItem(PASSWORD_KEY);
      } else {
        isUnlocked = window.sessionStorage.getItem(PASSWORD_KEY) === 'true';
      }
    } catch (error) {
      isUnlocked = false;
    }

    if (isUnlocked) {
      return;
    }

    body.classList.add('is-password-locked');

    const gate = document.createElement('div');
    gate.className = 'password-gate';
    gate.setAttribute('role', 'dialog');
    gate.setAttribute('aria-modal', 'true');
    gate.setAttribute('aria-labelledby', 'passwordGateTitle');
    gate.innerHTML = [
      '<div class="password-gate-panel">',
      '  <div class="password-gate-avatar" aria-hidden="true">',
      '    <img src="' + (window.location.pathname.includes('/case-studies/') ? '../' : '') + 'images/paul-photo.png" alt="">',
      '    <span class="password-gate-success">',
      '      <svg viewBox="0 0 48 48" focusable="false">',
      '        <path d="M14 25.2 21.2 32 35 16"></path>',
      '      </svg>',
      '    </span>',
      '    <span class="password-gate-failure">',
      '      <svg viewBox="0 0 48 48" focusable="false">',
      '        <path d="M16 16 32 32"></path>',
      '        <path d="M32 16 16 32"></path>',
      '      </svg>',
      '    </span>',
      '  </div>',
      '  <p class="password-gate-kicker">Private portfolio</p>',
      '  <h1 id="passwordGateTitle">Enter password</h1>',
      '  <p class="password-gate-copy">This portfolio is shared with invited viewers only.</p>',
      '  <form class="password-gate-form" novalidate>',
      '    <label class="sr-only" for="portfolioPassword">Password</label>',
      '    <input id="portfolioPassword" class="password-gate-input" type="text" name="password" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Password" required>',
      '    <button class="password-gate-submit" type="submit" aria-label="Unlock portfolio">',
      '      <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">',
      '        <path d="M5 12h13"></path>',
      '        <path d="m13 6 6 6-6 6"></path>',
      '      </svg>',
      '    </button>',
      '    <p class="password-gate-error" aria-live="polite"></p>',
      '  </form>',
      '</div>'
    ].join('');

    document.body.appendChild(gate);

    const form = gate.querySelector('.password-gate-form');
    const input = gate.querySelector('.password-gate-input');
    const error = gate.querySelector('.password-gate-error');

    window.setTimeout(function () {
      input.focus();
    }, 50);

    form.addEventListener('submit', async function (event) {
      event.preventDefault();

      const submittedHash = await hashPassword(input.value);

      if (submittedHash === PORTFOLIO_PASSWORD_HASH) {
        try {
          window.sessionStorage.setItem(PASSWORD_KEY, 'true');
        } catch (error) {
          // If sessionStorage is unavailable, keep access for this page load.
        }

        gate.classList.add('is-unlocking');
        input.blur();

        window.setTimeout(function () {
          body.classList.remove('is-password-locked');
        }, 1240);

        window.setTimeout(function () {
          gate.remove();
        }, 1740);
        return;
      }

      input.setAttribute('aria-invalid', 'true');
      error.textContent = 'That password is not recognised.';
      gate.classList.remove('has-error');
      gate.classList.remove('has-failure-mark');
      void gate.offsetWidth;
      gate.classList.add('has-error');
      gate.classList.add('has-failure-mark');
      input.select();
    });

    input.addEventListener('input', function () {
      input.removeAttribute('aria-invalid');
      error.textContent = '';
      gate.classList.remove('has-error');
    });
  }

  initPasswordGate();

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
     Nav - scroll state
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

  if (caseStudyCount && caseCards.length) {
    caseStudyCount.textContent = String(caseCards.length);
  }

  function getPreferredWorkView() {
    const saved = window.localStorage.getItem(WORK_VIEW_KEY);
    if (saved === 'list' || saved === 'carousel') {
      return saved;
    }
    return 'carousel';
  }

  function applyWorkView(view, shouldCenterActiveCard) {
    if (!workList) {
      return;
    }

    const nextView = view === 'carousel' ? 'carousel' : 'list';
    const isCarousel = nextView === 'carousel';
    const isCurrentCarousel = workList.classList.contains('work-list--carousel');
    const shouldAnimateViewChange = shouldCenterActiveCard && (isCarousel !== isCurrentCarousel) && caseCards.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const previousRects = shouldAnimateViewChange ? getCaseCardRects() : null;

    workList.classList.toggle('work-list--carousel', isCarousel);
    if (workCarouselShell) {
      workCarouselShell.classList.toggle('is-carousel', isCarousel);
    }

    workViewButtons.forEach(function (button) {
      const isActive = button.getAttribute('data-work-view') === nextView;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });

    if (isCarousel && shouldCenterActiveCard) {
      const activeCard = workList.querySelector('.case-card.is-active') || caseCards[0];
      if (activeCard) {
        workList.scrollLeft = getCenteredCaseCardScrollLeft(activeCard);
      }
    } else if (!isCarousel) {
      workList.scrollLeft = 0;
    }

    setActiveCaseCard();
    updateCarouselArrows();

    if (previousRects) {
      animateWorkViewChange(previousRects, isCarousel ? 'carousel' : 'list');
    }
  }

  function getCaseCardRects() {
    const rects = new Map();
    caseCards.forEach(function (card) {
      rects.set(card, card.getBoundingClientRect());
    });
    return rects;
  }

  function getCenteredCaseCardScrollLeft(card) {
    if (!workList || !card) {
      return 0;
    }

    const maxScroll = Math.max(0, workList.scrollWidth - workList.clientWidth);
    const targetLeft = card.offsetLeft - ((workList.clientWidth - card.offsetWidth) / 2);
    return Math.max(0, Math.min(maxScroll, targetLeft));
  }

  function animateWorkViewChange(previousRects, nextView) {
    if (!workList || !previousRects) {
      return;
    }

    const easing = 'cubic-bezier(0.32, 0, 0.18, 1)';
    const transitionDirection = nextView === 'list' ? 1 : -1;
    const maxDelay = Math.max(0, (caseCards.length - 1) * WORK_VIEW_TRANSITION_STAGGER);

    isWorkViewTransitioning = true;
    workList.classList.add('is-view-transitioning');

    caseCards.forEach(function (card, index) {
      const first = previousRects.get(card);
      const last = card.getBoundingClientRect();

      if (!first || !last) {
        return;
      }

      const deltaX = first.left - last.left;
      const deltaY = first.top - last.top;
      const delayIndex = transitionDirection > 0 ? index : (caseCards.length - 1 - index);
      const delay = delayIndex * WORK_VIEW_TRANSITION_STAGGER;
      card.style.transition = 'none';
      card.style.opacity = '0.72';
      card.style.transform = 'translate(' + deltaX.toFixed(2) + 'px, ' + deltaY.toFixed(2) + 'px)';
      card.style.setProperty('--view-transition-delay', delay + 'ms');
    });

    window.requestAnimationFrame(function () {
      caseCards.forEach(function (card) {
        const delay = card.style.getPropertyValue('--view-transition-delay') || '0ms';
        card.style.transition = 'transform ' + WORK_VIEW_TRANSITION_DURATION + 'ms ' + easing + ' ' + delay;
        card.style.opacity = '';
        card.style.transform = 'translate(0, 0)';
      });
    });

    window.setTimeout(function () {
      caseCards.forEach(function (card) {
        card.style.transition = '';
        card.style.transform = '';
        card.style.opacity = '';
        card.style.removeProperty('--view-transition-delay');
      });
      workList.classList.remove('is-view-transitioning');
      isWorkViewTransitioning = false;
      setActiveCaseCard();
      updateCarouselArrows();
    }, WORK_VIEW_TRANSITION_DURATION + maxDelay + 80);
  }

  function setActiveCaseCard() {
    if (!caseCards.length || !workList) {
      return;
    }

    const isCarousel = workList.classList.contains('work-list--carousel');
    const viewportCenter = window.innerHeight * 0.5;
    const carouselCenter = (function () {
      if (!isCarousel) {
        return 0;
      }
      const rect = workList.getBoundingClientRect();
      return rect.left + (rect.width / 2);
    })();

    let activeCard = caseCards[0];
    let closestDistance = Number.POSITIVE_INFINITY;

    caseCards.forEach(function (card) {
      const rect = card.getBoundingClientRect();
      const cardCenter = isCarousel
        ? rect.left + (rect.width / 2)
        : rect.top + (rect.height / 2);
      const targetCenter = isCarousel ? carouselCenter : viewportCenter;
      const distance = Math.abs(cardCenter - targetCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        activeCard = card;
      }
    });

    caseCards.forEach(function (card) {
      card.classList.toggle('is-active', card === activeCard);
    });
  }

  function activateCaseCard(card) {
    if (!card) {
      return;
    }

    caseCards.forEach(function (caseCard) {
      caseCard.classList.toggle('is-active', caseCard === card);
    });
  }

  function animateCarouselScroll(targetLeft, duration, onApproachComplete, onComplete) {
    if (!workList) {
      return;
    }

    if (carouselScrollFrame) {
      window.cancelAnimationFrame(carouselScrollFrame);
      carouselScrollFrame = null;
    }

    workList.classList.add('is-animating');

    const startLeft = workList.scrollLeft;
    const maxScroll = Math.max(0, workList.scrollWidth - workList.clientWidth);
    const clampedTarget = Math.max(0, Math.min(maxScroll, targetLeft));
    const distance = clampedTarget - startLeft;

    if (Math.abs(distance) < 1) {
      workList.scrollLeft = clampedTarget;
      workList.classList.remove('is-animating');
      if (typeof onApproachComplete === 'function') {
        onApproachComplete();
      }
      if (typeof onComplete === 'function') {
        onComplete();
      }
      return;
    }

    const startTime = performance.now();
    let approachCompleteCalled = false;

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      workList.scrollLeft = startLeft + (distance * eased);

      if (!approachCompleteCalled && progress >= CAROUSEL_ACTIVE_PROGRESS) {
        approachCompleteCalled = true;
        if (typeof onApproachComplete === 'function') {
          onApproachComplete();
        }
      }

      if (progress < 1) {
        carouselScrollFrame = window.requestAnimationFrame(step);
      } else {
        carouselScrollFrame = null;
        workList.classList.remove('is-animating');
        if (typeof onComplete === 'function') {
          onComplete();
        }
      }
    }

    carouselScrollFrame = window.requestAnimationFrame(step);
  }

  function centerCaseCard(card, duration, onApproachComplete, onComplete) {
    if (!card) {
      return;
    }

    if (workList && workList.classList.contains('work-list--carousel')) {
      animateCarouselScroll(getCenteredCaseCardScrollLeft(card), duration || CAROUSEL_SLIDE_DURATION, onApproachComplete, onComplete);
      return;
    }

    card.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
  }

  function moveCarouselToCard(targetCard) {
    if (!targetCard) {
      return;
    }

    if (!workList || !workList.classList.contains('work-list--carousel')) {
      centerCaseCard(targetCard);
      return;
    }

    if (targetCard.classList.contains('is-active')) {
      return;
    }

    suppressCarouselActiveSync = true;
    centerCaseCard(targetCard, CAROUSEL_SLIDE_DURATION, function () {
      activateCaseCard(targetCard);
      updateCarouselArrows();
    }, function () {
      suppressCarouselActiveSync = false;
      setActiveCaseCard();
      updateCarouselArrows();
    });
  }

  function updateCarouselArrows() {
    if (!workList || !workArrowPrev || !workArrowNext) {
      return;
    }

    const isCarousel = workList.classList.contains('work-list--carousel');
    if (!isCarousel) {
      workArrowPrev.classList.add('is-hidden');
      workArrowNext.classList.add('is-hidden');
      return;
    }

    const maxScroll = Math.max(0, workList.scrollWidth - workList.clientWidth);
    const left = workList.scrollLeft;
    const nearStart = left <= 8;
    const nearEnd = left >= (maxScroll - 8);

    workArrowPrev.classList.toggle('is-hidden', nearStart || maxScroll <= 0);
    workArrowNext.classList.toggle('is-hidden', nearEnd || maxScroll <= 0);
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
  applyWorkView(getPreferredWorkView(), false);
  setActiveCaseCard();
  updateCarouselArrows();
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

    if (workList) {
      workList.addEventListener('scroll', function () {
        if (workList.classList.contains('work-list--carousel')) {
          if (!suppressCarouselActiveSync && !isWorkViewTransitioning) {
            setActiveCaseCard();
          }
          updateCarouselArrows();
        }
      }, { passive: true });
    }

  caseCards.forEach(function (card) {
    card.addEventListener('click', function (event) {
      if (!card.classList.contains('is-active')) {
        event.preventDefault();
        moveCarouselToCard(card);
      }
    });
  });

  function scrollCarousel(direction) {
    if (!workList || !workList.classList.contains('work-list--carousel')) {
      return;
    }

    const activeCard = workList.querySelector('.case-card.is-active') || caseCards[0];
    const currentIndex = caseCards.indexOf(activeCard);
    const targetIndex = Math.max(0, Math.min(caseCards.length - 1, currentIndex + direction));
    const targetCard = caseCards[targetIndex];

    if (!targetCard || targetCard === activeCard) {
      return;
    }

    moveCarouselToCard(targetCard);
  }

  if (workArrowPrev) {
    workArrowPrev.addEventListener('click', function () {
      scrollCarousel(-1);
    });
  }

  if (workArrowNext) {
    workArrowNext.addEventListener('click', function () {
      scrollCarousel(1);
    });
  }

  workViewButtons.forEach(function (button) {
    button.addEventListener('click', function () {
      const view = button.getAttribute('data-work-view');
      applyWorkView(view, true);
      window.localStorage.setItem(WORK_VIEW_KEY, view);
    });
  });

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

  const caseStudyImageCards = Array.from(document.querySelectorAll('.cs-img'));
  let lightbox = null;
  let lightboxImage = null;

  function ensureLightbox() {
    if (lightbox) {
      return;
    }

    lightbox = document.createElement('div');
    lightbox.className = 'cs-lightbox';
    lightbox.setAttribute('aria-hidden', 'true');

    const closeButton = document.createElement('button');
    closeButton.className = 'cs-lightbox-close';
    closeButton.type = 'button';
    closeButton.setAttribute('aria-label', 'Close image');
    closeButton.textContent = '×';

    lightboxImage = document.createElement('img');
    lightboxImage.alt = '';

    lightbox.appendChild(closeButton);
    lightbox.appendChild(lightboxImage);
    document.body.appendChild(lightbox);

    closeButton.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', function (event) {
      if (event.target === lightbox) {
        closeLightbox();
      }
    });
  }

  function openLightbox(image) {
    if (!image) {
      return;
    }

    ensureLightbox();
    lightboxImage.src = image.currentSrc || image.src;
    lightboxImage.alt = image.alt || '';
    lightbox.classList.add('is-open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    if (!lightbox) {
      return;
    }

    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  caseStudyImageCards.forEach(function (card) {
    const image = card.querySelector('img');
    if (!image) {
      return;
    }

    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', image.alt ? 'Open image: ' + image.alt : 'Open image');

    card.addEventListener('click', function () {
      openLightbox(image);
    });

    card.addEventListener('keydown', function (event) {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openLightbox(image);
      }
    });
  });

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
      closeLightbox();
    }
  });

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
     Case card hover - subtle
     lift on metrics
     ------------------------- */
})();
