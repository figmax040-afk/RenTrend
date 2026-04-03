import { useState } from "react";
import { useNavigate } from "react-router";
import { Heart, MapPin } from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";

interface ListingCardProps {
  id: string | number;
  image: string;
  title: string;
  price: number;
  distance: string;
  category: string;
  available?: boolean;
  large?: boolean;
}

export function ListingCard({ id, image, title, price, distance, category, available = true, large = false }: ListingCardProps) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
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
        {available && (
          <span className="absolute top-2 left-2 bg-[#22C55E] text-white text-[10px] px-2 py-0.5 rounded-full">Available</span>
        )}
      </div>
      <div className="p-3">
        <p className="text-sm text-[#6B7280] mb-0.5">{category}</p>
        <h4 className="text-sm truncate" style={{ fontWeight: 500 }}>{title}</h4>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[#1E6B1E]" style={{ fontWeight: 600, fontSize: 14 }}>HK${price}<span className="text-[#6B7280]" style={{ fontWeight: 400, fontSize: 11 }}>/day</span></span>
          <span className="flex items-center gap-0.5 text-[#6B7280]" style={{ fontSize: 11 }}><MapPin size={10} />{distance}</span>
        </div>
      </div>
    </div>
  );
}