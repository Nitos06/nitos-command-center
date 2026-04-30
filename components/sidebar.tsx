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
  Zap,
  HelpCircle,
  Users,
  Hammer,
  Bot,
  PenLine,
  BookOpen,
  ChevronDown,
  Command,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useBrand } from "@/lib/brand-context";
import { useState } from "react";

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
      { href: "/taxes",        label: "Taxes (IL)",   icon: Receipt           },
      { href: "/ecom-builder", label: "Ecom Builder", icon: Hammer            },
      { href: "/agents",       label: "Agents",       icon: Bot               },
      { href: "/setup",        label: "Setup & Docs", icon: BookOpen          },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { activeBrand, brands, switchBrand } = useBrand();
  const [brandMenuOpen, setBrandMenuOpen] = useState(false);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const userEmail = "info@footyb.com";
  const userInitial = userEmail[0].toUpperCase();

  return (
    <aside className="w-56 shrink-0 h-screen sticky top-0 bg-[#0f0f10] flex flex-col border-r border-white/[0.06]">
      {/* Logo */}
      <div className="px-3 pt-4 pb-3">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="w-6 h-6 rounded-md bg-white/10 flex items-center justify-center shrink-0">
            <Command className="w-3.5 h-3.5 text-white/80" />
          </div>
          <span className="text-[13px] font-semibold text-white/90 tracking-tight">Command Center</span>
        </div>
      </div>

      {/* Brand switcher */}
      <div className="px-3 pb-3">
        <div className="relative">
          <button
            onClick={() => setBrandMenuOpen((o) => !o)}
            className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-md bg-white/[0.04] hover:bg-white/[0.07] transition-colors duration-100 group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-4 h-4 rounded-sm bg-indigo-500/60 flex items-center justify-center shrink-0">
                <span className="text-[9px] font-bold text-white leading-none">
                  {(activeBrand?.name ?? "B")[0].toUpperCase()}
                </span>
              </div>
              <span className="text-[12px] text-white/70 truncate">
                {activeBrand?.name ?? "Select brand"}
              </span>
            </div>
            <ChevronDown className="w-3 h-3 text-white/30 shrink-0 transition-transform duration-100 group-data-[open=true]:rotate-180" />
          </button>

          {brandMenuOpen && brands.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a1c] border border-white/[0.08] rounded-lg shadow-lg z-50 py-1 overflow-hidden">
              {brands.map((b) => (
                <button
                  key={b.id}
                  onClick={() => { switchBrand(b.id); setBrandMenuOpen(false); }}
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 py-1.5 text-left text-[12px] transition-colors duration-100",
                    b.id === activeBrand?.id
                      ? "text-white bg-white/[0.06]"
                      : "text-white/50 hover:text-white/80 hover:bg-white/[0.04]"
                  )}
                >
                  <div className="w-3.5 h-3.5 rounded-sm bg-indigo-500/50 flex items-center justify-center shrink-0">
                    <span className="text-[8px] font-bold text-white leading-none">{b.name[0].toUpperCase()}</span>
                  </div>
                  {b.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto space-y-0.5 pb-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label} className="mb-1">
            {section.label && (
              <div className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-2 pt-3 pb-1">
                {section.label}
              </div>
            )}
            {section.items.map(({ href, label, icon: Icon }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-all duration-100",
                    active
                      ? "bg-white/10 text-white font-medium"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-white/[0.06]">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] transition-all duration-100 mb-0.5",
            pathname.startsWith("/settings")
              ? "bg-white/10 text-white font-medium"
              : "text-white/60 hover:text-white hover:bg-white/5"
          )}
        >
          <Settings className="w-3.5 h-3.5 shrink-0" />
          Settings
        </Link>

        <button
          onClick={signOut}
          className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-[13px] text-white/60 hover:text-white hover:bg-white/5 transition-all duration-100 w-full"
        >
          <LogOut className="w-3.5 h-3.5 shrink-0" />
          Sign out
        </button>

        {/* User row */}
        <div className="flex items-center gap-2 px-2.5 py-2 mt-2 border-t border-white/[0.06]">
          <div className="w-5 h-5 rounded-full bg-indigo-500/40 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-semibold text-white leading-none">{userInitial}</span>
          </div>
          <span className="text-[11px] text-white/30 truncate">{userEmail}</span>
        </div>
      </div>
    </aside>
  );
}
