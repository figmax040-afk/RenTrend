import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Shield, CheckCircle, X, Star, MessageCircle } from "lucide-react";
import { useI18n } from "../components/i18n";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { supabase } from "../../lib/supabase";
import { fetchContactProfiles } from "../../lib/publicProfiles";
import { loginPath } from "../../lib/authRedirect";
import { APP_URL } from "../../lib/appUrl";
import { sendEmail } from "../../lib/sendEmail";
import { IMAGES } from "../components/data";
import { breakdownFromRequest } from "../../lib/pricing";
import { EscrowTracker, escrowOf } from "../components/EscrowTracker";
import { HandoverPanel, type HandoverRequest } from "../components/HandoverPanel";
import { LockerCodeCard } from "../components/Lockers";
import { PayoutBreakdown } from "../components/PayoutBreakdown";
import { PICKUP_LABEL_KEY, pickupMethodOf } from "../../demo/demo";
import { useDemoProfile } from "../../demo/useDemoProfile";

type Listing = {
  id: string;
  title: string;
  title_zh: string | null;
  image_url: string | null;
  price_per_day: number;
  price_weekly: number | null;
  price_monthly: number | null;
  deposit: number | null;
};

type RenterProfile = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
};

type Request = {
  id: string;
  listing_id: string;
  renter_id: string;
  start_date: string;
  end_date: string;
  message: string | null;
  status: string;
  pickup_preference: string | null;
  total_price: number | null;
  breakdown_json: Record<string, number | null> | null;
  pickup_method?: string | null;
  locker_id?: string | null;
  locker_code?: string | null;
  profiles: RenterProfile | null;
} & HandoverRequest;

function fmtFull(d: string) {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function daysBetween(start: string, end: string) {
  return Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000));
}

function renterName(r: Request) {
  const name = r.profiles?.name;
  if (name) return name;
  const email = r.profiles?.email ?? "";
  return email.split("@")[0] || "User";
}

function StarSelector({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((s) => (
        <button key={s} onClick={() => onChange(s)} className="p-0.5">
          <Star
            size={28}
            className={s <= value ? "text-[#F59E0B] fill-[#F59E0B]" : "text-[#D1D5DB]"}
          />
        </button>
      ))}
    </div>
  );
}

