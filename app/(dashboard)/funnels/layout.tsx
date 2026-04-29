"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Filter, Link2, Gift, FileText, MessageCircle, Mail, Users } from "lucide-react";

const TABS = [
  { href: "/funnels", label: "Overview", icon: Filter, exact: true },
  { href: "/funnels/link-in-bio", label: "Link in Bio", icon: Link2 },
  { href: "/funnels/lead-magnets", label: "Lead Magnets", icon: Gift },
  { href: "/funnels/landing-pages", label: "Landing Pages", icon: FileText },
  { href: "/funnels/auto-dms", label: "Auto DMs", icon: MessageCircle },
  { href: "/funnels/email-flows", label: "Email Flows", icon: Mail },
  { href: "/funnels/contacts", label: "Contacts", icon: Users },
];

export default function FunnelsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div>
      <nav className="flex gap-1 mb-6 overflow-x-auto pb-1 border-b border-surface-border">
        {TABS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition",
                active
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : "text-ink-muted hover:text-ink hover:bg-primary-50"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
