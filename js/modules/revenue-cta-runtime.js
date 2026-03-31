(function revenueCtaRuntime() {
  'use strict';

  var CONFIG = {
    flags: {
      enableSupportCta: true,
      enableQuoteCta: true,
      enableInternalLinkBridge: true,
      enableSaasCheckoutState: true,
      enableMobileNavToggle: true,
      showGithubSponsors: false,
      enableSaasCheckoutLive: false
    },
    routes: {
      quote: '/quote/',
      support: {
        kofi: 'https://ko-fi.com/pureflon',
        paypal: 'https://paypal.me/pureflon',
        githubSponsors: 'https://github.com/sponsors/pure-flon'
      }
    },
    deadHrefPatterns: [/PLACEHOLDER/i, /^javascript:/i],
    buyerIntentKeywords: [
      'ptfe', 'pfa', 'teflon', 'tube', 'tubing', 'semiconductor', 'medical',
      'chemical', 'manufactur', 'supplier', 'b2b', 'procurement', 'quote',
      'rfq', 'industrial', 'material'
    ],
    saasContextKeywords: ['ai', 'ops', 'automation', 'trading', 'crypto', 'dev', 'api']
  };

  var pathname = window.location.pathname || '/';
  var sourceSurface = detectSurface(pathname);
  var sourcePage = detectPage(pathname);

  function detectSurface(path) {
    if (path.indexOf('/tools/') === 0) return 'tools';
    if (path.indexOf('/blog/') === 0) return 'blog';
    if (path.indexOf('/products/') === 0) return 'products';
    if (path.indexOf('/quote/') === 0) return 'quote';
    if (path.indexOf('/saas/') === 0) return 'saas';
    return 'site';
  }

  function detectPage(path) {
    var normalized = path.replace(/^\/+|\/+$/g, '');
    if (!normalized) return 'home';
    if (normalized === 'saas/ai-ops-autopilot') return 'ai-ops-autopilot';
    return normalized.replace(/\.html$/i, '').replace(/\//g, '-');
  }

  function detectProductSlug() {
    var body = document.body;
    if (body && body.dataset && body.dataset.product) {
      return String(body.dataset.product).trim();
    }

    var segments = pathname.split('/').filter(Boolean);
    if (segments[0] === 'products' && segments[1]) {
      return segments[1].replace(/\.html$/i, '');
    }

    return '';
  }

  function isExternalUrl(url) {
    return url.origin !== window.location.origin;
  }

  function isPlaceholderHref(anchor) {
    var rawHref = (anchor.getAttribute('href') || '').trim();
    if (!rawHref) return true;

    if (rawHref === '#') {
      if (anchor.classList.contains('coming-soon')) return true;
      if (anchor.closest('.nav__item--dropdown')) return false;
      return false;
    }

    for (var i = 0; i < CONFIG.deadHrefPatterns.length; i += 1) {
      if (CONFIG.deadHrefPatterns[i].test(rawHref)) {
        return true;
      }
    }

    if (rawHref.charAt(0) === '#') {
      var targetId = rawHref.slice(1);
      if (!targetId) return false;
      if (!document.getElementById(targetId)) return true;
      return false;
    }

    return false;
  }

  function trackEvent(eventName, payload) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', eventName, payload);
  }

  function getQuoteHref(options) {
    var opts = options || {};
    var url = new URL(CONFIG.routes.quote, window.location.origin);

    url.searchParams.set('source_surface', opts.sourceSurface || sourceSurface);
    url.searchParams.set('source_page', opts.sourcePage || sourcePage);

    if (opts.ctaType) {
      url.searchParams.set('cta_type', opts.ctaType);
    }

    if (opts.product) {
      url.searchParams.set('product', opts.product);
    }

    if (opts.plan) {
      url.searchParams.set('plan', opts.plan);
    }

    return url.pathname + url.search;
  }

  function setCtaMetadata(anchor, ctaType) {
    anchor.dataset.ctaType = ctaType;
    anchor.dataset.sourceSurface = sourceSurface;
    anchor.dataset.sourcePage = sourcePage;
  }

  function addCtaTracking(anchor, eventName, ctaType, extraPayload) {
    var payload = extraPayload || {};
    setCtaMetadata(anchor, ctaType);

    anchor.addEventListener('click', function () {
      trackEvent(eventName, Object.assign({
        source_surface: sourceSurface,
        source_page: sourcePage,
        cta_type: ctaType
      }, payload));
    });
  }

  function ensureBridgeStyles() {
    if (document.getElementById('pf-internal-link-bridge-style')) return;

    var style = document.createElement('style');
    style.id = 'pf-internal-link-bridge-style';
    style.textContent = [
      '.pf-internal-link-bridge{margin:48px auto;padding:24px;border:1px solid rgba(148,163,184,.3);border-radius:16px;background:rgba(248,250,252,.7);max-width:1100px;}',
      '.pf-internal-link-bridge h2{font-size:1.25rem;margin:0 0 6px 0;}',
      '.pf-internal-link-bridge p{margin:0 0 18px 0;color:#475569;font-size:.95rem;}',
      '.pf-internal-link-bridge__cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px;}',
      '.pf-internal-link-bridge__card{display:block;padding:14px;border:1px solid rgba(148,163,184,.35);border-radius:12px;background:#fff;color:#0f172a;text-decoration:none;}',
      '.pf-internal-link-bridge__card:hover{border-color:#3b82f6;box-shadow:0 6px 20px rgba(15,23,42,.08);text-decoration:none;}',
      '.pf-internal-link-bridge__eyebrow{display:inline-block;font-size:.72rem;letter-spacing:.04em;text-transform:uppercase;color:#0369a1;margin-bottom:6px;font-weight:600;}',
      '.pf-internal-link-bridge__title{display:block;font-weight:700;margin-bottom:3px;}',
      '.pf-internal-link-bridge__desc{display:block;color:#475569;font-size:.85rem;}',
      '@media (max-width:768px){.pf-internal-link-bridge{margin:28px 16px;padding:16px;}}'
    ].join('');

    document.head.appendChild(style);
  }

  function isBuyerIntentPage() {
    var haystack = [pathname, document.title || ''].join(' ').toLowerCase();
    for (var i = 0; i < CONFIG.buyerIntentKeywords.length; i += 1) {
      if (haystack.indexOf(CONFIG.buyerIntentKeywords[i]) !== -1) {
        return true;
      }
    }
    return false;
  }

  function isSaasContextPage() {
    var haystack = [pathname, document.title || ''].join(' ').toLowerCase();
    for (var i = 0; i < CONFIG.saasContextKeywords.length; i += 1) {
      if (haystack.indexOf(CONFIG.saasContextKeywords[i]) !== -1) {
        return true;
      }
    }
    return false;
  }

  function findBridgeMount() {
    var sponsorLinks = document.querySelector('.sponsor-links');
    if (sponsorLinks) {
      return sponsorLinks.closest('footer') || sponsorLinks.parentElement;
    }

    var footer = document.querySelector('footer');
    if (footer) {
      return footer;
    }

    return null;
  }

  function initInternalLinkBridge() {
    if (!CONFIG.flags.enableInternalLinkBridge) return;
    if (!(sourceSurface === 'tools' || sourceSurface === 'blog')) return;
    if (document.querySelector('.pf-internal-link-bridge')) return;

    var mount = findBridgeMount();
    if (!mount || !mount.parentNode) return;

    ensureBridgeStyles();

    var includeQuoteCard = isBuyerIntentPage();
    var includeSaasCard = isSaasContextPage();

    var section = document.createElement('section');
    section.className = 'pf-internal-link-bridge';
    section.setAttribute('aria-label', 'Next step links');

    var cards = [];

    cards.push({
      eyebrow: 'Tool',
      title: sourceSurface === 'tools' ? 'Explore more free tools' : 'Try a free tool',
      desc: 'Use browser-first utilities without signup.',
      href: '/tools/',
      ctaType: 'internal-tool'
    });

    if (includeQuoteCard) {
      cards.push({
        eyebrow: 'B2B',
        title: 'Request a Quote',
        desc: 'Get a B2B quote within 1 business day.',
        href: getQuoteHref({ ctaType: 'quote' }),
        ctaType: 'quote'
      });
    } else {
      cards.push({
        eyebrow: 'Support',
        title: 'Support free tools',
        desc: 'Keep these utilities ad-free and fast.',
        href: CONFIG.routes.support.kofi,
        ctaType: 'support-kofi'
      });
    }

    if (includeSaasCard) {
      cards.push({
        eyebrow: 'SaaS',
        title: 'AI Ops Autopilot',
        desc: 'Monitor operations and triage anomalies 24/7.',
        href: '/saas/ai-ops-autopilot/',
        ctaType: 'internal-saas'
      });
    }

    var html = '';
    for (var i = 0; i < cards.length; i += 1) {
      var card = cards[i];
      html += [
        '<a class="pf-internal-link-bridge__card" href="', card.href, '">',
        '<span class="pf-internal-link-bridge__eyebrow">', card.eyebrow, '</span>',
        '<span class="pf-internal-link-bridge__title">', card.title, '</span>',
        '<span class="pf-internal-link-bridge__desc">', card.desc, ' \u2192</span>',
        '</a>'
      ].join('');
    }

    section.innerHTML = [
      '<h2>Next Step</h2>',
      '<p>Choose a direct path based on your current intent.</p>',
      '<div class="pf-internal-link-bridge__cards">', html, '</div>'
    ].join('');

    mount.parentNode.insertBefore(section, mount);

    section.querySelectorAll('a').forEach(function (anchor) {
      var inferredType = anchor.href.indexOf('/quote/') !== -1 ? 'quote' : 'internal-link';
      addCtaTracking(anchor, 'cta_click', inferredType);
    });
  }

  function initSupportCta() {
    if (!CONFIG.flags.enableSupportCta) return;

    var supportLinks = document.querySelectorAll(
      'a[href*="ko-fi.com"], a[href*="paypal.me"], a[href*="github.com/sponsors"]'
    );

    supportLinks.forEach(function (anchor) {
      var href = anchor.getAttribute('href') || '';
      var ctaType = 'support';

      if (href.indexOf('ko-fi.com') !== -1) {
        ctaType = 'support-kofi';
      } else if (href.indexOf('paypal.me') !== -1) {
        ctaType = 'support-paypal';
      } else if (href.indexOf('github.com/sponsors') !== -1) {
        ctaType = 'support-github';
        if (!CONFIG.flags.showGithubSponsors) {
          anchor.style.display = 'none';
          anchor.setAttribute('aria-hidden', 'true');
          return;
        }
      }

      addCtaTracking(anchor, 'sponsor_click', ctaType);
    });
  }

  function enhanceQuoteHref(anchor, options) {
    var opts = options || {};
    var rawHref = (anchor.getAttribute('href') || '').trim();
    if (!rawHref) return;

    var looksLikeMailto = rawHref.indexOf('mailto:') === 0;
    if (looksLikeMailto && !opts.forceQuote) return;

    var absolute;
    try {
      absolute = new URL(rawHref, window.location.href);
    } catch (error) {
      return;
    }

    if (isExternalUrl(absolute)) return;

    var quotePath = absolute.pathname || '';
    if (quotePath.indexOf('/quote/') !== 0 && !opts.forceQuote) {
      return;
    }

    if (opts.forceQuote) {
      anchor.setAttribute('href', getQuoteHref({
        ctaType: 'quote',
        product: opts.product
      }));
      addCtaTracking(anchor, 'quote_cta_click', 'quote', {
        product: opts.product || ''
      });
      return;
    }

    if (!absolute.searchParams.get('source_surface')) {
      absolute.searchParams.set('source_surface', sourceSurface);
    }

    if (!absolute.searchParams.get('source_page')) {
      absolute.searchParams.set('source_page', sourcePage);
    }

    var requestType = String(absolute.searchParams.get('type') || '').toLowerCase();
    var ctaType = requestType === 'sample' ? 'sample_quote' : 'quote';

    if (!absolute.searchParams.get('cta_type')) {
      absolute.searchParams.set('cta_type', ctaType);
    } else {
      ctaType = absolute.searchParams.get('cta_type');
    }

    if (opts.product && !absolute.searchParams.get('product')) {
      absolute.searchParams.set('product', opts.product);
    }

    anchor.setAttribute('href', absolute.pathname + absolute.search + absolute.hash);
    addCtaTracking(anchor, 'quote_cta_click', ctaType, {
      product: absolute.searchParams.get('product') || ''
    });
  }

  function initQuoteCta() {
    if (!CONFIG.flags.enableQuoteCta) return;

    var productSlug = detectProductSlug();

    if (sourceSurface === 'products') {
      var primaryButtons = document.querySelectorAll('a.btn--primary, a.btn-primary');
      primaryButtons.forEach(function (anchor) {
        enhanceQuoteHref(anchor, {
          forceQuote: true,
          product: productSlug || 'ptfe'
        });
      });
    }

    var quoteLinks = document.querySelectorAll(
      'a[href*="/quote/"], a[href^="../quote/"], a[href^="../../quote/"], a[href^="/quote/"]'
    );

    quoteLinks.forEach(function (anchor) {
      enhanceQuoteHref(anchor, {
        product: sourceSurface === 'products' ? (productSlug || 'ptfe') : ''
      });
    });
  }

  function disableComingSoonLinks() {
    var links = document.querySelectorAll('a.coming-soon, .tool-card.coming-soon');

    links.forEach(function (anchor) {
      anchor.removeAttribute('href');
      anchor.setAttribute('aria-disabled', 'true');
      anchor.setAttribute('tabindex', '-1');
      anchor.classList.add('is-disabled-route');
    });
  }

  function initRouteSafety() {
    disableComingSoonLinks();

    var anchors = document.querySelectorAll('a[href]');
    anchors.forEach(function (anchor) {
      if (!isPlaceholderHref(anchor)) return;

      var rawHref = (anchor.getAttribute('href') || '').trim();

      if (rawHref === '#') {
        if (anchor.classList.contains('coming-soon')) {
          anchor.removeAttribute('href');
          anchor.setAttribute('aria-disabled', 'true');
          anchor.setAttribute('tabindex', '-1');
        }
        return;
      }

      if (anchor.closest('.nav__item--dropdown')) return;

      if (anchor.classList.contains('btn') || anchor.className.indexOf('cta') !== -1) {
        anchor.setAttribute('href', getQuoteHref({ ctaType: 'quote' }));
        setCtaMetadata(anchor, 'quote');
      } else {
        anchor.removeAttribute('href');
        anchor.setAttribute('aria-disabled', 'true');
        anchor.setAttribute('tabindex', '-1');
      }
    });
  }

  function appendSaasHelperText(anchor) {
    var parent = anchor.parentElement;
    if (!parent) return;
    if (parent.querySelector('.pf-saas-helper')) return;
    if (Array.prototype.slice.call(parent.querySelectorAll('p')).some(function (node) {
      return (node.textContent || '').trim() === 'Self-serve checkout opens after payment links are live.';
    })) {
      return;
    }

    var helper = document.createElement('p');
    helper.className = 'pf-saas-helper';
    helper.style.marginTop = '10px';
    helper.style.fontSize = '12px';
    helper.style.color = '#94a3b8';
    helper.textContent = 'Self-serve checkout opens after payment links are live.';

    parent.appendChild(helper);
  }

  function patchSaasTrialLink(anchor, ctaType, plan) {
    var href = getQuoteHref({
      sourceSurface: 'saas',
      sourcePage: 'ai-ops-autopilot',
      ctaType: ctaType,
      plan: plan || ''
    });

    anchor.removeAttribute('onclick');
    anchor.setAttribute('href', href);
    if (ctaType === 'waitlist') {
      anchor.textContent = 'Join Waitlist';
    }

    addCtaTracking(anchor, 'cta_click', ctaType, {
      plan: plan || ''
    });
  }

  function initSaasCheckoutState() {
    if (!CONFIG.flags.enableSaasCheckoutState) return;
    if (sourceSurface !== 'saas') return;
    if (pathname.indexOf('/saas/ai-ops-autopilot/') !== 0) return;

    var placeholderCheckoutCtas = document.querySelectorAll(
      'a[href*="PLACEHOLDER"], a#cta-starter, a#cta-growth'
    );

    placeholderCheckoutCtas.forEach(function (anchor) {
      var plan = anchor.id === 'cta-growth' ? 'growth' : 'starter';
      if (CONFIG.flags.enableSaasCheckoutLive) {
        return;
      }

      patchSaasTrialLink(anchor, 'waitlist', plan);
      appendSaasHelperText(anchor);
    });

    var allTrialCtas = Array.prototype.slice.call(document.querySelectorAll('a[href="#pricing"]'));
    allTrialCtas.forEach(function (anchor) {
      var text = (anchor.textContent || '').toLowerCase();
      if (text.indexOf('trial') === -1) return;
      if (CONFIG.flags.enableSaasCheckoutLive) return;
      patchSaasTrialLink(anchor, 'waitlist', 'all');
    });

    var salesCtas = document.querySelectorAll('a[href="/quote/"], a[href^="/quote/?"]');
    salesCtas.forEach(function (anchor) {
      var text = (anchor.textContent || '').toLowerCase();
      if (text.indexOf('sales') === -1) return;
      addCtaTracking(anchor, 'cta_click', 'talk-to-sales');
    });
  }

  function toggleMenuOpen(menu, toggle, forceState) {
    var willOpen = typeof forceState === 'boolean' ? forceState : !menu.classList.contains('is-open');

    menu.classList.toggle('is-open', willOpen);
    toggle.classList.toggle('is-open', willOpen);
    toggle.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    document.body.classList.toggle('pf-mobile-nav-open', willOpen);
    if (window.innerWidth <= 768) {
      menu.style.display = willOpen ? 'flex' : 'none';
    } else {
      menu.style.display = '';
    }
  }

  function createNavToggleButton() {
    var btn = document.createElement('button');
    btn.className = 'nav-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Open menu');
    btn.setAttribute('aria-expanded', 'false');
    btn.innerHTML = '<span></span><span></span><span></span>';
    return btn;
  }

  function setupDropdownToggle(menu) {
    var triggers = menu.querySelectorAll('.nav__item--dropdown > .nav__link[aria-haspopup="true"]');
    triggers.forEach(function (trigger) {
      trigger.addEventListener('click', function (event) {
        if (window.innerWidth > 768) return;
        event.preventDefault();
        var parent = trigger.closest('.nav__item--dropdown');
        if (!parent) return;
        parent.classList.toggle('is-open');
      });
    });
  }

  function trapMenuFocus(menu, toggleButton) {
    function onKeyDown(event) {
      if (!menu.classList.contains('is-open')) return;

      if (event.key === 'Escape') {
        toggleMenuOpen(menu, toggleButton, false);
        toggleButton.focus();
        return;
      }

      if (event.key !== 'Tab') return;

      var focusable = menu.querySelectorAll('a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])');
      if (!focusable.length) return;

      var first = focusable[0];
      var last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
  }

  function initMobileNavToggle() {
    if (!CONFIG.flags.enableMobileNavToggle) return;
    if (!(sourceSurface === 'products' || (sourceSurface === 'quote' && pathname === '/quote/'))) return;

    var container = document.querySelector('.header__container');
    var menu = document.querySelector('.nav__menu');

    if (!container || !menu) return;

    menu.id = menu.id || 'pf-mobile-menu';

    var toggleButton = container.querySelector('.nav-toggle');
    if (!toggleButton) {
      toggleButton = createNavToggleButton();
      var actions = container.querySelector('.header__actions');
      if (actions && actions.parentNode === container) {
        container.insertBefore(toggleButton, actions);
      } else {
        container.appendChild(toggleButton);
      }
    }

    toggleButton.setAttribute('aria-controls', menu.id);
    toggleButton.setAttribute('aria-expanded', 'false');

    toggleButton.addEventListener('click', function () {
      toggleMenuOpen(menu, toggleButton);
      if (menu.classList.contains('is-open')) {
        var firstLink = menu.querySelector('a[href]');
        if (firstLink) firstLink.focus();
      }
    });

    document.addEventListener('click', function (event) {
      if (!menu.classList.contains('is-open')) return;
      if (container.contains(event.target)) return;
      toggleMenuOpen(menu, toggleButton, false);
    });

    menu.addEventListener('click', function (event) {
      var target = event.target;
      if (!(target instanceof HTMLElement)) return;
      if (target.tagName !== 'A') return;
      if (target.closest('.nav__item--dropdown') && window.innerWidth <= 768 && target.getAttribute('aria-haspopup') === 'true') {
        return;
      }
      if (window.innerWidth <= 768) {
        toggleMenuOpen(menu, toggleButton, false);
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 768) {
        toggleMenuOpen(menu, toggleButton, false);
      }
    });

    setupDropdownToggle(menu);
    trapMenuFocus(menu, toggleButton);
  }

  function init() {
    initRouteSafety();
    initSupportCta();
    initQuoteCta();
    initInternalLinkBridge();
    initSaasCheckoutState();
    initMobileNavToggle();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.PureFlonRevenueModules = {
    'support-cta': initSupportCta,
    'quote-cta': initQuoteCta,
    'internal-link-bridge': initInternalLinkBridge,
    'saas-checkout-state': initSaasCheckoutState
  };

  window.PureFlonRevenueConfig = CONFIG;
})();
