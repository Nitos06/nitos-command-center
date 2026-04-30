import { cookies } from "next/headers";
import { createClient } from "./server";
import { BRAND_COOKIE_NAME } from "@/lib/brand-context";

export async function getActiveBrandId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(BRAND_COOKIE_NAME)?.value ?? null;
}

export async function createBrandedClient() {
  const supabase = await createClient();
  const brandId = await getActiveBrandId();
  return { supabase, brandId };
}

export function brandFilter<T extends { eq: (col: string, val: string) => T }>(
  query: T,
  brandId: string | null
): T {
  if (brandId) return query.eq("brand_id", brandId);
  return query;
}
