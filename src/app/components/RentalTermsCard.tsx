import { Clock, ShieldCheck, CalendarX } from "lucide-react";
import { useI18n } from "./i18n";

export function RentalTermsCard() {
  const { t } = useI18n();
  const terms = [
    { icon: Clock, key: "termLate" },
    { icon: ShieldCheck, key: "termDamage" },
    { icon: CalendarX, key: "termCancel" },
  ];
  return (
    <div className="mt-4 p-3 rounded-xl border border-brand-border bg-brand-soft">
      <p className="text-sm text-brand-ink mb-2" style={{ fontWeight: 600 }}>{t("rentalTerms")}</p>
      <ul className="space-y-1.5">
        {terms.map(({ icon: Icon, key }) => (
          <li key={key} className="flex items-start gap-2 text-xs text-[#4B5563]">
            <Icon size={14} className="text-brand shrink-0 mt-0.5" />
            <span>{t(key)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
