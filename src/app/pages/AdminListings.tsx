import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useI18n } from "../components/i18n";

type Row = {
  id: string;
  title: string;
  is_active: boolean;
  approval_status: string | null;
  created_at: string;
  owner_id: string;
};

export function AdminListings() {
  const navigate = useNavigate();
  const { t, isZh, zh } = useI18n();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("listings")
      .select("id, title, is_active, approval_status, created_at, owner_id")
      .order("created_at", { ascending: false })
      .then(({ data, error: loadErr }) => {
        if (loadErr) setError(loadErr.message);
        setRows(data ?? []);
        setLoading(false);
      });
  }, []);

  // A taken-down listing ("rejected") is hidden from Home/Browse; restoring makes it visible again.
  async function setTakenDown(row: Row, takenDown: boolean) {
    setActing(row.id);
    setError("");
    const approval_status = takenDown ? "rejected" : "approved";
    const { data, error: updErr } = await supabase
      .from("listings").update({ approval_status }).eq("id", row.id).select("id");
    setActing(null);
    if (updErr) { setError(updErr.message); return; }
    // RLS can silently block the update; no returned row means nothing changed.
    if (!data?.length) { setError(t("updateBlocked")); return; }
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, approval_status } : r)));
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate("/admin")} className="text-[#6B7280]"><ArrowLeft size={20} /></button>
        <h2 className="text-[#1F2937]">{t("allListings")}</h2>
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl mb-4">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-center text-[#6B7280] text-sm py-12">{t("noListingsYet")}</p>
      ) : (
        <div className="bg-white rounded-xl border border-[#E5E7EB] divide-y divide-[#E5E7EB]">
          {rows.map((r) => {
            const takenDown = r.approval_status === "rejected";
            return (
            <div key={r.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate" style={{ fontWeight: 500 }}>{r.title}</p>
                <p className="text-[10px] text-[#6B7280] mt-0.5">
                  {r.owner_id.slice(0, 8)}… · {new Date(r.created_at).toLocaleDateString(isZh ? zh("zh-HK") : "en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <span
                className="ml-3 text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap"
                style={{
                  backgroundColor: takenDown ? "#EF444415" : r.is_active ? "#22C55E15" : "#6B728015",
                  color: takenDown ? "#EF4444" : r.is_active ? "#22C55E" : "#6B7280",
                }}
              >
                {takenDown ? t("takenDown") : r.is_active ? t("active") : t("inactive")}
              </span>
              <button
                onClick={() => setTakenDown(r, !takenDown)}
                disabled={acting === r.id}
                className={`ml-2 text-xs px-3 py-1 rounded-lg border disabled:opacity-50 ${takenDown ? "text-brand border-brand-border" : "text-[#EF4444] border-[#EF4444]/30"}`}
              >
                {takenDown ? t("restore") : t("takeDown")}
              </button>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
