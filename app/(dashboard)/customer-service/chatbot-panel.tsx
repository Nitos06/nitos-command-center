"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Copy, CheckCircle2, MessageSquare, Bot } from "lucide-react";

interface ChatbotPanelProps {
  brandId: string | null;
  recentChats: any[];
  appUrl: string;
}

export function ChatbotPanel({ brandId, recentChats, appUrl }: ChatbotPanelProps) {
  const [testMsg, setTestMsg] = useState("");
  const [testHistory, setTestHistory] = useState<{ role: "user" | "bot"; text: string }[]>([]);
  const [testLoading, setTestLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [sessionId] = useState(() => `test-${Date.now()}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [testHistory]);

  async function sendTest(e: React.FormEvent) {
    e.preventDefault();
    if (!testMsg.trim()) return;
    const msg = testMsg.trim();
    setTestMsg("");
    setTestHistory(h => [...h, { role: "user", text: msg }]);
    setTestLoading(true);
    try {
      const res = await fetch("/api/cs/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, sessionId, brandId }),
      });
      const data = await res.json();
      setTestHistory(h => [...h, { role: "bot", text: data.reply ?? data.error ?? "Error" }]);
    } catch {
      setTestHistory(h => [...h, { role: "bot", text: "Connection error." }]);
    } finally {
      setTestLoading(false);
    }
  }

  function copySnippet(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  const embedSnippet = brandId
    ? `<script src="${appUrl}/chatbot.js"\n  data-brand="${brandId}"\n  data-name="Support"\n  data-color="#6366f1"\n  data-greeting="Hi! How can I help you today?"\n></script>`
    : `<!-- Select a brand first to get your embed code -->`;

  const shopifySnippet = `{%- comment -%}
  Paste this in theme.liquid before </body>
{%- endcomment -%}
<script
  src="${appUrl}/chatbot.js"
  data-brand="{{ shop.metafields.nitai.brand_id | default: '${brandId ?? "YOUR_BRAND_ID"}' }}"
  data-name="Support"
  data-color="#6366f1"
></script>`;

  return (
    <div className="space-y-6">
      {/* Embed codes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <h3 className="font-semibold text-sm text-ink mb-2">HTML embed snippet</h3>
          <p className="text-xs text-ink-muted mb-3">Paste before <code className="bg-surface-tint px-1 rounded">&lt;/body&gt;</code> on any webpage.</p>
          <div className="relative">
            <pre className="text-[11px] text-ink-muted bg-surface-tint rounded-xl p-3 border border-surface-border overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
              {embedSnippet}
            </pre>
            <button
              onClick={() => copySnippet(embedSnippet, "html")}
              className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-surface-border transition-colors"
            >
              {copied === "html" ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-ink-muted" />}
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="font-semibold text-sm text-ink mb-2">Shopify theme.liquid</h3>
          <p className="text-xs text-ink-muted mb-3">Add to <code className="bg-surface-tint px-1 rounded">theme.liquid</code> in Shopify theme editor.</p>
          <div className="relative">
            <pre className="text-[11px] text-ink-muted bg-surface-tint rounded-xl p-3 border border-surface-border overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
              {shopifySnippet}
            </pre>
            <button
              onClick={() => copySnippet(shopifySnippet, "shopify")}
              className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-surface-border transition-colors"
            >
              {copied === "shopify" ? <CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 text-ink-muted" />}
            </button>
          </div>
        </div>
      </div>

      {/* Configuration hints */}
      <div className="card">
        <h3 className="font-semibold text-sm text-ink mb-3">Widget configuration attributes</h3>
        <table className="w-full text-xs">
          <thead className="text-left text-ink-muted">
            <tr><th className="pb-2">Attribute</th><th className="pb-2">Default</th><th className="pb-2">Description</th></tr>
          </thead>
          <tbody className="font-mono">
            {[
              ["data-brand", "—", "Your brand ID from Supabase (required)"],
              ["data-name", "Support", "Bot name shown in header"],
              ["data-color", "#6366f1", "Primary theme color (hex)"],
              ["data-greeting", "Hi! How can I help you today?", "Opening message"],
              ["data-position", "right", '"right" or "left"'],
              ["data-api", "(auto)", "API base URL (auto-detected from script src)"],
            ].map(([attr, def, desc]) => (
              <tr key={attr as string} className="border-t border-surface-border">
                <td className="py-1.5 text-primary-400">{attr}</td>
                <td className="py-1.5 text-ink-muted pr-4">{def}</td>
                <td className="py-1.5 text-ink-muted font-sans">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-xs text-ink-subtle mt-3">The bot uses your brand&apos;s FAQ library and CS rules from Supabase automatically. Update FAQ entries in the FAQ Library tab and the bot learns immediately.</p>
      </div>

      {/* Live test console */}
      <div className="card">
        <h3 className="font-semibold text-sm text-ink mb-3 flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary-500" />
          Test the chatbot live
        </h3>
        <p className="text-xs text-ink-muted mb-3">This runs the real AI — same model and context as the website widget.</p>

        <div className="border border-surface-border rounded-xl overflow-hidden">
          {/* Messages */}
          <div className="h-64 overflow-y-auto p-3 space-y-2 bg-surface-tint/20">
            {testHistory.length === 0 && (
              <div className="flex items-center justify-center h-full text-xs text-ink-subtle">
                Send a test message to try the bot
              </div>
            )}
            {testHistory.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-primary-500 text-white rounded-br-sm"
                    : "bg-white border border-surface-border text-ink rounded-bl-sm shadow-sm"
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {testLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-surface-border px-3 py-2 rounded-xl rounded-bl-sm">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-ink-muted" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendTest} className="flex gap-2 p-2.5 border-t border-surface-border bg-white">
            <input
              value={testMsg}
              onChange={e => setTestMsg(e.target.value)}
              placeholder="Type a test message…"
              className="flex-1 px-3 py-1.5 rounded-lg border border-surface-border text-xs text-ink focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
            <button type="submit" disabled={testLoading || !testMsg.trim()} className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5 disabled:opacity-50">
              <Send className="w-3 h-3" />
              Send
            </button>
          </form>
        </div>
      </div>

      {/* Recent chatbot conversations */}
      {recentChats.length > 0 && (
        <div className="card">
          <h3 className="font-semibold text-sm text-ink mb-3 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Recent website chatbot conversations
          </h3>
          <table className="w-full text-sm">
            <thead className="text-left text-ink-muted text-xs">
              <tr><th className="py-1.5">Session</th><th>First message</th><th>Started</th><th>Status</th></tr>
            </thead>
            <tbody>
              {recentChats.map((t: any) => (
                <tr key={t.id} className="border-t border-surface-border">
                  <td className="py-1.5 text-xs font-mono text-ink-subtle truncate max-w-[100px]">{t.id?.slice(0, 12)}…</td>
                  <td className="text-xs text-ink truncate max-w-[260px]">{t.subject ?? "—"}</td>
                  <td className="text-xs text-ink-muted">{t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}</td>
                  <td><span className={t.status === "resolved" ? "badge-success" : "badge-warn"}>{t.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
