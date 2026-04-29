import { PageHeader, EmptyState } from "@/components/page-header";
import { Zap } from "lucide-react";

export default function PostPurchasePage() {
  return (
    <>
      <PageHeader
        title="Post-Purchase Upsells"
        subtitle="Show targeted upsells on the Shopify Thank You page — one-click accept"
      />
      <div className="card">
        <EmptyState
          icon={Zap}
          title="Post-purchase funnels coming soon"
          hint="Build multi-step upsell funnels shown on the order confirmation page. Upsell → downsell → thank you. AI picks the best offer per order based on what was purchased."
        />
      </div>
    </>
  );
}
