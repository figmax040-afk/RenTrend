import { useState } from "react";
import { useI18n } from "../components/i18n";
import { listings } from "../components/data";
import { Package, Clock, MessageSquare, Recycle } from "lucide-react";

export function Admin() {
  const { t, lang } = useI18n();
  const [approved, setApproved] = useState<number[]>([]);

  const stats = [
    { key: "totalListings",        value: 47, icon: Package,      color: "#1E6B1E" },
    { key: "pendingApprovals",     value: 5,  icon: Clock,        color: "#F4A261" },
    { key: "openRequests",         value: 12, icon: MessageSquare, color: "#22C55E" },
    { key: "recyclingSubmissions", value: 3,  icon: Recycle,      color: "#6B7280" },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 pt-6">
      <h2 className="text-[#1F2937] mb-4">{t("admin")}</h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.key} className="bg-white rounded-xl border border-[#E5E7EB] p-4">
            <s.icon size={20} style={{ color: s.color }} />
            <p className="text-2xl mt-2" style={{ fontWeight: 600, color: s.color }}>{s.value}</p>
            <p className="text-xs text-[#6B7280]">{t(s.key)}</p>
          </div>
        ))}
      </div>

      <h3 className="text-[#1F2937] mb-3">{t("pendingApprovals")}</h3>
      <div className="bg-white rounded-xl border border-[#E5E7EB] divide-y divide-[#E5E7EB]">
        {listings.slice(0, 4).map((l) => (
          <div key={l.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm" style={{ fontWeight: 500 }}>{lang === "zh" ? l.titleZh : l.title}</p>
              <p className="text-xs text-[#6B7280]">{l.owner} · {lang === "zh" ? l.universityZh : l.university}</p>
            </div>
            {approved.includes(l.id) ? (
              <span className="text-xs text-[#22C55E]">{t("accepted")}</span>
            ) : (
              <div className="flex gap-2">
                <button onClick={() => setApproved([...approved, l.id])} className="px-3 py-1 bg-[#22C55E] text-white rounded-lg text-xs">{t("approve")}</button>
                <button className="px-3 py-1 border border-[#EF4444] text-[#EF4444] rounded-lg text-xs">{t("reject")}</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}