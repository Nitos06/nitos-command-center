/* Nitos Command Center — Website Chatbot Widget
   Embed: <script src="https://your-app.vercel.app/chatbot.js" data-brand="BRAND_ID"></script>
   Or with specific API URL: data-api="https://..."
*/
(function () {
  "use strict";

  var script = document.currentScript || (function () {
    var scripts = document.getElementsByTagName("script");
    return scripts[scripts.length - 1];
  })();

  var brandId  = script.getAttribute("data-brand") || "";
  var apiBase  = script.getAttribute("data-api")   || script.src.replace("/chatbot.js", "");
  var position = script.getAttribute("data-position") || "right"; // "right" or "left"
  var themeColor = script.getAttribute("data-color") || "#6366f1";
  var greeting = script.getAttribute("data-greeting") || "Hi! How can I help you today?";
  var botName  = script.getAttribute("data-name") || "Support";

  var sessionId = null;
  var isOpen = false;

  // ── Inject styles ──────────────────────────────────────────────
  var style = document.createElement("style");
  style.textContent = [
    "#nc-chat-bubble{position:fixed;bottom:24px;" + (position === "left" ? "left:24px" : "right:24px") + ";z-index:99999;width:52px;height:52px;border-radius:50%;background:" + themeColor + ";box-shadow:0 4px 16px rgba(0,0,0,0.25);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .2s;border:none;outline:none;}",
    "#nc-chat-bubble:hover{transform:scale(1.08);}",
    "#nc-chat-bubble svg{width:24px;height:24px;fill:white;}",
    "#nc-chat-window{position:fixed;bottom:88px;" + (position === "left" ? "left:24px" : "right:24px") + ";z-index:99999;width:340px;max-width:calc(100vw - 32px);height:480px;max-height:calc(100vh - 120px);background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.18);display:flex;flex-direction:column;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;transition:opacity .2s,transform .2s;}",
    "#nc-chat-window.nc-hidden{opacity:0;transform:translateY(12px) scale(.97);pointer-events:none;}",
    "#nc-chat-header{background:" + themeColor + ";color:white;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}",
    "#nc-chat-header .nc-name{font-weight:600;font-size:15px;}",
    "#nc-chat-header .nc-close{background:none;border:none;color:white;cursor:pointer;opacity:.8;font-size:20px;line-height:1;padding:0;}",
    "#nc-chat-header .nc-close:hover{opacity:1;}",
    "#nc-chat-messages{flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:8px;background:#f8f8fc;}",
    ".nc-msg{max-width:82%;padding:9px 13px;border-radius:14px;line-height:1.45;word-wrap:break-word;font-size:13.5px;}",
    ".nc-msg.nc-bot{background:#fff;color:#1a1a2e;border:1px solid #e8e8f0;border-bottom-left-radius:4px;align-self:flex-start;box-shadow:0 1px 4px rgba(0,0,0,.06);}",
    ".nc-msg.nc-user{background:" + themeColor + ";color:white;border-bottom-right-radius:4px;align-self:flex-end;}",
    ".nc-typing{display:flex;gap:4px;padding:10px 14px;align-self:flex-start;}",
    ".nc-dot{width:7px;height:7px;border-radius:50%;background:#bbb;animation:nc-bounce 1.2s infinite;}",
    ".nc-dot:nth-child(2){animation-delay:.2s;}.nc-dot:nth-child(3){animation-delay:.4s;}",
    "@keyframes nc-bounce{0%,60%,100%{transform:translateY(0);}30%{transform:translateY(-6px);}}",
    "#nc-chat-input-row{padding:10px 12px;border-top:1px solid #eee;display:flex;gap:8px;align-items:center;flex-shrink:0;background:#fff;}",
    "#nc-chat-input{flex:1;border:1.5px solid #e0e0ee;border-radius:10px;padding:8px 12px;font-size:13.5px;outline:none;resize:none;font-family:inherit;color:#1a1a2e;}",
    "#nc-chat-input:focus{border-color:" + themeColor + ";}",
    "#nc-chat-send{background:" + themeColor + ";color:white;border:none;border-radius:10px;width:36px;height:36px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:opacity .15s;}",
    "#nc-chat-send:disabled{opacity:.5;cursor:not-allowed;}",
    "#nc-chat-powered{text-align:center;font-size:10px;color:#bbb;padding:4px 0 8px;}",
  ].join("\n");
  document.head.appendChild(style);

  // ── Build DOM ──────────────────────────────────────────────────
  var bubble = document.createElement("button");
  bubble.id = "nc-chat-bubble";
  bubble.setAttribute("aria-label", "Open chat");
  bubble.innerHTML = '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>';

  var win = document.createElement("div");
  win.id = "nc-chat-window";
  win.className = "nc-hidden";
  win.innerHTML = [
    '<div id="nc-chat-header">',
    '  <span class="nc-name">' + botName + '</span>',
    '  <button class="nc-close" aria-label="Close">&times;</button>',
    '</div>',
    '<div id="nc-chat-messages"></div>',
    '<div id="nc-chat-input-row">',
    '  <textarea id="nc-chat-input" rows="1" placeholder="Type a message…"></textarea>',
    '  <button id="nc-chat-send" aria-label="Send">',
    '    <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>',
    '  </button>',
    '</div>',
    '<div id="nc-chat-powered">Powered by AI</div>',
  ].join("");

  document.body.appendChild(bubble);
  document.body.appendChild(win);

  var messages = win.querySelector("#nc-chat-messages");
  var input    = win.querySelector("#nc-chat-input");
  var sendBtn  = win.querySelector("#nc-chat-send");

  // ── Helpers ────────────────────────────────────────────────────
  function addMsg(text, who) {
    var div = document.createElement("div");
    div.className = "nc-msg nc-" + who;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }

  function showTyping() {
    var el = document.createElement("div");
    el.className = "nc-typing";
    el.innerHTML = '<div class="nc-dot"></div><div class="nc-dot"></div><div class="nc-dot"></div>';
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
    return el;
  }

  function toggleOpen() {
    isOpen = !isOpen;
    win.classList.toggle("nc-hidden", !isOpen);
    bubble.innerHTML = isOpen
      ? '<svg viewBox="0 0 24 24" fill="white" width="22" height="22"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>'
      : '<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg>';
    if (isOpen && messages.children.length === 0) {
      addMsg(greeting, "bot");
    }
    if (isOpen) input.focus();
  }

  async function sendMessage() {
    var text = (input.value || "").trim();
    if (!text) return;
    input.value = "";
    input.style.height = "auto";
    addMsg(text, "user");
    sendBtn.disabled = true;

    var typingEl = showTyping();

    try {
      var res = await fetch(apiBase + "/api/cs/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, sessionId: sessionId, brandId: brandId }),
      });
      var data = await res.json();
      typingEl.remove();
      if (data.error) {
        addMsg("Sorry, something went wrong. Please try again.", "bot");
      } else {
        sessionId = data.sessionId || sessionId;
        addMsg(data.reply, "bot");
      }
    } catch (err) {
      typingEl.remove();
      addMsg("Connection issue. Please refresh and try again.", "bot");
    } finally {
      sendBtn.disabled = false;
      input.focus();
    }
  }

  // ── Events ─────────────────────────────────────────────────────
  bubble.addEventListener("click", toggleOpen);
  win.querySelector(".nc-close").addEventListener("click", toggleOpen);
  sendBtn.addEventListener("click", sendMessage);
  input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  input.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = Math.min(this.scrollHeight, 80) + "px";
  });
})();
