import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Check, Crown, ShoppingBag, TrendingUp } from "lucide-react";
import { useI18n } from "../components/i18n";
import { PlusBadge } from "../components/Badges";
import { supabase } from "../../lib/supabase";
import { loginPath } from "../../lib/authRedirect";
import { PLUS_PLAN } from "../../demo/demoConfig";
import { copy } from "../../demo/demo";
import { fill } from "../../demo/strings";
import { refreshDemoProfile, useDemoProfile } from "../../demo/useDemoProfile";

export function LendyPlus() {
  const navigate = useNavigate();
  const { t, isZh, zh } = useI18n();
  const { profile, loading } = useDemoProfile();
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [justJoined, setJustJoined] = useState(false);

  const monthlyEquivalent = billing === "monthly" ? PLUS_PLAN.monthlyPrice : Math.round(PLUS_PLAN.yearlyPrice / 12);

  async function setPlan(plan: "plus" | "free") {
    if (!profile.userId) { navigate(loginPath()); return; }
    setBusy(true);
    setError("");
    const startedAt = new Date().toISOString();
    const { error: err } = await supabase
      .from("profiles")
      .update(plan === "plus"
        ? { plan, plan_billing: billing, plan_started_at: startedAt }
        : { plan, plan_billing: null, plan_started_at: null })
      .eq("id", profile.userId);
    if (err) { setBusy(false); setError(err.message); return; }
    await refreshDemoProfile();
    setBusy(false);
    setJustJoined(plan === "plus");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-10">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="text-[#6B7280]"><ArrowLeft size={20} /></button>
        <h2 className="text-[#1F2937]" style={{ fontWeight: 600 }}>{t("lendyPlus")}</h2>
      </div>

      {/* Hero */}
      <div className="rounded-2xl p-5 text-white mb-4" style={{ background: "linear-gradient(120deg, var(--brand-blue), var(--brand) 55%, var(--brand-green))" }}>
        <div className="flex items-center gap-2 mb-1">
          <Crown size={20} />
          <span style={{ fontWeight: 700, fontSize: 18 }}>Lendy Plus</span>
        </div>
        <p className="text-white/85 text-sm">{t("plusTagline")}</p>
        {profile.isPlus ? (
          <div className="mt-4 bg-white/15 rounded-xl p-3">
            <p className="text-sm" style={{ fontWeight: 600 }}>{justJoined ? t("plusWelcome") : t("plusActive")}</p>
            {profile.planStartedAt && (
              <p className="text-xs text-white/85">
                {fill(t("plusActiveSince"), {
                  date: new Date(profile.planStartedAt).toLocaleDateString("en-GB"),
                  billing: t(profile.planBilling ?? "monthly"),
                })}
              </p>
            )}
          </div>
        ) : (
          <>
            <div className="mt-4 inline-flex rounded-full bg-white/15 p-1 text-xs">
              {(["monthly", "yearly"] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => setBilling(b)}
                  className={`px-3 py-1 rounded-full transition-colors ${billing === b ? "bg-white text-brand-ink" : "text-white"}`}
                >
                  {t(b)}
                </button>
              ))}
            </div>
            <p className="mt-3">
              <span style={{ fontSize: 30, fontWeight: 700 }}>HK${monthlyEquivalent}</span>
              <span className="text-white/85 text-sm">{t("perMonthShort")}</span>
            </p>
            <p className="text-xs text-white/85">
              {billing === "yearly" ? fill(t("billedYearly"), { n: PLUS_PLAN.yearlyPrice }) : `HK$${PLUS_PLAN.monthlyPrice}${t("perMonthShort")}`}
            </p>
            {PLUS_PLAN.firstMonthFree && (
              <span className="inline-block mt-2 text-xs bg-white text-brand-ink px-2.5 py-1 rounded-full" style={{ fontWeight: 600 }}>
                {t("firstMonthFree")}
              </span>
            )}
          </>
        )}
      </div>

      <BenefitList icon={ShoppingBag} title={t("forRenters")} items={PLUS_PLAN.renterBenefits.map((b) => copy(b, isZh, zh))} />
      <BenefitList icon={TrendingUp} title={t("forLenders")} items={PLUS_PLAN.lenderBenefits.map((b) => copy(b, isZh, zh))} />

      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl mb-3">{error}</p>}

      {profile.isPlus ? (
        <div className="space-y-3">
          <div className="flex justify-center"><PlusBadge /></div>
          <button onClick={() => setPlan("free")} disabled={busy} className="w-full py-3 border border-[#E5E7EB] text-[#6B7280] rounded-xl text-sm disabled:opacity-60">
            {t("cancelPlus")}
          </button>
        </div>
      ) : (
        <button onClick={() => setPlan("plus")} disabled={busy} className="w-full py-3 bg-brand text-white rounded-xl disabled:opacity-60 hover:bg-brand-hover transition-colors">
          {busy ? t("subscribing") : t("subscribe")}
        </button>
      )}
      <p className="text-[11px] text-[#9CA3AF] text-center mt-2">{t("plusDemoNote")}</p>
    </div>
  );
}

function BenefitList({ icon: Icon, title, items }: { icon: typeof Crown; title: string; items: string[] }) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 mb-4">
      <p className="text-sm text-brand-ink flex items-center gap-2 mb-2" style={{ fontWeight: 600 }}>
        <Icon size={16} className="text-brand" />{title}
      </p>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-[#4B5563]">
            <Check size={15} className="text-[#22C55E] shrink-0 mt-0.5" />{item}
          </li>
        ))}
      </ul>
    </div>
  );
}
