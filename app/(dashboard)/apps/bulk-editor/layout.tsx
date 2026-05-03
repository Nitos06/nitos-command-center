"use client";

import { AppLayout } from "@/components/app-layout";
import { PenLine } from "lucide-react";

const TABS = [
  { href: "/apps/bulk-editor", label: "Editor" },
  { href: "/apps/bulk-editor/jobs", label: "Job History" },
  { href: "/apps/bulk-editor/settings", label: "Settings" },
];

export default function BulkEditorLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppLayout
      appName="Bulk Editor"
      appIcon={PenLine}
      subtitle="Bulk import, export & edit — Matrixify replacement"
      tabs={TABS}
    >
      {children}
    </AppLayout>
  );
}
