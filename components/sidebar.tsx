"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Megaphone,
  Search,
  MousePointerClick,
  Share2,
  Mail,
  HeadphonesIcon,
  Receipt,
  Hammer,
  Settings,
  LogOut,
  Filter,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/ads", label: "Ads", icon: Megaphone },
  { href: "/seo", label: "SEO", icon: Search },
  { href: "/cro", label: "CRO", icon: MousePointerClick },
  { href: "/socials", label: "Socials", icon: Share2 },
  { href: "/funnels", label: "Funnels", icon: Filter },
  { href: "/emails-sms", label: "Emails & SMS", icon: Mail },
  { href: "/customer-service", label: "Customer Service", icon: HeadphonesIcon },
  { href: "/taxes", label: "Taxes (IL)", icon: Receipt },
  { href: "/ecom-builder", label: "Ecom Builder", icon: Hammer },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 bg-surface border-r border-surface-border flex flex-col">
      <div className="px-5 py-5 border-b border-surface-border">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white font-bold">P</div>
          <div>
            <div className="font-semibold text-ink leading-tight">Paidads</div>
            <div className="text-[11px] text-ink-muted">Control panel</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition",
                active
                  ? "bg-primary-50 text-primary-700 font-medium"
                  : "text-ink-muted hover:bg-primary-50 hover:text-primary-700"
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-surface-border">
        <button onClick={signOut} className="btn-ghost w-full justify-start text-sm">
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
