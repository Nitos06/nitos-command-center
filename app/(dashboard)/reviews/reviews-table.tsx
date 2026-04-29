"use client";

import { useState } from "react";
import { StarRating } from "@/components/reviews/star-rating";
import { approveReview, rejectReview, replyToReview } from "./actions";
import { Check, X, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";

type Review = {
  id: string;
  customer_name: string | null;
  customer_email: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  status: string;
  verified_purchase: boolean;
  shopify_product_title: string | null;
  created_at: string;
  reply: string | null;
  media_urls: string[] | null;
};

export function ReviewsTable({ reviews }: { reviews: Review[] }) {
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const filtered = filter === "all" ? reviews : reviews.filter((r) => r.status === filter);

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-1 mb-4">
        {(["all", "pending", "approved", "rejected"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
              filter === f
                ? "bg-primary text-white"
                : "text-ink-muted hover:bg-surface-tint"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className="ml-1 opacity-60">
              {f === "all" ? reviews.length : reviews.filter((r) => r.status === f).length}
            </span>
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((review) => (
          <div
            key={review.id}
            className="border border-surface-border rounded-xl overflow-hidden"
          >
            <div
              className="flex items-start gap-3 p-3 cursor-pointer hover:bg-surface-tint transition"
              onClick={() => setExpanded(expanded === review.id ? null : review.id)}
            >
              {/* Rating + meta */}
              <div className="shrink-0 pt-0.5">
                <StarRating rating={review.rating} size="xs" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-ink text-sm truncate">
                    {review.title ?? "(no title)"}
                  </span>
                  {review.verified_purchase && (
                    <span className="badge-success text-[10px]">Verified</span>
                  )}
                  <span
                    className={
                      review.status === "approved"
                        ? "badge-success text-[10px]"
                        : review.status === "rejected"
                        ? "badge-crit text-[10px]"
                        : "badge-warn text-[10px]"
                    }
                  >
                    {review.status}
                  </span>
                </div>
                <div className="text-xs text-ink-muted mt-0.5">
                  {review.customer_name ?? review.customer_email ?? "Anonymous"} ·{" "}
                  {review.shopify_product_title ?? "Unknown product"} ·{" "}
                  {new Date(review.created_at).toLocaleDateString()}
                </div>
              </div>
              <div className="shrink-0 ml-auto">
                {expanded === review.id ? (
                  <ChevronUp className="w-4 h-4 text-ink-subtle" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-ink-subtle" />
                )}
              </div>
            </div>

            {expanded === review.id && (
              <div className="border-t border-surface-border p-3 bg-surface-tint/50 space-y-3">
                {review.body && (
                  <p className="text-sm text-ink leading-relaxed">{review.body}</p>
                )}

                {(review.media_urls ?? []).length > 0 && (
                  <div className="flex gap-2 flex-wrap">
                    {review.media_urls!.map((url, i) => (
                      <img
                        key={i}
                        src={url}
                        className="w-16 h-16 object-cover rounded-lg border border-surface-border"
                        alt="Review photo"
                      />
                    ))}
                  </div>
                )}

                {review.reply && (
                  <div className="bg-primary-50 rounded-xl p-3">
                    <div className="text-xs font-semibold text-primary-600 mb-1">Your reply</div>
                    <p className="text-sm text-ink">{review.reply}</p>
                  </div>
                )}

                {/* Reply box */}
                {!review.reply && (
                  <div className="flex gap-2">
                    <input
                      className="input flex-1 text-xs py-1.5"
                      placeholder="Write a reply..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <button
                      className="btn-primary text-xs px-3 py-1.5"
                      onClick={async () => {
                        if (!replyText.trim()) return;
                        await replyToReview(review.id, replyText);
                        setReplyText("");
                      }}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Reply
                    </button>
                  </div>
                )}

                {/* Moderation */}
                {review.status === "pending" && (
                  <div className="flex gap-2">
                    <button
                      className="btn text-xs px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      onClick={() => approveReview(review.id)}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button
                      className="btn-danger text-xs px-3 py-1.5"
                      onClick={() => rejectReview(review.id)}
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
