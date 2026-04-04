import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { useI18n } from "../components/i18n";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { ChevronRight } from "lucide-react";
import { supabase } from "../../lib/supabase";

const FALLBACK_IMAGE = "https://placehold.co/400x300?text=RenTrend";

type EnrichedRequest = {
  id: string;
  listing_id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: string;
  listing: {
    id: string;
    title: string;
    image_url: string | null;
    price_per_day: number;
    deposit: number | null;
    owner_id: string;
  } | null;
  owner: {
    id: string;
    name: string | null;
    email: string | null;
  } | null;
};

const tabs = ["active", "pending", "past"] as const;

const statusColor: Record<string, string> = {
  accepted: "#22C55E",
  pending: "#F4A261",
  rejected: "#EF4444",
  completed: "#6B7280",
  cancelled: "#6B7280",
};

function formatDateRange(start: string, end: string) {
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  return `${fmt(start)} – ${fmt(end)}`;
}

function ownerDisplayName(owner: { name: string | null; email: string | null } | null): string {
  if (owner?.name) return owner.name;
  if (owner?.email) return owner.email.split("@")[0];
  return "Owner";
}

export function MyRequests() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<EnrichedRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<(typeof tabs)[number]>("active");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      // Step 1: fetch requests
      const { data: rawRequests, error: reqErr } = await supabase
        .from("requests")
        .select("*")
        .eq("renter_id", user.id)
        .order("created_at", { ascending: false });

      if (reqErr) throw reqErr;
      if (!rawRequests || rawRequests.length === 0) {
        setRequests([]);
        setLoading(false);
        return;
      }

      // Step 2: fetch listings
      const listingIds = [...new Set(rawRequests.map((r) => r.listing_id))];
      const { data: listings } = await supabase
        .from("listings")
        .select("id, title, image_url, price_per_day, deposit, owner_id")
        .in("id", listingIds);

      // Step 3: fetch owner profiles
      const ownerIds = [...new Set((listings ?? []).map((l) => l.owner_id))];
      const { data: profiles } = ownerIds.length > 0
        ? await supabase
            .from("profiles")
            .select("id, name, email")
            .in("id", ownerIds)
        : { data: [] };

      // Step 4: merge
      const enriched: EnrichedRequest[] = rawRequests.map((r) => {
        const listing = (listings ?? []).find((l) => l.id === r.listing_id) ?? null;
        const owner = (profiles ?? []).find((p) => p.id === listing?.owner_id) ?? null;
        return { ...r, listing, owner };
      });

      setRequests(enriched);
    } catch (err: any) {
      console.error("MyRequests fetch error:", err);
      setError(lang === "zh" ? "載入請求時出錯" : "Failed to load requests.");
    } finally {
      setLoading(false);
    }
  }, [navigate, lang]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-[#1E6B1E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-8 text-center">
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-xl mb-3">{error}</p>
        <button onClick={load} className="text-sm text-[#1E6B1E]">
          {lang === "zh" ? "重試" : "Try again"}
        </button>
      </div>
    );
  }

  const filtered = requests.filter((r) => {
    if (tab === "active") return r.status === "accepted";
    if (tab === "pending") return r.status === "pending";
    return r.status === "rejected" || r.status === "completed" || r.status === "cancelled";
  });

  const emptyMsg: Record<(typeof tabs)[number], string> = {
    active: lang === "zh" ? "暫無進行中的租約" : "No active rentals",
    pending: lang === "zh" ? "暫無待處理的請求" : "No pending requests",
    past: lang === "zh" ? "暫無過去的請求" : "No past requests",
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-4">
      <h2 className="text-[#1F2937] mb-4">{t("myRequests")}</h2>
      <div className="flex gap-2 mb-4">
        {tabs.map((tb) => (
          <button
            key={tb}
            onClick={() => setTab(tb)}
            className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
              tab === tb
                ? "bg-[#1E6B1E] text-white border-[#1E6B1E]"
                : "bg-white text-[#6B7280] border-[#E5E7EB]"
            }`}
          >
            {t(tb)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-[#6B7280] text-sm py-12">{emptyMsg[tab]}</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const title = r.listing?.title ?? "—";
            const image = r.listing?.image_url ?? FALLBACK_IMAGE;
            const owner = ownerDisplayName(r.owner);

            return (
              <button
                key={r.id}
                onClick={() => navigate(`/my-requests/${r.id}`)}
                className="w-full bg-white rounded-xl border border-[#E5E7EB] overflow-hidden flex items-center gap-3 p-3 text-left"
              >
                <ImageWithFallback
                  src={image}
                  alt=""
                  className="w-14 h-14 rounded-lg object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate" style={{ fontWeight: 500 }}>{title}</p>
                  <p className="text-xs text-[#6B7280]">{owner}</p>
                  <p className="text-xs text-[#6B7280]">
                    {formatDateRange(r.start_date, r.end_date)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: (statusColor[r.status] ?? "#6B7280") + "15",
                      color: statusColor[r.status] ?? "#6B7280",
                    }}
                  >
                    {t(r.status)}
                  </span>
                  <ChevronRight size={14} className="text-[#6B7280]" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
