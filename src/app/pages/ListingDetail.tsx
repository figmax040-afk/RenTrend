import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Share2, Heart, MapPin, Shield, ChevronDown, ChevronUp, Star, MessageCircle } from "lucide-react";
import { useI18n } from "../components/i18n";
import { listings } from "../components/data";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

/* ── Mock review data ── */
interface Review {
  id: number;
  author: string;
  university: string;
  universityZh: string;
  rating: number;
  date: string;
  comment: string;
  commentZh: string;
}

const mockReviews: Record<number, Review[]> = {
  1: [
    {
      id: 1, author: "Mei L.", university: "CUHK", universityZh: "中文大學",
      rating: 5, date: "Mar 2026",
      comment: "Kettle worked perfectly, Alex was super responsive. Handoff was easy — would rent again!",
      commentZh: "電水壺運作完美，Alex 回覆很快。交收方便，下次還會再租！",
    },
    {
      id: 2, author: "Tom W.", university: "HKUST", universityZh: "科技大學",
      rating: 4, date: "Feb 2026",
      comment: "Great condition, clean and auto shut-off works. Slightly slow to respond at first but sorted it out.",
      commentZh: "狀態良好，乾淨且自動斷電正常。一開始回覆稍慢，但最終解決了。",
    },
  ],
  2: [
    {
      id: 3, author: "Sarah K.", university: "HKU", universityZh: "香港大學",
      rating: 5, date: "Jan 2026",
      comment: "Perfect for my room, quiet and powerful. Highly recommend!",
      commentZh: "非常適合我的房間，安靜而有力。強烈推薦！",
    },
  ],
  3: [
    {
      id: 4, author: "Jessica W.", university: "HKU", universityZh: "香港大學",
      rating: 5, date: "Mar 2026",
      comment: "Rice cooker is spotless. Tom is reliable and punctual.",
      commentZh: "電飯煲非常乾淨。Tom 可靠守時。",
    },
    {
      id: 5, author: "David H.", university: "HKBU", universityZh: "浸會大學",
      rating: 4, date: "Feb 2026",
      comment: "Works great for 1–2 people. Non-stick pot still in good shape.",
      commentZh: "適合1至2人使用，不粘鍋仍然完好。",
    },
  ],
};

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={12}
          className={s <= rating ? "text-[#F59E0B] fill-[#F59E0B]" : "text-[#D1D5DB]"}
        />
      ))}
    </div>
  );
}

