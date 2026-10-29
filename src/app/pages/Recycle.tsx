import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Recycle as RecycleIcon, CheckCircle, Upload } from "lucide-react";
import { useI18n } from "../components/i18n";
import { supabase } from "../../lib/supabase";
import { loginPath } from "../../lib/authRedirect";

declare global { interface Window { google: any; } }

// Values are stored as-is; only the labels are translated.
const RECYCLE_ITEM_TYPES: [string, string][] = [
  ["Kettle", "itemKettle"], ["Fan", "itemFan"], ["Rice Cooker", "itemRiceCooker"],
  ["Lamp", "itemLamp"], ["Fridge", "itemFridge"], ["Other", "itemOther"],
];

export function Recycle() {
  const navigate = useNavigate();
  const { t, isZh, zh } = useI18n();
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [itemType, setItemType] = useState("");
  const [cond, setCond] = useState("working");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [expectedPrice, setExpectedPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null);
    });
  }, []);

  // Load Google Maps script
  useEffect(() => {
    if (window.google) return;
    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing) return;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    document.head.appendChild(script);
  }, []);

  // Init autocomplete when form is shown
  useEffect(() => {
    if (!showForm) return;

    function init() {
      if (!window.google || !locationInputRef.current) return;
      const ac = new window.google.maps.places.Autocomplete(locationInputRef.current, {
        componentRestrictions: { country: "hk" },
        fields: ["formatted_address", "name"],
        types: ["establishment", "geocode"],
      });
      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        setLocation(place.formatted_address || place.name || "");
      });
    }

    if (window.google) {
      init();
    } else {
      const interval = setInterval(() => {
        if (window.google) { clearInterval(interval); init(); }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [showForm]);

  async function handleSubmit() {
    if (!itemType) return;
    setLoading(true);
    setError("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error(isZh ? zh("請先登入") : "Please sign in first");

      const { error: insertErr } = await supabase.from("recycle_submissions").insert({
        user_id: user.id,
        item_type: itemType,
        condition: cond,
        description: description || null,
        location: location || null,
        pickup_date: pickupDate || null,
        expected_price: expectedPrice ? Number(expectedPrice) : null,
        status: "pending",
      });

      if (insertErr) throw insertErr;
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || (isZh ? zh("提交失敗，請重試") : "Submission failed. Please try again."));
    } finally {
      setLoading(false);
    }
  }

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
        <button onClick={() => navigate("/home")} className="py-3 px-8 bg-brand text-white rounded-xl">{t("home")}</button>
      </div>
    );
  }

  if (!showForm) {
    if (userId === null) {
      // Still checking auth
      return (
        <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center mb-6">
          <RecycleIcon size={40} className="text-brand" />
        </div>
        <h1 className="text-[#1F2937] whitespace-pre-line mb-3" style={{ fontSize: 24 }}>{t("recycleTitle")}</h1>
        <p className="text-[#6B7280] text-sm mb-8 max-w-sm">{t("recycleSub")}</p>
        {userId ? (
          <button onClick={() => setShowForm(true)} className="py-3 px-8 bg-brand text-white rounded-xl">{t("submitAppliance")}</button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-[#6B7280]">{isZh ? zh("請先登入才能提交") : "Sign in to submit an appliance"}</p>
            <button onClick={() => navigate(loginPath())} className="py-3 px-8 bg-brand text-white rounded-xl">{t("logIn")}</button>
          </div>
        )}
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
              <option value="">{t("selectPlaceholder")}</option>
              {RECYCLE_ITEM_TYPES.map(([value, key]) => <option key={value} value={value}>{t(key)}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm text-[#6B7280]">{t("condition")}</label>
            <div className="flex gap-2 mt-2">
              {(["working", "partiallyWorking", "broken"] as const).map((c) => (
                <button key={c} onClick={() => setCond(c)} className={`flex-1 py-2 rounded-xl text-xs border ${cond === c ? "border-brand bg-brand/5 text-brand" : "border-[#E5E7EB] bg-white text-[#6B7280]"}`}>
                  {t(c)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm text-[#6B7280]">{t("recycleDescription")}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={isZh ? zh("物品狀態、年份或使用情況...") : "Any details about the item's condition, age, or usage..."}
              rows={3}
              className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm resize-none focus:outline-none focus:border-brand"
            />
          </div>
          <div className="border-2 border-dashed border-[#E5E7EB] rounded-xl p-6 flex flex-col items-center text-[#6B7280]">
            <Upload size={24} />
            <span className="text-xs mt-1">{t("addPhotos")}</span>
          </div>
          <div>
            <label className="text-sm text-[#6B7280]">{t("location")}</label>
            <input
              ref={locationInputRef}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm"
              placeholder={isZh ? zh("大廈 / 宿舍") : "Building / Area"}
            />
          </div>
          <div>
            <label className="text-sm text-[#6B7280]">{t("pickupDate")}</label>
            <input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm" />
          </div>
          <div>
            <label className="text-sm text-[#6B7280]">{t("expectedPrice")}</label>
            <input type="number" value={expectedPrice} onChange={(e) => setExpectedPrice(e.target.value)} placeholder="HK$" className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm" />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={!itemType || loading}
            className="w-full py-3 bg-brand text-white rounded-xl disabled:opacity-40"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isZh ? zh("提交中...") : "Submitting..."}
              </span>
            ) : t("submitCollection")}
          </button>
        </div>
      </div>
    </div>
  );
}
