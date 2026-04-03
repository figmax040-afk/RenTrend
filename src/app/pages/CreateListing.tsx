import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Camera, ChefHat, Monitor, Sofa, Camera as CameraIcon, Wind, MoreHorizontal, CheckCircle } from "lucide-react";
import { useI18n } from "../components/i18n";

const catIcons = [
  { key: "kitchen", icon: ChefHat },
  { key: "electronics", icon: Monitor },
  { key: "furniture", icon: Sofa },
  { key: "camera", icon: CameraIcon },
  { key: "cooling", icon: Wind },
  { key: "other", icon: MoreHorizontal },
];

const stepKeys = ["details", "pricing", "availability", "review"];
const conditions = ["worksPerf", "minorIssues", "forParts"];

export function CreateListing() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState("");
  const [cond, setCond] = useState("worksPerf");
  const [desc, setDesc] = useState("");
  const [daily, setDaily] = useState("");
  const [weekly, setWeekly] = useState("");
  const [monthly, setMonthly] = useState("");
  const [deposit, setDeposit] = useState("");
  const [avail, setAvail] = useState(true);
  const [location, setLocation] = useState("");
  const [published, setPublished] = useState(false);

  if (published) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 flex items-center justify-center mb-4">
          <CheckCircle size={36} className="text-[#22C55E]" />
        </div>
        <h1 className="text-[#1F2937] mb-2" style={{ fontSize: 22 }}>{t("publishListing")}</h1>
        <p className="text-[#6B7280] text-sm mb-6">{title}</p>
        <button onClick={() => navigate("/my-listings")} className="py-3 px-8 bg-[#1E6B1E] text-white rounded-xl">{t("myListings")}</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => step > 0 ? setStep(step - 1) : navigate(-1)} className="text-[#6B7280]"><ArrowLeft size={20} /></button>
          <h2 className="text-[#1F2937]">{t("createListing")}</h2>
        </div>

        {/* Stepper */}
        <div className="flex gap-1 mb-6">
          {stepKeys.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full ${i <= step ? "bg-[#1E6B1E]" : "bg-[#E5E7EB]"}`} />
          ))}
        </div>

        {/* Step 1 - Details */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="aspect-square rounded-xl border-2 border-dashed border-[#E5E7EB] flex flex-col items-center justify-center text-[#6B7280]">
                  <Camera size={20} />
                  <span className="text-[10px] mt-1">{i === 0 ? t("addPhotos") : `#${i + 1}`}</span>
                </div>
              ))}
            </div>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("title")} className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm focus:outline-none focus:border-[#1E6B1E]" />
            <div>
              <label className="text-sm text-[#6B7280]">{t("category")}</label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {catIcons.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setCat(c.key)}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition-colors ${cat === c.key ? "border-[#1E6B1E] bg-[#1E6B1E]/5" : "border-[#E5E7EB] bg-white"}`}
                  >
                    <c.icon size={18} className={cat === c.key ? "text-[#1E6B1E]" : "text-[#6B7280]"} />
                    <span className="text-[11px]">{t(c.key)}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm text-[#6B7280]">{t("condition")}</label>
              <div className="flex gap-2 mt-2">
                {conditions.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCond(c)}
                    className={`flex-1 py-2 rounded-xl text-xs border transition-colors ${cond === c ? "border-[#1E6B1E] bg-[#1E6B1E]/5 text-[#1E6B1E]" : "border-[#E5E7EB] bg-white text-[#6B7280]"}`}
                  >
                    {t(c)}
                  </button>
                ))}
              </div>
            </div>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t("description")} rows={3} className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm resize-none focus:outline-none focus:border-[#1E6B1E]" />
            <p className="text-right text-[10px] text-[#6B7280]">{desc.length}/500</p>
            <button onClick={() => setStep(1)} disabled={!title || !cat} className="w-full py-3 bg-[#1E6B1E] text-white rounded-xl disabled:opacity-40">{t("next")}</button>
          </div>
        )}

        {/* Step 2 - Pricing */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#6B7280]">{t("dailyPrice")}</label>
              <input type="number" value={daily} onChange={(e) => { setDaily(e.target.value); if (!weekly) setWeekly(String(Number(e.target.value) * 6)); if (!monthly) setMonthly(String(Number(e.target.value) * 25)); }} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm" />
            </div>
            <div>
              <label className="text-sm text-[#6B7280]">{t("weeklyPrice")}</label>
              <input type="number" value={weekly} onChange={(e) => setWeekly(e.target.value)} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm" />
            </div>
            <div>
              <label className="text-sm text-[#6B7280]">{t("monthlyPrice")}</label>
              <input type="number" value={monthly} onChange={(e) => setMonthly(e.target.value)} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm" />
            </div>
            <div>
              <label className="text-sm text-[#6B7280]">{t("depositAmount")}</label>
              <input type="number" value={deposit} onChange={(e) => setDeposit(e.target.value)} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm" />
            </div>
            <p className="text-xs text-[#6B7280]">{t("availableNow")}</p>
            <button onClick={() => setStep(2)} disabled={!daily} className="w-full py-3 bg-[#1E6B1E] text-white rounded-xl disabled:opacity-40">{t("next")}</button>
          </div>
        )}

        {/* Step 3 - Availability & Location */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#E5E7EB]">
              <span className="text-sm">{t("availableNow")}</span>
              <button onClick={() => setAvail(!avail)} className={`w-11 h-6 rounded-full transition-colors ${avail ? "bg-[#1E6B1E]" : "bg-[#E5E7EB]"} relative`}>
                <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${avail ? "left-5.5" : "left-0.5"}`} />
              </button>
            </div>
            <div>
              <label className="text-sm text-[#6B7280]">{t("location")}</label>
              <select value={location} onChange={(e) => setLocation(e.target.value)} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm">
                <option value="">Select area</option>
                <option>HKU Main Campus</option>
                <option>CUHK Shatin</option>
                <option>HKUST Clear Water Bay</option>
                <option>PolyU Hung Hom</option>
                <option>CityU Kowloon Tong</option>
              </select>
            </div>
            <button onClick={() => setStep(3)} className="w-full py-3 bg-[#1E6B1E] text-white rounded-xl">{t("next")}</button>
          </div>
        )}

        {/* Step 4 - Review */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] space-y-2 text-sm">
              <p style={{ fontWeight: 500 }}>{title}</p>
              <p className="text-[#6B7280]">{t(cat)} · {t(cond)}</p>
              <p className="text-[#1E6B1E]" style={{ fontWeight: 600 }}>HK${daily}/day · HK${weekly}/week · HK${monthly}/month</p>
              <p className="text-[#6B7280]">{t("deposit")}: HK${deposit}</p>
              <p className="text-[#6B7280]">{location}</p>
              {desc && <p className="text-[#6B7280]">{desc}</p>}
            </div>
            <button onClick={() => setPublished(true)} className="w-full py-3 bg-[#1E6B1E] text-white rounded-xl">{t("publishListing")}</button>
            <button onClick={() => navigate("/home")} className="w-full py-3 border border-[#E5E7EB] rounded-xl text-sm text-[#6B7280]">{t("saveAsDraft")}</button>
          </div>
        )}
      </div>
    </div>
  );
}