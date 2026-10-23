import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useI18n } from "../components/i18n";

type Submission = {
  id: string;
  user_id: string;
  item_type: string;
  condition: string;
  description: string | null;
  location: string | null;
  pickup_date: string | null;
  expected_price: number | null;
  status: string;
  created_at: string;
  submitterEmail: string;
};

const conditionColor: Record<string, string> = {
  working: "#22C55E",
  partiallyWorking: "#F4A261",
  broken: "#EF4444",
};

const statusColor: Record<string, string> = {
  pending: "#F4A261",
  collected: "#3B82F6",
  listed: "#22C55E",
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function AdminRecycling() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: rows } = await supabase
        .from("recycle_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (!rows || rows.length === 0) { setLoading(false); return; }

      const userIds = [...new Set(rows.map((r) => r.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", userIds);

      const profileMap = Object.fromEntries(
        (profiles ?? []).map((p) => [p.id, p.email || p.name || p.id.slice(0, 8) + "…"])
      );

      setSubmissions(rows.map((r) => ({
        ...r,
        submitterEmail: profileMap[r.user_id] ?? r.user_id.slice(0, 8) + "…",
      })));
      setLoading(false);
    }
    load();
  }, []);

  async function updateStatus(id: string, status: string) {
    await supabase.from("recycle_submissions").update({ status }).eq("id", id);
    setSubmissions((prev) => prev.map((s) => s.id === id ? { ...s, status } : s));
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate("/admin")} className="text-[#6B7280]"><ArrowLeft size={20} /></button>
        <h2 className="text-[#1F2937]">{t("recyclingSubmissions")}</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : submissions.length === 0 ? (
        <p className="text-center text-[#6B7280] text-sm py-12">{t("noSubmissionsYet")}</p>
      ) : (
        <div className="space-y-3">
          {submissions.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-[#E5E7EB] p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-sm" style={{ fontWeight: 500 }}>{s.item_type}</p>
                  <p className="text-xs text-[#6B7280] mt-0.5">{s.submitterEmail}</p>
                </div>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap"
                  style={{
                    backgroundColor: (statusColor[s.status] ?? "#6B7280") + "15",
                    color: statusColor[s.status] ?? "#6B7280",
                  }}
                >
                  {t(s.status) || s.status}
                </span>
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#6B7280] mb-2">
                <span
                  className="px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: (conditionColor[s.condition] ?? "#6B7280") + "15",
                    color: conditionColor[s.condition] ?? "#6B7280",
                  }}
                >
                  {t(s.condition) || s.condition}
                </span>
                {s.location && <span>📍 {s.location}</span>}
                {s.pickup_date && <span>📅 {fmt(s.pickup_date)}</span>}
                {s.expected_price != null && <span>💰 HK${s.expected_price}</span>}
              </div>

              {s.description && (
                <p className="text-xs text-[#6B7280] mb-3 italic">"{s.description}"</p>
              )}

              {s.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateStatus(s.id, "collected")}
                    className="flex-1 py-1.5 bg-[#3B82F6] text-white rounded-lg text-xs"
                  >
                    {t("markCollected")}
                  </button>
                  <button
                    onClick={() => updateStatus(s.id, "listed")}
                    className="flex-1 py-1.5 bg-brand text-white rounded-lg text-xs"
                  >
                    {t("markListed")}
                  </button>
                </div>
              )}
              {s.status === "collected" && (
                <button
                  onClick={() => updateStatus(s.id, "listed")}
                  className="w-full py-1.5 bg-brand text-white rounded-lg text-xs"
                >
                  {t("markListed")}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
