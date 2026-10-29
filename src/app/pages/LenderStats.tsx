import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Eye, Inbox, CheckCircle, Wallet, Trophy, Crown } from "lucide-react";
import { useI18n } from "../components/i18n";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { supabase } from "../../lib/supabase";
import { loginPath } from "../../lib/authRedirect";
import listingPlaceholder from "../../assets/listing-placeholder.svg";
import { STATS_SEED } from "../../demo/demoConfig";
import { payoutFor } from "../../demo/demo";
import { useDemoProfile } from "../../demo/useDemoProfile";

type Stats = {
  views: number;
  requests: number;
  completed: number;
  earnings: number;
  top: { title: string; image: string | null; views: number; requests: number } | null;
  bars: { label: string; value: number }[];
  sample: boolean;
};

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export function LenderStats() {
  const navigate = useNavigate();
  const { t, isZh, zh } = useI18n();
  const { profile, loading: profileLoading } = useDemoProfile();
  const [stats, setStats] = useState<Stats | null>(null);
  const [hasListings, setHasListings] = useState(true);

  useEffect(() => {
    if (profileLoading) return;
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate(loginPath()); return; }

      const { data: listings } = await supabase.from("listings").select("*").eq("owner_id", user.id);
      const own = listings ?? [];
      setHasListings(own.length > 0);
      const ids = own.map((l) => l.id);

      const { data: reqs } = ids.length > 0
        ? await supabase.from("requests").select("id, listing_id, status, total_price, created_at, completed_at").in("listing_id", ids)
        : { data: [] as any[] };

      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);
      const inMonth = (d: string | null) => !!d && new Date(d) >= monthStart;

      const all = reqs ?? [];
      const views = own.reduce((s, l) => s + (l.view_count ?? 0), 0);
      const requests = all.filter((r) => inMonth(r.created_at)).length;
      const done = all.filter((r) => r.status === "completed" && inMonth(r.completed_at));
      const earnings = done.reduce((s, r) => s + payoutFor(r.total_price ?? 0, profile.lenderCompleted).payout, 0);

      const reqCount = (id: string) => all.filter((r) => r.listing_id === id).length;
      const ranked = [...own].sort((a, b) => reqCount(b.id) - reqCount(a.id) || (b.view_count ?? 0) - (a.view_count ?? 0));
      const topRow = ranked[0];
      const titleOf = (l: Record<string, any>) => (isZh && l.title_zh ? zh(l.title_zh) : l.title);

      // New accounts have almost no history yet; show plausible sample numbers instead of zeros
      const sample = views < 20 && all.length < 3;
      if (sample) {
        setStats({
          views: STATS_SEED.views,
          requests: STATS_SEED.requests,
          completed: STATS_SEED.completed,
          earnings: STATS_SEED.earnings,
          top: topRow
            ? { title: titleOf(topRow), image: topRow.image_url, views: STATS_SEED.topListingViews, requests: STATS_SEED.topListingRequests }
            : null,
          bars: STATS_SEED.weeklyViews.map((v, i) => ({ label: DAY_LABELS[i], value: v })),
          sample: true,
        });
      } else {
        setStats({
          views,
          requests,
          completed: done.length,
          earnings,
          top: topRow ? { title: titleOf(topRow), image: topRow.image_url, views: topRow.view_count ?? 0, requests: reqCount(topRow.id) } : null,
          // Views per listing (the database keeps a running total, not a daily series)
          bars: ranked.slice(0, 7).map((l) => ({ label: titleOf(l).slice(0, 6), value: l.view_count ?? 0 })),
          sample: false,
        });
      }
    }
    load();
  }, [profileLoading, profile.lenderCompleted, navigate, isZh]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const tiles = [
    { icon: Eye, label: t("statViews"), value: stats.views.toLocaleString() },
    { icon: Inbox, label: t("statRequests"), value: stats.requests },
    { icon: CheckCircle, label: t("statCompleted"), value: stats.completed },
    { icon: Wallet, label: t("statEarnings"), value: `HK$${stats.earnings.toLocaleString()}`, sub: t("statsAfterFees") },
  ];
  const maxBar = Math.max(1, ...stats.bars.map((b) => b.value));

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-10">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate("/profile")} className="text-[#6B7280]"><ArrowLeft size={20} /></button>
        <h2 className="text-[#1F2937]" style={{ fontWeight: 600 }}>{t("myStats")}</h2>
      </div>

      {stats.sample && (
        <p className="text-xs text-[#B45309] bg-[#F4A261]/10 border border-[#F4A261]/30 px-3 py-2 rounded-xl mb-3">{t("sampleData")}</p>
      )}
      {!profile.isPlus && (
        <button onClick={() => navigate("/plus")} className="w-full text-left text-xs text-brand bg-brand-soft border border-brand-border px-3 py-2 rounded-xl mb-3 flex items-center gap-2">
          <Crown size={14} />{t("statsPlusNote")} →
        </button>
      )}

      <p className="text-xs text-[#6B7280] mb-2" style={{ fontWeight: 600 }}>{t("statsThisMonth")}</p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        {tiles.map(({ icon: Icon, label, value, sub }) => (
          <div key={label} className="bg-white rounded-xl border border-[#E5E7EB] p-4">
            <Icon size={16} className="text-brand mb-1" />
            <p className="text-brand-ink" style={{ fontSize: 22, fontWeight: 700 }}>{value}</p>
            <p className="text-xs text-[#6B7280]">{label}</p>
            {sub && <p className="text-[10px] text-[#9CA3AF]">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Top listing */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 mb-4">
        <p className="text-sm text-[#1F2937] flex items-center gap-1.5 mb-3" style={{ fontWeight: 600 }}>
          <Trophy size={16} className="text-[#F59E0B]" />{t("topListing")}
        </p>
        {stats.top ? (
          <div className="flex gap-3 items-center">
            <ImageWithFallback src={stats.top.image ?? listingPlaceholder} alt="" className="w-14 h-14 rounded-lg object-cover" />
            <div className="min-w-0">
              <p className="text-sm truncate" style={{ fontWeight: 500 }}>{stats.top.title}</p>
              <p className="text-xs text-[#6B7280]">{stats.top.views} {t("statViews")} · {stats.top.requests} {t("statRequests")}</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#9CA3AF]">{hasListings ? "—" : t("noListingsForStats")}</p>
        )}
      </div>

      {/* Views */}
      {stats.bars.length > 0 && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
          <p className="text-sm text-[#1F2937] mb-3" style={{ fontWeight: 600 }}>{stats.sample ? t("viewsLast7") : t("statViews")}</p>
          <div className="flex items-end gap-2 h-28">
            {stats.bars.map((b, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
                <span className="text-[9px] text-[#6B7280] mb-0.5">{b.value}</span>
                <div className="w-full rounded-t-md bg-brand" style={{ height: `${(b.value / maxBar) * 80}%`, opacity: 0.55 + 0.45 * (b.value / maxBar) }} />
                <span className="text-[9px] text-[#9CA3AF] mt-1 truncate w-full text-center">{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
