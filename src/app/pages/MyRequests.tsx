import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useI18n } from "../components/i18n";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { ChevronRight } from "lucide-react";
import { supabase } from "../../lib/supabase";

const FALLBACK_IMAGE = "https://placehold.co/400x300?text=RenTrend";

type OwnerProfile = {
  name: string | null;
  email: string | null;
};

type ListingWithOwner = {
  id: string;
  title: string;
  image_url: string | null;
  price_per_day: number;
  deposit: number | null;
  owner_id: string;
  profiles: OwnerProfile | null;
};

type RequestRow = {
  id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled";
  listings: ListingWithOwner | null;
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

function ownerDisplayName(profile: OwnerProfile | null): string {
  if (profile?.name) return profile.name;
  if (profile?.email) return profile.email.split("@")[0];
  return "Owner";
}

export function MyRequests() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<(typeof tabs)[number]>("active");

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }

      const { data } = await supabase
        .from("requests")
        .select(
          `*, listings!inner(id, title, image_url, price_per_day, deposit, owner_id, profiles!owner_id(name, email))`
        )
        .eq("renter_id", user.id)
        .order("created_at", { ascending: false });

      setRequests((data as RequestRow[]) ?? []);
      setLoading(false);
    }
    load();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-[#1E6B1E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filtered = requests.filter((r) => {
    if (tab === "active") return r.status === "accepted";
    if (tab === "pending") return r.status === "pending";
    return (
      r.status === "rejected" ||
      r.status === "completed" ||
      r.status === "cancelled"
    );
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
        <p className="text-center text-[#6B7280] text-sm py-12">
          {emptyMsg[tab]}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const listing = r.listings;
            const title = listing?.title ?? "—";
            const image = listing?.image_url ?? FALLBACK_IMAGE;
            const owner = ownerDisplayName(listing?.profiles ?? null);

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
                  <p className="text-sm truncate" style={{ fontWeight: 500 }}>
                    {title}
                  </p>
                  <p className="text-xs text-[#6B7280]">{owner}</p>
                  <p className="text-xs text-[#6B7280]">
                    {formatDateRange(r.start_date, r.end_date)}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor:
                        (statusColor[r.status] ?? "#6B7280") + "15",
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
