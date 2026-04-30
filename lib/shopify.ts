import { createClient } from "@/lib/supabase/server";

export interface ShopifyConfig {
  domain: string;
  adminToken: string;
}

async function getShopifyConfig(brandId: string): Promise<ShopifyConfig | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("connections")
    .select("*")
    .eq("brand_id", brandId)
    .eq("platform", "shopify")
    .eq("status", "connected")
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  return {
    domain: data.account_ref,
    adminToken: data.api_key ?? data.access_token ?? "",
  };
}

export async function shopifyAdminFetch<T = unknown>(
  query: string,
  variables: Record<string, unknown> | undefined,
  brandId: string
): Promise<T> {
  const config = await getShopifyConfig(brandId);
  if (!config) throw new Error("No Shopify connection found. Add one in Settings → Connections.");

  const url = `https://${config.domain}/admin/api/2024-10/graphql.json`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": config.adminToken,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Shopify API error: ${res.status} ${res.statusText}`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data as T;
}

export async function shopifyAdminRest<T = unknown>(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE",
  body: unknown | undefined,
  brandId: string
): Promise<T> {
  const config = await getShopifyConfig(brandId);
  if (!config) throw new Error("No Shopify connection found. Add one in Settings → Connections.");

  const url = `https://${config.domain}/admin/api/2024-10/${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": config.adminToken,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) throw new Error(`Shopify REST error: ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}
