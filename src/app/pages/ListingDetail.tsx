import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Share2, Heart, MapPin, Shield, ChevronDown, ChevronUp, Star, MessageCircle } from "lucide-react";
import { useI18n, translate } from "../components/i18n";
import { IMAGES } from "../components/data";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { supabase } from "../../lib/supabase";
import { loginPath } from "../../lib/authRedirect";
import { conditionKeyFromStored } from "../../lib/conditions";
import { ListingDetailAd } from "../components/Ads";
import { RentalTermsCard } from "../components/RentalTermsCard";
import { FeaturedTag, PowerLenderBadge } from "../components/Badges";
import { isBoosted, isPowerLender } from "../../demo/demo";

type NormalizedListing = {
  id: string | number;
  owner_id: string | null;
  title: string;
  titleZh: string;
  image: string;
  price: number;
  weeklyPrice: number;
  monthlyPrice: number;
  deposit: number;
  distance: string;
  distanceZh: string;
  category: string;
  categoryZh: string;
  condition: string;
  conditionZh: string;
  description: string;
  descriptionZh: string;
  owner: string;
  university: string;
  universityZh: string;
  memberSince: string;
  available: boolean;
  featured: boolean;
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
  const { t, lang, isZh, zh } = useI18n();
  const [priceMode, setPriceMode] = useState<"day" | "week" | "month">("day");
  const [showDesc,  setShowDesc]  = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [listing,   setListing]   = useState<NormalizedListing | null>(null);
  const [loading,   setLoading]   = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [copied,    setCopied]    = useState(false);
  const [ownerName, setOwnerName] = useState<string>("—");
  const [ownerIsPower, setOwnerIsPower] = useState(false);
  const [realReviews, setRealReviews] = useState<Array<{
    id: string; author: string; rating: number; date: string; comment: string; listing_title?: string;
  }>>([]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    // Get current user for owner detection and saved status
    supabase.auth.getUser().then(async ({ data }) => {
      const userId = data.user?.id ?? null;
      setCurrentUserId(userId);
      if (userId && id) {
        const { data: savedData } = await supabase
          .from("saved_listings")
          .select("id")
          .eq("user_id", userId)
          .eq("listing_id", id)
          .maybeSingle();
        setSaved(!!savedData);
      }
    });

    supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (data) {
          const condKey = conditionKeyFromStored(data.condition);
          setListing({
            id: data.id,
            owner_id: data.owner_id ?? null,
            title: data.title,
            titleZh: data.title_zh ?? data.title,
            image: data.image_url ?? IMAGES.kettle,
            price: data.price_per_day,
            weeklyPrice: data.price_weekly ?? Math.round(data.price_per_day * 6),
            monthlyPrice: data.price_monthly ?? Math.round(data.price_per_day * 25),
            deposit: data.deposit ?? 0,
            distance: data.district ?? "Hong Kong",
            distanceZh: data.district ?? "香港",
            category: data.category,
            categoryZh: data.category,
            condition: condKey ? translate(condKey, "en") : (data.condition ?? "Works perfectly"),
            conditionZh: condKey ? translate(condKey, "zh") : (data.condition_zh ?? data.condition ?? "運作完好"),
            description: data.description ?? "",
            descriptionZh: data.description_zh ?? data.description ?? "",
            owner: "—",
            university: data.university ?? "",
            universityZh: data.university ?? "",
            memberSince: new Date(data.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
            available: data.is_active && (data.approval_status ?? "approved") === "approved",
            featured: isBoosted(data.boosted_until),
          });
          // Count the view for the owner's stats (the function ignores the owner's own views)
          supabase.rpc("bump_listing_view", { p_listing_id: data.id }).then(() => {}, () => {});
        }
        setLoading(false);
      });
  }, [id]);

  // Fetch all owner reviews and owner name for UUID listings
  useEffect(() => {
    if (!listing || !listing.owner_id) return;

    async function fetchOwnerReviews() {
      // Fetch owner's display name
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", listing!.owner_id!)
        .maybeSingle();
      const oName = ownerProfile?.name || (ownerProfile?.email ? ownerProfile.email.split("@")[0] : "—");
      setOwnerName(oName);
      setOwnerIsPower(isPowerLender(ownerProfile?.completed_rentals_as_lender, ownerProfile?.rating_as_lister));

      // Fetch all reviews for this owner as a lister (renter reviews)
      const { data: revData } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, reviewer_id, listing_id")
        .eq("reviewee_id", listing!.owner_id!)
        .eq("role", "renter")
        .order("created_at", { ascending: false })
        .limit(10);

      if (!revData || revData.length === 0) { setRealReviews([]); return; }

      // Fetch reviewer names
      const reviewerIds = [...new Set(revData.map((r) => r.reviewer_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", reviewerIds);
      const profileMap = Object.fromEntries(
        (profiles ?? []).map((p) => [p.id, p.name || (p.email ? p.email.split("@")[0] : "User")])
      );

      // Fetch listing titles for each review
      const listingIds = [...new Set(revData.map((r) => r.listing_id).filter(Boolean))];
      let listingTitleMap: Record<string, string> = {};
      if (listingIds.length > 0) {
        const { data: listingData } = await supabase
          .from("listings")
          .select("id, title")
          .in("id", listingIds);
        listingTitleMap = Object.fromEntries((listingData ?? []).map((l) => [l.id, l.title]));
      }

      setRealReviews(revData.map((r) => ({
        id: r.id,
        author: profileMap[r.reviewer_id] ?? "User",
        rating: r.rating,
        date: new Date(r.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        comment: r.comment || "",
        listing_title: r.listing_id ? listingTitleMap[r.listing_id] : undefined,
      })));
    }

    fetchOwnerReviews();
  }, [listing]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!listing) return <div className="p-8 text-center text-[#6B7280]">{t("notFound")}</div>;

  const isOwner = !!currentUserId && !!listing.owner_id && currentUserId === listing.owner_id;

  async function handleSave() {
    if (!currentUserId) { navigate(loginPath()); return; }
    if (saved) {
      await supabase.from("saved_listings").delete()
        .eq("user_id", currentUserId).eq("listing_id", String(listing.id));
      setSaved(false);
    } else {
      await supabase.from("saved_listings").insert({ user_id: currentUserId, listing_id: String(listing.id) });
      setSaved(true);
    }
  }

  async function handleShare() {
    const url = window.location.href;
    const title = isZh ? zh(listing.titleZh) : listing.title;
    if (navigator.share) {
      await navigator.share({ title, text: `${t("shareText")} ${title}`, url });
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  const reviews = realReviews;
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
            <button onClick={handleShare} className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow">
              <Share2 size={16} />
            </button>
            <button
              onClick={handleSave}
              className="w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow"
            >
              <Heart size={16} className={saved ? "fill-red-500 text-red-500" : ""} />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        {/* ── Title & category ── */}
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block px-2 py-0.5 rounded-full bg-brand/10 text-brand text-xs">
            {t(listing.category?.toLowerCase() ?? "other")}
          </span>
          {listing.featured && <FeaturedTag />}
        </div>
        <h1 style={{ fontSize: 22 }} className="text-brand-ink">
          {isZh ? zh(listing.titleZh) : listing.title}
        </h1>

        {/* Average rating under title */}
        {avgRating !== null && (
          <div className="flex items-center gap-1.5 mt-1">
            <StarRow rating={Math.round(avgRating)} />
            <span className="text-xs text-[#6B7280]">
              {avgRating.toFixed(1)} ({reviews.length} {isZh ? zh("評價") : "reviews"})
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
                  ? "bg-brand text-white"
                  : "bg-[#F9FAFB] text-[#6B7280] border border-[#E5E7EB]"
              }`}
            >
              {labelMap[m]}
            </button>
          ))}
        </div>

        <p className="text-brand" style={{ fontSize: 24, fontWeight: 600 }}>
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
            {isZh ? zh(listing.distanceZh) : listing.distance}
            {listing.university && <> · {isZh ? zh(listing.universityZh) : listing.university}</>}
          </span>
        </div>

        {/* ── Owner card ── */}
        <div className="flex items-center gap-3 mt-4 p-3 rounded-xl bg-brand-soft border border-brand-border">
          <div className="w-10 h-10 rounded-full bg-brand flex items-center justify-center text-white text-sm">
            {ownerName[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-sm text-[#1F2937]" style={{ fontWeight: 500 }}>{ownerName}</p>
              {ownerIsPower && <PowerLenderBadge small />}
            </div>
            <div className="flex items-center gap-1">
              <Shield size={12} className="text-[#22C55E]" />
              <span className="text-xs text-[#22C55E]">
                {t("verified")}{listing.university && <> · {isZh ? zh(listing.universityZh) : listing.university}</>}
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
              {isZh ? zh(listing.descriptionZh) : listing.description}
            </p>
          )}
        </div>

        {/* ── Sponsored (by category, hidden for Plus members) ── */}
        <ListingDetailAd category={listing.category} />

        {/* ── Condition ── */}
        <div className="mt-4">
          <p className="text-sm mb-1" style={{ fontWeight: 500 }}>{t("condition")}</p>
          <span className="inline-block px-3 py-1 rounded-full bg-[#22C55E]/10 text-[#22C55E] text-xs">
            {isZh ? zh(listing.conditionZh) : listing.condition}
          </span>
        </div>

        {/* ── Rental terms ── */}
        <RentalTermsCard />

        {/* ── Reviews / Comments section ── */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle size={16} className="text-brand" />
            <h3 className="text-brand-ink" style={{ fontSize: 15, fontWeight: 600 }}>
              {`${t("reviewsFor")} ${ownerName}`}
            </h3>
            {reviews.length > 0 && (
              <span className="ml-auto text-xs text-[#6B7280]">
                {reviews.length} {isZh ? zh("則評價") : "reviews"}
              </span>
            )}
          </div>

          {reviews.length === 0 ? (
            <p className="text-sm text-[#6B7280] py-4 text-center">
              {isZh ? zh("暫無評價 — 成為第一個租用的人！") : "No reviews yet — be the first to rent!"}
            </p>
          ) : (
            <div className="space-y-3">
              {reviews.map((r) => {
                return (
                  <div key={r.id} className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB]">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-7 h-7 rounded-full bg-brand/15 flex items-center justify-center text-brand text-xs" style={{ fontWeight: 600 }}>
                        {r.author[0]}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs" style={{ fontWeight: 500 }}>{r.author}</p>
                        <p className="text-[10px] text-[#6B7280]">{r.date}</p>
                      </div>
                      <StarRow rating={r.rating} />
                    </div>
                    {r.comment && <p className="text-sm text-[#4B5563]">{r.comment}</p>}
                    {r.listing_title && (
                      <p className="text-[10px] text-[#9CA3AF] mt-1">{t("forListing")} {r.listing_title}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky CTA (sits above the mobile bottom nav) ── */}
      <div className="fixed bottom-16 md:bottom-0 left-0 right-0 md:sticky z-40 bg-white border-t border-[#E5E7EB] px-4 py-3 flex gap-3 max-w-2xl mx-auto">
        {isOwner ? (
          <button
            className="flex-1 py-3 bg-brand text-white rounded-xl hover:bg-brand-hover transition-colors"
            onClick={() => navigate(`/my-listings/${listing.id}/requests`)}
          >
            {t("manageListing")}
          </button>
        ) : !listing.available ? (
          <button
            disabled
            className="flex-1 py-3 bg-[#E5E7EB] text-[#6B7280] rounded-xl cursor-not-allowed"
          >
            {t("currentlyUnavailable")}
          </button>
        ) : (
          <button
            className="flex-1 py-3 bg-brand text-white rounded-xl hover:bg-brand-hover transition-colors"
            onClick={() => navigate(`/rent/${listing.id}`)}
          >
            {t("requestToRent")}
          </button>
        )}
        <button
          onClick={handleSave}
          className={`px-4 py-3 border rounded-xl transition-colors ${
            saved
              ? "border-red-400 text-red-500 bg-red-50"
              : "border-[#E5E7EB] text-[#6B7280] hover:text-brand"
          }`}
        >
          <Heart size={18} className={saved ? "fill-red-500" : ""} />
        </button>
      </div>

      {/* ── Link copied toast ── */}
      {copied && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-brand text-white text-sm px-4 py-2 rounded-xl shadow-lg z-50 whitespace-nowrap">
          {t("linkCopied")}
        </div>
      )}
    </div>
  );
}
