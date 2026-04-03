import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useI18n } from "../components/i18n";
import { listings } from "../components/data";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

export function RentRequest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [msg, setMsg] = useState("");
  const [pickup, setPickup] = useState<"collect" | "deliver">("collect");
  const [agreed, setAgreed] = useState(false);
  const [sent, setSent] = useState(false);

  const listing = listings.find((l) => l.id === Number(id));
  if (!listing) return null;

  const days = startDate && endDate ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000)) : 0;
  const total = days * listing.price + listing.deposit;

  if (sent) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 flex items-center justify-center mb-4">
          <CheckCircle size={36} className="text-[#22C55E]" />
        </div>
        <h1 className="text-[#1F2937] mb-2" style={{ fontSize: 22 }}>{t("requestSent")}</h1>
        <p className="text-[#6B7280] text-sm mb-6">{t("requestSentMsg")}</p>
        <button onClick={() => navigate("/my-requests")} className="w-full max-w-xs py-3 bg-[#1E6B1E] text-white rounded-xl mb-3">{t("viewMyRequests")}</button>
        <button onClick={() => navigate("/browse")} className="text-sm text-[#1E6B1E]">{t("backToBrowse")}</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-lg mx-auto px-4 pt-4 pb-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="text-[#6B7280]"><ArrowLeft size={20} /></button>
          <h2 className="text-[#1F2937]">{t("requestToRent")}</h2>
        </div>

        {/* Item summary */}
        <div className="flex gap-3 p-3 rounded-xl bg-white border border-[#E5E7EB] mb-5">
          <ImageWithFallback src={listing.image} alt="" className="w-16 h-16 rounded-lg object-cover" />
          <div className="text-sm">
            <p style={{ fontWeight: 500 }}>{lang === "zh" ? listing.titleZh : listing.title}</p>
            <p className="text-[#6B7280] text-xs">{lang === "zh" ? listing.universityZh : listing.university}</p>
            <p className="text-[#1E6B1E]" style={{ fontWeight: 600 }}>HK${listing.price}<span className="text-[#6B7280]" style={{ fontWeight: 400 }}>/day</span></p>
          </div>
        </div>

        {/* Dates */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-[#6B7280]">{t("startDate")}</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm" />
            </div>
            <div>
              <label className="text-sm text-[#6B7280]">{t("endDate")}</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm" />
            </div>
          </div>

          {/* Price breakdown */}
          {days > 0 && (
            <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] text-sm space-y-1">
              <div className="flex justify-between text-[#6B7280]">
                <span>HK${listing.price} × {days} {t("duration")}</span>
                <span>HK${days * listing.price}</span>
              </div>
              <div className="flex justify-between text-[#6B7280]">
                <span>{t("deposit")}</span>
                <span>HK${listing.deposit}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#E5E7EB]" style={{ fontWeight: 500 }}>
                <span>{t("total")}</span>
                <span className="text-[#1E6B1E]">HK${total}</span>
              </div>
            </div>
          )}

          {/* Message to owner */}
          <div>
            <label className="text-sm text-[#6B7280]">{t("messageToOwner")}</label>
            <textarea
              value={msg} onChange={(e) => setMsg(e.target.value)}
              placeholder={t("messagePlaceholder")}
              rows={3}
              className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm resize-none focus:outline-none focus:border-[#1E6B1E]"
            />
          </div>

          {/* Pickup preference */}
          <div>
            <label className="text-sm text-[#6B7280]">{t("pickupPref")}</label>
            <div className="flex gap-2 mt-2">
              {(["collect", "deliver"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPickup(p)}
                  className={`flex-1 py-2.5 rounded-xl text-sm border transition-colors ${pickup === p ? "bg-[#1E6B1E] text-white border-[#1E6B1E]" : "bg-white text-[#6B7280] border-[#E5E7EB]"}`}
                >
                  {p === "collect" ? t("iCanCollect") : t("canYouDeliver")}
                </button>
              ))}
            </div>
          </div>

          {/* Disclaimer & terms */}
          <p className="text-xs text-[#F4A261] bg-[#F4A261]/10 p-3 rounded-xl">{t("disclaimer")}</p>
          <label className="flex items-start gap-2 text-sm text-[#6B7280]">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 accent-[#1E6B1E]" />
            {t("agreeTerms")}
          </label>

          {/* Submit */}
          <button
            onClick={() => setSent(true)}
            disabled={!startDate || !endDate || !agreed}
            className="w-full py-3 bg-[#1E6B1E] text-white rounded-xl disabled:opacity-40"
          >
            {t("sendRequest")}
          </button>
        </div>
      </div>
    </div>
  );
}
