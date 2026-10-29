import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "../components/i18n";
import { LockerPicker } from "../components/Lockers";
import { PICKUP_LABEL_KEY, pickupMethodOf, type PickupMethod } from "../../demo/demo";
import { supabase } from "../../lib/supabase";
import listingPlaceholder from "../../assets/listing-placeholder.svg";
import { loginPath } from "../../lib/authRedirect";

type ListingInfo = {
  id: string;
  title: string;
  image_url: string | null;
  price_per_day: number;
  price_weekly: number | null;
  price_monthly: number | null;
  deposit: number | null;
};

type PriceBreakdown = { months: number; weeks: number; days: number; total: number };

function calculateOptimalPrice(
  totalDays: number,
  priceDay: number,
  priceWeek: number | null,
  priceMonth: number | null
): PriceBreakdown {
  const pw = priceWeek && priceWeek > 0 ? priceWeek : 0;
  const pm = priceMonth && priceMonth > 0 ? priceMonth : 0;
  const months = pm > 0 ? Math.floor(totalDays / 30) : 0;
  const remainingAfterMonths = totalDays - months * 30;
  const weeks = pw > 0 ? Math.floor(remainingAfterMonths / 7) : 0;
  const remainingDays = remainingAfterMonths - weeks * 7;
  const total = months * pm + weeks * pw + remainingDays * priceDay;
  return { months, weeks, days: remainingDays, total };
}