export function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const [priceMode, setPriceMode] = useState<"day" | "week" | "month">("day");
  const [showDesc,  setShowDesc]  = useState(false);
  const [saved,     setSaved]     = useState(false);

  const listing = listings.find((l) => l.id === Number(id));
  if (!listing) return <div className="p-8 text-center text-[#6B7280]">Not found</div>;

  const reviews   = mockReviews[listing.id] ?? [];
  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : null;

  const priceMap = { day: listing.price, week: listing.weeklyPrice, month: listing.monthlyPrice };
  const labelMap = { day: t("perDay"), week: t("perWeek"), month: t("perMonth") };

  return (
    <div className="max-w-2xl mx-auto bg-white min-h-screen pb-24">
      {/* ── Hero image ── */}
      <div className="relative h-64 md:h-80">
        <ImageWithFallback src={listing.image} alt={listing.title} className="w-full h-full object-cover" />
        <div className="absolute top-4 left-4 right-4 flex justify-between">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex gap-2">
            <button className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow">
              <Share2 size={16} />
            </button>
            <button
              onClick={() => setSaved(!saved)}
              className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow"
            >
              <Heart size={16} className={saved ? "fill-red-500 text-red-500" : ""} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* ── Title & category ── */}
        <span className="inline-block px-2 py-0.5 rounded-full bg-[#1E6B1E]/10 text-[#1E6B1E] text-xs mb-2">
          {lang === "zh" ? listing.categoryZh : listing.category}
        </span>
        <h1 style={{ fontSize: 22 }} className="text-[#1B3D1B]">
          {lang === "zh" ? listing.titleZh : listing.title}
        </h1>

        {/* Average rating under title */}
        {avgRating !== null && (
          <div className="flex items-center gap-1.5 mt-1">
            <StarRow rating={Math.round(avgRating)} />
            <span className="text-xs text-[#6B7280]">
              {avgRating.toFixed(1)} ({reviews.length} {lang === "zh" ? "評價" : "reviews"})
            </span>
          </div>
        )}

        {/* ── Price toggle ── */}
        <div className="flex items-center gap-2 mt-3 mb-2">
          {(["day", "week", "month"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setPriceMode(m)}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                priceMode === m
                  ? "bg-[#1E6B1E] text-white"
                  : "bg-[#F9FAFB] text-[#6B7280] border border-[#E5E7EB]"
              }`}
            >
              {labelMap[m]}
            </button>
          ))}
        </div>

        <p className="text-[#1E6B1E]" style={{ fontSize: 24, fontWeight: 600 }}>
          HK${priceMap[priceMode]}
          <span className="text-sm text-[#6B7280]" style={{ fontWeight: 400 }}>{labelMap[priceMode]}</span>
        </p>
        <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-[#F4A261]/10 text-[#F4A261] text-xs">
          HK${listing.deposit} {t("deposit")}
        </span>

        {/* ── Distance ── */}
        <div className="flex items-center gap-1 mt-3 text-[#6B7280] text-sm">
          <MapPin size={14} />
          <span>
            {lang === "zh" ? listing.distanceZh : listing.distance} ·{" "}
            {lang === "zh" ? listing.universityZh : listing.university}
          </span>
        </div>

        {/* ── Owner card ── */}
        <div className="flex items-center gap-3 mt-4 p-3 rounded-xl bg-[#F0F7F0] border border-[#C8E6C9]">
          <div className="w-10 h-10 rounded-full bg-[#1E6B1E] flex items-center justify-center text-white text-sm">
            {listing.owner[0]}
          </div>
          <div className="flex-1">
            <p className="text-sm text-[#1F2937]" style={{ fontWeight: 500 }}>{listing.owner}</p>
            <div className="flex items-center gap-1">
              <Shield size={12} className="text-[#22C55E]" />
              <span className="text-xs text-[#22C55E]">
                {t("verified")} · {lang === "zh" ? listing.universityZh : listing.university}
              </span>
            </div>
            <span className="text-[10px] text-[#6B7280]">{t("memberSince")} {listing.memberSince}</span>
          </div>
        </div>

        {/* ── Description ── */}
        <div className="mt-4">
          <button
            onClick={() => setShowDesc(!showDesc)}
            className="flex items-center gap-1 text-sm text-[#1F2937]"
            style={{ fontWeight: 500 }}
          >
            {t("description")} {showDesc ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showDesc && (
            <p className="text-sm text-[#6B7280] mt-2">
              {lang === "zh" ? listing.descriptionZh : listing.description}
            </p>
          )}
        </div>

        {/* ── Condition ── */}
        <div className="mt-4">
          <p className="text-sm mb-1" style={{ fontWeight: 500 }}>{t("condition")}</p>
          <span className="inline-block px-3 py-1 rounded-full bg-[#22C55E]/10 text-[#22C55E] text-xs">
            {lang === "zh" ? listing.conditionZh : listing.condition}
          </span>
        </div>

        {/* ── Reviews / Comments section ── */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle size={16} className="text-[#1E6B1E]" />
            <h3 className="text-[#1B3D1B]" style={{ fontSize: 15, fontWeight: 600 }}>
              {lang === "zh" ? "租客評價" : "Renter Reviews"}
            </h3>
            {reviews.length > 0 && (
              <span className="ml-auto text-xs text-[#6B7280]">
                {reviews.length} {lang === "zh" ? "則評價" : "reviews"}
              </span>
            )}
          </div>

          {reviews.length === 0 ? (
            <p className="text-sm text-[#6B7280] py-4 text-center">
              {lang === "zh" ? "暫無評價" : "No reviews yet — be the first to rent!"}
            </p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => (
                <div key={r.id} className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                  {/* Reviewer header */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-[#1E6B1E]/15 flex items-center justify-center text-[#1E6B1E] text-xs" style={{ fontWeight: 600 }}>
                      {r.author[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs" style={{ fontWeight: 500 }}>{r.author}</p>
                      <p className="text-[10px] text-[#6B7280]">
                        {lang === "zh" ? r.universityZh : r.university} · {r.date}
                      </p>
                    </div>
                    <StarRow rating={r.rating} />
                  </div>
                  {/* Comment text */}
                  <p className="text-sm text-[#4B5563]">
                    {lang === "zh" ? r.commentZh : r.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 md:sticky bg-white border-t border-[#E5E7EB] px-4 py-3 flex gap-3 max-w-2xl mx-auto">
        <button
          className="flex-1 py-3 bg-[#1E6B1E] text-white rounded-xl hover:bg-[#155215] transition-colors"
          onClick={() => navigate(`/rent/${listing.id}`)}
        >
          {t("requestToRent")}
        </button>
        <button
          onClick={() => setSaved(!saved)}
          className={`px-4 py-3 border rounded-xl transition-colors ${
            saved
              ? "border-red-400 text-red-500 bg-red-50"
              : "border-[#E5E7EB] text-[#6B7280] hover:text-[#1E6B1E]"
          }`}
        >
          <Heart size={18} className={saved ? "fill-red-500" : ""} />
        </button>
      </div>
    </div>
  );
}
