import { useState } from "react";
import { useI18n } from "../components/i18n";
import { listings } from "../components/data";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { ChevronDown, ChevronUp } from "lucide-react";

const mockRequests = [
  { id: 1, listingId: 1, owner: "Alex C.", dates: "Apr 5 – Apr 19", status: "accepted" as const },
  { id: 2, listingId: 3, owner: "Tom W.", dates: "Apr 10 – May 10", status: "pending" as const },
  { id: 3, listingId: 5, owner: "Jason L.", dates: "Mar 1 – Mar 15", status: "rejected" as const },
];

const tabs = ["active", "pending", "past"] as const;

export function MyRequests() {
  const { t, lang } = useI18n();
  const [tab, setTab] = useState<typeof tabs[number]>("active");
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = mockRequests.filter((r) => {
    if (tab === "active") return r.status === "accepted";
    if (tab === "pending") return r.status === "pending";
    return r.status === "rejected";
  });

  const statusColor = { accepted: "#22C55E", pending: "#F4A261", rejected: "#EF4444" };

  return (
    <div className="max-w-lg mx-auto px-4 pt-4">
      <h2 className="text-[#1F2937] mb-4">{t("myRequests")}</h2>
      <div className="flex gap-2 mb-4">
        {tabs.map((tb) => (
          <button key={tb} onClick={() => setTab(tb)} className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${tab === tb ? "bg-[#1E6B1E] text-white border-[#1E6B1E]" : "bg-white text-[#6B7280] border-[#E5E7EB]"}`}>
            {t(tb)}
          </button>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="text-center text-[#6B7280] text-sm py-12">{lang === "zh" ? "暫無請求" : "No requests yet"}</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => {
            const listing = listings.find((l) => l.id === r.listingId)!;
            const isOpen = expanded === r.id;
            return (
              <div key={r.id} className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
                <button onClick={() => setExpanded(isOpen ? null : r.id)} className="w-full flex items-center gap-3 p-3">
                  <ImageWithFallback src={listing.image} alt="" className="w-14 h-14 rounded-lg object-cover" />
                  <div className="flex-1 text-left">
                    <p className="text-sm" style={{ fontWeight: 500 }}>{lang === "zh" ? listing.titleZh : listing.title}</p>
                    <p className="text-xs text-[#6B7280]">{r.owner} · {r.dates}</p>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: statusColor[r.status] + "15", color: statusColor[r.status] }}>{t(r.status)}</span>
                  {isOpen ? <ChevronUp size={14} className="text-[#6B7280]" /> : <ChevronDown size={14} className="text-[#6B7280]" />}
                </button>
                {isOpen && (
                  <div className="px-3 pb-3 text-sm text-[#6B7280] border-t border-[#E5E7EB] pt-2">
                    <p>HK${listing.price}/day · {t("deposit")}: HK${listing.deposit}</p>
                    {r.status === "accepted" && <p className="text-[#22C55E] mt-1">Contact: alex@connect.hku.hk</p>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}