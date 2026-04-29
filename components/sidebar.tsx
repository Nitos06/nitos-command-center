"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Swords,
  LayoutDashboard,
  Megaphone,
  Search,
  Share2,
  Mail,
  HeadphonesIcon,
  Receipt,
  Settings,
  LogOut,
  Star,
  Package,
  Zap,
  HelpCircle,
  Users,
  MousePointerClick,
  Hammer,
  Bot,
  PenLine,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { BrandSwitcher } from "@/components/brand-switcher";

type NavItem = { href: string; label: string; icon: React.ElementType };
type NavSection = { label: string; items: NavItem[] };

const NAV_SECTIONS: NavSection[] = [
  {
    label: "",
    items: [
      { href: "/war-room", label: "War Room",   icon: Swords          },
      { href: "/",         label: "Overview",   icon: LayoutDashboard },
    ],
  },
  {
    label: "Store",
    items: [
      { href: "/reviews",       label: "Reviews",        icon: Star         },
      { href: "/bundles",       label: "Bundles",         icon: Package      },
      { href: "/post-purchase", label: "Post-Purchase",   icon: Zap          },
      { href: "/quiz",          label: "Quiz",            icon: HelpCircle   },
      { href: "/affiliates",    label: "Affiliates",      icon: Users        },
      { href: "/bulk-editor",   label: "Bulk Editor",     icon: PenLine      },
    ],
  },
  {
    label: "Engage",
    items: [
      { href: "/ads",               label: "Ads",              icon: Megaphone      },
      { href: "/emails-sms",        label: "Emails & SMS",     icon: Mail           },
      { href: "/customer-service",  label: "Customer Service", icon: HeadphonesIcon },
      { href: "/socials",           label: "Socials",          icon: Share2         },
      { href: "/seo",               label: "SEO",              icon: Search         },
    ],
  },
  {
    label: "Analyze",
    items: [
      { href: "/cro",          label: "CRO",          icon: MousePointerClick },
      { href: "/taxes",        label: "Taxes (IL)",   icon: Receipt           },
      { href: "/ecom-builder", label: "Ecom Builder", icon: Hammer            },
      { href: "/agents",       label: "Agents",       icon: Bot               },
    ],
  },
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
    <aside className="w-60 shrink-0 h-screen sticky top-0 bg-sidebar-bg border-r border-sidebar-border flex flex-col">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm shadow-pop">
            N
          </div>
          <div>
            <div className="font-semibold text-white text-sm leading-tight">Nitos</div>
            <div className="text-[10px] text-sidebar-text">Command Center</div>
          </div>
        </div>
      </div>

      {/* Brand Switcher */}
      <BrandSwitcher />

      {/* Nav */}
      <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {section.label && (
              <div className="sidebar-section-label">{section.label}</div>
            )}
            {section.items.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-100",
                    active
                      ? "bg-sidebar-active text-sidebar-active-text font-medium"
                      : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-sidebar-border space-y-1">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all duration-100",
            pathname.startsWith("/settings")
              ? "bg-sidebar-active text-sidebar-active-text font-medium"
              : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
          )}
        >
          <Settings className="w-4 h-4" />
          Settings
        </Link>
        <button
          onClick={signOut}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-sidebar-text hover:bg-sidebar-hover hover:text-white transition-all duration-100 w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
