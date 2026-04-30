"use client";

import { useBrand } from "@/lib/brand-context";
import { ChevronDown, Plus } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export function BrandSwitcher() {
  const { activeBrand, brands, switchBrand } = useBrand();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (brands.length === 0) return null;

  return (
    <div ref={ref} className="relative px-4 py-3 border-b border-sidebar-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full gap-2 rounded-lg px-2.5 py-2 hover:bg-sidebar-hover transition-colors"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {activeBrand?.logo_url ? (
            <img
              src={activeBrand.logo_url}
              alt=""
              className="w-6 h-6 rounded-md object-cover shrink-0"
            />
          ) : (
            <div className="w-6 h-6 rounded-md bg-primary-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {activeBrand?.name?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
          )}
          <span className="text-sm font-medium text-white truncate">
            {activeBrand?.name ?? "Select brand"}
          </span>
        </div>
        <ChevronDown className={cn("w-3.5 h-3.5 text-sidebar-text shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-3 right-3 top-full mt-1 bg-sidebar-bg border border-sidebar-border rounded-lg shadow-lg z-50 py-1 max-h-64 overflow-y-auto">
          {brands.map((b) => (
            <button
              key={b.id}
              onClick={() => {
                switchBrand(b.id);
                setOpen(false);
              }}
              className={cn(
                "flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors",
                b.id === activeBrand?.id
                  ? "bg-sidebar-active text-sidebar-active-text"
                  : "text-sidebar-text hover:bg-sidebar-hover hover:text-white"
              )}
            >
              {b.logo_url ? (
                <img src={b.logo_url} alt="" className="w-5 h-5 rounded object-cover shrink-0" />
              ) : (
                <div className="w-5 h-5 rounded bg-primary-600/40 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                  {b.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="truncate">{b.name}</span>
            </button>
          ))}
          <div className="border-t border-sidebar-border mt-1 pt-1">
            <a
              href="/ecom-builder"
              className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-sidebar-text hover:bg-sidebar-hover hover:text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              New brand
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
