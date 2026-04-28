// Cookie Consent Banner - Reference Implementation
// Stack: Next.js + shadcn/ui (Dialog, Sheet, Button, Switch) + Tailwind + lucide-react
// Language: Hebrew (RTL) - adapt text for your project language
//
// Required shadcn components: dialog, sheet, button, switch
// Install: npx shadcn@latest add dialog sheet button switch

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Cookie, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";

// ---------------------------------------------------------------------------
// Types & Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = "cookie-consent";

type CookiePreferences = {
  essential: boolean;
  functional: boolean;
  analytics: boolean;
  timestamp: string;
};

type CookieDisclosure = {
  name: string;
  purpose: string;
  duration: string;
};

// CUSTOMIZE: Update categories, descriptions, and disclosures for your project
const COOKIE_CATEGORIES = [
  {
    id: "essential" as const,
    label: "חיוני", // "Essential"
    description:
      "נדרש כדי לאפשר פונקציונליות בסיסית של האתר. אינך רשאי להשבית קובצי Cookie חיוניים.",
    alwaysOn: true,
    disclosures: [
      {
        name: "next-auth.session-token",
        purpose: "אימות משתמש ושמירת מצב התחברות",
        duration: "עד סגירת הדפדפן / 30 ימים",
      },
      {
        name: "next-auth.csrf-token",
        purpose: "הגנה מפני התקפות CSRF",
        duration: "עד סגירת הדפדפן",
      },
      {
        name: "next-auth.callback-url",
        purpose: "ניתוב חזרה לאחר התחברות",
        duration: "עד סגירת הדפדפן",
      },
    ] as CookieDisclosure[],
  },
  {
    id: "functional" as const,
    label: "התאמה אישית", // "Personalization"
    description:
      "אפשר לאתר לזכור בחירות שאתה עושה (כגון שם המשתמש, השפה או האזור שבו אתה נמצא) ולספק תכונות משופרות ואישיות יותר.",
    alwaysOn: false,
    disclosures: [
      {
        name: "cookie-consent",
        purpose: "שמירת העדפות הסכמה לעוגיות",
        duration: "12 חודשים",
      },
      {
        name: "accessibility-prefs (localStorage)",
        purpose: "הגדרות נגישות (גודל גופן, ניגודיות, הדגשת קישורים)",
        duration: "ללא תפוגה",
      },
      {
        name: "theme (localStorage)",
        purpose: "העדפת ערכת צבעים (בהיר/כהה)",
        duration: "ללא תפוגה",
      },
    ] as CookieDisclosure[],
  },
  {
    id: "analytics" as const,
    label: "אנליטיקה", // "Analytics"
    description:
      "עוזר למפעיל האתר להבין את ביצועי האתר שלו, כיצד המבקרים מקיימים אינטראקציה עם האתר והאם ייתכנו בעיות טכניות.",
    alwaysOn: false,
    disclosures: [] as CookieDisclosure[],
  },
];

// ---------------------------------------------------------------------------
// Storage Helpers
// ---------------------------------------------------------------------------

function getStoredPreferences(): CookiePreferences | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null && "essential" in parsed) {
      return parsed as CookiePreferences;
    }
    return null;
  } catch {
    return null;
  }
}

