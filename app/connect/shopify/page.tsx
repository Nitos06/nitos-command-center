"use client";
import { useState } from "react";
import { ShoppingBag, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

export default function ConnectShopifyPage() {
  const [shop, setShop] = useState("");
  const [brandId, setBrandId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleConnect() {
    const domain = shop.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
    if (!domain.includes(".myshopify.com") && !domain.includes(".")) {
      setError("Enter your full store domain, e.g. my-store.myshopify.com");
      return;
    }
    setError("");
    setLoading(true);
    const params = new URLSearchParams({ shop: domain });
    if (brandId) params.set("brandId", brandId);
    window.location.href = `/api/auth/shopify?${params.toString()}`;
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="card text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-7 h-7 text-primary-600" />
          </div>
          <h1 className="text-xl font-bold text-ink mb-1">Connect your Shopify store</h1>
          <p className="text-sm text-ink-muted mb-6">
            This will install NitaiEcomPro on your store and register all webhooks automatically.
          </p>

          <div className="space-y-3 text-left mb-6">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">Store domain</label>
              <input
                type="text"
                value={shop}
                onChange={e => setShop(e.target.value)}
                placeholder="my-store.myshopify.com"
                className="input w-full"
                onKeyDown={e => e.key === "Enter" && handleConnect()}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">Brand ID <span className="font-normal">(optional — leave blank for default)</span></label>
              <input
                type="text"
                value={brandId}
                onChange={e => setBrandId(e.target.value)}
                placeholder="uuid from Supabase brands table"
                className="input w-full font-mono text-xs"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 mb-4 text-left">{error}</p>
          )}

          <button
            onClick={handleConnect}
            disabled={loading || !shop.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Connecting...</>
            ) : (
              <>Connect store <ArrowRight className="w-4 h-4" /></>
            )}
          </button>

          <div className="mt-6 space-y-2 text-left">
            {[
              "OAuth — Shopify securely grants access, no password needed",
              "Webhooks auto-registered: orders, checkouts, customers",
              "Email flows activate immediately after connect",
            ].map(item => (
              <div key={item} className="flex items-start gap-2 text-xs text-ink-muted">
                <CheckCircle2 className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
