import { PageHeader, EmptyState } from "@/components/page-header";
import { Users } from "lucide-react";

export default function AffiliatesPage() {
  return (
    <>
      <PageHeader
        title="Affiliate Marketing"
        subtitle="Track clicks, conversions, and commissions — replacing UpPromote"
      />
      <div className="card">
        <EmptyState
          icon={Users}
          title="Affiliate program coming soon"
          hint="Invite affiliates, give them unique discount codes, track clicks and orders automatically via Shopify webhooks. Pay commissions by percentage or fixed amount. Full dashboard per affiliate."
        />
      </div>
    </>
  );
}
