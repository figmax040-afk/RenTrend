import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Gift, Share2, Copy } from "lucide-react";
import { useI18n } from "../components/i18n";
import { APP_URL } from "../../lib/appUrl";
import { referralCodeFor } from "../../demo/demo";
import { fill } from "../../demo/strings";
import { useDemoProfile } from "../../demo/useDemoProfile";

export function Referral() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { profile, loading } = useDemoProfile();
  const [copied, setCopied] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const code = profile.userId ? referralCodeFor(profile.userId, profile.name) : "LENDY-…";
  const text = `${fill(t("referralShareText"), { code })} ${APP_URL}/signup`;

  async function share() {
    if (navigator.share) {
      try { await navigator.share({ title: "Lendy", text }); } catch { /* user closed the sheet */ }
      return;
    }
    copyCode(text);
  }

  async function copyCode(value = code) {
    try { await navigator.clipboard.writeText(value); } catch { /* clipboard blocked */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-10">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate("/profile")} className="text-[#6B7280]"><ArrowLeft size={20} /></button>
        <h2 className="text-[#1F2937]" style={{ fontWeight: 600 }}>{t("inviteFriends")}</h2>
      </div>

      <div className="rounded-2xl p-5 text-white text-center mb-4" style={{ background: "linear-gradient(120deg, var(--brand-blue), var(--brand-green))" }}>
        <Gift size={32} className="mx-auto mb-2" />
        <p style={{ fontSize: 18, fontWeight: 700 }}>{t("referralTitle")}</p>
        <p className="text-sm text-white/85 mt-1">{t("referralSub")}</p>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 mb-4 text-center">
        <p className="text-xs text-[#6B7280]">{t("yourCode")}</p>
        <button onClick={() => copyCode()} className="mt-1 inline-flex items-center gap-2 text-brand-ink tracking-wider" style={{ fontSize: 22, fontWeight: 700 }}>
          {code}<Copy size={16} className="text-[#9CA3AF]" />
        </button>
        {copied && <p className="text-xs text-[#15803D] mt-1">{t("copied")}</p>}
        <button onClick={share} className="w-full mt-4 py-3 bg-brand text-white rounded-xl flex items-center justify-center gap-2 hover:bg-brand-hover transition-colors">
          <Share2 size={16} />{t("shareCode")}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4">
        <p className="text-sm text-brand-ink mb-3" style={{ fontWeight: 600 }}>{t("howItWorks")}</p>
        <ol className="space-y-2">
          {["referralStep1", "referralStep2", "referralStep3"].map((k, i) => (
            <li key={k} className="flex items-center gap-3 text-sm text-[#4B5563]">
              <span className="w-6 h-6 rounded-full bg-brand/10 text-brand text-xs flex items-center justify-center shrink-0" style={{ fontWeight: 600 }}>{i + 1}</span>
              {t(k)}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
