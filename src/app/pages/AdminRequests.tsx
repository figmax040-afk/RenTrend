import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useI18n } from "../components/i18n";

type Row = {
  id: string;
  renter_id: string;
  listing_id: string;
  start_date: string;
  end_date: string;
  status: string;
  total_price: number;
  renterName: string;
  listingTitle: string;
};

const statusColor: Record<string, string> = {
  pending:   "#F4A261",
  accepted:  "#22C55E",
  rejected:  "#EF4444",
  cancelled: "#EF4444",
  completed: "#6B7280",
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function AdminRequests() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // Step 1: fetch requests
      const { data: requests } = await supabase
        .from("requests")
        .select("id, renter_id, listing_id, start_date, end_date, status, total_price")
        .order("created_at", { ascending: false });

      if (!requests || requests.length === 0) { setLoading(false); return; }

      // Step 2: fetch listing titles
      const listingIds = [...new Set(requests.map((r) => r.listing_id))];
      const { data: listings } = await supabase
        .from("listings")
        .select("id, title")
        .in("id", listingIds);

      // Step 3: fetch renter profiles
      const renterIds = [...new Set(requests.map((r) => r.renter_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", renterIds);

      const listingMap = Object.fromEntries((listings ?? []).map((l) => [l.id, l.title]));
      const profileMap = Object.fromEntries(
        (profiles ?? []).map((p) => [
          p.id,
          p.name || (p.email ? p.email.split("@")[0] : p.id.slice(0, 8) + "…"),
        ])
      );

      setRows(
        requests.map((r) => ({
          ...r,
          renterName: profileMap[r.renter_id] ?? r.renter_id.slice(0, 8) + "…",
          listingTitle: listingMap[r.listing_id] ?? "—",
        }))
      );
      setLoading(false);
    }
    load();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 pt-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate("/admin")} className="text-[#6B7280]"><ArrowLeft size={20} /></button>
        <h2 className="text-[#1F2937]">{t("allRequests")}</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-[#1E6B1E] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-center text-[#6B7280] text-sm py-12">{t("noRequestsYet")}</p>
      ) : (
        <div className="bg-white rounded-xl border border-[#E5E7EB] divide-y divide-[#E5E7EB]">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate" style={{ fontWeight: 500 }}>{r.listingTitle}</p>
                <p className="text-[10px] text-[#6B7280] mt-0.5">
                  {r.renterName} · {fmt(r.start_date)} – {fmt(r.end_date)} · HK${r.total_price}
                </p>
              </div>
              <span
                className="ml-3 text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap"
                style={{
                  backgroundColor: (statusColor[r.status] ?? "#6B7280") + "15",
                  color: statusColor[r.status] ?? "#6B7280",
                }}
              >
                {t(r.status) || r.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
