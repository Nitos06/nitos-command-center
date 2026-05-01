(function () {
  'use strict';

  var APP_URL = 'https://nitaiecompro-nine.vercel.app';
  function getCookie(name) {
    var v = document.cookie.match('(^|;)\\s*' + name + '\\s*=\\s*([^;]+)');
    return v ? v.pop() : '';
  }

  // Permanent cookie — no expiry (max-age of 10 years)
  function setCookie(name, value) {
    document.cookie = name + '=' + value + ';max-age=' + (10 * 365 * 24 * 3600) + ';path=/;SameSite=Lax';
  }

  function getBrandId() {
    var el = document.querySelector('[data-brand-id]');
    return el ? el.getAttribute('data-brand-id') : '';
  }

  function init() {
    // Read ?ref= param
    var params = new URLSearchParams(window.location.search);
    var ref = params.get('ref') || params.get('aff') || params.get('affiliate');

    if (ref) {
      setCookie('aff_ref', ref);
      // Track click
      var brandId = getBrandId() || document.querySelector('[data-affiliates]')?.getAttribute('data-affiliates') || '';
      fetch(APP_URL + '/api/affiliates/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: ref,
          brand_id: brandId,
          page: window.location.pathname,
          referrer: document.referrer,
        }),
        keepalive: true,
      }).catch(function () {});
    }

    // Expose ref for checkout attribution
    var stored = getCookie('aff_ref');
    if (stored) {
      window.__affiliateRef = stored;
    }
  }

  init();
})();
