/**
 * main.js — Portfolio Site JavaScript
 *
 * Features:
 *   1. Sticky nav — adds scrolled class for shadow
 *   2. Active nav link highlighting based on scroll position
 *   3. Mobile drawer menu (hamburger toggle + overlay)
 *   4. Smooth scroll for all anchor links
 *   5. Scroll-reveal animations (IntersectionObserver)
 *   6. Portfolio filter buttons
 *   7. Contact form handler (with basic validation)
 *   8. Footer year update
 */

'use strict';

/* --------------------------------------------------------------------------
   Utility: Run callback when DOM is ready
   -------------------------------------------------------------------------- */
function ready(fn) {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}


/* --------------------------------------------------------------------------
   0. Content Management System — Load content from JSON
   -------------------------------------------------------------------------- */
async function loadContent() {
  try {
    const response = await fetch('data/content.json');
    if (!response.ok) throw new Error('Content not found');
    const data = await response.json();

    const getValue = (path, obj) => {
      return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    // Populate keys
    document.querySelectorAll('[data-content-key]').forEach(el => {
      const path = el.getAttribute('data-content-key');
      const val = getValue(path, data);
      if (val !== undefined) el.innerHTML = val;
    });

    // Populate placeholders
    document.querySelectorAll('[data-content-placeholder]').forEach(el => {
      const path = el.getAttribute('data-content-placeholder');
      const val = getValue(path, data);
      if (val !== undefined) el.setAttribute('placeholder', val);
    });

    // Populate lists
    document.querySelectorAll('[data-content-list]').forEach(el => {
      const path = el.getAttribute('data-content-list');
      const val = getValue(path, data);
      if (!val) return;

      if (path === 'about.paragraphs') renderAboutParagraphs(el, val);
      if (path === 'about.tags') renderAboutTags(el, val);
      if (path === 'skills.items') renderSkills(el, val);
      if (path === 'education.items') renderEducation(el, val);
      if (path === 'portfolio.filters') renderPortfolioFilters(el, val);
      if (path === 'portfolio.projects') renderPortfolioProjects(el, val);
    });

    const portfolioSection = document.getElementById('portfolio');
    const portfolioNavLink = document.querySelector('[data-section="portfolio"]');

    if (!data.portfolio?.visible) {
      portfolioSection.style.display = 'none';
      if (portfolioNavLink) portfolioNavLink.style.display = 'none';
    }

    // Update mailto link
    const emailLink = document.querySelector('.contact__email');

    if (emailLink && data.contact?.email) {
      emailLink.href = `mailto:${data.contact.email}`;
    }

    // Update social links
    const socials = data.contact?.social;
    if (socials) {
      // if (socials.behance) document.querySelector('[aria-label="Behance profile"]').href = socials.behance;
      // if (socials.dribbble) document.querySelector('[aria-label="Dribbble profile"]').href = socials.dribbble;
      if (socials.linkedin) document.querySelector('[aria-label="LinkedIn profile"]').href = socials.linkedin;
      if (socials.instagram) document.querySelector('[aria-label="Instagram profile"]').href = socials.instagram;
    }

    // Re-init dynamic hooks
    initScrollReveal();
    initActiveNavLinks();
    initPortfolioFilter();

  } catch (err) {
    console.warn('Content fallback active:', err);
    initScrollReveal();
    initActiveNavLinks();
    initPortfolioFilter();
  }
}

function renderAboutParagraphs(container, data) {
  container.innerHTML = data.map(p => `<p class="about__paragraph">${p}</p>`).join('');
}

function renderAboutTags(container, data) {
  container.innerHTML = data.map(tag => `<span class="tag">${tag}</span>`).join('');
}

function renderSkills(container, data) {
  // We try to keep existing icons if matching by index, otherwise default
  const existingCards = Array.from(container.querySelectorAll('.skill-card'));
  container.innerHTML = data.map((item, i) => {
    const iconHtml = existingCards[i] ? existingCards[i].querySelector('.skill-card__icon').innerHTML : '';
    return `
      <article class="skill-card" data-aos>
        <div class="skill-card__icon" aria-hidden="true">${iconHtml}</div>
        <h3 class="skill-card__title">${item.title}</h3>
        <p class="skill-card__desc">${item.desc}</p>
        <ul class="skill-card__tags">
          ${item.tags.map(t => `<li>${t}</li>`).join('')}
        </ul>
      </article>
    `;
  }).join('');
}

function renderEducation(container, data) {
  container.innerHTML = data.map(item => `
    <article class="timeline-item" data-aos>
      <div class="timeline-item__marker" aria-hidden="true"></div>
      <div class="timeline-item__content">
        <div class="timeline-item__period">${item.period}</div>
        <h3 class="timeline-item__degree">${item.degree}</h3>
        <p class="timeline-item__school">${item.school}</p>
        <p class="timeline-item__detail">${item.detail}</p>
        <div class="timeline-item__highlights">
          ${item.highlights.map(h => `<span class="highlight-badge">${h}</span>`).join('')}
        </div> 
      </div>
    </article>
  `).join('');
}

function renderPortfolioFilters(container, data) {
  container.innerHTML = Object.entries(data).map(([key, label], i) => `
    <button class="filter-btn ${i === 0 ? 'filter-btn--active' : ''}" data-filter="${key}">${label}</button>
  `).join('');
}

function renderPortfolioProjects(container, data) {
  container.innerHTML = data.map((proj, i) => `
    <article class="project-card" data-category="${proj.category}" data-aos>
      <div class="project-card__visual project-card__visual--${i + 1}" aria-hidden="true">
        <div class="project-card__overlay">
          <a href="${proj.url ?? '#'}" class="project-card__view-btn" aria-label="View project: ${proj.title}">
            ${proj.cta}
          </a>
        </div>
      </div>
      <div class="project-card__info">
        <span class="project-card__category">${proj.categoryLabel}</span>
        <h3 class="project-card__title">${proj.title}</h3>
        <p class="project-card__desc">${proj.desc}</p>
      </div>
    </article>
  `).join('');
}


/* --------------------------------------------------------------------------
   1. Sticky Navigation — Scrolled State
   -------------------------------------------------------------------------- */
function initStickyNav() {
  const header = document.getElementById('site-header');
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle('is-scrolled', window.scrollY > 24);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load
}


/* --------------------------------------------------------------------------
   2. Active Nav Link — Highlight based on section in view
   -------------------------------------------------------------------------- */
function initActiveNavLinks() {
  const navLinks = document.querySelectorAll('.nav-link[data-section]');
  if (!navLinks.length) return;

  const sections = Array.from(navLinks).map(link => {
    const id = link.getAttribute('data-section');
    return document.getElementById(id);
  }).filter(Boolean);

  const setActive = () => {
    let current = '';
    const threshold = window.innerHeight * 0.4; // Mid-top check

    sections.forEach(section => {
      const rect = section.getBoundingClientRect();
      // If the top of the section is above the threshold, it's potentially active
      if (rect.top <= threshold) {
        current = section.id;
      }
    });

    navLinks.forEach(link => {
      link.classList.toggle(
        'is-active',
        link.getAttribute('data-section') === current
      );
    });
  };

  window.addEventListener('scroll', setActive, { passive: true });
  setActive();
}


/* --------------------------------------------------------------------------
   3. Mobile Drawer Navigation
   -------------------------------------------------------------------------- */
function initMobileNav() {
  const toggle = document.getElementById('nav-toggle');
  const menu = document.getElementById('nav-menu');

  if (!toggle || !menu) return;

  const mobileQuery = window.matchMedia('(max-width: 639px)');
  const header = document.getElementById('site-header');

  function handleMediaChange(e) {
    if (e.matches) {
      document.body.appendChild(menu);
    } else {
      const navbar = header.querySelector('.navbar');
      if (navbar) navbar.appendChild(menu);
    }
  }

  mobileQuery.addEventListener('change', handleMediaChange);
  handleMediaChange(mobileQuery);

  const headerLi = document.createElement('li');
  headerLi.classList.add('drawer-header-li');
  headerLi.setAttribute('aria-hidden', 'true');

  headerLi.innerHTML =
    '<a href="#hero" class="drawer-brand" aria-label="Go to top">' +
    '<span class="logo-initials" aria-hidden="true">DF</span>' +
    '<span class="drawer-brand-name">Denise Fuellas</span>' +
    '</a>' +
    '<button type="button" class="drawer-close" aria-label="Close navigation menu">&#x2715;</button>';

  menu.insertBefore(headerLi, menu.firstChild);

  const closeBtn = headerLi.querySelector('.drawer-close');
  const drawerBrand = headerLi.querySelector('.drawer-brand');

  const overlay = document.createElement('div');
  overlay.classList.add('nav-overlay');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.appendChild(overlay);

  function openMenu() {
    menu.classList.add('is-open');
    overlay.classList.add('is-visible');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    closeBtn.focus();
  }

  function closeMenu() {
    menu.classList.remove('is-open');
    overlay.classList.remove('is-visible');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.classList.remove('is-open');
    document.body.style.overflow = '';
    toggle.focus();
  }

  toggle.addEventListener('click', openMenu);
  closeBtn.addEventListener('click', closeMenu);
  drawerBrand.addEventListener('click', closeMenu);
  overlay.addEventListener('click', closeMenu);

  menu.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      closeMenu();
    }
  });
}


