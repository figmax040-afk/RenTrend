import { Check, ShieldCheck, RotateCcw } from "lucide-react";
import { useI18n } from "./i18n";
import type { EscrowStatus } from "../../demo/demo";

export type EscrowRequest = {
  status: string;
  escrow_status?: string | null;
  pickup_renter_ok_at?: string | null;
  pickup_lender_ok_at?: string | null;
  return_renter_ok_at?: string | null;
  return_lender_ok_at?: string | null;
};

export function escrowOf(r: EscrowRequest): EscrowStatus {
  const e = r.escrow_status;
  return e === "held" || e === "released" || e === "refunded" ? e : "unpaid";
}

const STATUS_STYLE: Record<EscrowStatus, { bg: string; fg: string; key: string; note: string }> = {
  unpaid: { bg: "#F4A26119", fg: "#B45309", key: "escrowUnpaid", note: "escrowNoteUnpaid" },
  held: { bg: "#1A7A8619", fg: "var(--brand)", key: "escrowHeld", note: "escrowNoteHeld" },
  released: { bg: "#22C55E19", fg: "#15803D", key: "escrowReleased", note: "escrowNoteReleased" },
  refunded: { bg: "#EF444419", fg: "#B91C1C", key: "escrowRefunded", note: "escrowNoteRefunded" },
};

/** Accepted → Paid & held → Picked up → Returned → Released (or Refunded). Shown to both parties. */
export function EscrowTracker({ request }: { request: EscrowRequest }) {
  const { t } = useI18n();
  const escrow = escrowOf(request);
  const pickedUp = !!request.pickup_renter_ok_at && !!request.pickup_lender_ok_at;
  const returned = !!request.return_renter_ok_at && !!request.return_lender_ok_at;

  const steps = escrow === "refunded"
    ? [
        { key: "stepAccepted", done: true },
        { key: "stepPaid", done: true },
        { key: "stepRefunded", done: true, refund: true },
      ]
    : [
        { key: "stepAccepted", done: true },
        { key: "stepPaid", done: escrow !== "unpaid" },
        { key: "stepPickedUp", done: pickedUp || escrow === "released" },
        { key: "stepReturned", done: returned || escrow === "released" },
        { key: "stepReleased", done: escrow === "released" },
      ];
  const current = steps.findIndex((s) => !s.done);
  const style = STATUS_STYLE[escrow];

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-[#1F2937] flex items-center gap-1.5" style={{ fontWeight: 600 }}>
          <ShieldCheck size={16} className="text-brand" />{t("escrowTitle")}
        </p>
        <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ backgroundColor: style.bg, color: style.fg, fontWeight: 600 }}>
          {t(style.key)}
        </span>
      </div>

      <ol className="flex items-start">
        {steps.map((s, i) => {
          const isCurrent = i === current;
          const color = "refund" in s && s.refund ? "#EF4444" : "var(--brand)";
          return (
            <li key={s.key} className="flex-1 flex flex-col items-center text-center relative">
              {i > 0 && (
                <span
                  className="absolute top-3 right-1/2 w-full h-0.5 -z-0"
                  style={{ backgroundColor: s.done ? color : "#E5E7EB" }}
                />
              )}
              <span
                className="relative z-10 w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px]"
                style={{
                  backgroundColor: s.done ? color : "#fff",
                  border: s.done ? "none" : `2px solid ${isCurrent ? "var(--brand)" : "#E5E7EB"}`,
                  color: s.done ? "#fff" : isCurrent ? "var(--brand)" : "#9CA3AF",
                }}
              >
                {s.done ? ("refund" in s && s.refund ? <RotateCcw size={12} /> : <Check size={12} />) : i + 1}
              </span>
              <span className={`mt-1 text-[10px] leading-tight px-0.5 ${s.done || isCurrent ? "text-[#1F2937]" : "text-[#9CA3AF]"}`}>
                {t(s.key)}
              </span>
            </li>
          );
        })}
      </ol>

      <p className="text-xs text-[#6B7280] mt-3">{t(style.note)}</p>
    </div>
  );
}
