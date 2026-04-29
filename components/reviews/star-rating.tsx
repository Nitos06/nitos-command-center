import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRating({
  rating,
  max = 5,
  size = "sm",
}: {
  rating: number;
  max?: number;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  const sizeMap = { xs: "w-3 h-3", sm: "w-4 h-4", md: "w-5 h-5", lg: "w-6 h-6" };
  const cls = sizeMap[size];

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            cls,
            i < Math.round(rating)
              ? "fill-amber-400 text-amber-400"
              : "fill-surface-border text-surface-border"
          )}
        />
      ))}
    </div>
  );
}

export function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="transition-transform hover:scale-110"
        >
          <Star
            className={cn(
              "w-6 h-6 cursor-pointer",
              star <= value ? "fill-amber-400 text-amber-400" : "fill-surface-border text-surface-border"
            )}
          />
        </button>
      ))}
    </div>
  );
}
