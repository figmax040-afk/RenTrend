import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useI18n } from "../components/i18n";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { PlusCircle, MoreVertical } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/useAuth";
import { IMAGES } from "../components/data";

type DbListing = {
  id: string;
  title: string;
  title_zh: string | null;
  image_url: string | null;
  price_per_day: number;
  is_active: boolean;
};

export function MyListings() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [myListings, setMyListings] = useState<DbListing[]>([]);
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({});
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }
    loadData();
  }, [authLoading, user]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadData() {
    if (!user) return;
    setDataLoading(true);

    const { data: listingsData } = await supabase
      .from("listings")
      .select("id, title, title_zh, image_url, price_per_day, is_active")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    const listings = listingsData ?? [];
    setMyListings(listings);

    if (listings.length > 0) {
      const listingIds = listings.map((l) => l.id);
      const { data: reqData } = await supabase
        .from("requests")
        .select("id, listing_id")
        .in("listing_id", listingIds)
        .eq("status", "pending");

      const counts: Record<string, number> = {};
      for (const r of reqData ?? []) {
        counts[r.listing_id] = (counts[r.listing_id] ?? 0) + 1;
      }
      setPendingCounts(counts);
    }

    setDataLoading(false);
  }

  if (authLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-[#1E6B1E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[#1F2937]">{t("myListings")}</h2>
        <button onClick={() => navigate("/create")} className="flex items-center gap-1 px-3 py-1.5 bg-[#1E6B1E] text-white rounded-lg text-sm">
          <PlusCircle size={14} />{t("createListing")}
        </button>
      </div>

      {myListings.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[#6B7280] text-sm mb-4">
            {lang === "zh" ? "你還沒有刊登物品" : "You haven't listed anything yet"}
          </p>
          <button
            onClick={() => navigate("/create")}
            className="px-6 py-2.5 bg-[#1E6B1E] text-white rounded-xl text-sm"
          >
            {lang === "zh" ? "建立你的第一個刊登" : "Create your first listing"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {myListings.map((listing) => {
            const reqCount = pendingCounts[listing.id] ?? 0;
            return (
              <div
                key={listing.id}
                onClick={() => navigate(`/my-listings/${listing.id}/requests`)}
                className="bg-white rounded-xl border border-[#E5E7EB] p-3 flex gap-3 cursor-pointer hover:border-[#1E6B1E] transition-colors"
              >
                <div className="relative">
                  <ImageWithFallback
                    src={listing.image_url ?? IMAGES.kettle}
                    alt=""
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  {reqCount > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/my-listings/${listing.id}/requests`); }}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-[#EF4444] text-white rounded-full flex items-center justify-center text-[10px]"
                    >
                      {reqCount}
                    </button>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm" style={{ fontWeight: 500 }}>
                      {lang === "zh" && listing.title_zh ? listing.title_zh : listing.title}
                    </p>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="text-[#6B7280]"
                    >
                      <MoreVertical size={14} />
                    </button>
                  </div>
                  <p className="text-xs text-[#1E6B1E]" style={{ fontWeight: 500 }}>HK${listing.price_per_day}/day</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full"
                      style={{
                        backgroundColor: listing.is_active ? "#22C55E15" : "#6B728015",
                        color: listing.is_active ? "#22C55E" : "#6B7280",
                      }}
                    >
                      {t(listing.is_active ? "active" : "unavailable")}
                    </span>
                    {reqCount > 0 && (
                      <span className="text-[10px] text-[#F4A261]">
                        {reqCount} {t("requests")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
