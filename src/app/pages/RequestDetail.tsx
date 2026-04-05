import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Shield, CheckCircle, X, Star } from "lucide-react";
import { useI18n } from "../components/i18n";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { supabase } from "../../lib/supabase";
import { sendEmail } from "../../lib/sendEmail";
import { IMAGES } from "../components/data";

type Listing = {
  id: string;
  title: string;
  title_zh: string | null;
  image_url: string | null;
  price_per_day: number;
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
  profiles: RenterProfile | null;
};

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
  const { t, lang } = useI18n();

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
      if (!user) { navigate("/login"); return; }
      setCurrentUserId(user.id);

      const { data: listingData, error: listingErr } = await supabase
        .from("listings")
        .select("id, title, title_zh, image_url, price_per_day")
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
        .single();

      if (reqErr || !reqData) {
        setError(lang === "zh" ? "找不到該請求" : "Request not found.");
        setLoading(false);
        return;
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, name, email, phone")
        .eq("id", reqData.renter_id)
        .single();

      setRequest({ ...reqData, profiles: profileData ?? null } as Request);

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
      setError(lang === "zh" ? "載入請求時出錯" : "Failed to load request.");
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
      setError(lang === "zh" ? "接受請求時出錯，請重試" : "Failed to accept request. Please try again.");
      setActing(false);
      return;
    }

    await supabase
      .from("requests")
      .update({ status: "rejected" })
      .eq("listing_id", listingId)
      .eq("status", "pending")
      .neq("id", request.id);

    setRequest((prev) => prev ? { ...prev, status: "accepted" } : prev);
    setActing(false);

    // Email renter
    const renterEmail = request.profiles?.email;
    const listingTitle = lang === "zh" && listing.title_zh ? listing.title_zh : listing.title;
    if (renterEmail) {
      await sendEmail(
        renterEmail,
        "Your rental request was accepted!",
        `Great news! Your request to rent <strong>${listingTitle}</strong> has been accepted. Contact the owner to arrange pickup. View your request: <a href="https://ren-trend.vercel.app/activity?tab=requests">https://ren-trend.vercel.app/activity?tab=requests</a>`
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
      setError(lang === "zh" ? "拒絕請求時出錯，請重試" : "Failed to decline request. Please try again.");
      setActing(false);
      return;
    }

    setRequest((prev) => prev ? { ...prev, status: "rejected" } : prev);
    setActing(false);

    // Email renter
    const renterEmail = request.profiles?.email;
    const listingTitle = lang === "zh" && listing.title_zh ? listing.title_zh : listing.title;
    if (renterEmail) {
      await sendEmail(
        renterEmail,
        "Update on your rental request",
        `Unfortunately, your request to rent <strong>${listingTitle}</strong> was not accepted this time. Browse other available items: <a href="https://ren-trend.vercel.app/browse">https://ren-trend.vercel.app/browse</a>`
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
      setError(lang === "zh" ? "標記完成時出錯" : "Failed to mark as completed.");
      setCompleting(false);
      return;
    }

    // Update local state immediately
    setRequest((prev) => prev ? { ...prev, status: "completed", completed_at: new Date().toISOString() } as Request & { completed_at: string } : prev);

    const listingTitle = lang === "zh" && listing.title_zh ? listing.title_zh : listing.title;

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
        `Your rental of <strong>${listingTitle}</strong> is complete. Please leave a review! View: <a href="https://ren-trend.vercel.app/my-requests/${request.id}">https://ren-trend.vercel.app/my-requests/${request.id}</a>`
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
        <div className="w-8 h-8 border-2 border-[#1E6B1E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!listing || !request) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-8 text-center">
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-xl mb-3">
          {error || (lang === "zh" ? "找不到請求" : "Request not found.")}
        </p>
        <button onClick={load} className="text-sm text-[#1E6B1E] mb-2 block">
          {lang === "zh" ? "重試" : "Try again"}
        </button>
        <button
          onClick={() => navigate(`/my-listings/${listingId}/requests`)}
          className="text-sm text-[#6B7280]"
        >
          ← {lang === "zh" ? "返回" : "Back"}
        </button>
      </div>
    );
  }

  const name = renterName(request);
  const days = daysBetween(request.start_date, request.end_date);
  const total = request.total_price ?? listing.price_per_day * days;
  const listingTitle = lang === "zh" && listing.title_zh ? listing.title_zh : listing.title;

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
          {lang === "zh" ? "租用請求詳情" : "Rental Request"}
        </h2>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={load} className="text-xs text-[#1E6B1E] ml-3 shrink-0">
            {lang === "zh" ? "重試" : "Try again"}
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
          <p className="text-xs text-[#6B7280] mb-0.5">{lang === "zh" ? "租用物品" : "Item requested"}</p>
          <p className="text-sm" style={{ fontWeight: 500 }}>{listingTitle}</p>
          <p className="text-xs text-[#1E6B1E]" style={{ fontWeight: 500 }}>HK${listing.price_per_day}/day</p>
        </div>
      </div>

      {/* ── Section 2: Renter ── */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 mb-4">
        <p className="text-xs text-[#6B7280] mb-3">{lang === "zh" ? "租客資料" : "Renter information"}</p>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-[#1E6B1E] flex items-center justify-center text-white" style={{ fontWeight: 600, fontSize: 16 }}>
            {name[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1">
            <p className="text-sm" style={{ fontWeight: 500 }}>{name}</p>
            {request.profiles?.email && (
              <a
                href={`mailto:${request.profiles.email}`}
                className="text-xs text-[#1E6B1E] underline"
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
            <p className="text-xs text-[#6B7280] mb-1">{lang === "zh" ? "聯絡電話" : "Phone"}</p>
            <a href={`tel:${request.profiles.phone}`} className="text-sm text-[#1E6B1E]" style={{ fontWeight: 500 }}>
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
            <p className="text-[10px] text-[#9CA3AF]">{lang === "zh" ? "租用天數" : "Duration"}</p>
            <p className="text-sm text-[#1F2937]">{days} {lang === "zh" ? "天" : "days"}</p>
          </div>
          <div>
            <p className="text-[10px] text-[#9CA3AF]">{lang === "zh" ? "取件方式" : "Pickup"}</p>
            <p className="text-sm text-[#1F2937]">
              {request.pickup_preference === "deliver"
                ? t("ownerDelivers")
                : t("renterCollects")}
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-[#E5E7EB]">
          <div className="flex justify-between items-center">
            <p className="text-xs text-[#6B7280]">
              HK${listing.price_per_day} × {days} {lang === "zh" ? "天" : "days"}
            </p>
            <p className="text-[#1E6B1E]" style={{ fontWeight: 600, fontSize: 16 }}>HK${total}</p>
          </div>
        </div>

        {request.message && (
          <div className="pt-2 border-t border-[#E5E7EB]">
            <p className="text-xs text-[#6B7280] mb-2">{t("rentersMessage")}</p>
            <div className="bg-[#F9FAFB] border-l-2 border-[#1E6B1E] pl-3 py-2 rounded-r-lg">
              <p className="text-sm text-[#4B5563] italic">"{request.message}"</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Section 4: Actions ── */}
      {request.status === "completed" && (
        <div className="bg-[#1E6B1E]/10 border border-[#1E6B1E]/30 rounded-xl px-4 py-3 mb-4 flex items-center gap-3">
          <CheckCircle size={20} className="text-[#1E6B1E] shrink-0" />
          <p className="text-sm text-[#1E6B1E]" style={{ fontWeight: 500 }}>
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

          {!showCompleteConfirm ? (
            <button
              onClick={() => setShowCompleteConfirm(true)}
              disabled={completing}
              className="w-full py-3 bg-[#1E6B1E] text-white rounded-xl text-sm hover:bg-[#155215] transition-colors disabled:opacity-60 mb-3"
            >
              {t("markCompleted")}
            </button>
          ) : (
            <div className="bg-[#1E6B1E]/5 border border-[#1E6B1E]/20 rounded-xl px-4 py-3 mb-3 space-y-3">
              <p className="text-sm text-[#1F2937]">{t("markCompletedConfirm")}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCompleteConfirm(false)}
                  className="flex-1 py-2 border border-[#E5E7EB] text-[#6B7280] rounded-xl text-sm"
                >
                  {lang === "zh" ? "取消" : "Cancel"}
                </button>
                <button
                  onClick={handleComplete}
                  disabled={completing}
                  className="flex-1 py-2 bg-[#1E6B1E] text-white rounded-xl text-sm disabled:opacity-60"
                >
                  {completing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    </span>
                  ) : lang === "zh" ? "確認完成" : "Confirm"}
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {request.status === "rejected" && (
        <div className="bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl px-4 py-3 mb-4">
          <p className="text-sm text-[#6B7280]">
            {lang === "zh" ? "你已拒絕此請求" : "You declined this request"}
          </p>
        </div>
      )}

      {request.status === "pending" && hasAcceptedOther && (
        <div className="bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl px-4 py-3 mb-4">
          <p className="text-sm text-[#6B7280]">{t("alreadyAccepted")}</p>
          <button
            onClick={() => navigate(`/my-listings/${listingId}/requests`)}
            className="text-xs text-[#1E6B1E] mt-2"
          >
            ← {lang === "zh" ? "返回請求列表" : "Back to requests"}
          </button>
        </div>
      )}

      {request.status === "pending" && !hasAcceptedOther && (
        <div className="space-y-3">
          <button
            onClick={() => setShowConfirm(true)}
            disabled={acting}
            className="w-full py-3 bg-[#1E6B1E] text-white rounded-xl hover:bg-[#155215] transition-colors disabled:opacity-60"
          >
            {acting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {lang === "zh" ? "處理中..." : "Processing..."}
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
              <p className="text-sm text-[#1E6B1E]" style={{ fontWeight: 500 }}>
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
                placeholder={lang === "zh" ? "這位租客怎麼樣？" : "How was this renter?"}
                rows={3}
                className="w-full mt-3 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-sm resize-none focus:outline-none focus:border-[#1E6B1E]"
              />
              <button
                onClick={handleSubmitReview}
                disabled={!reviewRating || submittingReview}
                className="w-full mt-3 py-2.5 bg-[#1E6B1E] text-white rounded-xl text-sm disabled:opacity-40"
              >
                {submittingReview ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {lang === "zh" ? "提交中..." : "Submitting..."}
                  </span>
                ) : lang === "zh" ? "提交評價" : "Submit Review"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Accept confirmation modal ── */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[#1F2937]" style={{ fontWeight: 600, fontSize: 16 }}>
                {lang === "zh" ? "確認接受請求" : "Confirm Accept"}
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
                {lang === "zh" ? "取消" : "Cancel"}
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 py-2.5 bg-[#1E6B1E] text-white rounded-xl text-sm hover:bg-[#155215] transition-colors"
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
