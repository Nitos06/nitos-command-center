"use client";

import { AppLayout } from "@/components/app-layout";
import { Gift } from "lucide-react";

const TABS = [
  { href: "/apps/gift", label: "Rules" },
  { href: "/apps/gift/analytics", label: "Analytics" },
  { href: "/apps/gift/settings", label: "Settings" },
];

export default function GiftLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout
      appName="Gift with Purchase"
      appIcon={Gift}
      subtitle="Free gift offers to boost AOV and conversions"
      tabs={TABS}
    >
      {children}
    </AppLayout>
  );
}
