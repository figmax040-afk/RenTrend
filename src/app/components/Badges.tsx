import { Crown, Zap, Rocket } from "lucide-react";
import { useI18n } from "./i18n";

export function PlusBadge({ small }: { small?: boolean }) {
  const { t } = useI18n();
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full text-white ${small ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5"}`}
      style={{ background: "linear-gradient(90deg, var(--brand-blue), var(--brand-green))", fontWeight: 600 }}
    >
      <Crown size={small ? 9 : 11} />{t("plusBadge")}
    </span>
  );
}

export function PowerLenderBadge({ small }: { small?: boolean }) {
  const { t } = useI18n();
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#F59E0B]/15 text-[#B45309] ${small ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-0.5"}`}
      style={{ fontWeight: 600 }}
    >
      <Zap size={small ? 9 : 11} className="fill-[#F59E0B] text-[#F59E0B]" />{t("powerLender")}
    </span>
  );
}

export function FeaturedTag() {
  const { t } = useI18n();
  return (
    <span className="inline-flex items-center gap-1 bg-[#F59E0B] text-white text-[10px] px-2 py-0.5 rounded-full" style={{ fontWeight: 600 }}>
      <Rocket size={9} />{t("featured")}
    </span>
  );
}
