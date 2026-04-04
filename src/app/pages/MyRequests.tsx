import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useI18n } from "../components/i18n";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { MoreVertical } from "lucide-react";
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
  cancelled: "#EF4444",
};

const statusKeyMap: Record<string, string> = {
  pending: "pending",
  accepted: "accepted",
  rejected: "rejected",
  cancelled: "cancelled",
  completed: "completed",
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
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { navigate("/login"); return; }

        const { data: reqs, error } = await supabase
          .from("requests")
          .select("*")
          .eq("renter_id", user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;
        if (!reqs || reqs.length === 0) { setRequests([]); setLoading(false); return; }

        const listingIds = [...new Set(reqs.map((r) => r.listing_id))];
        const { data: listings } = await supabase
          .from("listings")
          .select("id, title, image_url, price_per_day, deposit, owner_id")
          .in("id", listingIds);

        const ownerIds = [...new Set((listings || []).map((l) => l.owner_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, email")
          .in("id", ownerIds);

        const enriched: EnrichedRequest[] = reqs.map((r) => {
          const listing = listings?.find((l) => l.id === r.listing_id) ?? null;
          const owner = profiles?.find((p) => p.id === listing?.owner_id) ?? null;
          return { ...r, listing, owner };
        });

        setRequests(enriched);
      } catch (err: any) {
        setError(err.message || "Failed to load requests.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  async function handleCancel(requestId: string) {
    setActing(true);
    const { error } = await supabase.from("requests").update({ status: "cancelled" }).eq("id", requestId);
    if (!error) {
      setRequests((prev) => prev.map((r) => r.id === requestId ? { ...r, status: "cancelled" } : r));
    }
    setConfirmCancel(null);
    setActing(false);
  }

  async function handleDelete(requestId: string) {
    setActing(true);
    await supabase.from("requests").delete().eq("id", requestId);
    setRequests((prev) => prev.filter((r) => r.id !== requestId));
    setConfirmDelete(null);
    setActing(false);
  }

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
        <button onClick={() => window.location.reload()} className="text-sm text-[#1E6B1E]">{lang === "zh" ? "重試" : "Try again"}</button>
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
    <div className="max-w-lg mx-auto px-4 pt-4" onClick={() => setMenuOpen(null)}>
      <h2 className="text-[#1F2937] mb-4">{t("myRentalRequests")}</h2>
      <div className="flex gap-2 mb-4">
        {tabs.map((tb) => (
          <button key={tb} onClick={() => setTab(tb)}
            className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
              tab === tb ? "bg-[#1E6B1E] text-white border-[#1E6B1E]" : "bg-white text-[#6B7280] border-[#E5E7EB]"
            }`}>
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
            const isMenuOpen = menuOpen === r.id;
            const isCancelConfirming = confirmCancel === r.id;
            const isDeleteConfirming = confirmDelete === r.id;

            return (
              <div key={r.id} className="relative">
                <div
                  onClick={() => { if (!isCancelConfirming && !isDeleteConfirming) navigate(`/my-requests/${r.id}`); }}
                  className="bg-white rounded-xl border border-[#E5E7EB] p-3 flex gap-3 cursor-pointer hover:border-[#1E6B1E] transition-colors"
                >
                  <ImageWithFallback src={image} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ fontWeight: 500 }}>{title}</p>
                    <p className="text-xs text-[#6B7280]">{owner}</p>
                    <p className="text-xs text-[#6B7280]">{formatDateRange(r.start_date, r.end_date)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: (statusColor[r.status] ?? "#6B7280") + "15",
                          color: statusColor[r.status] ?? "#6B7280",
                        }}>
                        {t(statusKeyMap[r.status] ?? r.status)}
                      </span>
                      {r.total_price > 0 && (
                        <span className="text-xs text-[#1E6B1E]" style={{ fontWeight: 500 }}>
                          HK${r.total_price}
                        </span>
                      )}
                    </div>
                  </div>
                  {/* Three-dot menu */}
                  <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setMenuOpen(isMenuOpen ? null : r.id); setConfirmCancel(null); setConfirmDelete(null); }}
                      className="text-[#6B7280] p-1"
                    >
                      <MoreVertical size={14} />
                    </button>
                    {isMenuOpen && (
                      <div className="absolute right-0 top-6 bg-white border border-[#E5E7EB] rounded-xl shadow-sm z-10 min-w-[160px]"
                        onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => { navigate(`/my-requests/${r.id}`); setMenuOpen(null); }}
                          className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#F9FAFB] rounded-t-xl"
                        >
                          {t("viewRequest")}
                        </button>
                        {r.status === "pending" && (
                          <button
                            onClick={() => { navigate(`/my-requests/${r.id}/edit`); setMenuOpen(null); }}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#F9FAFB]"
                          >
                            {t("editRequest")}
                          </button>
                        )}
                        {r.status === "pending" && (
                          <button
                            onClick={() => { setConfirmCancel(r.id); setMenuOpen(null); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-[#F4A261] hover:bg-orange-50"
                          >
                            {t("cancelRequest")}
                          </button>
                        )}
                        {(r.status === "rejected" || r.status === "cancelled") && (
                          <button
                            onClick={() => { setConfirmDelete(r.id); setMenuOpen(null); }}
                            className="w-full text-left px-4 py-2.5 text-sm text-[#EF4444] hover:bg-red-50 rounded-b-xl"
                          >
                            {t("deleteRequest")}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Cancel confirmation */}
                {isCancelConfirming && (
                  <div className="mt-1 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <p className="text-sm text-[#1F2937] mb-2">{t("cancelConfirm")}</p>
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmCancel(null)} className="flex-1 py-1.5 border border-[#E5E7EB] text-[#6B7280] rounded-lg text-xs">
                        {lang === "zh" ? "返回" : "Go back"}
                      </button>
                      <button onClick={() => handleCancel(r.id)} disabled={acting}
                        className="flex-1 py-1.5 bg-[#F4A261] text-white rounded-lg text-xs disabled:opacity-60">
                        {acting ? "…" : t("cancelRequest")}
                      </button>
                    </div>
                  </div>
                )}

                {/* Delete confirmation */}
                {isDeleteConfirming && (
                  <div className="mt-1 bg-red-50 border border-red-200 rounded-xl px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <p className="text-sm text-[#1F2937] mb-2">{t("deleteConfirm")}</p>
                    <div className="flex gap-2">
                      <button onClick={() => setConfirmDelete(null)} className="flex-1 py-1.5 border border-[#E5E7EB] text-[#6B7280] rounded-lg text-xs">
                        {lang === "zh" ? "取消" : "Cancel"}
                      </button>
                      <button onClick={() => handleDelete(r.id)} disabled={acting}
                        className="flex-1 py-1.5 bg-[#EF4444] text-white rounded-lg text-xs disabled:opacity-60">
                        {acting ? "…" : t("delete")}
                      </button>
                    </div>
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
