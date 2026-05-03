"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ChevronRight, Settings } from "lucide-react";

interface Tab {
  href: string;
  label: string;
}

interface AppLayoutProps {
  appName: string;
  appIcon: React.ElementType;
  subtitle?: string;
  tabs: Tab[];
  action?: React.ReactNode;
  children: React.ReactNode;
}

export function AppLayout({ appName, appIcon: Icon, subtitle, tabs, action, children }: AppLayoutProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href.endsWith("/settings")) return pathname === href;
    const segments = href.split("/").filter(Boolean);
    const pathSegments = pathname.split("/").filter(Boolean);
    if (segments.length === pathSegments.length) return pathname === href;
    return pathname.startsWith(href + "/");
  };

  const mainTabs = tabs.filter(t => !t.href.endsWith("/settings"));
  const settingsTab = tabs.find(t => t.href.endsWith("/settings"));

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
          <Link href="/" className="hover:text-gray-600 transition">Dashboard</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-600 font-medium">{appName}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Icon className="w-4.5 h-4.5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 tracking-tight leading-snug">{appName}</h1>
              {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      </div>

      {/* Tab navigation */}
      <div className="flex items-center gap-1 border-b border-gray-200 mb-6">
        <div className="flex items-center gap-0.5 flex-1">
          {mainTabs.map(tab => {
            const active = tab.href === pathname || (tab.href === tabs[0]?.href && pathname === tabs[0]?.href);
            const activeTab = isActive(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "px-3 py-2 text-sm font-medium border-b-2 transition-colors -mb-px",
                  activeTab
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
        {settingsTab && (
          <Link
            href={settingsTab.href}
            className={cn(
              "p-2 rounded-lg transition-colors -mb-px",
              isActive(settingsTab.href)
                ? "text-indigo-600 bg-indigo-50"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
            )}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </Link>
        )}
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
