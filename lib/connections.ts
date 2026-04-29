import { createClient } from "@/lib/supabase/server";

export interface PlatformCredentials {
  platform: string;
  accountRef: string;
  vaultSecretId: string | null;
  apiKey?: string;
  accessToken?: string;
}

export async function getConnection(
  brandId: string,
  platform: string
): Promise<PlatformCredentials | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("connections")
    .select("*")
    .eq("brand_id", brandId)
    .eq("platform", platform)
    .eq("status", "connected")
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  return {
    platform: data.platform,
    accountRef: data.account_ref,
    vaultSecretId: data.vault_secret_id,
    apiKey: data.api_key,
    accessToken: data.access_token,
  };
}

export async function getAllConnections(brandId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("connections")
    .select("platform, account_ref, status, connected_at")
    .eq("brand_id", brandId)
    .order("platform");

  return data ?? [];
}

export async function upsertConnection(
  brandId: string,
  platform: string,
  accountRef: string,
  credentials: { api_key?: string; access_token?: string; vault_secret_id?: string }
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("connections")
    .upsert(
      {
        brand_id: brandId,
        platform,
        account_ref: accountRef,
        status: "connected",
        connected_at: new Date().toISOString(),
        ...credentials,
      },
      { onConflict: "brand_id,platform,account_ref" }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
