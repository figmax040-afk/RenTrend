import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useI18n } from "../components/i18n";
import { sendEmail } from "../../lib/sendEmail";
import { APP_URL } from "../../lib/appUrl";

type Row = {
  id: string;
  title: string;
  owner_id: string;
  created_at: string;
};

export function AdminApprovals() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase
      .from("listings")
      .select("id, title, owner_id, created_at")
      .eq("approval_status", "pending")
      .order("created_at", { ascending: false })
      .then(({ data, error: loadErr }) => {
        if (loadErr) setError(loadErr.message);
        setRows(data ?? []);
        setLoading(false);
      });
  }, []);

  async function decide(row: Row, approval_status: "approved" | "rejected") {
    setActing(row.id);
    setError("");
    // Reject keeps the listing (and its history) instead of deleting it
    const { error: updErr } = await supabase.from("listings").update({ approval_status }).eq("id", row.id);
    if (updErr) {
      setError(updErr.message);
      setActing(null);
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    setActing(null);

    const { data: owner } = await supabase.from("profiles").select("name, email").eq("id", row.owner_id).single();
    if (owner?.email) {
      await sendEmail(
        owner.email,
        approval_status === "approved" ? `Your listing "${row.title}" is live` : `Your listing "${row.title}" was not approved`,
        approval_status === "approved"
          ? `Hi ${owner.name || "there"}, <strong>${row.title}</strong> has been approved and is now visible to renters. <a href="${APP_URL}/activity?tab=listings">${APP_URL}/activity?tab=listings</a>`
          : `Hi ${owner.name || "there"}, <strong>${row.title}</strong> was not approved. You can edit it or contact us for details. <a href="${APP_URL}/activity?tab=listings">${APP_URL}/activity?tab=listings</a>`
      );
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 pt-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate("/admin")} className="text-[#6B7280]"><ArrowLeft size={20} /></button>
        <h2 className="text-[#1F2937]">{t("pendingApprovals")}</h2>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl mb-3">{error}</p>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-center text-[#6B7280] text-sm py-12">{t("noPendingApprovals")}</p>
      ) : (
        <div className="bg-white rounded-xl border border-[#E5E7EB] divide-y divide-[#E5E7EB]">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate" style={{ fontWeight: 500 }}>{r.title}</p>
                <p className="text-[10px] text-[#6B7280] mt-0.5">
                  {r.owner_id.slice(0, 8)}… · {new Date(r.created_at).toLocaleDateString(lang === "zh" ? "zh-HK" : "en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <div className="flex gap-2 ml-3">
                <button
                  onClick={() => decide(r, "approved")}
                  disabled={acting === r.id}
                  className="px-3 py-1 bg-[#22C55E] text-white rounded-lg text-xs disabled:opacity-50"
                >
                  {t("approve")}
                </button>
                <button
                  onClick={() => decide(r, "rejected")}
                  disabled={acting === r.id}
                  className="px-3 py-1 border border-[#EF4444] text-[#EF4444] rounded-lg text-xs disabled:opacity-50"
                >
                  {t("reject")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
