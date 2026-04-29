import { PageHeader, EmptyState } from "@/components/page-header";
import { Package } from "lucide-react";

export default function BundlesPage() {
  return (
    <>
      <PageHeader
        title="Bundles"
        subtitle="Frequently Bought Together + volume discounts — replacing KaChingBundles"
      />
      <div className="card">
        <EmptyState
          icon={Package}
          title="Bundles coming soon"
          hint="Create product bundles with discounts, volume tiers, and 'Frequently Bought Together' suggestions powered by your order history. The storefront widget auto-installs with one click."
        />
      </div>
    </>
  );
}
