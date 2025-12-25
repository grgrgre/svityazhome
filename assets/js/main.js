// Shared utilities and interactions for SvityazHOME
(async function () {
  const fetchPartial = async (path) => {
    try {
      const res = await fetch(path, { cache: 'no-cache' });
      if (!res.ok) return '';
      return await res.text();
    } catch (err) {
      return '';
    }
  };

  const ensurePartials = async () => {
    const inject = (selector, html, position) => {
      if (!html) return;
      const template = document.createElement('div');
      template.innerHTML = html.trim();
      const node = template.firstElementChild;
      if (!node) return;

      const existing = document.querySelector(selector);
      if (existing) {
        existing.replaceWith(node);
      } else {
        if (position === 'start') {
          document.body.insertAdjacentElement('afterbegin', node);
        } else {
          document.body.insertAdjacentElement('beforeend', node);
        }
      }
    };

    const [headerHtml, footerHtml] = await Promise.all([
      fetchPartial('/assets/partials/header.html'),
      fetchPartial('/assets/partials/footer.html'),
    ]);

    inject('.site-header', headerHtml, 'start');
    inject('.site-footer', footerHtml, 'end');
  };

  await ensurePartials();

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Theme toggle (light/dark) */
  const THEME_STORAGE_KEY = 'svityazhome-theme';
  const root = document.documentElement;
  const colorSchemeQuery = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  const getStoredTheme = () => {
    try {
      const value = localStorage.getItem(THEME_STORAGE_KEY);
      return value === 'dark' || value === 'light' ? value : null;
    } catch (err) {
      return null;
    }
  };

  const setStoredTheme = (theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (err) {
      // ignore
    }
  };

  let storedTheme = getStoredTheme();

  const getSystemTheme = () => (colorSchemeQuery && colorSchemeQuery.matches ? 'dark' : 'light');
  const getEffectiveTheme = () => storedTheme || getSystemTheme();
  const syncColorScheme = (theme) => {
    root.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
  };

  const applyTheme = () => {
    const theme = getEffectiveTheme();
    root.dataset.theme = theme;
    syncColorScheme(theme);
  };

  const updateThemeToggle = (btn) => {
    const theme = getEffectiveTheme();
    const isDark = theme === 'dark';
    const icon = btn.querySelector('.theme-toggle__icon');
    if (icon) icon.textContent = isDark ? '☾' : '☀';

    btn.setAttribute('aria-pressed', String(isDark));
    btn.setAttribute('aria-label', isDark ? 'Перемкнути на світлу тему' : 'Перемкнути на темну тему');
    btn.title = isDark ? 'Темна тема' : 'Світла тема';
  };

  const createThemeToggle = () => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'theme-toggle';
    btn.innerHTML =
      '<span class="theme-toggle__icon" aria-hidden="true"></span><span class="u-sr-only">Перемкнути тему</span>';

    btn.addEventListener('click', () => {
      const currentTheme = getEffectiveTheme();
      storedTheme = currentTheme === 'dark' ? 'light' : 'dark';
      setStoredTheme(storedTheme);
      applyTheme();
      updateThemeToggle(btn);
    });

    return btn;
  };

  const mountThemeToggle = () => {
    if ($('.theme-toggle')) return;

    const btn = createThemeToggle();
    updateThemeToggle(btn);

    const nav = $('.nav');
    const navToggleBtn = $('.nav-toggle');

    if (nav) {
      if (navToggleBtn && nav.contains(navToggleBtn)) {
        nav.insertBefore(btn, navToggleBtn);
      } else {
        nav.appendChild(btn);
      }
      return;
    }

    btn.classList.add('theme-toggle--floating');
    document.body.appendChild(btn);
  };

  applyTheme();
  mountThemeToggle();

  const handleSystemThemeChange = () => {
    if (storedTheme) return;
    applyTheme();
    const btn = $('.theme-toggle');
    if (btn) updateThemeToggle(btn);
  };

  if (colorSchemeQuery && typeof colorSchemeQuery.addEventListener === 'function') {
    colorSchemeQuery.addEventListener('change', handleSystemThemeChange);
  } else if (colorSchemeQuery && typeof colorSchemeQuery.addListener === 'function') {
    colorSchemeQuery.addListener(handleSystemThemeChange);
  }

  /* Sticky header + active nav */
  const header = $('.site-header');
  const navToggle = $('.nav-toggle');
  const navLinks = $('.nav__links');
  const currentPage = document.body.dataset.page;
  let lightbox;

  const syncBodyLock = () => {
    const navOpen = navLinks && navLinks.classList.contains('is-open');
    const lightboxOpen = lightbox && lightbox.classList.contains('is-open');
    document.body.classList.toggle('is-locked', Boolean(navOpen || lightboxOpen));
  };

  const setActiveNav = () => {
    $$('[data-nav]').forEach((link) => {
      link.classList.toggle('is-active', link.dataset.nav === currentPage);
    });
  };

  const handleScrollHeader = () => {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  };

  setActiveNav();
  handleScrollHeader();
  window.addEventListener('scroll', handleScrollHeader, { passive: true });

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(isOpen));
      syncBodyLock();
    });
    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !navToggle.contains(e.target)) {
        navLinks.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        syncBodyLock();
      }
    });
    navLinks.addEventListener('click', (e) => {
      if (e.target.closest('.nav__link')) {
        navLinks.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
        syncBodyLock();
      }
    });
  }

  /* Scroll reveal using IntersectionObserver */
  const srItems = $$('[data-sr]');
  if (prefersReducedMotion) {
    srItems.forEach((el) => el.classList.add('is-visible'));
  } else if (srItems.length) {
    const srObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target;
            const delay = el.dataset.srDelay ? Number(el.dataset.srDelay) : 0;
            el.style.transitionDelay = `${delay}ms`;
            el.classList.add('is-visible');
            srObserver.unobserve(el);
          }
        });
      },
      { threshold: 0.18 }
    );
    srItems.forEach((el) => srObserver.observe(el));
  }

  /* Lightbox for gallery */
  const ensureLightbox = () => {
    if (lightbox) return lightbox;
    lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.innerHTML = `
      <div class="lightbox__inner" role="dialog" aria-modal="true">
        <button class="lightbox__close" aria-label="Закрити">&times;</button>
        <img class="lightbox__img" alt="">
        <div class="lightbox__caption"></div>
      </div>`;
    document.body.appendChild(lightbox);
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox || e.target.classList.contains('lightbox__close')) closeLightbox();
    });
    document.addEventListener('keydown', (e) => e.key === 'Escape' && closeLightbox());
    return lightbox;
  };

  const openLightbox = (src, alt = '') => {
    const lb = ensureLightbox();
    $('.lightbox__img', lb).src = src;
    $('.lightbox__img', lb).alt = alt;
    $('.lightbox__caption', lb).textContent = alt;
    lb.classList.add('is-open');
    lb.setAttribute('aria-hidden', 'false');
    syncBodyLock();
  };

  const closeLightbox = () => {
    if (lightbox) {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      syncBodyLock();
    }
  };

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('.js-lightbox');
    if (!trigger) return;
    e.preventDefault();
    const src = trigger.dataset.src || trigger.src;
    const alt = trigger.dataset.caption || trigger.alt || '';
    if (src) openLightbox(src, alt);
  });

  /* Rooms filter */
  const capacitySelect = $('#filterCapacity');
  const typeSelect = $('#filterType');
  const roomCards = $$('.room-card[data-capacity]');
  const emptyState = $('#roomsEmpty');

  const applyRoomFilter = () => {
    if (!roomCards.length) return;
    const cap = capacitySelect ? capacitySelect.value : 'all';
    const type = typeSelect ? typeSelect.value : 'all';
    let visibleCount = 0;

    roomCards.forEach((card) => {
      const cardCap = card.dataset.capacity;
      const cardType = card.dataset.type;
      const capMatch = cap === 'all' || cap === cardCap;
      const typeMatch = type === 'all' || type === cardType;
      const show = capMatch && typeMatch;
      card.style.display = show ? '' : 'none';
      if (show) visibleCount += 1;
    });

    if (emptyState) emptyState.style.display = visibleCount ? 'none' : 'block';
  };

  if (capacitySelect) capacitySelect.addEventListener('change', applyRoomFilter);
  if (typeSelect) typeSelect.addEventListener('change', applyRoomFilter);
  applyRoomFilter();

  /* Booking form */
  const bookingForm = $('#bookingForm');
  const bookingMessage = $('#bookingMessage');
  const summaryList = $('#bookingSummary');

  const todayISO = new Date().toISOString().split('T')[0];
  $$('input[type="date"]').forEach((input) => input.setAttribute('min', todayISO));

  const updateSummary = () => {
    if (!summaryList || !bookingForm) return;
    const data = new FormData(bookingForm);
    const items = [
      ['Імʼя', data.get('name')],
      ['Email', data.get('email')],
      ['Телефон', data.get('phone')],
      ['Заїзд', data.get('checkin')],
      ['Виїзд', data.get('checkout')],
      ['Гості', data.get('guests')],
      ['Тип номера', data.get('roomType')],
      ['Додатково', data.get('extras')],
      ['Коментар', data.get('notes')],
    ];
    summaryList.innerHTML = items
      .map(([label, value]) => `<li><strong>${label}:</strong> ${value || '—'}</li>`)
      .join('');
  };

  if (bookingForm) {
    bookingForm.addEventListener('input', updateSummary);
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (bookingMessage) {
        bookingMessage.textContent = '';
        bookingMessage.className = 'message';
      }

      const data = new FormData(bookingForm);
      if (data.get('_gotcha')) return; // honeypot

      const required = ['name', 'email', 'phone', 'checkin', 'checkout', 'guests', 'roomType'];
      const missing = required.filter((field) => !data.get(field));

      const checkin = new Date(data.get('checkin'));
      const checkout = new Date(data.get('checkout'));
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (missing.length) {
        if (bookingMessage) {
          bookingMessage.textContent = 'Будь ласка, заповніть усі обовʼязкові поля.';
          bookingMessage.classList.add('error');
        }
        return;
      }

      if (checkin < today) {
        if (bookingMessage) {
          bookingMessage.textContent = 'Дата заїзду не може бути в минулому.';
          bookingMessage.classList.add('error');
        }
        return;
      }

      if (checkout <= checkin) {
        if (bookingMessage) {
          bookingMessage.textContent = 'Дата виїзду має бути пізніше заїзду.';
          bookingMessage.classList.add('error');
        }
        return;
      }

      if (bookingMessage) {
        bookingMessage.textContent = 'Надсилаємо заявку...';
        bookingMessage.classList.remove('error');
      }

      try {
        const response = await fetch(bookingForm.action, {
          method: 'POST',
          body: data,
          headers: { Accept: 'application/json' },
        });

        if (response.ok) {
          if (bookingMessage) {
            bookingMessage.textContent = 'Дякуємо! Ми отримали запит і звʼяжемося з вами протягом 30 хвилин.';
            bookingMessage.classList.remove('error');
          }
          bookingForm.reset();
          updateSummary();
        } else {
          throw new Error('Formspree error');
        }
      } catch (err) {
        if (bookingMessage) {
          bookingMessage.textContent = 'Не вдалося надіслати. Спробуйте ще раз або напишіть нам напряму.';
          bookingMessage.classList.add('error');
        }
      }
    });
    updateSummary();
  }
})();

// Simple service worker registration to cache key pages/assets for faster navigation
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('Service worker registration failed', err);
    });
  });
}
