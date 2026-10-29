import { Wallet } from "lucide-react";
import { useI18n } from "./i18n";
import { copy, payoutFor } from "../../demo/demo";
import { fill } from "../../demo/strings";

/** Lender view: rental price − Lendy fee = payout. The fee tier comes from completed rentals. */
export function PayoutBreakdown({ rentalPrice, completedRentals }: { rentalPrice: number; completedRentals: number }) {
  const { t, isZh, zh } = useI18n();
  const { tier, fee, payout } = payoutFor(rentalPrice, completedRentals);
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 mb-4">
      <p className="text-sm text-[#1F2937] flex items-center gap-1.5 mb-3" style={{ fontWeight: 600 }}>
        <Wallet size={16} className="text-brand" />{t("payoutTitle")}
      </p>
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between text-[#6B7280]">
          <span>{t("rentalPrice")}</span><span>HK${rentalPrice}</span>
        </div>
        <div className="flex justify-between text-[#6B7280]">
          <span>{fill(t("lendyFee"), { pct: tier.pct, tier: copy(tier.name, isZh, zh) })}</span>
          <span>− HK${fee}</span>
        </div>
        <div className="flex justify-between pt-1.5 border-t border-[#E5E7EB]" style={{ fontWeight: 600 }}>
          <span>{t("payout")}</span><span className="text-brand">HK${payout}</span>
        </div>
      </div>
      <p className="text-[11px] text-[#9CA3AF] mt-2">{t("payoutNote")}</p>
    </div>
  );
}
