import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Recycle as RecycleIcon, CheckCircle, Upload } from "lucide-react";
import { useI18n } from "../components/i18n";

export function Recycle() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [itemType, setItemType] = useState("");
  const [cond, setCond] = useState("working");

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 flex items-center justify-center mb-4">
          <CheckCircle size={36} className="text-[#22C55E]" />
        </div>
        <h1 className="text-[#1F2937] mb-2" style={{ fontSize: 22 }}>{t("submitAppliance")}</h1>
        <p className="text-[#6B7280] text-sm mb-4">{t("recycleConfirm")}</p>
        <div className="flex gap-6 text-center mt-4 mb-8">
          {["📦 Collection", "🔍 Assessment", "♻️ Listed / Recycled"].map((s) => (
            <div key={s} className="text-xs text-[#6B7280]">{s}</div>
          ))}
        </div>
        <button onClick={() => navigate("/home")} className="py-3 px-8 bg-[#1E6B1E] text-white rounded-xl">{t("home")}</button>
      </div>
    );
  }

  if (!showForm) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-[#1E6B1E]/10 flex items-center justify-center mb-6">
          <RecycleIcon size={40} className="text-[#1E6B1E]" />
        </div>
        <h1 className="text-[#1F2937] whitespace-pre-line mb-3" style={{ fontSize: 24 }}>{t("recycleTitle")}</h1>
        <p className="text-[#6B7280] text-sm mb-8 max-w-sm">{t("recycleSub")}</p>
        <button onClick={() => setShowForm(true)} className="py-3 px-8 bg-[#1E6B1E] text-white rounded-xl">{t("submitAppliance")}</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setShowForm(false)} className="text-[#6B7280]"><ArrowLeft size={20} /></button>
          <h2 className="text-[#1F2937]">{t("submitAppliance")}</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-[#6B7280]">{t("itemType")}</label>
            <select value={itemType} onChange={(e) => setItemType(e.target.value)} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm">
              <option value="">Select...</option>
              <option>Kettle</option><option>Fan</option><option>Rice Cooker</option><option>Lamp</option><option>Fridge</option><option>Other</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-[#6B7280]">{t("condition")}</label>
            <div className="flex gap-2 mt-2">
              {(["working", "partiallyWorking", "broken"] as const).map((c) => (
                <button key={c} onClick={() => setCond(c)} className={`flex-1 py-2 rounded-xl text-xs border ${cond === c ? "border-[#1E6B1E] bg-[#1E6B1E]/5 text-[#1E6B1E]" : "border-[#E5E7EB] bg-white text-[#6B7280]"}`}>
                  {t(c)}
                </button>
              ))}
            </div>
          </div>
          <div className="border-2 border-dashed border-[#E5E7EB] rounded-xl p-6 flex flex-col items-center text-[#6B7280]">
            <Upload size={24} />
            <span className="text-xs mt-1">{t("addPhotos")}</span>
          </div>
          <div>
            <label className="text-sm text-[#6B7280]">{t("location")}</label>
            <input className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm" placeholder="Building / Dorm" />
          </div>
          <div>
            <label className="text-sm text-[#6B7280]">{t("pickupDate")}</label>
            <input type="date" className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm" />
          </div>
          <div>
            <label className="text-sm text-[#6B7280]">{t("expectedPrice")}</label>
            <input type="number" placeholder="HK$" className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm" />
          </div>
          <button onClick={() => setSubmitted(true)} disabled={!itemType} className="w-full py-3 bg-[#1E6B1E] text-white rounded-xl disabled:opacity-40">{t("submitCollection")}</button>
        </div>
      </div>
    </div>
  );
}