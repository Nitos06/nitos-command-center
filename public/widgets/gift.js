(function () {
  'use strict';

  var APP_URL = 'https://nitaiecompro-nine.vercel.app';
  var POLL_MS  = 5000; // re-check cart every 5 s

  // ── Per-rule state (keyed by rule id) ────────────────────────────────────
  var added = {};

  function init() {
    var el = document.getElementById('gift-bar') || document.querySelector('[data-gift-widget]');
    if (!el) return;

    var brandId = el.getAttribute('data-brand-id') || el.getAttribute('data-gift-widget') || '';
    if (!brandId) return;

    fetch(APP_URL + '/api/widgets/gift-rules?brand_id=' + encodeURIComponent(brandId))
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (!data.ok || !data.rules || !data.rules.length) return;
        var rule = data.rules[0]; // use first active rule
        startWatcher(el, rule);
      })
      .catch(function () {});
  }

  // ── Watcher: poll + listen to theme events ───────────────────────────────
  function startWatcher(el, rule) {
    tick(el, rule);
    setInterval(function () { tick(el, rule); }, POLL_MS);

    // Respond to theme events immediately so there's no visible lag
    ['cart:updated', 'cart:item-added', 'bundle:added', 'shopify:section:load'].forEach(function (evt) {
      document.addEventListener(evt, function () {
        setTimeout(function () { tick(el, rule); }, 400);
      });
    });
  }

  // ── One tick: get cart, update bar, maybe add gift ───────────────────────
  function tick(el, rule) {
    getCart().then(function (cart) {
      var total     = cart.total_price / 100; // Shopify returns cents
      var threshold = parseFloat(rule.threshold) || 75;
      var variantId = rule.variant_id;

      renderBar(el, rule, total, threshold);

      if (total >= threshold && variantId && !added[rule.id]) {
        // Only add if gift is not already in the cart
        var alreadyIn = cart.items.some(function (item) {
          return (
            String(item.variant_id) === String(variantId) ||
            (item.properties && item.properties._gift === 'true')
          );
        });

        if (!alreadyIn) {
          addGift(variantId, rule);
        } else {
          added[rule.id] = true; // mark as done so we stop checking
        }
      }
    }).catch(function () {});
  }

  // ── Shopify cart fetch ───────────────────────────────────────────────────
  function getCart() {
    return fetch('/cart.js', { credentials: 'include' }).then(function (r) { return r.json(); });
  }

  // ── Add gift to cart ─────────────────────────────────────────────────────
  function addGift(variantId, rule) {
    added[rule.id] = true; // optimistically lock so we don't double-add

    fetch('/cart/add.js', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        id: variantId,
        quantity: 1,
        properties: { _gift: 'true' },
      }),
    })
      .then(function (r) {
        if (!r.ok) throw new Error('add failed ' + r.status);
        showToast(rule.cart_message || ('🎁 ' + (rule.product_title || 'Free gift') + ' added to your cart!'));
        // Refresh bar one more time so it reflects unlocked state
        getCart().then(function (cart) {
          renderBar(null, rule, cart.total_price / 100, parseFloat(rule.threshold) || 75);
        });
      })
      .catch(function (e) {
        console.warn('[gift.js] Could not add gift:', e);
        added[rule.id] = false; // allow retry on next tick
      });
  }

  // ── Render progress bar ──────────────────────────────────────────────────
  function renderBar(el, rule, total, threshold) {
    if (!el) return;
    var remaining = Math.max(0, threshold - total);
    var pct       = Math.min(100, (total / threshold) * 100);
    var unlocked  = total >= threshold;
    var barColor  = unlocked ? '#16a34a' : '#6366f1';
    var bgColor   = unlocked ? '#dcfce7'  : '#eef2ff';
    var message   = unlocked
      ? '🎁 ' + (rule.cart_message || 'You unlocked a free gift! It\'s been added to your cart.')
      : 'Add <strong>$' + remaining.toFixed(2) + '</strong> more to unlock: <strong>' + (rule.product_title || 'Free Gift') + '</strong> 🎁';

    el.innerHTML =
      '<div style="font-family:system-ui,sans-serif;padding:12px 16px;background:' + bgColor + ';border-radius:12px;margin-bottom:12px;">'
      + '<div style="font-size:13px;color:#374151;margin-bottom:8px;">' + message + '</div>'
      + '<div style="background:#e5e7eb;border-radius:999px;height:6px;">'
      + '<div style="background:' + barColor + ';height:6px;border-radius:999px;width:' + pct + '%;transition:width 0.5s ease;"></div>'
      + '</div>'
      + '</div>';
  }

  // ── Toast notification ───────────────────────────────────────────────────
  function showToast(message) {
    var toast = document.createElement('div');
    toast.style.cssText = [
      'position:fixed',
      'bottom:20px',
      'left:50%',
      'transform:translateX(-50%) translateY(20px)',
      'z-index:99999',
      'background:#16a34a',
      'color:#fff',
      'font-family:system-ui,sans-serif',
      'font-size:14px',
      'font-weight:600',
      'padding:12px 22px',
      'border-radius:50px',
      'box-shadow:0 4px 20px rgba(0,0,0,0.2)',
      'opacity:0',
      'transition:opacity 0.3s,transform 0.3s',
      'pointer-events:none',
    ].join(';');
    toast.textContent = message;
    document.body.appendChild(toast);

    // Animate in
    setTimeout(function () {
      toast.style.opacity = '1';
      toast.style.transform = 'translateX(-50%) translateY(0)';
    }, 30);

    // Animate out after 5 s
    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(20px)';
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 350);
    }, 5000);
  }

  // ── Boot ─────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
