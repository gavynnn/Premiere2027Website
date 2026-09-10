/* Shared interactions for the local static site. No scroll hijacking. */
(() => {
  'use strict';
  const page = document.body;
  page.classList.add('js-enabled');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const header = document.querySelector('.site-header');
  const menu = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#main-nav');
  const mobile = window.matchMedia('(max-width: 760px)');
  const compactNavigation = window.matchMedia('(max-width: 980px)');
  const scrollCue = document.getElementById('scrollCue');
  const t = (key, replacements) => window.PREMIERE_I18N.t(key, replacements);

  function setMenu(open, returnFocus = false) {
    if (!menu || !nav) return;
    menu.setAttribute('aria-expanded', String(open));
    header.classList.toggle('menu-open', open);
    nav.inert = compactNavigation.matches && !open;
    if (returnFocus) menu.focus();
  }
  menu?.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') setMenu(false, true);
  });
  document.addEventListener('click', (event) => {
    if (header && !header.contains(event.target)) setMenu(false);
  });
  header?.addEventListener('focusout', (event) => {
    if (event.relatedTarget && !header.contains(event.relatedTarget)) setMenu(false);
  });
  compactNavigation.addEventListener('change', () => setMenu(false));
  setMenu(false);

  // Keep preview and download on the same language. Empty URLs stay coming soon.
  function renderDocuments() {
    const language = window.PREMIERE_I18N.language;
    document.querySelectorAll('[data-document]').forEach((card) => {
      const kind = card.dataset.document;
      const config = window.PREMIERE_DOCUMENTS?.[kind];
      const settings = config?.[language] || config;
      let url = null;
      try {
        if (settings?.url) url = new URL(settings.url, window.location.href);
      } catch { /* Invalid or missing URLs render the placeholder. */ }
      if (url && !['http:', 'https:', 'file:'].includes(url.protocol)) url = null;
      const preview = card.querySelector('.document-preview');
      const placeholder = card.querySelector('.document-placeholder');
      const download = card.querySelector('.document-download');
      const open = card.querySelector('.document-open');
      let frame = preview.querySelector('iframe');

      card.classList.toggle('document-ready', Boolean(url));
      placeholder.hidden = Boolean(url);
      download.hidden = !url;
      open.hidden = !url;
      card.querySelector('.document-pending').hidden = Boolean(url);
      if (!url) {
        frame?.remove();
        download.removeAttribute('href');
        open.removeAttribute('href');
        card.querySelector('.document-status').textContent = t(kind + '.pending');
        return;
      }
      if (!frame) {
        frame = document.createElement('iframe');
        frame.className = 'pdf-frame';
        frame.loading = 'lazy';
        preview.append(frame);
      }
      frame.title = t('document.previewTitle', { name: t(kind + '.name') });
      const source = url.href + (url.hash ? '' : '#view=FitH');
      if (frame.src !== source) frame.src = source;
      download.href = url.href;
      download.download = settings.filename || '';
      open.href = url.href;
      card.querySelector('.document-status').textContent = t('document.ready');
    });
  }
  renderDocuments();

  // Friendly, accessible feedback for forms that have not been supplied yet.
  const notice = document.createElement('div');
  notice.className = 'site-notice';
  notice.setAttribute('role', 'status');
  notice.setAttribute('aria-live', 'polite');
  page.append(notice);
  let noticeTimer;
  function showNotice(message) {
    notice.textContent = message;
    notice.classList.add('notice-visible');
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => notice.classList.remove('notice-visible'), 4500);
  }
  document.querySelectorAll('.competition-card').forEach((card) => {
    if (card.getAttribute('href') !== '#') {
      card.target = '_blank';
      card.rel = 'noopener noreferrer';
      return;
    }
    card.addEventListener('click', (event) => {
      event.preventDefault();
      const title = card.querySelector('h2');
      const name = title.innerHTML.replace(/<br\s*\/?\s*>/gi, ' ').replace(/<[^>]+>/g, '').trim();
      showNotice(t('form.soon', { name }));
    });
  });

  let navigating = false;
  let navigationTimer;
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented || event.button !== 0 ||
        event.metaKey || event.ctrlKey || event.shiftKey || event.altKey ||
        link.hasAttribute('download') || (link.target && link.target !== '_self')) return;
    const url = new URL(link.href, window.location.href);
    if (url.origin !== window.location.origin || !url.pathname.endsWith('.html')) return;
    setMenu(false);
    if (url.pathname === window.location.pathname || reducedMotion.matches) return;
    event.preventDefault();
    if (navigating) return;
    navigating = true;
    page.classList.add('is-leaving');
    navigationTimer = setTimeout(() => window.location.assign(url.href), 190);
  });
  window.addEventListener('pageshow', () => {
    clearTimeout(navigationTimer);
    navigating = false;
    page.classList.remove('is-leaving', 'page-entering');
    setMenu(false);
  });

  const comet = document.getElementById('comet');
  const route = document.getElementById('cometRoute');
  const track = document.querySelector('.comet-track');
  let routeLength = 0;
  let targetProgress = 0;
  let currentProgress = 0;
  let cometFrame = 0;
  let lastFrame = 0;
  let trackWidth = 1000;
  let trackHeight = 4000;

  function updateCometTarget() {
    if (!track || !routeLength) return;
    const rect = track.getBoundingClientRect();
    targetProgress = Math.min(1, Math.max(0,
      (window.innerHeight * .72 - rect.top) / (rect.height + window.innerHeight * .08)));
    if (!cometFrame) {
      lastFrame = 0;
      cometFrame = requestAnimationFrame(renderComet);
    }
  }
  function renderComet(time) {
    cometFrame = 0;
    if (!comet || !routeLength) return;
    const delta = lastFrame ? Math.min(50, time - lastFrame) : 16.67;
    lastFrame = time;
    const damping = reducedMotion.matches ? 1 : 1 - Math.exp(-delta / 175);
    currentProgress += (targetProgress - currentProgress) * damping;
    if (Math.abs(targetProgress - currentProgress) < .0001) currentProgress = targetProgress;
    const distance = routeLength * currentProgress;
    const point = route.getPointAtLength(distance);
    const before = route.getPointAtLength(Math.max(0, distance - 3));
    const after = route.getPointAtLength(Math.min(routeLength, distance + 3));
    // Use rendered SVG proportions so the tail points along the actual curve on phones too.
    const angle = Math.atan2((after.y - before.y) * trackHeight / 4000,
      (after.x - before.x) * trackWidth / 1000) * 180 / Math.PI;
    const scale = mobile.matches ? .64 : 1;
    comet.style.left = point.x / 10 + '%';
    comet.style.top = point.y / 40 + '%';
    comet.style.transform = 'translate(-50%, -50%) rotate(' + angle + 'deg) scale(' + scale + ')';
    if (currentProgress !== targetProgress) cometFrame = requestAnimationFrame(renderComet);
  }
  function measureComet() {
    if (!route || !track) return;
    routeLength = route.getTotalLength();
    trackWidth = track.clientWidth;
    trackHeight = track.clientHeight;
    updateCometTarget();
  }
  let scrollFrame = 0;
  function updateScroll() {
    scrollFrame = 0;
    header?.classList.toggle('is-scrolled', window.scrollY > 24);
    scrollCue?.classList.toggle('hidden', window.scrollY > 15);
    updateCometTarget();
  }
  window.addEventListener('scroll', () => {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScroll);
  }, { passive: true });
  window.addEventListener('resize', measureComet);
  document.fonts?.ready.then(measureComet);
  window.addEventListener('premiere:languagechange', () => {
    setMenu(false);
    renderDocuments();
    clearTimeout(noticeTimer);
    notice.classList.remove('notice-visible');
    requestAnimationFrame(measureComet);
  });
  measureComet();
  updateScroll();

  // Content is fully visible without JS; reveal only while motion is enabled.
  const revealTargets = document.querySelectorAll(
    '.journey-heading, .memory-panel, .timeline-header, .timeline-row, .section-heading, ' +
    '.document-card, .sponsors-head, .sponsor-placeholder, .ticket-announcement, .competition-card');
  let observer;
  if (!reducedMotion.matches && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        entry.target.classList.remove('reveal-pending');
        observer.unobserve(entry.target);
      }
    }, { threshold: .08, rootMargin: '0px 0px -24px 0px' });
    revealTargets.forEach((element, index) => {
      element.style.setProperty('--reveal-delay', ((index % 3) * 55) + 'ms');
      // Never conceal content already visible in the viewport.
      if (element.getBoundingClientRect().top > window.innerHeight) element.classList.add('reveal-pending');
      observer.observe(element);
    });
  } else {
    revealTargets.forEach((element) => element.classList.add('is-visible'));
  }
  reducedMotion.addEventListener('change', () => {
    if (reducedMotion.matches) {
      observer?.disconnect();
      revealTargets.forEach((element) => {
        element.classList.remove('reveal-pending');
        element.classList.add('is-visible');
      });
    }
    updateCometTarget();
  });
})();
