import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { useI18n } from "../components/i18n";
import { listings as mockListings, IMAGES } from "../components/data";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { supabase } from "../../lib/supabase";

type DurationType = "daily" | "weekly" | "monthly";

type ListingSummary = {
  id: string | number;
  owner_id: string | null;
  title: string;
  titleZh: string;
  image: string;
  price: number;
  priceWeekly: number | null;
  priceMonthly: number | null;
  deposit: number;
  university: string;
  universityZh: string;
};

export function RentRequest() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const [listing, setListing] = useState<ListingSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [durationType, setDurationType] = useState<DurationType>("daily");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [msg, setMsg] = useState("");
  const [pickup, setPickup] = useState<"collect" | "deliver">("collect");
  const [agreed, setAgreed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (!id) return;
    const numericId = Number(id);

    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      if (!isNaN(numericId)) {
        const found = mockListings.find((l) => l.id === numericId);
        if (found) {
          setListing({
            id: found.id, owner_id: null,
            title: found.title, titleZh: found.titleZh,
            image: found.image, price: found.price,
            priceWeekly: found.weeklyPrice, priceMonthly: found.monthlyPrice,
            deposit: found.deposit,
            university: found.university, universityZh: found.universityZh,
          });
        }
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("listings")
        .select("id, owner_id, title, title_zh, image_url, price_per_day, price_weekly, price_monthly, deposit, university")
        .eq("id", id)
        .single();

      if (data) {
        if (data.owner_id === user.id) { navigate("/my-listings"); return; }
        setListing({
          id: data.id,
          owner_id: data.owner_id,
          title: data.title,
          titleZh: data.title_zh ?? data.title,
          image: data.image_url ?? IMAGES.kettle,
          price: data.price_per_day,
          priceWeekly: data.price_weekly ?? null,
          priceMonthly: data.price_monthly ?? null,
          deposit: data.deposit ?? 0,
          university: data.university ?? "—",
          universityZh: data.university ?? "—",
        });
      }
      setLoading(false);
    }

    load();
  }, [id, navigate]);

  // When duration type changes, clear end date so user re-picks within constraints
  useEffect(() => { setEndDate(""); }, [durationType]);

  async function handleSubmit() {
    if (!listing || !startDate || !endDate || !agreed) return;
    setSubmitError("");
    setSending(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }

    const { error } = await supabase.from("requests").insert({
      listing_id: listing.id,
      renter_id: user.id,
      start_date: startDate,
      end_date: endDate,
      total_price: total,
      status: "pending",
    });

    setSending(false);
    if (error) { setSubmitError(error.message); } else { setSent(true); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-[#1E6B1E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!listing) return null;

  const today = new Date().toISOString().split("T")[0];

  // Minimum end date based on duration type
  function getMinEndDate(): string {
    const base = startDate || today;
    const d = new Date(base + "T00:00:00");
    if (durationType === "weekly") d.setDate(d.getDate() + 6);
    else if (durationType === "monthly") d.setDate(d.getDate() + 29);
    return d.toISOString().split("T")[0];
  }

  const days = startDate && endDate
    ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000))
    : 0;

  // Compute rental cost and label based on duration type
  let rentalCost = 0;
  let costLabel = "";
  if (days > 0) {
    if (durationType === "daily") {
      rentalCost = days * listing.price;
      costLabel = `HK$${listing.price} × ${days} ${t("duration")}`;
    } else if (durationType === "weekly") {
      const weeks = Math.max(1, Math.ceil(days / 7));
      rentalCost = weeks * (listing.priceWeekly ?? 0);
      costLabel = `HK$${listing.priceWeekly} × ${weeks} ${weeks === 1 ? "week" : "weeks"}`;
    } else if (durationType === "monthly") {
      const months = Math.max(1, Math.ceil(days / 30));
      rentalCost = months * (listing.priceMonthly ?? 0);
      costLabel = `HK$${listing.priceMonthly} × ${months} ${months === 1 ? "month" : "months"}`;
    }
  }
  const total = rentalCost + listing.deposit;

  const durationOptions: { key: DurationType; label: string; price: number | null }[] = [
    { key: "daily",   label: "Daily",   price: listing.price },
    { key: "weekly",  label: "Weekly",  price: listing.priceWeekly },
    { key: "monthly", label: "Monthly", price: listing.priceMonthly },
  ];

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

        <div className="space-y-4">
          {/* Duration type selector */}
          <div>
            <label className="text-sm text-[#6B7280]">Rental period</label>
            <div className="flex gap-2 mt-2">
              {durationOptions.map(({ key, label, price }) => {
                const unavailable = key !== "daily" && !price;
                return (
                  <button
                    key={key}
                    onClick={() => !unavailable && setDurationType(key)}
                    disabled={unavailable}
                    title={unavailable ? "Not available for this listing" : undefined}
                    className={`flex-1 py-2.5 rounded-xl text-xs border transition-colors ${
                      durationType === key
                        ? "bg-[#1E6B1E] text-white border-[#1E6B1E]"
                        : unavailable
                        ? "bg-[#F9FAFB] text-[#D1D5DB] border-[#E5E7EB] cursor-not-allowed"
                        : "bg-white text-[#6B7280] border-[#E5E7EB]"
                    }`}
                  >
                    <span className="block">{label}</span>
                    {price ? (
                      <span className="block text-[10px] opacity-80">HK${price}/{key === "daily" ? "day" : key === "weekly" ? "wk" : "mo"}</span>
                    ) : (
                      <span className="block text-[10px]">N/A</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-[#6B7280]">{t("startDate")}</label>
              <input
                type="date"
                value={startDate}
                min={today}
                onChange={(e) => { setStartDate(e.target.value); setEndDate(""); }}
                className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm"
              />
            </div>
            <div>
              <label className="text-sm text-[#6B7280]">{t("endDate")}</label>
              <input
                type="date"
                value={endDate}
                min={getMinEndDate()}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm"
              />
            </div>
          </div>
          {durationType !== "daily" && (
            <p className="text-[10px] text-[#6B7280] -mt-2">
              {durationType === "weekly" ? "Minimum 7 days (1 week)" : "Minimum 30 days (1 month)"}
            </p>
          )}

          {/* Price breakdown */}
          {days > 0 && (
            <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] text-sm space-y-1">
              <div className="flex justify-between text-[#6B7280]">
                <span>{costLabel}</span>
                <span>HK${rentalCost}</span>
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

          {submitError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{submitError}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={!startDate || !endDate || !agreed || sending}
            className="w-full py-3 bg-[#1E6B1E] text-white rounded-xl disabled:opacity-40"
          >
            {sending ? "Sending..." : t("sendRequest")}
          </button>
        </div>
      </div>
    </div>
  );
}
