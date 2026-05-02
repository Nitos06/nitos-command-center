/**
 * Nitos Email Capture Popup Widget
 * Time-delay trigger only. Supports two styles: "popup" (centered) and "flyout" (corner).
 * Clicking X sets a localStorage cooldown so it won't reappear for cooldown_days days.
 */
(function () {
  "use strict";

  var cfg = null;
  var brandId = (window.__nitos && window.__nitos.shop) || "";
  var apiBase = (window.__nitos && window.__nitos.api) || "";

  var STORAGE_KEY = "nitos_popup_closed_" + brandId;

  function isOnCooldown() {
    try {
      var ts = localStorage.getItem(STORAGE_KEY);
      if (!ts) return false;
      var days = (cfg && cfg.cooldown_days) || 7;
      return Date.now() - parseInt(ts, 10) < days * 86400000;
    } catch (e) {
      return false;
    }
  }

  function setCooldown() {
    try {
      localStorage.setItem(STORAGE_KEY, String(Date.now()));
    } catch (e) {}
  }

  function loadConfig(cb) {
    var url = apiBase + "/api/widgets/popup-config?brand_id=" + encodeURIComponent(brandId);
    fetch(url)
      .then(function (r) { return r.json(); })
      .then(function (data) { cb(data.config || data); })
      .catch(function () { cb(null); });
  }

  /* ── Popup (centered modal) ─────────────────────────────────────────── */
  function buildPopup(c) {
    var overlay = document.createElement("div");
    overlay.id = "nitos-popup-overlay";
    overlay.style.cssText = [
      "position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:2147483647;",
      "display:flex;align-items:center;justify-content:center;",
    ].join("");

    var box = document.createElement("div");
    box.style.cssText = [
      "background:" + (c.bg_color || "#ffffff") + ";border-radius:16px;",
      "padding:32px 28px 24px;max-width:380px;width:90%;position:relative;",
      "box-shadow:0 20px 60px rgba(0,0,0,0.25);",
      "animation:nitosSlideUp 0.3s cubic-bezier(0.34,1.56,0.64,1)",
    ].join("");

    var style = document.createElement("style");
    style.textContent = [
      "@keyframes nitosSlideUp{from{transform:translateY(24px);opacity:0}to{transform:translateY(0);opacity:1}}",
      "@keyframes nitosFlyIn{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}",
    ].join("");

    box.innerHTML = buildInnerHTML(c);
    overlay.appendChild(style);
    overlay.appendChild(box);

    /* Close on overlay click */
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay) dismissPopup(overlay);
    });

    return overlay;
  }

  /* ── Flyout (bottom-right corner slide-in) ───────────────────────────── */
  function buildFlyout(c) {
    var el = document.createElement("div");
    el.id = "nitos-popup-overlay";
    el.style.cssText = [
      "position:fixed;bottom:24px;right:24px;z-index:2147483647;",
      "background:" + (c.bg_color || "#ffffff") + ";border-radius:16px;",
      "padding:24px 20px 18px;width:320px;max-width:calc(100vw - 48px);",
      "box-shadow:0 12px 40px rgba(0,0,0,0.18);",
      "animation:nitosFlyIn 0.35s cubic-bezier(0.34,1.56,0.64,1)",
    ].join("");

    var style = document.createElement("style");
    style.textContent = "@keyframes nitosFlyIn{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}";
    el.appendChild(style);

    var inner = document.createElement("div");
    inner.innerHTML = buildInnerHTML(c);
    el.appendChild(inner);

    return el;
  }

  function buildInnerHTML(c) {
    var accent = c.accent_color || "#6366f1";
    var showName = !!c.show_name_field;
    var btnText = c.button_text || "Subscribe";

    return [
      /* close button */
      '<button id="nitos-close" style="position:absolute;top:10px;right:12px;background:none;border:none;',
      'cursor:pointer;font-size:20px;color:#9ca3af;line-height:1;padding:4px 6px;">&times;</button>',

      /* headline */
      '<p style="margin:0 0 6px;font-size:17px;font-weight:700;color:#111827;font-family:system-ui,sans-serif;">',
      escHtml(c.headline || "Get 10% off your first order"),
      '</p>',

      /* subtext */
      '<p style="margin:0 0 16px;font-size:13px;color:#6b7280;font-family:system-ui,sans-serif;">',
      escHtml(c.subtext || "Join our list for exclusive deals."),
      '</p>',

      /* fields */
      '<div id="nitos-form" style="display:flex;flex-direction:column;gap:8px;">',
      showName
        ? '<input id="nitos-name" type="text" placeholder="First name" style="' + fieldStyle() + '" />'
        : '',
      '<input id="nitos-email" type="email" placeholder="Email address *" style="' + fieldStyle() + '" />',
      '<button id="nitos-submit" type="button" style="' + btnStyle(accent) + '">' + escHtml(btnText) + '</button>',
      '</div>',

      /* success */
      '<div id="nitos-success" style="display:none;text-align:center;padding:14px 0;',
      'font-size:14px;font-weight:600;color:' + accent + ';font-family:system-ui,sans-serif;">',
      '&#10003; You\'re in! Check your inbox.',
      '</div>',

      /* privacy */
      '<p style="margin:10px 0 0;font-size:10px;color:#d1d5db;text-align:center;font-family:system-ui,sans-serif;">',
      'No spam. Unsubscribe anytime.',
      '</p>',
    ].join("");
  }

  function fieldStyle() {
    return [
      "width:100%;box-sizing:border-box;padding:10px 12px;",
      "border:1.5px solid #e5e7eb;border-radius:8px;",
      "font-size:13px;font-family:system-ui,sans-serif;outline:none;",
    ].join("");
  }

  function btnStyle(accent) {
    return [
      "width:100%;padding:11px;background:" + accent + ";color:#fff;",
      "border:none;border-radius:8px;font-size:14px;font-weight:600;",
      "font-family:system-ui,sans-serif;cursor:pointer;",
    ].join("");
  }

  function escHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function dismissPopup(el) {
    setCooldown();
    el.style.transition = "opacity 0.2s";
    el.style.opacity = "0";
    setTimeout(function () { if (el && el.parentNode) el.parentNode.removeChild(el); }, 220);
  }

  function attachHandlers(el) {
    var closeBtn   = el.querySelector("#nitos-close");
    var submitBtn  = el.querySelector("#nitos-submit");
    var emailInput = el.querySelector("#nitos-email");
    var nameInput  = el.querySelector("#nitos-name");
    var formDiv    = el.querySelector("#nitos-form");
    var successDiv = el.querySelector("#nitos-success");

    if (closeBtn) {
      closeBtn.addEventListener("click", function () { dismissPopup(el); });
    }

    if (submitBtn && emailInput) {
      submitBtn.addEventListener("mouseenter", function () { this.style.opacity = "0.88"; });
      submitBtn.addEventListener("mouseleave", function () { this.style.opacity = "1"; });

      submitBtn.addEventListener("click", function () {
        var email = emailInput.value.trim();
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          emailInput.style.borderColor = "#ef4444";
          emailInput.focus();
          return;
        }
        emailInput.style.borderColor = "#e5e7eb";
        submitBtn.disabled = true;
        submitBtn.style.opacity = "0.7";
        submitBtn.textContent = "Subscribing…";

        fetch(apiBase + "/api/email/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email,
            name: nameInput ? nameInput.value.trim() : "",
            source: "popup",
            brand_id: brandId,
          }),
        })
          .then(function () {
            if (formDiv)    formDiv.style.display    = "none";
            if (successDiv) successDiv.style.display = "block";
            setCooldown();
            setTimeout(function () { dismissPopup(el); }, 2800);
          })
          .catch(function () {
            submitBtn.disabled = false;
            submitBtn.style.opacity = "1";
            submitBtn.textContent = (cfg && cfg.button_text) || "Subscribe";
          });
      });
    }
  }

  function showWidget(c) {
    if (isOnCooldown()) return;
    if (document.getElementById("nitos-popup-overlay")) return;
    var el = (c.style === "flyout") ? buildFlyout(c) : buildPopup(c);
    document.body.appendChild(el);
    attachHandlers(el);
  }

  function init() {
    loadConfig(function (c) {
      if (!c || !c.is_active) return;
      cfg = c;
      if (isOnCooldown()) return;
      var delay = ((c.delay_seconds || 8) * 1000);
      setTimeout(function () { showWidget(c); }, delay);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
