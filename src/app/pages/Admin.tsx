import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useI18n } from "../components/i18n";
import { Package, MessageSquare, Recycle, ArrowLeft } from "lucide-react";
import { supabase } from "../../lib/supabase";

type Stats = {
  totalListings: number;
  openRequests: number;
  recyclingSubmissions: number;
};

export function Admin() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ totalListings: 0, openRequests: 0, recyclingSubmissions: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const [listingsRes, requestsRes, recycleRes] = await Promise.all([
        supabase.from("listings").select("id", { count: "exact", head: true }),
        supabase.from("requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("recycle_submissions").select("id", { count: "exact", head: true }).eq("status", "pending"),
      ]);
      setStats({
        totalListings: listingsRes.count ?? 0,
        openRequests: requestsRes.count ?? 0,
        recyclingSubmissions: recycleRes.count ?? 0,
      });
      setLoading(false);
    }
    fetchStats();
  }, []);

  const statCards = [
    { key: "totalListings",        icon: Package,       color: "#F4A261", route: "/admin/listings"  },
    { key: "openRequests",         icon: MessageSquare, color: "#22C55E", route: "/admin/requests"  },
    { key: "recyclingSubmissions", icon: Recycle,       color: "#6B7280", route: "/admin/recycling" },
  ] as const;

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate("/profile")} className="text-[#6B7280]">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-[#1F2937]">{t("admin")}</h2>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {statCards.map((s) => {
          const Icon = s.icon;
          const value = stats[s.key as keyof Stats];
          return (
            <button
              key={s.key}
              onClick={() => navigate(s.route)}
              className="bg-white rounded-xl border border-[#E5E7EB] p-4 text-left hover:border-brand transition-colors"
            >
              <Icon size={20} style={{ color: s.color }} />
              {loading ? (
                <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mt-2 mb-1" style={{ borderColor: s.color, borderTopColor: "transparent" }} />
              ) : (
                <p className="text-2xl mt-2" style={{ fontWeight: 600, color: s.color }}>{value}</p>
              )}
              <p className="text-xs text-[#6B7280]">{t(s.key)}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
