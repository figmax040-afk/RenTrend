import { MapPin, Lock, Clock, CheckCircle } from "lucide-react";
import { useI18n } from "./i18n";
import { LOCKERS } from "../../demo/demoConfig";
import { copy, lockerById } from "../../demo/demo";

export function LockerPicker({ value, onChange }: { value: string | null; onChange: (id: string) => void }) {
  const { t, isZh, zh } = useI18n();
  return (
    <div className="mt-2">
      <p className="text-xs text-[#6B7280] mb-2">{t("chooseLocker")}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {LOCKERS.map((l) => {
          const active = value === l.id;
          return (
            <button
              key={l.id}
              onClick={() => onChange(l.id)}
              className={`text-left p-3 rounded-xl border transition-colors ${active ? "border-brand bg-brand/5" : "border-[#E5E7EB] bg-white"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-[#1F2937]" style={{ fontWeight: 500 }}>{copy(l.name, isZh, zh)}</p>
                {active && <CheckCircle size={16} className="text-brand shrink-0" />}
              </div>
              <p className="text-xs text-brand flex items-center gap-1 mt-0.5"><MapPin size={11} />{copy(l.station, isZh, zh)}</p>
              <p className="text-[11px] text-[#6B7280] mt-0.5">{copy(l.address, isZh, zh)}</p>
              <p className="text-[11px] text-[#6B7280] flex items-center gap-1 mt-0.5"><Clock size={10} />{copy(l.hours, isZh, zh)}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Locker location, plus the 4-digit code once the rental is paid. */
export function LockerCodeCard({ lockerId, code, paid }: { lockerId: string | null; code: string | null; paid: boolean }) {
  const { t, isZh, zh } = useI18n();
  const locker = lockerById(lockerId);
  if (!locker) return null;
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Lock size={16} className="text-brand" />
        <p className="text-sm text-[#1F2937]" style={{ fontWeight: 600 }}>{copy(locker.name, isZh, zh)}</p>
      </div>
      <p className="text-xs text-[#6B7280]">{copy(locker.station, isZh, zh)} · {copy(locker.address, isZh, zh)}</p>
      {paid && code ? (
        <div className="mt-3 rounded-xl bg-brand-soft border border-brand-border p-3 text-center">
          <p className="text-[11px] text-[#6B7280]">{t("lockerCode")}</p>
          <p className="text-brand-ink tracking-[0.4em] pl-[0.4em]" style={{ fontSize: 30, fontWeight: 700 }}>{code}</p>
          <p className="text-[11px] text-[#6B7280]">{t("lockerCodeHint")}</p>
        </div>
      ) : (
        <p className="mt-2 text-xs text-[#9CA3AF]">{t("lockerCodeAfterPay")}</p>
      )}
    </div>
  );
}
