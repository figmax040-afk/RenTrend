import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Camera, X, ChefHat, Monitor, Sofa, Camera as CameraIcon, Wind, MoreHorizontal, CheckCircle } from "lucide-react";
import { useI18n } from "../components/i18n";
import { supabase } from "../../lib/supabase";

declare global { interface Window { google: any; } }

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

const BRANDS = [
  "Philips", "Panasonic", "Sony", "Samsung", "LG", "Xiaomi", "Dyson",
  "Tefal", "Midea", "Cornell", "Sharp", "IKEA", "Canon", "Nikon",
  "Fujifilm", "GoPro", "Honeywell", "Mistral", "Other / Unlisted brand",
];

const conditionReverseMap: Record<string, string> = {
  "Works perfectly": "worksPerf",
  "Minor issues": "minorIssues",
  "For parts": "forParts",
};

export function EditListing() {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();

  const [step, setStep] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);

  // Step 1 — Details
  const [photos, setPhotos]           = useState<(string | null)[]>([null, null, null]);
  const [imageUrls, setImageUrls]     = useState<(string | null)[]>([null, null, null]);
  const [uploading, setUploading]     = useState<boolean[]>([false, false, false]);
  const [uploadErrors, setUploadErrors] = useState<(string | null)[]>([null, null, null]);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([null, null, null]);

  const [title, setTitle]             = useState("");
  const [brand, setBrand]             = useState("");
  const [customBrand, setCustomBrand] = useState("");
  const [cat, setCat]                 = useState("");
  const [cond, setCond]               = useState("worksPerf");
  const [damagedParts, setDamagedParts] = useState("");
  const [desc, setDesc]               = useState("");

  // Step 2 — Pricing
  const [daily, setDaily]     = useState("");
  const [weekly, setWeekly]   = useState("");
  const [monthly, setMonthly] = useState("");
  const [deposit, setDeposit] = useState("");

  // Step 3 — Availability
  const [avail, setAvail]           = useState(true);
  const [location, setLocation]     = useState("");
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  // Save state
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState("");
  const [saved, setSaved]           = useState(false);

  // Load listing data
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", listingId)
        .eq("owner_id", user.id)
        .single();

      if (error || !data) { navigate("/activity?tab=listings"); return; }

      // Pre-fill Step 1
      setTitle(data.title ?? "");
      setDesc(data.description ?? "");
      setCat(data.category ?? "");

      const condKey = conditionReverseMap[data.condition] ?? "worksPerf";
      setCond(condKey);
      setDamagedParts(data.damaged_parts ?? "");

      // Brand
      const existingBrand = data.brand ?? "";
      if (BRANDS.includes(existingBrand)) {
        setBrand(existingBrand);
      } else if (existingBrand) {
        setBrand("Other / Unlisted brand");
        setCustomBrand(existingBrand);
      }

      // Photos — populate first 3 slots from images[] or image_url
      const imgs: string[] = data.images ?? (data.image_url ? [data.image_url] : []);
      const slots: (string | null)[] = [imgs[0] ?? null, imgs[1] ?? null, imgs[2] ?? null];
      setPhotos(slots);
      setImageUrls(slots);

      // Step 2
      setDaily(String(data.price_per_day ?? ""));
      setWeekly(String(data.price_weekly ?? ""));
      setMonthly(String(data.price_monthly ?? ""));
      setDeposit(String(data.deposit ?? ""));

      // Step 3
      setAvail(data.is_active ?? true);
      setLocation(data.location_address ?? data.district ?? "");
      setLocationLat(data.location_lat ?? null);
      setLocationLng(data.location_lng ?? null);

      setPageLoading(false);
    }
    load();
  }, [listingId, navigate]);

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

  // Init autocomplete on step 2
  useEffect(() => {
    if (step !== 2) return;
    function init() {
      if (!window.google || !locationInputRef.current) return;
      const ac = new window.google.maps.places.Autocomplete(locationInputRef.current, {
        componentRestrictions: { country: "hk" },
        fields: ["formatted_address", "geometry", "name"],
        types: ["establishment", "geocode"],
      });
      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        const address = place.formatted_address || place.name || "";
        setLocation(address);
        setLocationLat(place.geometry?.location?.lat() ?? null);
        setLocationLng(place.geometry?.location?.lng() ?? null);
      });
    }
    if (window.google) { init(); }
    else {
      const interval = setInterval(() => { if (window.google) { clearInterval(interval); init(); } }, 200);
      return () => clearInterval(interval);
    }
  }, [step]);

  async function handleFileSelect(index: number, file: File) {
    setUploadErrors((e) => { const n = [...e]; n[index] = null; return n; });
    setUploading((u) => { const n = [...u]; n[index] = true; return n; });
    const previewUrl = URL.createObjectURL(file);
    setPhotos((p) => { const n = [...p]; n[index] = previewUrl; return n; });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading((u) => { const n = [...u]; n[index] = false; return n; }); return; }

    const path = `${user.id}/${Date.now()}_${file.name.replace(/\s+/g, "_")}`;
    const { error } = await supabase.storage.from("listings").upload(path, file);

    if (error) {
      setPhotos((p) => { const n = [...p]; n[index] = null; return n; });
      setUploadErrors((e) => { const n = [...e]; n[index] = error.message; return n; });
    } else {
      const { data: { publicUrl } } = supabase.storage.from("listings").getPublicUrl(path);
      setImageUrls((u) => { const n = [...u]; n[index] = publicUrl; return n; });
    }
    setUploading((u) => { const n = [...u]; n[index] = false; return n; });
  }

  function removePhoto(index: number) {
    setPhotos((p) => { const n = [...p]; n[index] = null; return n; });
    setImageUrls((u) => { const n = [...u]; n[index] = null; return n; });
    setUploadErrors((e) => { const n = [...e]; n[index] = null; return n; });
    if (fileRefs.current[index]) fileRefs.current[index]!.value = "";
  }

  async function handleSave() {
    setSaveError("");
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }

    const finalBrand = brand === "Other / Unlisted brand" ? customBrand : brand;
    const urls = imageUrls.filter((u): u is string => u !== null);

    const { error } = await supabase
      .from("listings")
      .update({
        title,
        brand: finalBrand || null,
        category: cat,
        condition: t(cond),
        damaged_parts: cond === "forParts" ? damagedParts : null,
        description: desc,
        price_per_day: Number(daily),
        price_weekly: weekly ? Number(weekly) : null,
        price_monthly: monthly ? Number(monthly) : null,
        deposit: deposit ? Number(deposit) : null,
        district: location || null,
        location_address: location || null,
        location_lat: locationLat,
        location_lng: locationLng,
        is_active: avail,
        image_url: urls[0] ?? null,
        images: urls.length > 0 ? urls : null,
      })
      .eq("id", listingId);

    setSaving(false);
    if (error) { setSaveError(error.message); }
    else { setSaved(true); }
  }

  const step1NextDisabled = !title || !cat || (cond === "forParts" && !damagedParts);

  if (pageLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-[#1E6B1E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (saved) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 flex items-center justify-center mb-4">
          <CheckCircle size={36} className="text-[#22C55E]" />
        </div>
        <h1 className="text-[#1F2937] mb-2" style={{ fontSize: 22 }}>{t("listingUpdated")}</h1>
        <p className="text-[#6B7280] text-sm mb-6">{title}</p>
        <button onClick={() => navigate("/activity?tab=listings")} className="py-3 px-8 bg-[#1E6B1E] text-white rounded-xl">{t("myListings")}</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate("/activity?tab=listings")} className="text-[#6B7280]"><ArrowLeft size={20} /></button>
          <h2 className="text-[#1F2937]">{t("editListing")}</h2>
        </div>

        {/* Stepper */}
        <div className="flex gap-1 mb-6">
          {stepKeys.map((_, i) => (
            <div key={i} className={`flex-1 h-1 rounded-full ${i <= step ? "bg-[#1E6B1E]" : "bg-[#E5E7EB]"}`} />
          ))}
        </div>

        {/* Step 1 — Details */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="relative">
                  <input
                    ref={(el) => { fileRefs.current[i] = el; }}
                    type="file" accept="image/*,.heic,.heif" className="hidden"
                    onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileSelect(i, file); }}
                  />
                  <div className="aspect-square rounded-xl border-2 border-dashed border-[#E5E7EB] overflow-hidden bg-[#F9FAFB]">
                    {uploading[i] ? (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-[#1E6B1E] border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : photos[i] ? (
                      <div className="relative w-full h-full">
                        <img src={photos[i]!} alt="" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removePhoto(i)} className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
                          <X size={10} className="text-white" />
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => fileRefs.current[i]?.click()} className="w-full h-full flex flex-col items-center justify-center text-[#6B7280]">
                        <Camera size={20} />
                        <span className="text-[10px] mt-1">{i === 0 ? t("addPhotos") : `#${i + 1}`}</span>
                      </button>
                    )}
                  </div>
                  {uploadErrors[i] && <p className="text-[9px] text-red-500 mt-0.5 text-center leading-tight">{uploadErrors[i]}</p>}
                </div>
              ))}
            </div>

            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t("title")}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm focus:outline-none focus:border-[#1E6B1E]" />

            <div>
              <label className="text-sm text-[#6B7280]">{t("brand")} <span className="text-[#9CA3AF]">(optional)</span></label>
              <select value={brand} onChange={(e) => { setBrand(e.target.value); setCustomBrand(""); }}
                className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm focus:outline-none focus:border-[#1E6B1E]">
                <option value="">Select brand</option>
                {BRANDS.map((b) => <option key={b}>{b}</option>)}
              </select>
              {brand === "Other / Unlisted brand" && (
                <input value={customBrand} onChange={(e) => setCustomBrand(e.target.value)} placeholder="Type brand name"
                  className="w-full mt-2 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm focus:outline-none focus:border-[#1E6B1E]" />
              )}
            </div>

            <div>
              <label className="text-sm text-[#6B7280]">{t("category")}</label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {catIcons.map((c) => (
                  <button key={c.key} onClick={() => setCat(c.key)}
                    className={`flex flex-col items-center gap-1 py-3 rounded-xl border transition-colors ${cat === c.key ? "border-[#1E6B1E] bg-[#1E6B1E]/5" : "border-[#E5E7EB] bg-white"}`}>
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
                  <button key={c} onClick={() => setCond(c)}
                    className={`flex-1 py-2 rounded-xl text-xs border transition-colors ${cond === c ? "border-[#1E6B1E] bg-[#1E6B1E]/5 text-[#1E6B1E]" : "border-[#E5E7EB] bg-white text-[#6B7280]"}`}>
                    {t(c)}
                  </button>
                ))}
              </div>
              {cond === "forParts" && (
                <div className="mt-2">
                  <textarea value={damagedParts} onChange={(e) => setDamagedParts(e.target.value)}
                    placeholder="e.g. The motor works but the heating element is broken" rows={2}
                    className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm resize-none focus:outline-none focus:border-[#1E6B1E]" />
                  <p className="text-[10px] text-[#6B7280] mt-0.5">Describe the damaged or non-working parts</p>
                </div>
              )}
            </div>

            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder={t("description")} rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm resize-none focus:outline-none focus:border-[#1E6B1E]" />
            <p className="text-right text-[10px] text-[#6B7280]">{desc.length}/500</p>

            <button onClick={() => setStep(1)} disabled={step1NextDisabled}
              className="w-full py-3 bg-[#1E6B1E] text-white rounded-xl disabled:opacity-40">{t("next")}</button>
          </div>
        )}

        {/* Step 2 — Pricing */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm text-[#6B7280]">{t("dailyPrice")}</label>
              <input type="number" value={daily} onChange={(e) => setDaily(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm" />
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
            <button onClick={() => setStep(2)} disabled={!daily} className="w-full py-3 bg-[#1E6B1E] text-white rounded-xl disabled:opacity-40">{t("next")}</button>
          </div>
        )}

        {/* Step 3 — Availability & Location */}
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
              <input ref={locationInputRef} type="text" value={location}
                onChange={(e) => { setLocation(e.target.value); setLocationLat(null); setLocationLng(null); }}
                placeholder="Search for a location in Hong Kong..."
                className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm focus:outline-none focus:border-[#1E6B1E]" />
            </div>
            <button onClick={() => setStep(3)} className="w-full py-3 bg-[#1E6B1E] text-white rounded-xl">{t("next")}</button>
          </div>
        )}

        {/* Step 4 — Review */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] space-y-2 text-sm">
              {photos.some((p) => p !== null) && (
                <div className="flex gap-1.5 mb-3">
                  {photos.filter((p) => p !== null).map((p, i) => (
                    <img key={i} src={p!} alt="" className="w-14 h-14 rounded-lg object-cover" />
                  ))}
                </div>
              )}
              <p style={{ fontWeight: 500 }}>{title}</p>
              {(brand === "Other / Unlisted brand" ? customBrand : brand) && (
                <p className="text-[#6B7280]">{t("brand")}: {brand === "Other / Unlisted brand" ? customBrand : brand}</p>
              )}
              <p className="text-[#6B7280]">{t(cat)} · {t(cond)}</p>
              {cond === "forParts" && damagedParts && <p className="text-[#6B7280] text-xs">Damaged: {damagedParts}</p>}
              <p className="text-[#1E6B1E]" style={{ fontWeight: 600 }}>HK${daily}/day · HK${weekly}/week · HK${monthly}/month</p>
              <p className="text-[#6B7280]">{t("deposit")}: HK${deposit}</p>
              <p className="text-[#6B7280]">{location}</p>
              {desc && <p className="text-[#6B7280]">{desc}</p>}
            </div>
            {saveError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{saveError}</p>}
            <button onClick={handleSave} disabled={saving} className="w-full py-3 bg-[#1E6B1E] text-white rounded-xl disabled:opacity-60">
              {saving ? "Saving..." : t("saveChanges")}
            </button>
            <button onClick={() => navigate("/activity?tab=listings")} className="w-full py-3 border border-[#E5E7EB] rounded-xl text-sm text-[#6B7280]">
              {t("back")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
