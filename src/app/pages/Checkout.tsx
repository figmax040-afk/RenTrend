import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, ShieldCheck, CreditCard, CheckCircle, Tag, X } from "lucide-react";
import { useI18n } from "../components/i18n";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { RentalTermsCard } from "../components/RentalTermsCard";
import { supabase } from "../../lib/supabase";
import { loginPath } from "../../lib/authRedirect";
import { APP_URL } from "../../lib/appUrl";
import { sendEmail } from "../../lib/sendEmail";
import { breakdownFromRequest } from "../../lib/pricing";
import listingPlaceholder from "../../assets/listing-placeholder.svg";
import { useDemoProfile } from "../../demo/useDemoProfile";
import {
  copy, lockerById, pickupFee, pickupMethodOf, randomLockerCode, referralCodeFor, validatePromo,
  PICKUP_LABEL_KEY, type PromoResult,
} from "../../demo/demo";
import { fill } from "../../demo/strings";

type Applied = Extract<PromoResult, { ok: true }>;

export function Checkout() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { t, isZh, zh } = useI18n();
  const { profile, loading: profileLoading } = useDemoProfile();

  const [request, setRequest] = useState<Record<string, any> | null>(null);
  const [listing, setListing] = useState<Record<string, any> | null>(null);
  const [isFirstRental, setIsFirstRental] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [codeInput, setCodeInput] = useState("");
  const [promo, setPromo] = useState<Applied | null>(null);
  const [promoError, setPromoError] = useState("");
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate(loginPath()); return; }

      const { data: req } = await supabase.from("requests").select("*").eq("id", requestId).maybeSingle();
      if (!req || req.renter_id !== user.id) { navigate("/activity?tab=requests"); return; }
      setRequest(req);

      if (req.listing_id) {
        const { data: l } = await supabase
          .from("listings")
          .select("id, title, title_zh, image_url, price_per_day, price_weekly, price_monthly, deposit, owner_id")
          .eq("id", req.listing_id)
          .maybeSingle();
        setListing(l ?? null);
      }

      // Promo codes for first rentals: no earlier rental paid through Lendy
      const { count } = await supabase
        .from("requests")
        .select("id", { count: "exact", head: true })
        .eq("renter_id", user.id)
        .in("escrow_status", ["held", "released"])
        .neq("id", req.id);
      setIsFirstRental((count ?? 0) === 0);
      setLoading(false);
    }
    load();
  }, [requestId, navigate]);

  if (loading || profileLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!request) return null;

  const method = pickupMethodOf(request);
  const locker = lockerById(request.locker_id);
  const lines = breakdownFromRequest(request as any, listing as any);
  const subtotal = lines?.total ?? request.total_price ?? 0;
  const deposit = listing?.deposit ?? 0;
  const fee = pickupFee(method, profile.isPlus);
  const discount = promo ? Math.min(promo.amount, subtotal) : 0;
  const total = subtotal + deposit + fee.charged - discount;
  const title = listing ? (isZh && listing.title_zh ? zh(listing.title_zh) : listing.title) : t("listingRemovedShort");
  const alreadyPaid = request.escrow_status && request.escrow_status !== "unpaid";

  function applyCode() {
    setPromoError("");
    const result = validatePromo(codeInput, {
      isFirstRental,
      ownReferralCode: profile.userId ? referralCodeFor(profile.userId, profile.name) : "",
    });
    if (result.ok) { setPromo(result); setCodeInput(""); return; }
    setPromo(null);
    setPromoError(t(result.reason === "firstRentalOnly" ? "promoFirstOnly" : result.reason === "ownCode" ? "promoOwnCode" : "promoInvalid"));
  }

  async function pay() {
    if (!request || paying) return;
    setPaying(true);
    setError("");
    // Mock payment provider: a short pause, then the money is "held" by Lendy
    await new Promise((r) => setTimeout(r, 1200));
    const { data: updated, error: err } = await supabase
      .from("requests")
      .update({
        escrow_status: "held",
        paid_at: new Date().toISOString(),
        amount_paid: total,
        delivery_fee: fee.charged,
        promo_code: promo?.code ?? null,
        discount: discount || null,
        locker_code: method === "locker" ? randomLockerCode() : null,
      })
      .eq("id", request.id)
      .eq("escrow_status", "unpaid")
      .select("id");
    setPaying(false);
    if (err) { setError(err.message); return; }
    if (!updated?.length) { setError(t("alreadyPaid")); return; }
    setPaid(true);

    if (listing?.owner_id) {
      const { data: owner } = await supabase.from("profiles").select("name, email").eq("id", listing.owner_id).maybeSingle();
      if (owner?.email) {
        sendEmail(
          owner.email,
          `Payment received for ${listing.title}`,
          `Hi ${owner.name || "there"}, the renter has paid for <strong>${listing.title}</strong>. Lendy is holding the payment until the item is returned. View the rental: <a href="${APP_URL}/my-listings/${listing.id}/requests/${request.id}">${APP_URL}/my-listings/${listing.id}/requests/${request.id}</a>`
        );
      }
    }
  }

  if (paid) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col items-center justify-center px-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[#22C55E]/10 flex items-center justify-center mb-4">
          <CheckCircle size={36} className="text-[#22C55E]" />
        </div>
        <h1 className="text-[#1F2937] mb-2" style={{ fontSize: 22 }}>{t("paymentSuccess")}</h1>
        <p className="text-[#6B7280] text-sm mb-1">HK${total} · {title}</p>
        <p className="text-[#6B7280] text-xs mb-6 max-w-xs">{t("paymentSuccessMsg")}</p>
        <button onClick={() => navigate(`/my-requests/${request.id}`)} className="w-full max-w-xs py-3 bg-brand text-white rounded-xl">{t("viewRental")}</button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-10">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(`/my-requests/${request.id}`)} className="text-[#6B7280]"><ArrowLeft size={20} /></button>
        <h2 className="text-[#1F2937]" style={{ fontWeight: 600 }}>{t("checkout")}</h2>
      </div>

      {alreadyPaid || request.status !== "accepted" ? (
        <div className="bg-[#F3F4F6] border border-[#E5E7EB] text-[#4B5563] text-sm px-4 py-3 rounded-xl">
          {alreadyPaid ? t("alreadyPaid") : t("awaitingResponse")}
          <button onClick={() => navigate(`/my-requests/${request.id}`)} className="block mt-1 text-brand">{t("viewRental")} →</button>
        </div>
      ) : (
        <>
          {/* Item */}
          <div className="flex gap-3 p-3 rounded-xl bg-white border border-[#E5E7EB] mb-4">
            <ImageWithFallback src={listing?.image_url ?? listingPlaceholder} alt="" className="w-16 h-16 rounded-lg object-cover" />
            <div className="text-sm min-w-0">
              <p className="truncate" style={{ fontWeight: 500 }}>{title}</p>
              <p className="text-xs text-[#6B7280]">{request.start_date} → {request.end_date}</p>
              <p className="text-xs text-[#6B7280]">
                {t(PICKUP_LABEL_KEY[method])}{locker && <> · {copy(locker.name, isZh, zh)}</>}
              </p>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 mb-4 space-y-2 text-sm">
            <div className="flex justify-between text-[#4B5563]">
              <span>{t("rentalSubtotal")}</span><span>HK${subtotal}</span>
            </div>
            {lines && (
              <p className="text-[11px] text-[#9CA3AF] -mt-1">
                {[
                  lines.months > 0 && `${fill(t("monthsN"), { n: lines.months })} × HK$${lines.priceMonth}`,
                  lines.weeks > 0 && `${fill(t("weeksN"), { n: lines.weeks })} × HK$${lines.priceWeek}`,
                  lines.days > 0 && `${fill(t("daysN"), { n: lines.days })} × HK$${lines.priceDay}`,
                ].filter(Boolean).join(" + ")}
              </p>
            )}
            <div className="flex justify-between text-[#4B5563]">
              <span>{t("refundableDeposit")}</span><span>HK${deposit}</span>
            </div>
            <div className="flex justify-between text-[#4B5563]">
              <span>{t(method === "delivery" ? "deliveryFee" : method === "locker" ? "lockerFee" : "pickupFeeNone")}</span>
              <span>
                {fee.base === 0 ? "HK$0" : fee.charged === 0
                  ? <><s className="text-[#9CA3AF]">HK${fee.base}</s> <span className="text-[#15803D]">{t("free")}</span></>
                  : `HK$${fee.base}`}
              </span>
            </div>

            {/* Promo code */}
            <div className="pt-2 border-t border-[#E5E7EB]">
              {promo ? (
                <div className="flex items-center justify-between text-[#15803D]">
                  <span className="flex items-center gap-1.5"><Tag size={14} />{promo.code} · {copy(promo.label, isZh, zh)}</span>
                  <button onClick={() => setPromo(null)} className="text-[#6B7280]" aria-label={t("remove")}><X size={14} /></button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={codeInput}
                    onChange={(e) => { setCodeInput(e.target.value); setPromoError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter" && codeInput.trim()) applyCode(); }}
                    placeholder={t("promoCode")}
                    className="flex-1 px-3 py-2 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-sm uppercase focus:outline-none focus:border-brand"
                  />
                  <button onClick={applyCode} disabled={!codeInput.trim()} className="px-4 py-2 rounded-xl border border-brand text-brand text-sm disabled:opacity-40">
                    {t("apply")}
                  </button>
                </div>
              )}
              {promoError && <p className="text-xs text-red-600 mt-1">{promoError}</p>}
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-[#15803D]">
                <span>{t("discount")}</span><span>− HK${discount}</span>
              </div>
            )}

            <div className="flex justify-between pt-2 border-t border-[#E5E7EB]" style={{ fontWeight: 700 }}>
              <span>{t("payTotal")}</span><span className="text-brand" style={{ fontSize: 18 }}>HK${total}</span>
            </div>
          </div>

          <p className="text-xs text-brand bg-brand-soft border border-brand-border p-3 rounded-xl flex gap-2 mb-4">
            <ShieldCheck size={16} className="shrink-0" />
            <span>{t("escrowPromise")}</span>
          </p>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#4B5563] mb-4">
            <CreditCard size={16} className="text-brand" />{t("demoCard")}
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl mb-3">{error}</p>}

          <button
            onClick={pay}
            disabled={paying}
            className="w-full py-3 bg-brand text-white rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {paying ? (
              <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{t("processingPayment")}</>
            ) : (
              <><ShieldCheck size={16} />{t("paySecurely")} · HK${total}</>
            )}
          </button>

          <RentalTermsCard />
        </>
      )}
    </div>
  );
}
