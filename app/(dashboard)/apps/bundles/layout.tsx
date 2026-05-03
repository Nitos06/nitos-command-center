"use client";

import { AppLayout } from "@/components/app-layout";
import { Package } from "lucide-react";

const TABS = [
  { href: "/apps/bundles", label: "Volume Editor" },
  { href: "/apps/bundles/manager", label: "Bundle Manager" },
  { href: "/apps/bundles/analytics", label: "Analytics" },
  { href: "/apps/bundles/settings", label: "Settings" },
];

export default function BundlesLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout
      appName="Bundles"
      appIcon={Package}
      subtitle="Frequently Bought Together + volume discounts — KaChingBundles replacement"
      tabs={TABS}
    >
      {children}
    </AppLayout>
  );
}
