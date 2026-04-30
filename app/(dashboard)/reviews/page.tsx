import { PageHeader, Kpi, EmptyState } from "@/components/page-header";
import { StarRating } from "@/components/reviews/star-rating";
import { ReviewsTable } from "./reviews-table";
import { SegmentsPanel } from "./segments-panel";
import { Star, Download, Zap, ImageIcon, Video, Share2 } from "lucide-react";
import { createBrandedClient } from "@/lib/supabase/branded-query";

export default async function ReviewsPage() {
  const { supabase, brandId } = await createBrandedClient();

  const eq = (q: any) => (brandId ? q.eq("brand_id", brandId) : q);

  const [
    { data: reviews, count: totalCount },
    { data: pending },
    { data: segments },
    { data: brands },
    { data: ugcAssets },
  ] = await Promise.all([
    eq(supabase.from("reviews").select("*", { count: "exact" }))
      .order("created_at", { ascending: false })
      .limit(50),
    eq(supabase.from("reviews").select("id", { count: "exact" })).eq("status", "pending"),
    eq(supabase.from("review_segments").select("*")).order("created_at", { ascending: false }),
    supabase.from("brands").select("id, name").eq("status", "active"),
    eq(supabase.from("ugc_assets").select("*")).order("quality_score", { ascending: false }).limit(20),
  ]);

  const approved = (reviews ?? []).filter((r: any) => r.status === "approved");
  const avgRating =
    approved.length > 0
      ? approved.reduce((s: number, r: any) => s + r.rating, 0) / approved.length
      : 0;

  const thisMonth = (reviews ?? []).filter((r: any) => {
    const d = new Date(r.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const brandList = (brands ?? []).map((b: any) => ({ id: b.id, name: b.name }));

  return (
    <>
      <PageHeader
        title="Reviews"
        subtitle="Smarter than Judge.me — collect, segment, and activate review data"
        action={
          <div className="flex items-center gap-2">
            <form action="/api/widget-install" method="POST">
              <input type="hidden" name="widgetType" value="reviews" />
              <button className="btn-primary text-xs px-3 py-1.5">
                <Zap className="w-3.5 h-3.5" />
                Install on store
              </button>
            </form>
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Kpi label="Total reviews" value={String(totalCount ?? 0)} />
        <div className="card hover:shadow-card-hover transition-shadow">
          <div className="kpi-label">Avg rating</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="kpi-value">{avgRating.toFixed(1)}</span>
            <StarRating rating={avgRating} size="sm" />
          </div>
        </div>
        <Kpi label="Pending approval" value={String(pending?.length ?? 0)} />
        <Kpi label="This month" value={String(thisMonth)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-ink">All reviews</h2>
            <div className="flex items-center gap-2">
              <button className="btn-outline text-xs px-3 py-1.5">
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
            </div>
          </div>
          {(reviews?.length ?? 0) === 0 ? (
            <EmptyState
              icon={Star}
              title="No reviews yet"
              hint="Install the widget on your store to start collecting reviews, or import from Judge.me below."
            />
          ) : (
            <ReviewsTable reviews={reviews ?? []} />
          )}
        </div>

        <div className="space-y-4">
          <SegmentsPanel segments={segments ?? []} brands={brandList} />

          <div className="card">
            <h3 className="font-bold text-ink text-sm mb-3">Import</h3>
            <div className="space-y-2">
              <button className="btn-outline w-full justify-start text-sm">
                <img src="/icons/judgeme.svg" className="w-4 h-4" alt="" onError={() => {}} />
                Import from Judge.me
              </button>
              <button className="btn-outline w-full justify-start text-sm">
                <Star className="w-4 h-4 text-amber-400" />
                Import from CSV
              </button>
            </div>
          </div>

          <div className="card">
            <h3 className="font-bold text-ink text-sm mb-3">Store Widget</h3>
            <p className="text-xs text-ink-muted mb-3 leading-relaxed">
              Install once — the widget shows star ratings on product pages, renders review lists, and lets customers submit reviews with photos.
            </p>
            <div className="text-xs text-ink-subtle font-mono bg-surface-tint rounded-lg p-2 break-all">
              {process.env.NEXT_PUBLIC_APP_URL}/api/widgets/reviews?shop=yourstore.myshopify.com
            </div>
          </div>
        </div>
      </div>

      {/* UGC Assets */}
      <div className="card mt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-ink flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-primary-500" />
            UGC Asset Library
          </h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-ink-muted">{ugcAssets?.length ?? 0} assets · AI-scored</span>
            {brandId && (
              <button className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5" />
                Export top to Meta
              </button>
            )}
          </div>
        </div>
        {(ugcAssets?.length ?? 0) === 0 ? (
          <div className="py-8 text-center text-sm text-ink-muted">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-ink-subtle" />
            No UGC assets yet. The reviews agent scans new reviews daily for images and videos,
            scores quality (1–10), and surfaces the best for ads.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {ugcAssets!.map((asset: any) => (
              <div key={asset.id} className="relative rounded-xl overflow-hidden border border-surface-border group">
                {asset.type === "video" ? (
                  <div className="aspect-square bg-surface-tint flex items-center justify-center">
                    <Video className="w-8 h-8 text-ink-muted" />
                  </div>
                ) : (
                  <img
                    src={asset.url}
                    alt=""
                    className="aspect-square object-cover w-full"
                    loading="lazy"
                  />
                )}
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white text-xs font-semibold">{asset.quality_score ?? "—"}/10</span>
                    {asset.used_in_ads && (
                      <span className="text-[10px] bg-green-500 text-white px-1.5 rounded-full">In ads</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