/* --------------------------------------------------------------------------
   4. Smooth Scroll for Anchor Links
   -------------------------------------------------------------------------- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}


/* --------------------------------------------------------------------------
   5. Scroll-Reveal Animations (IntersectionObserver)
   -------------------------------------------------------------------------- */
function initScrollReveal() {
  const elements = document.querySelectorAll('[data-aos]');
  if (!elements.length) return;

  elements.forEach(el => el.classList.remove('is-visible'));

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    elements.forEach(el => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          const delay = entry.target.closest('[data-stagger]') ? i * 80 : 0;
          setTimeout(() => {
            entry.target.classList.add('is-visible');
          }, delay);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  elements.forEach(el => observer.observe(el));
}


/* --------------------------------------------------------------------------
   6. Portfolio Filter
   -------------------------------------------------------------------------- */
function initPortfolioFilter() {
  const container = document.querySelector('.portfolio__filters');
  if (!container) return;

  // Use event delegation for maximum reliability with dynamic content
  container.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    const filter = btn.getAttribute('data-filter');
    const buttons = container.querySelectorAll('.filter-btn');
    const cards = document.querySelectorAll('.project-card');

    // Update active UI
    buttons.forEach(b => b.classList.remove('filter-btn--active'));
    btn.classList.add('filter-btn--active');

    // Filter projects logic
    cards.forEach(card => {
      const category = card.getAttribute('data-category');
      const satisfies = filter === 'all' || category === filter;

      if (satisfies) {
        card.classList.remove('is-hidden');
        card.classList.remove('is-visible');
        requestAnimationFrame(() => {
          requestAnimationFrame(() => card.classList.add('is-visible'));
        });
      } else {
        card.classList.add('is-hidden');
      }
    });
  });
}


