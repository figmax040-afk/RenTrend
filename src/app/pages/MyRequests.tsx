import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useI18n } from "../components/i18n";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { ChevronDown, ChevronUp } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/useAuth";
import { IMAGES } from "../components/data";

type RequestRow = {
  id: string;
  start_date: string;
  end_date: string;
  total_price: number;
  status: "pending" | "accepted" | "rejected" | "completed";
  listings: {
    id: string;
    title: string;
    title_zh: string | null;
    image_url: string | null;
    price_per_day: number;
    deposit: number | null;
  } | null;
};

const tabs = ["active", "pending", "past"] as const;

const statusColor: Record<string, string> = {
  accepted: "#22C55E",
  pending: "#F4A261",
  rejected: "#EF4444",
  completed: "#6B7280",
};

function formatDateRange(start: string, end: string) {
  const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${fmt(start)} – ${fmt(end)}`;
}

export function MyRequests() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [tab, setTab] = useState<typeof tabs[number]>("active");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }

    supabase
      .from("requests")
      .select("id, start_date, end_date, total_price, status, listings(id, title, title_zh, image_url, price_per_day, deposit)")
      .eq("renter_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRequests((data as RequestRow[]) ?? []);
        setDataLoading(false);
      });
  }, [authLoading, user, navigate]);

  if (authLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-[#1E6B1E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const filtered = requests.filter((r) => {
    if (tab === "active") return r.status === "accepted";
    if (tab === "pending") return r.status === "pending";
    return r.status === "rejected" || r.status === "completed";
  });

  const emptyMsg: Record<typeof tabs[number], string> = {
    active:  lang === "zh" ? "暫無進行中的租約" : "No active rentals",
    pending: lang === "zh" ? "暫無待處理的請求" : "No pending requests",
    past:    lang === "zh" ? "暫無過去的請求" : "No past requests",
  };

  return (
    <div className="max-w-lg mx-auto px-4 pt-4">
      <h2 className="text-[#1F2937] mb-4">{t("myRequests")}</h2>
      <div className="flex gap-2 mb-4">
        {tabs.map((tb) => (
          <button key={tb} onClick={() => setTab(tb)} className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${tab === tb ? "bg-[#1E6B1E] text-white border-[#1E6B1E]" : "bg-white text-[#6B7280] border-[#E5E7EB]"}`}>
            {t(tb)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-[#6B7280] text-sm py-12">{emptyMsg[tab]}</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const listing = r.listings;
            const isOpen = expanded === r.id;
            const title = listing
              ? (lang === "zh" && listing.title_zh ? listing.title_zh : listing.title)
              : "—";
            const image = listing?.image_url ?? IMAGES.kettle;

            return (
              <div key={r.id} className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
                <button onClick={() => setExpanded(isOpen ? null : r.id)} className="w-full flex items-center gap-3 p-3">
                  <ImageWithFallback src={image} alt="" className="w-14 h-14 rounded-lg object-cover" />
                  <div className="flex-1 text-left">
                    <p className="text-sm" style={{ fontWeight: 500 }}>{title}</p>
                    <p className="text-xs text-[#6B7280]">{formatDateRange(r.start_date, r.end_date)}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: (statusColor[r.status] ?? "#6B7280") + "15", color: statusColor[r.status] ?? "#6B7280" }}>
                    {t(r.status)}
                  </span>
                  {isOpen ? <ChevronUp size={14} className="text-[#6B7280]" /> : <ChevronDown size={14} className="text-[#6B7280]" />}
                </button>
                {isOpen && (
                  <div className="px-3 pb-3 text-sm text-[#6B7280] border-t border-[#E5E7EB] pt-2">
                    <p>HK${listing?.price_per_day}/day · {t("deposit")}: HK${listing?.deposit ?? 0}</p>
                    <p className="mt-1">{lang === "zh" ? "總計" : "Total"}: <span className="text-[#1E6B1E]" style={{ fontWeight: 500 }}>HK${r.total_price}</span></p>
                    {r.status === "accepted" && (
                      <p className="text-[#22C55E] mt-1">{lang === "zh" ? "已接受 — 請聯繫物主安排交收" : "Accepted — contact the owner to arrange pickup"}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
