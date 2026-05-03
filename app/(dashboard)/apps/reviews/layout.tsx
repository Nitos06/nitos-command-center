"use client";

import { AppLayout } from "@/components/app-layout";
import { Star } from "lucide-react";

const TABS = [
  { href: "/apps/reviews", label: "Reviews" },
  { href: "/apps/reviews/qa", label: "Q&A" },
  { href: "/apps/reviews/request-settings", label: "Request Settings" },
  { href: "/apps/reviews/import", label: "Import" },
  { href: "/apps/reviews/creative-center", label: "Creative Center" },
  { href: "/apps/reviews/widgets", label: "Widgets" },
  { href: "/apps/reviews/settings", label: "Settings" },
];

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout
      appName="Reviews"
      appIcon={Star}
      subtitle="Professional review management — Judge.me replacement"
      tabs={TABS}
    >
      {children}
    </AppLayout>
  );
}
