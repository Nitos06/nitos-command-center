(function () {
  'use strict';

  var APP_URL = 'https://nitaiecompro-nine.vercel.app';

  function init() {
    var el = document.getElementById('gift-bar') || document.querySelector('[data-gift-widget]');
    if (!el) return;

    var brandId = el.getAttribute('data-brand-id') || el.getAttribute('data-gift-widget') || '';

    fetch(APP_URL + '/api/widgets/gift-rules?brand_id=' + encodeURIComponent(brandId))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.ok || !data.rules || !data.rules.length) return;
        watchCart(el, data.rules[0]);
      })
      .catch(function () {});
  }

  function watchCart(el, rule) {
    updateBar(el, rule);
    // Re-check every time cart changes
    document.addEventListener('cart:updated', function () { updateBar(el, rule); });
    document.addEventListener('bundle:added', function () { setTimeout(function () { updateBar(el, rule); }, 500); });
  }

  function getCartTotal() {
    // Try Shopify cart API
    return fetch('/cart.js')
      .then(function (r) { return r.json(); })
      .then(function (c) { return (c.total_price || 0) / 100; })
      .catch(function () { return 0; });
  }

  function updateBar(el, rule) {
    getCartTotal().then(function (total) {
      var threshold = parseFloat(rule.threshold) || 75;
      var remaining = Math.max(0, threshold - total);
      var pct = Math.min(100, (total / threshold) * 100);
      var unlocked = total >= threshold;

      var color = unlocked ? '#16a34a' : '#6366f1';
      var message = unlocked
        ? '🎁 ' + (rule.cart_message || 'You unlocked a free gift!')
        : 'Add $' + remaining.toFixed(2) + ' more to unlock: <strong>' + (rule.product_title || 'Free Gift') + '</strong> 🎁';

      el.innerHTML = '<div style="font-family:system-ui,sans-serif;padding:12px 16px;background:' + (unlocked ? '#dcfce7' : '#eef2ff') + ';border-radius:12px;margin-bottom:12px;">'
        + '<div style="font-size:13px;color:#374151;margin-bottom:8px;">' + message + '</div>'
        + '<div style="background:#e5e7eb;border-radius:999px;height:6px;">'
        + '<div style="background:' + color + ';height:6px;border-radius:999px;width:' + pct + '%;transition:width 0.4s;"></div>'
        + '</div>'
        + '</div>';
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
