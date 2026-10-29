import { useState } from "react";
import { useNavigate } from "react-router";
import { Heart, Star } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { useI18n } from "./i18n";
import { FeaturedTag, PowerLenderBadge } from "./Badges";

const categoryKeyMap: Record<string, string> = {
  kitchen: "kitchen",
  electronics: "electronics",
  furniture: "furniture",
  cooling: "cooling",
  other: "other",
};

interface ListingCardProps {
  id: string | number;
  image: string;
  title: string;
  price: number;
  category: string;
  available?: boolean;
  large?: boolean;
  rating?: { avg: number; count: number } | null;
  featured?: boolean;
  powerLender?: boolean;
}

export function ListingCard({ id, image, title, price, category, available = true, large = false, rating, featured = false, powerLender = false }: ListingCardProps) {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [liked, setLiked] = useState(false);
  const categoryLabel = t(categoryKeyMap[category.toLowerCase()] ?? category);
  return (
    <div
      onClick={() => navigate(`/listing/${id}`)}
      className={`bg-white rounded-xl overflow-hidden border border-[#E5E7EB] cursor-pointer hover:shadow-md transition-shadow ${large ? "row-span-2" : ""}`}
    >
      <div className={`relative ${large ? "h-48" : "h-36"}`}>
        <ImageWithFallback src={image} alt={title} className="w-full h-full object-cover" />
        <button
          onClick={(e) => { e.stopPropagation(); setLiked(!liked); }}
          className="absolute top-2 right-2 w-7 h-7 bg-white/80 rounded-full flex items-center justify-center"
        >
          <Heart size={14} className={liked ? "fill-red-500 text-red-500" : "text-[#6B7280]"} />
        </button>
        <div className="absolute top-2 left-2 flex flex-col items-start gap-1">
          {featured && <FeaturedTag />}
          {available && (
            <span className="bg-[#22C55E] text-white text-[10px] px-2 py-0.5 rounded-full">{t("available")}</span>
          )}
        </div>
      </div>
      <div className="p-3">
        <p className="text-sm text-[#6B7280] mb-0.5">{categoryLabel}</p>
        <h4 className="text-sm truncate" style={{ fontWeight: 500 }}>{title}</h4>
        <div className="flex items-center gap-1.5 mt-0.5 min-h-[18px]">
          <span className="flex items-center gap-0.5 text-[11px] text-[#6B7280]">
            <Star size={11} className="text-[#F59E0B] fill-[#F59E0B]" />
            {rating && rating.count > 0 ? <>{rating.avg.toFixed(1)} <span className="text-[#9CA3AF]">({rating.count})</span></> : t("newListing")}
          </span>
          {powerLender && <PowerLenderBadge small />}
        </div>
        <p className="text-brand mt-1.5" style={{ fontWeight: 600, fontSize: 14 }}>HK${price}<span className="text-[#6B7280]" style={{ fontWeight: 400, fontSize: 11 }}>{t("perDay")}</span></p>
      </div>
    </div>
  );
}