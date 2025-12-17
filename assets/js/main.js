// Shared utilities and interactions for SvityazHOME
(function () {
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Sticky header + active nav */
  const header = $('.site-header');
  const navToggle = $('.nav-toggle');
  const navLinks = $('.nav__links');
  const currentPage = document.body.dataset.page;

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
    });
    document.addEventListener('click', (e) => {
      if (!navLinks.contains(e.target) && !navToggle.contains(e.target)) {
        navLinks.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
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
  let lightbox;
  const ensureLightbox = () => {
    if (lightbox) return lightbox;
    lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
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
  };

  const closeLightbox = () => {
    if (lightbox) lightbox.classList.remove('is-open');
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
