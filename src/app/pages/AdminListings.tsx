import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useI18n } from "../components/i18n";

type Row = {
  id: string;
  title: string;
  is_active: boolean;
  created_at: string;
  owner_id: string;
};

export function AdminListings() {
  const navigate = useNavigate();
  const { t, isZh, zh } = useI18n();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("listings")
      .select("id, title, is_active, created_at, owner_id")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setRows(data ?? []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 pt-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate("/admin")} className="text-[#6B7280]"><ArrowLeft size={20} /></button>
        <h2 className="text-[#1F2937]">{t("allListings")}</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <p className="text-center text-[#6B7280] text-sm py-12">{t("noListingsYet")}</p>
      ) : (
        <div className="bg-white rounded-xl border border-[#E5E7EB] divide-y divide-[#E5E7EB]">
          {rows.map((r) => (
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
                  backgroundColor: r.is_active ? "#22C55E15" : "#6B728015",
                  color: r.is_active ? "#22C55E" : "#6B7280",
                }}
              >
                {r.is_active ? t("active") : t("inactive")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