function savePreferences(prefs: CookiePreferences) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    window.dispatchEvent(new Event("cookie-consent-updated"));
  } catch {
    // Gracefully degrade - private browsing or full storage
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function CookieConsentBanner() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return !getStoredPreferences();
  });
  const [isReopen, setIsReopen] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [functional, setFunctional] = useState(true);
  const [analytics, setAnalytics] = useState(true);
  const [expandedDisclosures, setExpandedDisclosures] = useState<Set<string>>(
    new Set()
  );

  // Listen for reopen event (dispatched from footer "Cookie Settings" button)
  useEffect(() => {
    const handleReopen = () => {
      const stored = getStoredPreferences();
      if (stored) {
        setFunctional(stored.functional);
        setAnalytics(stored.analytics);
      }
      setVisible(true);
      setIsReopen(true);
    };

    window.addEventListener("reopen-cookie-consent", handleReopen);
    return () => window.removeEventListener("reopen-cookie-consent", handleReopen);
  }, []);

  const handleAcceptAll = useCallback(() => {
    savePreferences({
      essential: true,
      functional: true,
      analytics: true,
      timestamp: new Date().toISOString(),
    });
    setVisible(false);
    setShowPreferences(false);
  }, []);

  const handleRejectNonEssential = useCallback(() => {
    savePreferences({
      essential: true,
      functional: false,
      analytics: false,
      timestamp: new Date().toISOString(),
    });
    setVisible(false);
    setShowPreferences(false);
  }, []);

  const handleSavePreferences = useCallback(() => {
    savePreferences({
      essential: true,
      functional,
      analytics,
      timestamp: new Date().toISOString(),
    });
    setVisible(false);
    setShowPreferences(false);
    setExpandedDisclosures(new Set());
  }, [functional, analytics]);

  const toggleDisclosure = useCallback((id: string) => {
    setExpandedDisclosures((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const getToggleValue = (id: string) => {
    if (id === "functional") return functional;
    if (id === "analytics") return analytics;
    return true;
  };

  const setToggleValue = (id: string, value: boolean) => {
    if (id === "functional") setFunctional(value);
    if (id === "analytics") setAnalytics(value);
  };

  if (!visible) return null;

  return (
    <>
      {/* ── Main Consent Modal ── */}
      <Dialog
        open={visible && !showPreferences}
        onOpenChange={(open) => {
          if (!open && isReopen) {
            setVisible(false);
          }
        }}
      >
        <DialogContent
          showCloseButton={isReopen}
          onPointerDownOutside={(e) => {
            if (!isReopen) e.preventDefault();
          }}
          onEscapeKeyDown={(e) => {
            if (!isReopen) e.preventDefault();
          }}
          className="max-w-sm gap-0 p-0 overflow-hidden"
        >
          {/* Header */}
          <div className="flex flex-col items-center gap-3 px-6 pt-8 pb-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Cookie className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            </div>
            {/* CUSTOMIZE: Title */}
            <DialogTitle className="text-lg font-bold">
              הגדרות פרטיות
            </DialogTitle>
            {/* CUSTOMIZE: Description + privacy link */}
            <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
              אתר זה משתמש בטכנולוגיות כגון קובצי Cookie כדי לאפשר פונקציונליות
              חיונית של האתר, כמו גם עבור אנליטיקה, התאמה אישית ופרסום ממוקד.{" "}
              <Link
                href="/privacy"
                className="font-medium text-primary underline underline-offset-2 hover:text-primary/80"
              >
                מדיניות פרטיות
              </Link>
              .
            </DialogDescription>
          </div>

          {/* Buttons - all same style (primary) */}
          <div className="border-t px-6 py-5">
            <div className="flex flex-col gap-2">
              <Button onClick={handleAcceptAll} className="w-full min-h-11">
                קבל
              </Button>
              <Button onClick={handleRejectNonEssential} className="w-full min-h-11">
                סרב לקובצי עוגיות לא חיוניות
              </Button>
              <Button onClick={() => setShowPreferences(true)} className="w-full min-h-11">
                נהל העדפות
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Preferences Side Panel (Sheet) ── */}
      <Sheet
        open={showPreferences}
        onOpenChange={(open) => {
          if (!open) {
            setShowPreferences(false);
            setExpandedDisclosures(new Set());
          }
        }}
      >
        <SheetContent side="right" className="overflow-y-auto p-0 flex flex-col">
          <SheetHeader className="p-6 pb-4">
            {/* CUSTOMIZE: Panel title */}
            <SheetTitle className="text-xl font-bold">העדפות אחסון</SheetTitle>
            {/* CUSTOMIZE: Panel description */}
            <SheetDescription className="text-sm leading-relaxed">
              כאשר אתה מבקר באתרים, הם עשויים לאחסן או לאחזר נתונים אודותיך
              באמצעות קובצי Cookie וטכנולוגיות דומות. קובצי Cookie עשויים להיות
              נחוצים עבור הפונקציונליות הבסיסית של האתר וגם למטרות אחרות. יש לך
              אפשרות להשבית סוגים מסוימים של קובצי Cookie, אם כי פעולה זו עשויה
              להשפיע על החוויה שלך באתר.
            </SheetDescription>
            <Link
              href="/privacy"
              className="text-sm font-medium text-primary underline underline-offset-2 hover:text-primary/80 mt-1 inline-block"
            >
              מדיניות פרטיות
            </Link>
          </SheetHeader>

          {/* Categories */}
          <div className="flex-1 divide-y">
            {COOKIE_CATEGORIES.map((category) => (
              <div key={category.id} className="px-6 py-5">
                {/* Toggle row */}
                <div className="flex items-center justify-between gap-3 mb-2">
                  <h3 className="text-base font-bold">{category.label}</h3>
                  <Switch
                    checked={getToggleValue(category.id)}
                    onCheckedChange={
                      category.alwaysOn
                        ? undefined
                        : (val) => setToggleValue(category.id, val)
                    }
                    disabled={category.alwaysOn}
                    aria-label={category.label}
                  />
                </div>

                {/* Description */}
                <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                  {category.description}
                </p>

                {/* Expandable disclosures */}
                {category.disclosures.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleDisclosure(category.id)}
                      className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      הצג גילויים
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          expandedDisclosures.has(category.id) ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    {expandedDisclosures.has(category.id) && (
                      <div className="mt-3 rounded-lg border bg-muted/30 overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-start py-2 px-3 font-medium text-xs">שם</th>
                              <th className="text-start py-2 px-3 font-medium text-xs">מטרה</th>
                              <th className="text-start py-2 px-3 font-medium text-xs">תוקף</th>
                            </tr>
                          </thead>
                          <tbody className="text-muted-foreground">
                            {category.disclosures.map((d) => (
                              <tr key={d.name} className="border-b last:border-b-0">
                                <td className="py-2 px-3 font-mono text-xs whitespace-nowrap">
                                  {d.name}
                                </td>
                                <td className="py-2 px-3 text-xs">{d.purpose}</td>
                                <td className="py-2 px-3 text-xs whitespace-nowrap">
                                  {d.duration}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Save button */}
          <SheetFooter className="border-t p-6">
            <Button onClick={handleSavePreferences} className="w-full min-h-11">
              שמור העדפות
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

export { CookieConsentBanner, getStoredPreferences };
export type { CookiePreferences };
