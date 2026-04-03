import { useState } from "react";
import { useNavigate } from "react-router";
import { useI18n } from "../components/i18n";
import { listings } from "../components/data";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { PlusCircle, MoreVertical, Bell } from "lucide-react";

const mockOwned = [
  { listingId: 1, status: "active" as const, requestCount: 2 },
  { listingId: 3, status: "active" as const, requestCount: 0 },
  { listingId: 6, status: "unavailable" as const, requestCount: 0 },
];

const mockIncoming = [
  { id: 1, renter: "Sarah K.", university: "HKU", universityZh: "香港大學", message: "I'm arriving next week and need a kettle!", dates: "Apr 5 – Apr 19", listingId: 1 },
  { id: 2, renter: "Mark T.", university: "CUHK", universityZh: "中文大學", message: "Can I rent for 2 weeks?", dates: "Apr 8 – Apr 22", listingId: 1 },
];

export function MyListings() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const [showIncoming, setShowIncoming] = useState(false);
  const [accepted, setAccepted] = useState<number[]>([]);

  const statusColor = { active: "#22C55E", draft: "#F4A261", unavailable: "#6B7280" };

  if (showIncoming) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setShowIncoming(false)} className="text-[#6B7280]">←</button>
          <h2 className="text-[#1F2937]">{t("incomingRequests")}</h2>
        </div>
        <div className="space-y-3">
          {mockIncoming.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-[#E5E7EB] p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#1E6B1E] flex items-center justify-center text-white text-xs">{r.renter[0]}</div>
                <div>
                  <p className="text-sm" style={{ fontWeight: 500 }}>{r.renter}</p>
                  <p className="text-[10px] text-[#22C55E]">{t("verified")} · {lang === "zh" ? r.universityZh : r.university}</p>
                </div>
              </div>
              <p className="text-sm text-[#6B7280] mb-2">"{r.message}"</p>
              <p className="text-xs text-[#6B7280] mb-3">{r.dates}</p>
              {accepted.includes(r.id) ? (
                <div className="text-sm text-[#22C55E] bg-[#22C55E]/10 p-2 rounded-lg">
                  {t("accepted")} — {r.renter.toLowerCase().replace(" ", "")}@connect.hku.hk
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setAccepted([...accepted, r.id])} className="flex-1 py-2 bg-[#22C55E] text-white rounded-xl text-sm">{t("accept")}</button>
                  <button className="flex-1 py-2 border border-[#EF4444] text-[#EF4444] rounded-xl text-sm">{t("decline")}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[#1F2937]">{t("myListings")}</h2>
        <button onClick={() => navigate("/create")} className="flex items-center gap-1 px-3 py-1.5 bg-[#1E6B1E] text-white rounded-lg text-sm">
          <PlusCircle size={14} />{t("createListing")}
        </button>
      </div>
      <div className="space-y-3">
        {mockOwned.map((o) => {
          const listing = listings.find((l) => l.id === o.listingId)!;
          return (
            <div key={o.listingId} className="bg-white rounded-xl border border-[#E5E7EB] p-3 flex gap-3">
              <div className="relative">
                <ImageWithFallback src={listing.image} alt="" className="w-20 h-20 rounded-lg object-cover" />
                {o.requestCount > 0 && (
                  <button onClick={() => setShowIncoming(true)} className="absolute -top-1 -right-1 w-5 h-5 bg-[#EF4444] text-white rounded-full flex items-center justify-center text-[10px]">
                    {o.requestCount}
                  </button>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm" style={{ fontWeight: 500 }}>{lang === "zh" ? listing.titleZh : listing.title}</p>
                  <button className="text-[#6B7280]"><MoreVertical size={14} /></button>
                </div>
                <p className="text-xs text-[#1E6B1E]" style={{ fontWeight: 500 }}>HK${listing.price}/day</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: statusColor[o.status] + "15", color: statusColor[o.status] }}>{t(o.status === "active" ? "active" : "unavailable")}</span>
                  {o.requestCount > 0 && (
                    <button onClick={() => setShowIncoming(true)} className="flex items-center gap-0.5 text-[10px] text-[#F4A261]">
                      <Bell size={10} />{o.requestCount} {t("requests")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}