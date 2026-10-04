/**
 * Lumen landing page – interactions
 * ---------------------------------
 * - Dark / light theme toggle (persisted in localStorage)
 * - Mobile navigation menu
 * - Header shadow + active nav link on scroll
 * - Monthly / yearly pricing toggle
 * - FAQ accordion
 * - Contact form client-side validation
 * - Scroll reveal animations
 */
(function () {
  'use strict';

  const root = document.documentElement;
  root.classList.add('js');

  /* ---------------------------------------------------------------------
   * Theme toggle
   * ------------------------------------------------------------------- */
  const THEME_KEY = 'lumen-theme';
  const themeToggle = document.getElementById('theme-toggle');

  function setTheme(theme) {
    root.dataset.theme = theme;
    localStorage.setItem(THEME_KEY, theme);
    themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }

  themeToggle.addEventListener('click', () => {
    setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');
  });
  themeToggle.setAttribute('aria-label', root.dataset.theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');

  /* ---------------------------------------------------------------------
   * Mobile navigation
   * ------------------------------------------------------------------- */
  const nav = document.getElementById('nav');
  const navToggle = document.getElementById('nav-toggle');

  function setNavOpen(open) {
    nav.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('nav-open', open);
  }

  navToggle.addEventListener('click', () => setNavOpen(!nav.classList.contains('is-open')));

  // Close the menu after choosing a link, on Escape, or when resizing to desktop.
  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) setNavOpen(false);
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      setNavOpen(false);
      navToggle.focus();
    }
  });
  window.matchMedia('(min-width: 861px)').addEventListener('change', (e) => {
    if (e.matches) setNavOpen(false);
  });

  /* ---------------------------------------------------------------------
   * Header state + active section highlighting
   * ------------------------------------------------------------------- */
  const header = document.getElementById('header');
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const navLinks = document.querySelectorAll('.nav__link');
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        navLinks.forEach((link) => {
          link.classList.toggle('is-active', link.getAttribute('href') === `#${entry.target.id}`);
        });
      });
    },
    { rootMargin: '-45% 0px -50% 0px' },
  );
  document.querySelectorAll('main section[id]').forEach((section) => sectionObserver.observe(section));

  /* ---------------------------------------------------------------------
   * Pricing toggle
   * ------------------------------------------------------------------- */
  const billingSwitch = document.getElementById('billing-switch');
  const periodLabels = document.querySelectorAll('[data-period-label]');
  const plans = document.querySelectorAll('.plan');

  function setBilling(period) {
    const yearly = period === 'yearly';
    billingSwitch.setAttribute('aria-checked', String(yearly));
    billingSwitch.setAttribute('aria-label', yearly ? 'Switch to monthly billing' : 'Switch to yearly billing');
    periodLabels.forEach((label) => label.classList.toggle('is-active', label.dataset.periodLabel === period));

    plans.forEach((plan) => {
      const amount = plan.querySelector('.plan__amount');
      const billed = plan.querySelector('[data-billed]');
      const price = Number(amount.dataset[period]);

      // Brief fade so the price change is noticeable.
      amount.classList.add('is-changing');
      setTimeout(() => {
        amount.textContent = `$${price}`;
        amount.classList.remove('is-changing');
      }, 150);

      if (price === 0) billed.textContent = 'Free forever';
      else billed.textContent = yearly ? `Billed yearly ($${price * 12}/year)` : 'Billed monthly';
    });
  }

  billingSwitch.addEventListener('click', () => {
    setBilling(billingSwitch.getAttribute('aria-checked') === 'true' ? 'monthly' : 'yearly');
  });
  // Clicking the labels also switches the period.
  periodLabels.forEach((label) => {
    label.style.cursor = 'pointer';
    label.addEventListener('click', () => setBilling(label.dataset.periodLabel));
  });

  /* ---------------------------------------------------------------------
   * FAQ accordion (one item open at a time)
   * ------------------------------------------------------------------- */
  const faqButtons = document.querySelectorAll('.faq__question');

  faqButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const item = button.closest('.faq__item');
      const willOpen = !item.classList.contains('is-open');

      faqButtons.forEach((other) => {
        other.setAttribute('aria-expanded', 'false');
        other.closest('.faq__item').classList.remove('is-open');
      });

      item.classList.toggle('is-open', willOpen);
      button.setAttribute('aria-expanded', String(willOpen));
    });
  });

  /* ---------------------------------------------------------------------
   * Contact form validation
   * ------------------------------------------------------------------- */
  const form = document.getElementById('contact-form');
  const success = document.getElementById('form-success');
  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  /** Rules return an error message, or an empty string when valid. */
  const rules = {
    name: (v) => (v.trim().length >= 2 ? '' : 'Please enter your full name.'),
    email: (v) => {
      if (!v.trim()) return 'Please enter your email address.';
      return EMAIL_RE.test(v.trim()) ? '' : 'Please enter a valid email address.';
    },
    company: () => '',
    message: (v) => {
      const len = v.trim().length;
      if (!len) return 'Please write a message.';
      return len >= 20 ? '' : `Message must be at least 20 characters (${20 - len} more).`;
    },
    consent: (_v, field) => (field.checked ? '' : 'Please confirm you agree to be contacted.'),
  };

  function errorElementFor(field) {
    return field.type === 'checkbox'
      ? form.querySelector(`[data-for="${field.name}"]`)
      : field.closest('.form__field').querySelector('.form__error');
  }

  function validateField(field) {
    const rule = rules[field.name];
    if (!rule) return true;
    const message = rule(field.value, field);
    const errorEl = errorElementFor(field);

    errorEl.textContent = message;
    field.classList.toggle('is-invalid', Boolean(message));
    field.classList.toggle('is-valid', !message && field.type !== 'checkbox' && field.value.trim() !== '');
    field.setAttribute('aria-invalid', String(Boolean(message)));
    if (errorEl.id === '') errorEl.id = `${field.name}-error`;
    field.setAttribute('aria-describedby', errorEl.id);
    return !message;
  }

  // Validate on blur, then live once a field has been marked invalid.
  form.querySelectorAll('input, textarea').forEach((field) => {
    field.addEventListener('blur', () => validateField(field));
    field.addEventListener('input', () => {
      if (field.classList.contains('is-invalid')) validateField(field);
    });
    field.addEventListener('change', () => {
      if (field.type === 'checkbox') validateField(field);
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    success.hidden = true;

    const fields = [...form.elements].filter((el) => el.name && rules[el.name]);
    const results = fields.map(validateField);
    const firstInvalid = fields[results.indexOf(false)];

    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    // Demo only: simulate sending. Replace with a real endpoint (e.g. Formspree) if needed.
    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    setTimeout(() => {
      form.reset();
      fields.forEach((field) => field.classList.remove('is-valid'));
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send message';
      success.hidden = false;
    }, 800);
  });

  /* ---------------------------------------------------------------------
   * Scroll reveal
   * ------------------------------------------------------------------- */
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 },
  );
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

  /* ---------------------------------------------------------------------
   * Footer year
   * ------------------------------------------------------------------- */
  document.getElementById('year').textContent = new Date().getFullYear();
})();
