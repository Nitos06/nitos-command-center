"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

const COOKIE_NAME = "nitos_active_brand";

type Brand = { id: string; name: string; slug: string; logo_url: string | null };

interface BrandContextValue {
  activeBrandId: string | null;
  activeBrand: Brand | null;
  brands: Brand[];
  switchBrand: (brandId: string) => void;
  setBrands: (brands: Brand[]) => void;
}

const BrandContext = createContext<BrandContextValue>({
  activeBrandId: null,
  activeBrand: null,
  brands: [],
  switchBrand: () => {},
  setBrands: () => {},
});

export function useBrand() {
  return useContext(BrandContext);
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days = 365) {
  document.cookie = `${name}=${encodeURIComponent(value)};path=/;max-age=${days * 86400};SameSite=Lax`;
}

export function BrandProvider({
  children,
  initialBrands,
  initialBrandId,
}: {
  children: ReactNode;
  initialBrands: Brand[];
  initialBrandId: string | null;
}) {
  const [brands, setBrands] = useState<Brand[]>(initialBrands);
  const [activeBrandId, setActiveBrandId] = useState<string | null>(() => {
    const fromCookie = getCookie(COOKIE_NAME);
    if (fromCookie && initialBrands.some((b) => b.id === fromCookie)) return fromCookie;
    return initialBrandId ?? initialBrands[0]?.id ?? null;
  });

  const activeBrand = brands.find((b) => b.id === activeBrandId) ?? null;

  const switchBrand = useCallback((brandId: string) => {
    setActiveBrandId(brandId);
    setCookie(COOKIE_NAME, brandId);
    window.location.reload();
  }, []);

  useEffect(() => {
    if (activeBrandId) setCookie(COOKIE_NAME, activeBrandId);
  }, [activeBrandId]);

  return (
    <BrandContext.Provider value={{ activeBrandId, activeBrand, brands, switchBrand, setBrands }}>
      {children}
    </BrandContext.Provider>
  );
}

export const BRAND_COOKIE_NAME = COOKIE_NAME;
