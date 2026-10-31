import { useState } from "react";
import { Truck, Package, Sparkles, Camera, Wrench, X } from "lucide-react";
import { useI18n } from "./i18n";
import { useDemoProfile } from "../../demo/useDemoProfile";
import { adSetFor, copy } from "../../demo/demo";
import type { Ad, AdIcon, AdSet } from "../../demo/demoConfig";

const ICONS: Record<AdIcon, typeof Truck> = { truck: Truck, box: Package, sparkles: Sparkles, camera: Camera, wrench: Wrench };

/** The ad set for the current user, or null for Plus members (no ads). */
export function useAdSet(): AdSet | null {
  const { profile, loading } = useDemoProfile();
  if (loading || profile.isPlus) return null;
  return adSetFor(profile.renterCompleted);
}

function SponsoredTag({ light }: { light?: boolean }) {
  const { t } = useI18n();
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full ${light ? "bg-white/25 text-white" : "bg-[#F3F4F6] text-[#6B7280]"}`}>
      {t("sponsored")}
    </span>
  );
}

function AdInfo({ ad, onClose }: { ad: Ad; onClose: () => void }) {
  const { t, isZh, zh } = useI18n();
  return (
    <div className="fixed inset-0 bg-black/40 z-[60] flex items-end md:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <SponsoredTag />
          <button onClick={onClose} className="text-[#6B7280]" aria-label={t("close")}><X size={18} /></button>
        </div>
        <p className="text-[#1F2937]" style={{ fontWeight: 600 }}>{ad.advertiser}</p>
        <p className="text-sm text-[#4B5563]">{copy(ad.headline, isZh, zh)}</p>
        <p className="text-xs text-[#6B7280]">{t("demoAdNote")}</p>
        <button onClick={onClose} className="w-full py-2.5 bg-brand text-white rounded-xl text-sm">{t("close")}</button>
      </div>
    </div>
  );
}

function useAdInfo() {
  const [open, setOpen] = useState<Ad | null>(null);
  return { open, show: (ad: Ad) => setOpen(ad), modal: open ? <AdInfo ad={open} onClose={() => setOpen(null)} /> : null };
}

/** Home: one banner directly under the hero. */
export function HomeAdBanner() {
  const set = useAdSet();
  const { isZh, zh } = useI18n();
  const info = useAdInfo();
  if (!set) return null;
  const ad = set.homeBanner;
  const Icon = ICONS[ad.icon];
  return (
    <>
      <button
        onClick={() => info.show(ad)}
        className="mx-4 mt-3 w-[calc(100%-2rem)] rounded-2xl p-4 flex items-center gap-3 text-left text-white"
        style={{ background: `linear-gradient(120deg, ${ad.gradient[0]}, ${ad.gradient[1]})` }}
      >
        <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Icon size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs text-white/85">{ad.advertiser}</span>
            <SponsoredTag light />
          </div>
          <p className="text-sm" style={{ fontWeight: 600 }}>{copy(ad.headline, isZh, zh)}</p>
          <p className="text-xs text-white/85 truncate">{copy(ad.body, isZh, zh)}</p>
        </div>
        <span className="hidden sm:inline-block text-xs bg-white text-brand-ink px-3 py-1.5 rounded-full shrink-0" style={{ fontWeight: 600 }}>
          {copy(ad.cta, isZh, zh)}
        </span>
      </button>
      {info.modal}
    </>
  );
}

/** Browse: styled like a listing card. */
export function SponsoredListingCard({ ad }: { ad: Ad }) {
  const { isZh, zh } = useI18n();
  const info = useAdInfo();
  const Icon = ICONS[ad.icon];
  return (
    <>
      <div onClick={() => info.show(ad)} className="bg-white rounded-xl overflow-hidden border border-[#E5E7EB] cursor-pointer hover:shadow-md transition-shadow">
        <div className="relative h-36 flex items-center justify-center text-white" style={{ background: `linear-gradient(135deg, ${ad.gradient[0]}, ${ad.gradient[1]})` }}>
          <Icon size={40} strokeWidth={1.5} />
          <span className="absolute top-2 left-2"><SponsoredTag light /></span>
        </div>
        <div className="p-3">
          <p className="text-sm text-[#6B7280] mb-0.5 truncate">{ad.advertiser}</p>
          <h4 className="text-sm line-clamp-2" style={{ fontWeight: 500 }}>{copy(ad.headline, isZh, zh)}</h4>
          <p className="text-brand mt-1.5" style={{ fontWeight: 600, fontSize: 13 }}>{copy(ad.cta, isZh, zh)} →</p>
        </div>
      </div>
      {info.modal}
    </>
  );
}

/** Listing detail: one small ad under the description, matched to the category. */
export function ListingDetailAd({ category }: { category: string }) {
  const set = useAdSet();
  const { isZh, zh } = useI18n();
  const info = useAdInfo();
  if (!set) return null;
  const ad = set.byCategory[category?.toLowerCase()] ?? set.byCategory.default;
  const Icon = ICONS[ad.icon];
  return (
    <>
      <button onClick={() => info.show(ad)} className="mt-4 w-full flex items-center gap-3 p-3 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-left">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0" style={{ background: `linear-gradient(135deg, ${ad.gradient[0]}, ${ad.gradient[1]})` }}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#1F2937]" style={{ fontWeight: 500 }}>{ad.advertiser}</span>
            <SponsoredTag />
          </div>
          <p className="text-xs text-[#6B7280] truncate">{copy(ad.headline, isZh, zh)}</p>
        </div>
        <span className="text-xs text-brand shrink-0">{copy(ad.cta, isZh, zh)}</span>
      </button>
      {info.modal}
    </>
  );
}
