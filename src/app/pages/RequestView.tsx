import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Shield, Star } from "lucide-react";
import { useI18n } from "../components/i18n";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { supabase } from "../../lib/supabase";

const FALLBACK_IMAGE = "https://placehold.co/400x300?text=RenTrend";

type OwnerProfile = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
};

type ListingData = {
  id: string;
  title: string;
  image_url: string | null;
  price_per_day: number;
  price_weekly: number | null;
  price_monthly: number | null;
  deposit: number | null;
  district: string | null;
  owner_id: string;
};

type RequestData = {
  id: string;
  renter_id: string;
  listing_id: string;
  start_date: string;
  end_date: string;
  message: string | null;
  status: string;
  pickup_preference: string | null;
  total_price: number | null;
};

function fmtFull(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysBetween(start: string, end: string) {
  return Math.max(
    1,
    Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000)
  );
}

function ownerDisplayName(profile: OwnerProfile | null): string {
  if (profile?.name) return profile.name;
  if (profile?.email) return profile.email.split("@")[0];
  return "Owner";
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

export function RequestView() {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  const { t, lang } = useI18n();

  const [request, setRequest] = useState<RequestData | null>(null);
  const [listing, setListing] = useState<ListingData | null>(null);
  const [ownerProfile, setOwnerProfile] = useState<OwnerProfile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

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

      // Step 1: fetch request
      const { data: req, error: reqErr } = await supabase
        .from("requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (reqErr || !req) {
        setError(lang === "zh" ? "找不到該請求" : "Request not found.");
        setLoading(false);
        return;
      }

      if (req.renter_id !== user.id) {
        navigate("/activity?tab=requests");
        return;
      }

      setRequest(req as RequestData);

      // Step 2: fetch listing
      const { data: listingData } = await supabase
        .from("listings")
        .select("id, title, image_url, price_per_day, price_weekly, price_monthly, deposit, district, owner_id")
        .eq("id", req.listing_id)
        .single();

      setListing(listingData ?? null);

      // Step 3: fetch owner profile
      if (listingData?.owner_id) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("id, name, email, phone")
          .eq("id", listingData.owner_id)
          .single();
        setOwnerProfile(profileData ?? null);
      }

      // Step 4: check existing review if completed
      if (req.status === "completed") {
        const { data: rev } = await supabase
          .from("reviews")
          .select("rating, comment")
          .eq("request_id", req.id)
          .eq("reviewer_id", user.id)
          .maybeSingle();
        setExistingReview(rev ?? null);
        setReviewChecked(true);
      }
    } catch (err: any) {
      console.error("RequestView fetch error:", err);
      setError(lang === "zh" ? "載入請求時出錯" : "Failed to load request.");
    } finally {
      setLoading(false);
    }
  }, [requestId, navigate, lang]);

  useEffect(() => { load(); }, [load]);

  async function handleCancel() {
    if (!request) return;
    setCancelling(true);
    const { error: cancelErr } = await supabase
      .from("requests")
      .update({ status: "cancelled" })
      .eq("id", request.id);

    if (cancelErr) {
      setError(
        lang === "zh"
          ? "取消請求時出錯，請重試"
          : "Failed to cancel request. Please try again."
      );
      setCancelling(false);
      setShowCancelConfirm(false);
      return;
    }

    navigate("/activity?tab=requests");
  }

  async function handleSubmitReview() {
    if (!listing || !reviewRating || !currentUserId) return;
    setSubmittingReview(true);

    await supabase.from("reviews").insert({
      request_id: requestId,
      listing_id: listing.id,
      reviewer_id: currentUserId,
      reviewee_id: listing.owner_id,
      role: "renter",
      rating: reviewRating,
      comment: reviewComment || null,
    });

    // Update lister's rating on their profile
    const { data: allRevs } = await supabase
      .from("reviews")
      .select("rating")
      .eq("reviewee_id", listing.owner_id)
      .eq("role", "renter");

    if (allRevs && allRevs.length > 0) {
      const avg = Math.round(allRevs.reduce((s, r) => s + r.rating, 0) / allRevs.length * 10) / 10;
      await supabase.from("profiles").update({
        rating_as_lister: avg,
        review_count_as_lister: allRevs.length,
      }).eq("id", listing.owner_id);
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

  if (!request || !listing) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-8 text-center">
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 px-4 py-3 rounded-xl mb-3">
          {error || (lang === "zh" ? "找不到請求" : "Request not found.")}
        </p>
        <button onClick={load} className="text-sm text-[#1E6B1E] mb-2 block">
          {lang === "zh" ? "重試" : "Try again"}
        </button>
        <button onClick={() => navigate("/activity?tab=requests")} className="text-sm text-[#6B7280]">
          ← {lang === "zh" ? "返回" : "Back"}
        </button>
      </div>
    );
  }

  const ownerName = ownerDisplayName(ownerProfile);
  const days = daysBetween(request.start_date, request.end_date);
  const dailyTotal = listing.price_per_day * days;
  const deposit = listing.deposit ?? 0;
  const total = request.total_price ?? dailyTotal + deposit;

  return (
    <div className="max-w-lg mx-auto px-4 pt-4 pb-10">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate("/activity?tab=requests")} className="text-[#6B7280]">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-[#1F2937]" style={{ fontWeight: 600 }}>
          {t("myRequestDetail")}
        </h2>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      {/* ── Section 1: Item requested ── */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden mb-4">
        <ImageWithFallback
          src={listing.image_url ?? FALLBACK_IMAGE}
          alt=""
          className="w-full h-40 object-cover rounded-xl"
        />
        <div className="p-3">
          <p className="text-[#1B3D1B] mb-0.5" style={{ fontWeight: 600, fontSize: 16 }}>
            {listing.title}
          </p>
          <p className="text-sm text-[#1E6B1E]" style={{ fontWeight: 500 }}>
            HK${listing.price_per_day}/day
          </p>
          {listing.district && (
            <p className="text-xs text-[#6B7280] mt-0.5">{listing.district}</p>
          )}
        </div>
      </div>

      {/* ── Section 2: Status banner ── */}
      {request.status === "pending" && (
        <div
          className="rounded-xl px-4 py-3 mb-4"
          style={{ backgroundColor: "#F4A26119", border: "1px solid #F4A26140" }}
        >
          <p className="text-sm" style={{ color: "#B45309", fontWeight: 500 }}>
            {t("awaitingResponse")}
          </p>
          <p className="text-xs mt-0.5" style={{ color: "#92400E" }}>
            {lang === "zh"
              ? "你將在物主回覆後收到通知。"
              : "You'll be notified when they reply."}
          </p>
        </div>
      )}

      {request.status === "accepted" && (
        <div
          className="rounded-xl px-4 py-3 mb-4"
          style={{ backgroundColor: "#22C55E19", border: "1px solid #22C55E40" }}
        >
          <p className="text-sm" style={{ color: "#15803D", fontWeight: 500 }}>
            {lang === "zh" ? "你的請求已被接受！" : "Your request was accepted!"}
          </p>
        </div>
      )}

      {request.status === "completed" && (
        <div
          className="rounded-xl px-4 py-3 mb-4"
          style={{ backgroundColor: "#1E6B1E19", border: "1px solid #1E6B1E40" }}
        >
          <p className="text-sm" style={{ color: "#1E6B1E", fontWeight: 500 }}>
            {t("rentalCompleted")}
          </p>
        </div>
      )}

      {(request.status === "rejected" || request.status === "cancelled") && (
        <div
          className="rounded-xl px-4 py-3 mb-4"
          style={{ backgroundColor: "#EF444419", border: "1px solid #EF444440" }}
        >
          <p className="text-sm" style={{ color: "#B91C1C", fontWeight: 500 }}>
            {request.status === "cancelled"
              ? lang === "zh" ? "你已取消此請求。" : "You cancelled this request."
              : t("requestDeclined")}
          </p>
        </div>
      )}

      {/* ── Section 3: Rental details ── */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 mb-4 space-y-3">
        <p className="text-xs text-[#6B7280]" style={{ fontWeight: 600 }}>
          {lang === "zh" ? "你的租用詳情" : "Your rental details"}
        </p>

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
            <p className="text-[10px] text-[#9CA3AF]">
              {lang === "zh" ? "租用天數" : "Duration"}
            </p>
            <p className="text-sm text-[#1F2937]">
              {days} {lang === "zh" ? "天" : "days"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-[#9CA3AF]">{t("pickupPref")}</p>
            <p className="text-sm text-[#1F2937]">
              {request.pickup_preference === "deliver"
                ? t("ownerDelivers")
                : t("iCanCollect")}
            </p>
          </div>
        </div>

        {request.message && (
          <div className="pt-2 border-t border-[#E5E7EB]">
            <p className="text-xs text-[#6B7280] mb-2">
              {lang === "zh" ? "你的留言" : "Your message"}
            </p>
            <div className="bg-[#F9FAFB] border-l-2 border-[#1E6B1E] pl-3 py-2 rounded-r-lg">
              <p className="text-sm text-[#4B5563] italic">"{request.message}"</p>
            </div>
          </div>
        )}

        {/* Price breakdown */}
        <div className="pt-2 border-t border-[#E5E7EB] space-y-1.5">
          <div className="flex justify-between items-center">
            <p className="text-xs text-[#6B7280]">
              HK${listing.price_per_day} × {days} {lang === "zh" ? "天" : "days"}
            </p>
            <p className="text-sm text-[#1F2937]">HK${dailyTotal}</p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-[#6B7280]">{t("deposit")}</p>
            <p className="text-sm text-[#1F2937]">HK${deposit}</p>
          </div>
          <div className="flex justify-between items-center pt-1 border-t border-[#E5E7EB]">
            <p className="text-sm text-[#1F2937]" style={{ fontWeight: 600 }}>{t("total")}</p>
            <p className="text-[#1E6B1E]" style={{ fontWeight: 700, fontSize: 16 }}>
              HK${total}
            </p>
          </div>
        </div>
      </div>

      {/* ── Section 4: Owner information ── */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 mb-4">
        <p className="text-xs text-[#6B7280] mb-3">
          {lang === "zh" ? "物主資料" : "Owner information"}
        </p>
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-full bg-[#1E6B1E] flex items-center justify-center text-white shrink-0"
            style={{ fontWeight: 600, fontSize: 16 }}
          >
            {ownerName[0]?.toUpperCase() ?? "O"}
          </div>
          <div className="flex-1">
            <p className="text-sm" style={{ fontWeight: 500 }}>{ownerName}</p>
          </div>
          <div className="flex items-center gap-1">
            <Shield size={12} className="text-[#22C55E]" />
            <span className="text-xs text-[#22C55E]">{t("verified")}</span>
          </div>
        </div>
      </div>

      {/* ── Section 5: Contact info (accepted only) ── */}
      {request.status === "accepted" && (
        <div
          className="rounded-xl px-4 py-3 mb-4"
          style={{ backgroundColor: "#1E6B1E0D", border: "1px solid #1E6B1E30" }}
        >
          <p className="text-sm text-[#1E6B1E] mb-2" style={{ fontWeight: 500 }}>
            {t("ownerAccepted")}
          </p>
          {ownerProfile?.email && (
            <a
              href={`mailto:${ownerProfile.email}`}
              className="block text-sm text-[#1E6B1E] underline mb-1"
            >
              {ownerProfile.email}
            </a>
          )}
          {ownerProfile?.phone && (
            <a
              href={`tel:${ownerProfile.phone}`}
              className="block text-sm text-[#1E6B1E] underline"
            >
              {ownerProfile.phone}
            </a>
          )}
        </div>
      )}

      {/* ── Section 6: Review (completed only) ── */}
      {request.status === "completed" && reviewChecked && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 mb-4">
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
                {t("leaveReview")}
              </p>
              <StarSelector value={reviewRating} onChange={setReviewRating} />
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder={lang === "zh" ? "你的租用體驗如何？" : "How was your experience?"}
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

      {/* ── Section 7: Cancel button (pending only) ── */}
      {request.status === "pending" && (
        <div>
          {!showCancelConfirm ? (
            <button
              onClick={() => setShowCancelConfirm(true)}
              className="w-full py-3 border border-[#EF4444] text-[#EF4444] rounded-xl text-sm hover:bg-red-50 transition-colors"
            >
              {t("cancelRequest")}
            </button>
          ) : (
            <div className="border border-[#EF4444] rounded-xl p-4 space-y-3">
              <p className="text-sm text-[#1F2937]">{t("cancelConfirm")}</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCancelConfirm(false)}
                  className="flex-1 py-2.5 border border-[#E5E7EB] text-[#6B7280] rounded-xl text-sm"
                >
                  {lang === "zh" ? "返回" : "Go back"}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 py-2.5 bg-[#EF4444] text-white rounded-xl text-sm hover:bg-red-600 transition-colors disabled:opacity-60"
                >
                  {cancelling ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {lang === "zh" ? "處理中..." : "Cancelling..."}
                    </span>
                  ) : (
                    t("cancelRequest")
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
