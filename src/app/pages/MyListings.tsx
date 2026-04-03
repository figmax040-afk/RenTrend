import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useI18n } from "../components/i18n";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { PlusCircle, MoreVertical, Bell } from "lucide-react";
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

type IncomingRequest = {
  id: string;
  listing_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  message: string | null;
  status: string;
  renter_name: string;
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function MyListings() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [myListings, setMyListings] = useState<DbListing[]>([]);
  const [incoming, setIncoming] = useState<IncomingRequest[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showIncoming, setShowIncoming] = useState(false);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }
    loadData();
  }, [authLoading, user]);

  async function loadData() {
    if (!user) return;
    setDataLoading(true);

    // Fetch user's listings
    const { data: listingsData } = await supabase
      .from("listings")
      .select("id, title, title_zh, image_url, price_per_day, is_active")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    const listings = listingsData ?? [];
    setMyListings(listings);

    if (listings.length > 0) {
      const listingIds = listings.map((l) => l.id);

      // Fetch pending requests for these listings
      const { data: reqData } = await supabase
        .from("requests")
        .select("id, listing_id, renter_id, start_date, end_date, message, status")
        .in("listing_id", listingIds)
        .eq("status", "pending");

      const requests = reqData ?? [];

      // Fetch renter profiles in one query
      const renterIds = [...new Set(requests.map((r) => r.renter_id))];
      let profileMap: Record<string, string> = {};
      if (renterIds.length > 0) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, name")
          .in("id", renterIds);
        profileMap = Object.fromEntries(
          (profileData ?? []).map((p) => [p.id, p.name ?? "User"])
        );
      }

      setIncoming(
        requests.map((r) => ({
          ...r,
          renter_name: profileMap[r.renter_id] ?? "User",
        }))
      );
    }

    setDataLoading(false);
  }

  async function handleAccept(requestId: string) {
    setActing(requestId);
    await supabase.from("requests").update({ status: "accepted" }).eq("id", requestId);
    setIncoming((prev) => prev.filter((r) => r.id !== requestId));
    setActing(null);
  }

  async function handleDecline(requestId: string) {
    setActing(requestId);
    await supabase.from("requests").update({ status: "rejected" }).eq("id", requestId);
    setIncoming((prev) => prev.filter((r) => r.id !== requestId));
    setActing(null);
  }

  // Count pending requests per listing
  const requestCountById = incoming.reduce<Record<string, number>>((acc, r) => {
    acc[r.listing_id] = (acc[r.listing_id] ?? 0) + 1;
    return acc;
  }, {});

  if (authLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-[#1E6B1E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (showIncoming) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setShowIncoming(false)} className="text-[#6B7280]">←</button>
          <h2 className="text-[#1F2937]">{t("incomingRequests")}</h2>
        </div>
        {incoming.length === 0 ? (
          <p className="text-center text-[#6B7280] text-sm py-12">
            {lang === "zh" ? "暫無待處理的請求" : "No pending requests"}
          </p>
        ) : (
          <div className="space-y-3">
            {incoming.map((r) => (
              <div key={r.id} className="bg-white rounded-xl border border-[#E5E7EB] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-full bg-[#1E6B1E] flex items-center justify-center text-white text-xs">
                    {r.renter_name[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm" style={{ fontWeight: 500 }}>{r.renter_name}</p>
                    <p className="text-[10px] text-[#22C55E]">{t("verified")}</p>
                  </div>
                </div>
                {r.message && <p className="text-sm text-[#6B7280] mb-2">"{r.message}"</p>}
                <p className="text-xs text-[#6B7280] mb-3">{fmt(r.start_date)} – {fmt(r.end_date)}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(r.id)}
                    disabled={acting === r.id}
                    className="flex-1 py-2 bg-[#22C55E] text-white rounded-xl text-sm disabled:opacity-50"
                  >
                    {t("accept")}
                  </button>
                  <button
                    onClick={() => handleDecline(r.id)}
                    disabled={acting === r.id}
                    className="flex-1 py-2 border border-[#EF4444] text-[#EF4444] rounded-xl text-sm disabled:opacity-50"
                  >
                    {t("decline")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
            const reqCount = requestCountById[listing.id] ?? 0;
            return (
              <div
                key={listing.id}
                onClick={() => navigate(`/listing/${listing.id}`)}
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
                      onClick={(e) => { e.stopPropagation(); setShowIncoming(true); }}
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
                      <button
                        onClick={(e) => { e.stopPropagation(); setShowIncoming(true); }}
                        className="flex items-center gap-0.5 text-[10px] text-[#F4A261]"
                      >
                        <Bell size={10} />{reqCount} {t("requests")}
                      </button>
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