export function EditRequest() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { t, isZh, zh } = useI18n();

  const [listing, setListing] = useState<ListingInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [msg, setMsg] = useState("");
  const [pickup, setPickup] = useState<PickupMethod>("meetup");
  const [lockerId, setLockerId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate(loginPath()); return; }

      const { data: req, error: reqErr } = await supabase
        .from("requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (reqErr || !req) { navigate("/activity?tab=requests"); return; }
      if (req.renter_id !== user.id) { navigate("/activity?tab=requests"); return; }
      if (req.status !== "pending") { navigate(`/my-requests/${requestId}`); return; }

      // Pre-fill
      setStartDate(req.start_date ?? "");
      setEndDate(req.end_date ?? "");
      setMsg(req.message ?? "");
      setPickup(pickupMethodOf(req));
      setLockerId(req.locker_id ?? null);

      // Load listing for pricing display
      const { data: listingData } = await supabase
        .from("listings")
        .select("id, title, image_url, price_per_day, price_weekly, price_monthly, deposit")
        .eq("id", req.listing_id)
        .single();

      setListing(listingData ?? null);
      setLoading(false);
    }
    load();
  }, [requestId, navigate]);

  async function handleSave() {
    if (!listing || !startDate || !endDate) return;
    if (pickup === "locker" && !lockerId) return;
    setSaveError("");
    setSaving(true);

    const totalDays = Math.max(1, Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000
    ));
    const breakdown = calculateOptimalPrice(totalDays, listing.price_per_day, listing.price_weekly, listing.price_monthly);

    const base = {
        start_date: startDate,
        end_date: endDate,
        total_price: breakdown.total,
        message: msg || null,
        pickup_preference: pickup === "delivery" ? "deliver" : "collect",
        breakdown_json: {
          months: breakdown.months,
          weeks: breakdown.weeks,
          days: breakdown.days,
          total: breakdown.total,
          priceMonth: listing.price_monthly,
          priceWeek: listing.price_weekly,
          priceDay: listing.price_per_day,
        },
    };
    let { error } = await supabase
      .from("requests")
      .update({ ...base, pickup_method: pickup, locker_id: pickup === "locker" ? lockerId : null })
      .eq("id", requestId);
    // Demo migration not run yet: save without the new columns
    if (error?.code === "PGRST204") ({ error } = await supabase.from("requests").update(base).eq("id", requestId));

    setSaving(false);
    if (error) { setSaveError(error.message); }
    else { navigate(`/my-requests/${requestId}`); }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-8 text-center">
        <p className="text-[#6B7280] text-sm">{error || (isZh ? zh("找不到請求") : "Request not found.")}</p>
        <button onClick={() => navigate("/activity?tab=requests")} className="mt-4 text-brand text-sm">← {isZh ? zh("返回") : "Back"}</button>
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const totalDays = startDate && endDate
    ? Math.max(1, Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000))
    : 0;
  const breakdown = totalDays > 0
    ? calculateOptimalPrice(totalDays, listing.price_per_day, listing.price_weekly, listing.price_monthly)
    : null;
  const grandTotal = breakdown ? breakdown.total + (listing.deposit ?? 0) : 0;

  return (
    <div className="min-h-screen bg-[#F9FAFB]">
      <div className="max-w-lg mx-auto px-4 pt-4 pb-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(`/my-requests/${requestId}`)} className="text-[#6B7280]"><ArrowLeft size={20} /></button>
          <h2 className="text-[#1F2937]">{t("editRequest")}</h2>
        </div>

        {/* Item summary */}
        <div className="flex gap-3 p-3 rounded-xl bg-white border border-[#E5E7EB] mb-5">
          <img
            src={listing.image_url ?? listingPlaceholder}
            alt=""
            className="w-16 h-16 rounded-lg object-cover"
          />
          <div className="text-sm">
            <p style={{ fontWeight: 500 }}>{listing.title}</p>
            <p className="text-brand" style={{ fontWeight: 600 }}>
              HK${listing.price_per_day}<span className="text-[#6B7280]" style={{ fontWeight: 400 }}>{t("perDay")}</span>
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Pricing info pills */}
          <div className="flex gap-2">
            {[
              { label: "day", value: listing.price_per_day },
              { label: "week", value: listing.price_weekly },
              { label: "month", value: listing.price_monthly },
            ].map(({ label, value }) => (
              <div key={label} className="flex-1 py-2 px-2 rounded-xl bg-[#F3F4F6] text-center">
                {value ? (
                  <span className="text-xs text-brand" style={{ fontWeight: 600 }}>HK${value}</span>
                ) : (
                  <span className="text-xs text-[#9CA3AF]">—</span>
                )}
                <span className="block text-[10px] text-[#6B7280]">/{label}</span>
              </div>
            ))}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-[#6B7280]">{t("startDate")}</label>
              <input type="date" value={startDate} min={today}
                onChange={(e) => { setStartDate(e.target.value); setEndDate(""); }}
                className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm" />
            </div>
            <div>
              <label className="text-sm text-[#6B7280]">{t("endDate")}</label>
              <input type="date" value={endDate} min={startDate || today}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm" />
            </div>
          </div>

          {/* Smart price breakdown */}
          {breakdown && (
            <div className="p-3 rounded-xl bg-white border border-[#E5E7EB] text-sm space-y-1.5">
              {breakdown.months > 0 && (
                <div className="flex justify-between text-[#6B7280]">
                  <span>{breakdown.months} month{breakdown.months > 1 ? "s" : ""} × HK${listing.price_monthly}</span>
                  <span>HK${breakdown.months * (listing.price_monthly ?? 0)}</span>
                </div>
              )}
              {breakdown.weeks > 0 && (
                <div className="flex justify-between text-[#6B7280]">
                  <span>{breakdown.weeks} week{breakdown.weeks > 1 ? "s" : ""} × HK${listing.price_weekly}</span>
                  <span>HK${breakdown.weeks * (listing.price_weekly ?? 0)}</span>
                </div>
              )}
              {breakdown.days > 0 && (
                <div className="flex justify-between text-[#6B7280]">
                  <span>{breakdown.days} day{breakdown.days > 1 ? "s" : ""} × HK${listing.price_per_day}</span>
                  <span>HK${breakdown.days * listing.price_per_day}</span>
                </div>
              )}
              <div className="border-t border-[#E5E7EB] pt-1.5 space-y-1">
                <div className="flex justify-between text-[#6B7280]">
                  <span>{t("deposit")}</span>
                  <span>HK${listing.deposit ?? 0}</span>
                </div>
                <div className="flex justify-between" style={{ fontWeight: 600 }}>
                  <span>{t("total")}</span>
                  <span className="text-brand">HK${grandTotal}</span>
                </div>
              </div>
            </div>
          )}

          {/* Message */}
          <div>
            <label className="text-sm text-[#6B7280]">{t("messageToOwner")}</label>
            <textarea value={msg} onChange={(e) => setMsg(e.target.value)}
              placeholder={t("messagePlaceholder")} rows={3}
              className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm resize-none focus:outline-none focus:border-brand" />
          </div>

          {/* Pickup preference */}
          <div>
            <label className="text-sm text-[#6B7280]">{t("pickupPref")}</label>
            <div className="flex gap-2 mt-2">
              {(["meetup", "locker", "delivery"] as const).map((p) => (
                <button key={p} onClick={() => setPickup(p)}
                  className={`flex-1 py-2.5 rounded-xl text-sm border transition-colors ${pickup === p ? "bg-brand text-white border-brand" : "bg-white text-[#6B7280] border-[#E5E7EB]"}`}>
                  {t(PICKUP_LABEL_KEY[p])}
                </button>
              ))}
            </div>
            {pickup === "locker" && <LockerPicker value={lockerId} onChange={setLockerId} />}
            {pickup === "locker" && !lockerId && <p className="text-xs text-[#B45309] mt-1">{t("lockerRequired")}</p>}
          </div>

          {saveError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{saveError}</p>
          )}

          <button
            onClick={handleSave}
            disabled={!startDate || !endDate || saving || (pickup === "locker" && !lockerId)}
            className="w-full py-3 bg-brand text-white rounded-xl disabled:opacity-40"
          >
            {saving ? t("saving") : t("saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}
