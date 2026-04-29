/**
 * Nitos Reviews Widget
 * Injects star ratings + review list on Shopify product pages.
 * Config injected at runtime by /api/widgets/reviews route:
 *   window.__nitos.shop, window.__nitos.api
 */
(function () {
  "use strict";

  var cfg = window.__nitos || {};
  var API = cfg.api || "";
  var SHOP = cfg.shop || "";

  // Only run on product pages
  var productId = window.ShopifyAnalytics?.meta?.product?.id?.toString() ||
    document.querySelector("[data-product-id]")?.getAttribute("data-product-id");

  if (!productId) return;

  // ── Styles ──────────────────────────────────────────────────
  var style = document.createElement("style");
  style.textContent = `
    .nitos-reviews { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin-top: 40px; }
    .nitos-summary { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
    .nitos-avg { font-size: 2.5rem; font-weight: 700; line-height: 1; }
    .nitos-stars { display: flex; gap: 2px; }
    .nitos-star { width: 18px; height: 18px; }
    .nitos-star-full { fill: #FBBF24; color: #FBBF24; }
    .nitos-star-empty { fill: #E2E8F0; color: #E2E8F0; }
    .nitos-count { font-size: 0.875rem; color: #64748B; }
    .nitos-bars { display: flex; flex-direction: column; gap: 4px; }
    .nitos-bar-row { display: flex; align-items: center; gap: 8px; font-size: 0.75rem; color: #64748B; }
    .nitos-bar-track { flex: 1; height: 6px; background: #E2E8F0; border-radius: 99px; overflow: hidden; }
    .nitos-bar-fill { height: 100%; background: #FBBF24; border-radius: 99px; }
    .nitos-review { padding: 16px 0; border-top: 1px solid #E2E8F0; }
    .nitos-review-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
    .nitos-name { font-weight: 600; font-size: 0.875rem; }
    .nitos-badge { font-size: 0.65rem; background: #ECFDF5; color: #059669; padding: 2px 6px; border-radius: 99px; font-weight: 600; }
    .nitos-title { font-weight: 600; font-size: 0.9rem; margin-bottom: 4px; }
    .nitos-body { font-size: 0.875rem; color: #334155; line-height: 1.6; }
    .nitos-photos { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }
    .nitos-photo { width: 64px; height: 64px; object-fit: cover; border-radius: 8px; border: 1px solid #E2E8F0; cursor: pointer; }
    .nitos-write-btn { margin-top: 20px; background: #6366F1; color: white; border: none; padding: 10px 20px; border-radius: 10px; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
    .nitos-write-btn:hover { background: #4F46E5; }
    .nitos-modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 99999; display: flex; align-items: center; justify-content: center; padding: 16px; }
    .nitos-modal { background: white; border-radius: 16px; padding: 24px; width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; }
    .nitos-modal h3 { font-size: 1.1rem; font-weight: 700; margin-bottom: 16px; }
    .nitos-form-field { margin-bottom: 12px; }
    .nitos-form-field label { display: block; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #64748B; margin-bottom: 4px; }
    .nitos-input { width: 100%; border: 1px solid #E2E8F0; border-radius: 10px; padding: 8px 12px; font-size: 0.875rem; outline: none; }
    .nitos-input:focus { border-color: #6366F1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
    .nitos-star-input { display: flex; gap: 6px; }
    .nitos-star-input svg { width: 28px; height: 28px; cursor: pointer; transition: transform 0.1s; }
    .nitos-star-input svg:hover { transform: scale(1.15); }
    .nitos-submit-btn { width: 100%; background: #6366F1; color: white; border: none; padding: 12px; border-radius: 10px; font-size: 0.9rem; font-weight: 600; cursor: pointer; margin-top: 4px; }
    .nitos-cancel-btn { width: 100%; background: transparent; border: 1px solid #E2E8F0; color: #64748B; padding: 10px; border-radius: 10px; font-size: 0.875rem; cursor: pointer; margin-top: 8px; }
  `;
  document.head.appendChild(style);

  function starSVG(full) {
    var cls = full ? "nitos-star-full" : "nitos-star-empty";
    return '<svg class="nitos-star ' + cls + '" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';
  }

  function renderStars(rating) {
    var html = "";
    for (var i = 1; i <= 5; i++) html += starSVG(i <= Math.round(rating));
    return '<div class="nitos-stars">' + html + "</div>";
  }

  // ── Fetch + Render ───────────────────────────────────────────
  fetch(API + "/api/widget-data/reviews?product_id=" + productId + "&shop=" + SHOP)
    .then(function (r) { return r.json(); })
    .then(function (data) {
      var container = document.createElement("div");
      container.className = "nitos-reviews";

      var summary = data.summary || { average: 0, total: 0, counts: [] };
      var reviews = data.reviews || [];

      // Summary header
      if (summary.total > 0) {
        var barHtml = summary.counts.slice().reverse().map(function (c) {
          var pct = summary.total > 0 ? (c.count / summary.total) * 100 : 0;
          return '<div class="nitos-bar-row"><span>' + c.star + '★</span><div class="nitos-bar-track"><div class="nitos-bar-fill" style="width:' + pct.toFixed(0) + '%"></div></div><span>' + c.count + '</span></div>';
        }).join("");

        container.innerHTML += '<div class="nitos-summary">' +
          '<div class="nitos-avg">' + summary.average.toFixed(1) + '</div>' +
          renderStars(summary.average) +
          '<div><div class="nitos-count">' + summary.total + ' reviews</div><div class="nitos-bars">' + barHtml + '</div></div>' +
          '</div>';
      }

      // Review list
      reviews.forEach(function (r) {
        var photosHtml = (r.media_urls || []).map(function (u) {
          return '<img class="nitos-photo" src="' + u + '" alt="Review photo">';
        }).join("");

        container.innerHTML += '<div class="nitos-review">' +
          '<div class="nitos-review-header">' +
          renderStars(r.rating) +
          '<span class="nitos-name">' + (r.customer_name || "Customer") + '</span>' +
          (r.verified_purchase ? '<span class="nitos-badge">✓ Verified</span>' : '') +
          '</div>' +
          (r.title ? '<div class="nitos-title">' + r.title + '</div>' : '') +
          '<div class="nitos-body">' + (r.body || "") + '</div>' +
          (photosHtml ? '<div class="nitos-photos">' + photosHtml + '</div>' : '') +
          '</div>';
      });

      // Write a review button
      var writeBtn = document.createElement("button");
      writeBtn.className = "nitos-write-btn";
      writeBtn.textContent = "Write a review";
      writeBtn.addEventListener("click", openReviewModal);
      container.appendChild(writeBtn);

      // Inject below product description
      var insertTarget =
        document.querySelector(".product__description") ||
        document.querySelector(".product-description") ||
        document.querySelector("[data-product-description]") ||
        document.querySelector(".product-single__description") ||
        document.querySelector("main");

      if (insertTarget) insertTarget.appendChild(container);

      // Structured data for SEO
      if (summary.total > 0) {
        var ld = document.createElement("script");
        ld.type = "application/ld+json";
        ld.textContent = JSON.stringify({
          "@context": "https://schema.org/",
          "@type": "Product",
          "name": document.title,
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": summary.average.toFixed(1),
            "reviewCount": summary.total,
          },
        });
        document.head.appendChild(ld);
      }
    })
    .catch(function () { /* silently fail if API unreachable */ });

  // ── Review modal ─────────────────────────────────────────────
  var selectedRating = 0;

  function openReviewModal() {
    var overlay = document.createElement("div");
    overlay.className = "nitos-modal-overlay";
    overlay.innerHTML = '<div class="nitos-modal">' +
      '<h3>Write a review</h3>' +
      '<div class="nitos-form-field"><label>Your rating</label>' +
      '<div class="nitos-star-input" id="nrsi">' +
      [1,2,3,4,5].map(function(i){ return '<svg viewBox="0 0 24 24" data-v="'+i+'"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>'; }).join("") +
      '</div></div>' +
      '<div class="nitos-form-field"><label>Your name</label><input class="nitos-input" id="nr-name" placeholder="Jane D."></div>' +
      '<div class="nitos-form-field"><label>Email (for verified badge)</label><input class="nitos-input" id="nr-email" type="email" placeholder="jane@example.com"></div>' +
      '<div class="nitos-form-field"><label>Review title</label><input class="nitos-input" id="nr-title" placeholder="Great product!"></div>' +
      '<div class="nitos-form-field"><label>Review</label><textarea class="nitos-input" id="nr-body" rows="4" placeholder="Share your experience..."></textarea></div>' +
      '<button class="nitos-submit-btn" id="nr-submit">Submit review</button>' +
      '<button class="nitos-cancel-btn" id="nr-cancel">Cancel</button>' +
      '</div>';

    document.body.appendChild(overlay);
    updateStarInput(overlay, 0);

    overlay.querySelector("#nrsi").addEventListener("click", function(e) {
      var v = parseInt(e.target.closest("[data-v]")?.getAttribute("data-v") || "0");
      if (v) { selectedRating = v; updateStarInput(overlay, v); }
    });

    overlay.querySelector("#nr-cancel").addEventListener("click", function() {
      overlay.remove();
    });

    overlay.querySelector("#nr-submit").addEventListener("click", function() {
      var payload = {
        type: "review_submitted",
        shop: SHOP,
        payload: {
          product_id: productId,
          rating: selectedRating,
          name: overlay.querySelector("#nr-name").value,
          email: overlay.querySelector("#nr-email").value,
          title: overlay.querySelector("#nr-title").value,
          body: overlay.querySelector("#nr-body").value,
          product_title: document.querySelector("h1")?.textContent?.trim() || "",
        },
      };
      fetch(API + "/api/widget-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then(function() {
        overlay.innerHTML = '<div class="nitos-modal" style="text-align:center;padding:40px"><div style="font-size:2rem">⭐</div><h3 style="margin-top:12px">Thanks for your review!</h3><p style="color:#64748B;margin-top:8px">It\'s pending approval and will appear soon.</p><button class="nitos-cancel-btn" style="margin-top:20px" onclick="this.closest(\'.nitos-modal-overlay\').remove()">Close</button></div>';
      });
    });
  }

  function updateStarInput(overlay, rating) {
    var stars = overlay.querySelectorAll("#nrsi svg");
    stars.forEach(function(s, i) {
      s.style.fill = i < rating ? "#FBBF24" : "#E2E8F0";
      s.style.color = i < rating ? "#FBBF24" : "#E2E8F0";
    });
  }
})();