/* --------------------------------------------------------------------------
   7. Contact Form — Validation & Simulated Submit
   -------------------------------------------------------------------------- */

let recaptchaWidgetId;

window.onRecaptchaLoad = () => {
  recaptchaWidgetId = grecaptcha.render('recaptcha-widget', {
    sitekey: '6LfrNnQsAAAAANcCTz_tYes8zrHSHX3hwtCzyztj',
    size: 'invisible',
    callback: onRecaptchaSuccess,
  });
};

window.onRecaptchaSuccess = async (token) => {
  const form = document.getElementById('contact-form');
  const statusEl = document.getElementById('form-status');
  const submitBtn = form.querySelector('#form-submit');
  const nameEl = form.querySelector('#name');
  const emailEl = form.querySelector('#email');
  const messageEl = form.querySelector('#message');

  const showStatus = (msg, type) => {
    statusEl.textContent = msg;
    statusEl.className = `form-status is-${type}`;
  };

  try {
    await emailjs.send('service_03jd196', 'template_6143c7i', {
      name: nameEl.value.trim(),
      email: emailEl.value.trim(),
      message: messageEl.value.trim(),
      'g-recaptcha-response': token,
    });

    showStatus('Message sent! ✨', 'success');
    form.reset();
  } catch (err) {
    console.error('EmailJS error:', err);
    showStatus('Something went wrong. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Send';
    grecaptcha.reset(recaptchaWidgetId);
  }
};

function initContactForm() {
  const form = document.getElementById('contact-form');
  const statusEl = document.getElementById('form-status');
  if (!form) return;

  emailjs.init({ publicKey: "BWTpdL9ALB0zuBanA" });

  const showStatus = (msg, type) => {
    statusEl.textContent = msg;
    statusEl.className = `form-status is-${type}`;
  };

  form.onsubmit = (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('#form-submit');
    const nameEl = form.querySelector('#name');
    const emailEl = form.querySelector('#email');
    const messageEl = form.querySelector('#message');

    if (!nameEl.value.trim()) { showStatus('Please enter your name.', 'error'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailEl.value.trim())) { showStatus('Valid email please.', 'error'); return; }
    if (!messageEl.value.trim()) { showStatus('Please write a message.', 'error'); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    grecaptcha.execute(recaptchaWidgetId);
  };
}



/* --------------------------------------------------------------------------
   8. Footer — Current Year
   -------------------------------------------------------------------------- */
function initFooterYear() {
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}


/* --------------------------------------------------------------------------
   Init — Wire everything up
   -------------------------------------------------------------------------- */
ready(() => {
  initStickyNav();
  initMobileNav();
  initSmoothScroll();
  initFooterYear();
  initContactForm();
  initActiveNavLinks();
  initPortfolioFilter();

  // Load dynamic content
  loadContent();
});