export function RequestDetail() {
  const { listingId, requestId } = useParams<{ listingId: string; requestId: string }>();
  const navigate = useNavigate();
  const { t, lang, isZh, zh } = useI18n();
  const { profile } = useDemoProfile();

  const [listing, setListing] = useState<Listing | null>(null);
  const [request, setRequest] = useState<Request | null>(null);
  const [allRequests, setAllRequests] = useState<{ id: string; status: string }[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Mark complete
  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Review state
  const [existingReview, setExistingReview] = useState<{ rating: number; comment: string | null } | null>(null);
  const [reviewChecked, setReviewChecked] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewDone, setReviewDone] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate(loginPath()); return; }
      setCurrentUserId(user.id);

      const { data: listingData, error: listingErr } = await supabase
        .from("listings")
        .select("id, title, title_zh, image_url, price_per_day, price_weekly, price_monthly, deposit")
        .eq("id", listingId)
        .eq("owner_id", user.id)
        .single();

      if (listingErr || !listingData) {
        navigate("/activity?tab=listings");
        return;
      }
      setListing(listingData);

      const { data: reqData, error: reqErr } = await supabase
        .from("requests")
        .select("*")
        .eq("id", requestId)
        .eq("listing_id", listingId)
        .single();

      if (reqErr || !reqData) {
        setError(isZh ? zh("找不到該請求") : "Request not found.");
        setLoading(false);
        return;
      }

      const contacts = await fetchContactProfiles([reqData.renter_id]);

      setRequest({ ...reqData, profiles: contacts[reqData.renter_id] ?? null } as Request);

      const { data: allReqData } = await supabase
        .from("requests")
        .select("id, status")
        .eq("listing_id", listingId);
      setAllRequests((allReqData ?? []) as { id: string; status: string }[]);

      // Check existing review if completed
      if (reqData.status === "completed") {
        const { data: rev } = await supabase
          .from("reviews")
          .select("rating, comment")
          .eq("request_id", reqData.id)
          .eq("reviewer_id", user.id)
          .maybeSingle();
        setExistingReview(rev ?? null);
        setReviewChecked(true);
      }
    } catch (err: any) {
      console.error("RequestDetail fetch error:", err);
      setError(isZh ? zh("載入請求時出錯") : "Failed to load request.");
    } finally {
      setLoading(false);
    }
  }, [requestId, listingId, navigate, lang]);

  useEffect(() => { load(); }, [load]);

  async function handleAccept() {
    if (!request || !listingId || !listing) return;
    setActing(true);
    setShowConfirm(false);

    const { error: acceptErr } = await supabase
      .from("requests")
      .update({ status: "accepted" })
      .eq("id", request.id);

    if (acceptErr) {
      setError(isZh ? zh("接受請求時出錯，請重試") : "Failed to accept request. Please try again.");
      setActing(false);
      return;
    }

    const { error: declineOthersErr } = await supabase
      .from("requests")
      .update({ status: "rejected" })
      .eq("listing_id", listingId)
      .eq("status", "pending")
      .neq("id", request.id);
    if (declineOthersErr) {
      setError(isZh
        ? zh("已接受此請求，但未能自動拒絕其他請求，請手動處理。")
        : "Request accepted, but other pending requests couldn't be declined automatically. Please decline them manually.");
    } else {
      setAllRequests((prev) => prev.map((r) => r.id !== request.id && r.status === "pending" ? { ...r, status: "rejected" } : r));
    }

    setRequest((prev) => prev ? { ...prev, status: "accepted" } : prev);
    setActing(false);

    // Email renter
    const renterEmail = request.profiles?.email;
    const listingTitle = isZh && listing.title_zh ? zh(listing.title_zh) : listing.title;
    if (renterEmail) {
      await sendEmail(
        renterEmail,
        "Your rental request was accepted!",
        `Great news! Your request to rent <strong>${listingTitle}</strong> has been accepted. Pay securely on Lendy to confirm your booking — we hold the payment until the item is returned. View your request: <a href="${APP_URL}/activity?tab=requests">${APP_URL}/activity?tab=requests</a>`
      );
    }
  }

  async function handleDecline() {
    if (!request || !listing) return;
    setActing(true);

    const { error: declineErr } = await supabase
      .from("requests")
      .update({ status: "rejected" })
      .eq("id", request.id);

    if (declineErr) {
      setError(isZh ? zh("拒絕請求時出錯，請重試") : "Failed to decline request. Please try again.");
      setActing(false);
      return;
    }

    setRequest((prev) => prev ? { ...prev, status: "rejected" } : prev);
    setActing(false);

    // Email renter
    const renterEmail = request.profiles?.email;
    const listingTitle = isZh && listing.title_zh ? zh(listing.title_zh) : listing.title;
    if (renterEmail) {
      await sendEmail(
        renterEmail,
        "Update on your rental request",
        `Unfortunately, your request to rent <strong>${listingTitle}</strong> was not accepted this time. Browse other available items: <a href="${APP_URL}/browse">${APP_URL}/browse</a>`
      );
    }
  }

  async function handleComplete() {
    if (!request || !listing) return;
    setCompleting(true);
    setShowCompleteConfirm(false);

    const { error: completeErr } = await supabase
      .from("requests")
      .update({ status: "completed", completed_at: new Date().toISOString() })
      .eq("id", request.id);

    if (completeErr) {
      console.error("Mark complete error:", completeErr);
      setError(isZh ? zh("標記完成時出錯") : "Failed to mark as completed.");
      setCompleting(false);
      return;
    }

    // Update local state immediately
    setRequest((prev) => prev ? { ...prev, status: "completed", completed_at: new Date().toISOString() } as Request & { completed_at: string } : prev);

    const listingTitle = isZh && listing.title_zh ? zh(listing.title_zh) : listing.title;

    // Check existing review now that it's completed
    const { data: rev } = await supabase
      .from("reviews")
      .select("rating, comment")
      .eq("request_id", request.id)
      .eq("reviewer_id", currentUserId)
      .maybeSingle();
    setExistingReview(rev ?? null);
    setReviewChecked(true);
    setCompleting(false);

    // Email renter
    const renterEmail = request.profiles?.email;
    if (renterEmail) {
      await sendEmail(
        renterEmail,
        `Your rental of ${listingTitle} is complete`,
        `Your rental of <strong>${listingTitle}</strong> is complete. Please leave a review! View: <a href="${APP_URL}/my-requests/${request.id}">${APP_URL}/my-requests/${request.id}</a>`
      );
    }

    // Email lister (self)
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      await sendEmail(
        user.email,
        "Rental completed",
        `Rental of <strong>${listingTitle}</strong> completed — don't forget to leave a review for your renter.`
      );
    }
  }

  async function handleSubmitReview() {
    if (!request || !reviewRating || !currentUserId) return;
    setSubmittingReview(true);

    await supabase.from("reviews").insert({
      request_id: requestId,
      listing_id: listingId,
      reviewer_id: currentUserId,
      reviewee_id: request.renter_id,
      role: "lister",
      rating: reviewRating,
      comment: reviewComment || null,
    });

    // Update renter's rating on their profile
    const { data: allRevs } = await supabase
      .from("reviews")
      .select("rating")
      .eq("reviewee_id", request.renter_id)
      .eq("role", "lister");

    if (allRevs && allRevs.length > 0) {
      const avg = Math.round(allRevs.reduce((s, r) => s + r.rating, 0) / allRevs.length * 10) / 10;
      await supabase.from("profiles").update({
        rating_as_renter: avg,
        review_count_as_renter: allRevs.length,
      }).eq("id", request.renter_id);
    }

    setReviewDone(true);
    setSubmittingReview(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!listing || !request) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-8 text-center">
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-xl mb-3">
          {error || (isZh ? zh("找不到請求") : "Request not found.")}
        </p>
        <button onClick={load} className="text-sm text-brand mb-2 block">
          {isZh ? zh("重試") : "Try again"}
        </button>
        <button
          onClick={() => navigate(`/my-listings/${listingId}/requests`)}
          className="text-sm text-[#6B7280]"
        >
          ← {isZh ? zh("返回") : "Back"}
        </button>
      </div>
    );
  }

  const name = renterName(request);
  const days = daysBetween(request.start_date, request.end_date);
  const lines = breakdownFromRequest(request, listing);
  const total = lines?.total ?? request.total_price ?? listing.price_per_day * days;
  const deposit = listing.deposit ?? 0;
  const listingTitle = isZh && listing.title_zh ? zh(listing.title_zh) : listing.title;

  const escrow = escrowOf(request);
  const method = pickupMethodOf(request);
  const showEscrow = request.status === "accepted" || request.status === "completed" || escrow === "refunded";

  const hasAcceptedOther = allRequests.some(
    (r) => r.id !== request.id && r.status === "accepted"
  );

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate(`/my-listings/${listingId}/requests`)} className="text-[#6B7280]">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-[#1F2937]" style={{ fontWeight: 600 }}>
          {isZh ? zh("租用請求詳情") : "Rental Request"}
        </h2>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={load} className="text-xs text-brand ml-3 shrink-0">
            {isZh ? zh("重試") : "Try again"}
          </button>
        </div>
      )}

      {/* ── Section 1: Item ── */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-3 flex gap-3 mb-4">
        <ImageWithFallback
          src={listing.image_url ?? IMAGES.kettle}
          alt=""
          className="w-16 h-16 rounded-lg object-cover"
        />
        <div className="flex-1">
          <p className="text-xs text-[#6B7280] mb-0.5">{isZh ? zh("租用物品") : "Item requested"}</p>
          <p className="text-sm" style={{ fontWeight: 500 }}>{listingTitle}</p>
          <p className="text-xs text-brand" style={{ fontWeight: 500 }}>HK${listing.price_per_day}{t("perDay")}</p>
        </div>
      </div>

      {/* ── Section 2: Renter ── */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 mb-4">
        <p className="text-xs text-[#6B7280] mb-3">{isZh ? zh("租客資料") : "Renter information"}</p>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-brand flex items-center justify-center text-white" style={{ fontWeight: 600, fontSize: 16 }}>
            {name[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1">
            <p className="text-sm" style={{ fontWeight: 500 }}>{name}</p>
            {request.profiles?.email && (
              <a
                href={`mailto:${request.profiles.email}`}
                className="text-xs text-brand underline"
                onClick={(e) => e.stopPropagation()}
              >
                {request.profiles.email}
              </a>
            )}
          </div>
          <div className="flex items-center gap-1">
            <Shield size={12} className="text-[#22C55E]" />
            <span className="text-xs text-[#22C55E]">{t("verified")}</span>
          </div>
        </div>

        {request.status === "accepted" && request.profiles?.phone && (
          <div className="mt-3 pt-3 border-t border-[#E5E7EB]">
            <p className="text-xs text-[#6B7280] mb-1">{isZh ? zh("聯絡電話") : "Phone"}</p>
            <a href={`tel:${request.profiles.phone}`} className="text-sm text-brand" style={{ fontWeight: 500 }}>
              {request.profiles.phone}
            </a>
          </div>
        )}
      </div>

      {/* ── Section 3: Rental details ── */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 mb-4 space-y-3">
        <p className="text-xs text-[#6B7280]">{t("rentalPeriod")}</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-[#9CA3AF]">{t("startDate")}</p>
            <p className="text-sm text-[#1F2937]">{fmtFull(request.start_date)}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#9CA3AF]">{t("endDate")}</p>
            <p className="text-sm text-[#1F2937]">{fmtFull(request.end_date)}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#9CA3AF]">{isZh ? zh("租用天數") : "Duration"}</p>
            <p className="text-sm text-[#1F2937]">{days} {isZh ? zh("天") : "days"}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#9CA3AF]">{isZh ? zh("取件方式") : "Pickup"}</p>
            <p className="text-sm text-[#1F2937]">
              {t(PICKUP_LABEL_KEY[method])}
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-[#E5E7EB] space-y-1.5">
          {lines && lines.months > 0 && (
            <div className="flex justify-between items-center text-xs text-[#6B7280]">
              <span>{lines.months} {isZh ? zh("個月") : `month${lines.months > 1 ? "s" : ""}`} × HK${lines.priceMonth}</span>
              <span>HK${lines.months * (lines.priceMonth ?? 0)}</span>
            </div>
          )}
          {lines && lines.weeks > 0 && (
            <div className="flex justify-between items-center text-xs text-[#6B7280]">
              <span>{lines.weeks} {isZh ? zh("週") : `week${lines.weeks > 1 ? "s" : ""}`} × HK${lines.priceWeek}</span>
              <span>HK${lines.weeks * (lines.priceWeek ?? 0)}</span>
            </div>
          )}
          {lines && lines.days > 0 && (
            <div className="flex justify-between items-center text-xs text-[#6B7280]">
              <span>{lines.days} {isZh ? zh("天") : `day${lines.days > 1 ? "s" : ""}`} × HK${lines.priceDay}</span>
              <span>HK${lines.days * lines.priceDay}</span>
            </div>
          )}
          <div className="flex justify-between items-center pt-1">
            <p className="text-xs text-[#1F2937]" style={{ fontWeight: 600 }}>{t("rentalTotal")}</p>
            <p className="text-brand" style={{ fontWeight: 600, fontSize: 16 }}>HK${total}</p>
          </div>
          {deposit > 0 && (
            <div className="flex justify-between items-center text-xs text-[#6B7280]">
              <span>{t("deposit")}</span>
              <span>HK${deposit}</span>
            </div>
          )}
        </div>

        {request.message && (
          <div className="pt-2 border-t border-[#E5E7EB]">
            <p className="text-xs text-[#6B7280] mb-2">{t("rentersMessage")}</p>
            <div className="bg-[#F9FAFB] border-l-2 border-brand pl-3 py-2 rounded-r-lg">
              <p className="text-sm text-[#4B5563] italic">"{request.message}"</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Payout, escrow, locker and handovers ── */}
      {(request.status === "accepted" || request.status === "completed") && (
        <PayoutBreakdown rentalPrice={total} completedRentals={profile.lenderCompleted} />
      )}
      {showEscrow && <EscrowTracker request={request} />}
      {showEscrow && method === "locker" && escrow !== "refunded" && (
        <LockerCodeCard lockerId={request.locker_id ?? null} code={request.locker_code ?? null} paid={escrow !== "unpaid"} />
      )}
      {request.status === "accepted" && (
        <HandoverPanel
          request={request}
          role="lender"
          onUpdated={(row) => (row.status === "completed" ? load() : setRequest((prev) => prev ? { ...row, profiles: prev.profiles } : prev))}
        />
      )}

      {/* ── Section 4: Actions ── */}
      {request.status === "completed" && (
        <div className="bg-brand/10 border border-brand/30 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-brand shrink-0" />
          <p className="text-sm text-brand" style={{ fontWeight: 500 }}>
            {t("rentalCompleted")}
          </p>
        </div>
      )}

      {request.status === "accepted" && (
        <>
          <div className="bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-xl px-4 py-3 flex items-center gap-3 mb-3">
            <CheckCircle size={20} className="text-[#22C55E] shrink-0" />
            <p className="text-sm text-[#15803D]" style={{ fontWeight: 500 }}>
              {t("requestAccepted")}
            </p>
          </div>

          {/* Paid rentals complete through the return handover; this is for rentals settled outside Lendy */}
          {escrow !== "unpaid" ? null : !showCompleteConfirm ? (
            <>
            <p className="text-[11px] text-[#9CA3AF] mb-2">{t("mockMarkComplete")}</p>
            <button
              onClick={() => setShowCompleteConfirm(true)}
              disabled={completing}
              className="w-full py-3 bg-brand text-white rounded-xl text-sm hover:bg-brand-hover transition-colors disabled:opacity-60 mb-3"
            >
              {t("markCompleted")}
            </button>
            </>
          ) : (
            <div className="bg-brand/5 border border-brand/20 rounded-xl px-4 py-3 mb-3 space-y-3">
              <p className="text-sm text-[#1F2937]">{t("markCompletedConfirm")}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCompleteConfirm(false)}
                  className="flex-1 py-2 border border-[#E5E7EB] text-[#6B7280] rounded-xl text-sm"
                >
                  {isZh ? zh("取消") : "Cancel"}
                </button>
                <button
                  onClick={handleComplete}
                  disabled={completing}
                  className="flex-1 py-2 bg-brand text-white rounded-xl text-sm disabled:opacity-60"
                >
                  {completing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </span>
                  ) : isZh ? zh("確認完成") : "Confirm"}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {request.status === "rejected" && (
        <div className="bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl px-4 py-3 mb-4">
          <p className="text-sm text-[#6B7280]">
            {isZh ? zh("你已拒絕此請求") : "You declined this request"}
          </p>
        </div>
      )}

      {request.status === "pending" && hasAcceptedOther && (
        <div className="bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl px-4 py-3 mb-4">
          <p className="text-sm text-[#6B7280]">{t("alreadyAccepted")}</p>
          <button
            onClick={() => navigate(`/my-listings/${listingId}/requests`)}
            className="text-xs text-brand mt-2"
          >
            ← {isZh ? zh("返回請求列表") : "Back to requests"}
          </button>
        </div>
      )}

      {(request.status === "pending" || request.status === "accepted") && (
        <button
          onClick={() => navigate(`/chat/${requestId}`)}
          className="w-full py-3 border border-brand text-brand rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-brand/5 transition-colors mb-3"
        >
          <MessageCircle size={16} />
          {t("messageRenter")}
        </button>
      )}

      {request.status === "pending" && !hasAcceptedOther && (
        <div className="space-y-3">
          <button
            onClick={() => setShowConfirm(true)}
            disabled={acting}
            className="w-full py-3 bg-brand text-white rounded-xl hover:bg-brand-hover transition-colors disabled:opacity-60"
          >
            {acting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isZh ? zh("處理中...") : "Processing..."}
              </span>
            ) : t("acceptRequest")}
          </button>
          <button
            onClick={handleDecline}
            disabled={acting}
            className="w-full py-3 border border-[#EF4444] text-[#EF4444] rounded-xl hover:bg-red-50 transition-colors disabled:opacity-60"
          >
            {t("decline")}
          </button>
        </div>
      )}

      {/* ── Review section (completed only) ── */}
      {request.status === "completed" && reviewChecked && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 mt-4">
          {existingReview || reviewDone ? (
            <div>
              <p className="text-sm text-brand" style={{ fontWeight: 500 }}>
                {t("reviewSubmitted")}
              </p>
              {(existingReview?.comment || reviewComment) && (
                <p className="text-xs text-[#6B7280] mt-1 italic">
                  "{existingReview?.comment || reviewComment}"
                </p>
              )}
            </div>
          ) : (
            <div>
              <p className="text-sm text-[#1F2937] mb-3" style={{ fontWeight: 500 }}>
                {t("reviewRenter")}
              </p>
              <StarSelector value={reviewRating} onChange={setReviewRating} />
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={isZh ? zh("這位租客怎麼樣？") : "How was this renter?"}
                rows={3}
                className="w-full mt-3 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-sm resize-none focus:outline-none focus:border-brand"
              />
              <button
                onClick={handleSubmitReview}
                disabled={!reviewRating || submittingReview}
                className="w-full mt-3 py-2.5 bg-brand text-white rounded-xl text-sm disabled:opacity-40"
              >
                {submittingReview ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {isZh ? zh("提交中...") : "Submitting..."}
                  </span>
                ) : isZh ? zh("提交評價") : "Submit Review"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Accept confirmation modal ── */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 z-[60] flex items-end md:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[#1F2937]" style={{ fontWeight: 600, fontSize: 16 }}>
                {isZh ? zh("確認接受請求") : "Confirm Accept"}
              </p>
              <button onClick={() => setShowConfirm(false)} className="text-[#6B7280]">
                <X size={18} />
              </button>
            </div>
            <p className="text-sm text-[#6B7280]">{t("acceptConfirm")}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 border border-[#E5E7EB] text-[#6B7280] rounded-xl text-sm"
              >
                {isZh ? zh("取消") : "Cancel"}
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 py-2.5 bg-brand text-white rounded-xl text-sm hover:bg-brand-hover transition-colors"
              >
                {t("acceptRequest")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
