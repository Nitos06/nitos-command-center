"use client";

import { AppLayout } from "@/components/app-layout";
import { Users } from "lucide-react";

const TABS = [
  { href: "/apps/affiliates", label: "Dashboard" },
  { href: "/apps/affiliates/programs", label: "Programs" },
  { href: "/apps/affiliates/motivation", label: "Motivation" },
  { href: "/apps/affiliates/reach-out", label: "Reach Out" },
  { href: "/apps/affiliates/payouts", label: "Payouts" },
  { href: "/apps/affiliates/analytics", label: "Analytics" },
  { href: "/apps/affiliates/settings", label: "Settings" },
];

export default function AffiliatesLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout
      appName="Affiliates"
      appIcon={Users}
      subtitle="Full affiliate program management — UpPromote replacement"
      tabs={TABS}
    >
      {children}
    </AppLayout>
  );
}
