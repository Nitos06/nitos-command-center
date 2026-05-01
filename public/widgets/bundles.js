(function () {
  'use strict';

  var APP_URL = 'https://nitaiecompro-nine.vercel.app';

  function formatPrice(cents) {
    return '$' + (cents / 100).toFixed(2);
  }

  function init() {
    var els = document.querySelectorAll('[data-bundle-id]');
    if (!els.length) return;

    els.forEach(function (el) {
      var bundleId = el.getAttribute('data-bundle-id');
      var brandId = el.getAttribute('data-brand-id') || '';
      if (!bundleId) return;

      fetch(APP_URL + '/api/widgets/bundles?bundle_id=' + bundleId + '&brand_id=' + encodeURIComponent(brandId))
        .then(function (r) { return r.json(); })
        .then(function (data) {
          if (!data.ok || !data.bundle) return;
          renderBundle(el, data.bundle);
        })
        .catch(function () {});
    });
  }

  function renderBundle(el, bundle) {
    var html = '<div style="font-family:system-ui,sans-serif;padding:24px;background:#f9fafb;border-radius:16px;border:1px solid #e5e7eb;">';
    html += '<div style="font-size:14px;font-weight:700;color:#111827;margin-bottom:16px;">📦 ' + (bundle.name || 'Frequently Bought Together') + '</div>';
    html += '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;">';

    (bundle.items || []).forEach(function (item, i) {
      if (i > 0) html += '<div style="display:flex;align-items:center;color:#9ca3af;font-size:20px;">+</div>';
      html += '<div style="text-align:center;flex:1;min-width:80px;">';
      if (item.image) html += '<img src="' + item.image + '" style="width:80px;height:80px;object-fit:cover;border-radius:8px;margin-bottom:4px;" />';
      html += '<div style="font-size:12px;color:#374151;font-weight:600;">' + (item.title || '') + '</div>';
      if (item.price) html += '<div style="font-size:12px;color:#6b7280;">' + item.price + '</div>';
      html += '</div>';
    });

    html += '</div>';

    if (bundle.savings) {
      html += '<div style="background:#dcfce7;color:#166534;font-size:12px;font-weight:600;padding:6px 12px;border-radius:8px;display:inline-block;margin-bottom:12px;">Save ' + bundle.savings + ' when bought together</div>';
    }

    html += '<button onclick="window.__addBundle(\'' + bundle.id + '\')" style="width:100%;padding:14px;background:#6366f1;color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;">Add Bundle to Cart</button>';
    html += '</div>';

    el.innerHTML = html;
  }

  window.__addBundle = function (bundleId) {
    // Shopify AJAX cart add — works for Shopify stores
    var btn = event.target;
    btn.textContent = 'Adding...';
    btn.disabled = true;

    fetch(APP_URL + '/api/widgets/bundles?bundle_id=' + bundleId + '&action=cart_items')
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.items || !data.items.length) throw new Error('No items');
        // Shopify AJAX API
        return fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: data.items }),
        });
      })
      .then(function () {
        btn.textContent = '✓ Added to Cart!';
        btn.style.background = '#16a34a';
        setTimeout(function () {
          btn.textContent = 'Add Bundle to Cart';
          btn.style.background = '#6366f1';
          btn.disabled = false;
        }, 2000);
        // Trigger cart drawer open if available
        if (window.Shopify && window.Shopify.cart) window.Shopify.cart.open();
        document.dispatchEvent(new CustomEvent('bundle:added', { detail: { bundleId: bundleId } }));
      })
      .catch(function () {
        btn.textContent = 'Add Bundle to Cart';
        btn.disabled = false;
      });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
