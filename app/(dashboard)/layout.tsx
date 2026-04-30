import { Sidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BrandProvider } from "@/lib/brand-context";
import { cookies } from "next/headers";

const BRAND_COOKIE = "nitos_active_brand";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: brands } = await supabase
    .from("brands")
    .select("id, name, slug, logo_url")
    .eq("status", "active")
    .order("created_at");

  const cookieStore = await cookies();
  const savedBrandId = cookieStore.get(BRAND_COOKIE)?.value ?? null;
  const brandList = (brands ?? []).map((b: any) => ({
    id: b.id,
    name: b.name,
    slug: b.slug,
    logo_url: b.logo_url ?? null,
  }));

  return (
    <BrandProvider initialBrands={brandList} initialBrandId={savedBrandId}>
      <div className="flex min-h-screen bg-primary-bg">
        <Sidebar />
        <main className="flex-1 min-w-0">
          <div className="max-w-7xl mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </BrandProvider>
  );
}
