"use client";

import { AppLayout } from "@/components/app-layout";
import { Hammer } from "lucide-react";

const TABS = [
  { href: "/apps/ecom-builder", label: "Guide" },
  { href: "/apps/ecom-builder/research", label: "Research" },
  { href: "/apps/ecom-builder/branding", label: "Branding" },
  { href: "/apps/ecom-builder/settings", label: "Settings" },
];

export default function EcomBuilderLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout
      appName="Ecom Builder"
      appIcon={Hammer}
      subtitle="Step-by-step website creation guide & supplier research"
      tabs={TABS}
    >
      {children}
    </AppLayout>
  );
}
