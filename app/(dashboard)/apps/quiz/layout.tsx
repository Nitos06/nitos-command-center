"use client";

import { AppLayout } from "@/components/app-layout";
import { HelpCircle } from "lucide-react";

const TABS = [
  { href: "/apps/quiz", label: "Design & Configure" },
  { href: "/apps/quiz/analytics", label: "Analytics" },
  { href: "/apps/quiz/roi", label: "ROI Calculator" },
  { href: "/apps/quiz/settings", label: "Settings" },
];

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout
      appName="Quiz"
      appIcon={HelpCircle}
      subtitle="Product recommendation quizzes — Octane AI / RevenueHunt replacement"
      tabs={TABS}
    >
      {children}
    </AppLayout>
  );
}
