import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { useI18n } from "../components/i18n";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { supabase } from "../../lib/supabase";
import { loginPath } from "../../lib/authRedirect";
import { IMAGES } from "../components/data";

type Listing = {
  id: string;
  title: string;
  title_zh: string | null;
  image_url: string | null;
  price_per_day: number;
  is_active: boolean;
};

type RenterProfile = {
  id: string;
  name: string | null;
  email: string | null;
};

type Request = {
  id: string;
  listing_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  message: string | null;
  status: string;
  pickup_preference: string | null;
  total_price: number | null;
  profiles: RenterProfile | null;
};

type Tab = "pending" | "accepted" | "declined";

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function daysBetween(start: string, end: string) {
  return Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000));
}

function renterName(r: Request) {
  const name = r.profiles?.name;
  if (name) return name;
  const email = r.profiles?.email ?? "";
  return email.split("@")[0] || "User";
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    pending:  { label: "Pending",  color: "#F4A261", bg: "#F4A26115" },
    accepted: { label: "Accepted", color: "#22C55E", bg: "#22C55E15" },
    rejected: { label: "Declined", color: "#6B7280", bg: "#6B728015" },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ color: s.color, backgroundColor: s.bg }}>
      {s.label}
    </span>
  );
}

export function ListingRequests() {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const { t, lang, isZh, zh } = useI18n();

  const [listing, setListing] = useState<Listing | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("pending");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate(loginPath()); return; }

      const { data: listingData, error: listingErr } = await supabase
        .from("listings")
        .select("id, title, title_zh, image_url, price_per_day, is_active")
        .eq("id", listingId)
        .eq("owner_id", user.id)
        .single();

      if (listingErr || !listingData) {
        navigate("/activity?tab=listings");
        return;
      }
      setListing(listingData);

      // Step 1: fetch requests without nested join
      const { data: reqData, error: reqErr } = await supabase
        .from("requests")
        .select("*")
        .eq("listing_id", listingId)
        .order("created_at", { ascending: false });

      if (reqErr) throw reqErr;

      const rawRequests = reqData ?? [];

      // Step 2: fetch renter profiles separately
      const renterIds = [...new Set(rawRequests.map((r) => r.renter_id))];
      const { data: profiles } = renterIds.length > 0
        ? await supabase
            .from("profiles")
            .select("id, name, email")
            .in("id", renterIds)
        : { data: [] };

      // Step 3: merge
      const merged: Request[] = rawRequests.map((r) => ({
        ...r,
        profiles: (profiles ?? []).find((p) => p.id === r.renter_id) ?? null,
      }));

      setRequests(merged);
    } catch (err: any) {
      console.error("ListingRequests fetch error:", err);
      setError(isZh ? zh("載入請求時出錯") : "Failed to load requests.");
    } finally {
      setLoading(false);
    }
  }, [listingId, navigate, lang]);

  useEffect(() => { load(); }, [load]);

  const hasAccepted = requests.some((r) => r.status === "accepted");

  const tabRequests = requests.filter((r) => {
    if (activeTab === "pending")  return r.status === "pending";
    if (activeTab === "accepted") return r.status === "accepted";
    return r.status === "rejected";
  });

  const tabs: { key: Tab; label: string }[] = [
    { key: "pending",  label: t("pending") },
    { key: "accepted", label: t("accepted") },
    { key: "declined", label: t("decline") },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!listing) return null;

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-8 text-center">
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-xl mb-3">{error}</p>
        <button onClick={load} className="text-sm text-brand">
          {isZh ? zh("重試") : "Try again"}
        </button>
      </div>
    );
  }

  const listingTitle = isZh && listing.title_zh ? zh(listing.title_zh) : listing.title;

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate("/activity?tab=listings")} className="text-[#6B7280]">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-[#1F2937] truncate flex-1" style={{ fontWeight: 600 }}>
          {listingTitle}
        </h2>
      </div>

      {/* Listing summary card */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-3 flex gap-3 mb-4">
        <ImageWithFallback
          src={listing.image_url ?? IMAGES.kettle}
          alt=""
          className="w-16 h-16 rounded-lg object-cover"
        />
        <div className="flex-1">
          <p className="text-sm" style={{ fontWeight: 500 }}>{listingTitle}</p>
          <p className="text-xs text-brand" style={{ fontWeight: 500 }}>HK${listing.price_per_day}/day</p>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full mt-1 inline-block"
            style={{
              backgroundColor: listing.is_active ? "#22C55E15" : "#6B728015",
              color: listing.is_active ? "#22C55E" : "#6B7280",
            }}
          >
            {t(listing.is_active ? "active" : "unavailable")}
          </span>
        </div>
      </div>

      {/* Accepted banner */}
      {hasAccepted && (
        <div className="bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#15803D] text-xs px-4 py-3 rounded-xl mb-4">
          {isZh
            ? zh("你已接受此刊登的一個請求 — 其他請求已鎖定")
            : "You have accepted a request for this listing — other requests are locked"}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-[#F3F4F6] rounded-xl p-1 mb-4">
        {tabs.map(({ key, label }) => {
          const count = requests.filter((r) =>
            key === "pending"  ? r.status === "pending"  :
            key === "accepted" ? r.status === "accepted" :
            r.status === "rejected"
          ).length;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-1.5 rounded-lg text-xs transition-colors ${
                activeTab === key
                  ? "bg-white text-brand shadow-sm"
                  : "text-[#6B7280]"
              }`}
              style={{ fontWeight: activeTab === key ? 600 : 400 }}
            >
              {label}{count > 0 ? ` (${count})` : ""}
            </button>
          );
        })}
      </div>

      {/* Request list */}
      {tabRequests.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-[#6B7280] text-sm">
            {isZh
              ? zh(`暫無${activeTab === "pending" ? "待處理" : activeTab === "accepted" ? "已接受" : "已拒絕"}的請求`)
              : `No ${activeTab} requests`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {tabRequests.map((req) => {
            const name = renterName(req);
            const days = daysBetween(req.start_date, req.end_date);
            const total = req.total_price ?? listing.price_per_day * days;
            return (
              <div
                key={req.id}
                onClick={() => navigate(`/my-listings/${listingId}/requests/${req.id}`)}
                className="bg-white rounded-xl border border-[#E5E7EB] p-4 cursor-pointer hover:border-brand transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center text-white text-sm" style={{ fontWeight: 600 }}>
                    {name[0]?.toUpperCase() ?? "U"}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm" style={{ fontWeight: 500 }}>{name}</p>
                    <StatusBadge status={req.status} />
                  </div>
                  <ChevronRight size={16} className="text-[#6B7280]" />
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-[#6B7280]">
                  <div>
                    <p className="text-[10px] text-[#9CA3AF] mb-0.5">{t("rentalPeriod")}</p>
                    <p className="text-[#1F2937]">{fmtDate(req.start_date)} – {fmtDate(req.end_date)}</p>
                    <p>{days} {isZh ? zh("天") : "days"}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#9CA3AF] mb-0.5">{isZh ? zh("總金額") : "Total"}</p>
                    <p className="text-brand" style={{ fontWeight: 600 }}>HK${total}</p>
                    {req.pickup_preference && (
                      <p className="text-[10px] mt-0.5">
                        {req.pickup_preference === "collect"
                          ? t("renterCollects")
                          : t("ownerDelivers")}
                      </p>
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
