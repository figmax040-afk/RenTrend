import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Shield, CheckCircle, X } from "lucide-react";
import { useI18n } from "../components/i18n";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { supabase } from "../../lib/supabase";
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

export function RequestDetail() {
  const { listingId, requestId } = useParams<{ listingId: string; requestId: string }>();
  const navigate = useNavigate();
  const { t, lang } = useI18n();

  const [listing, setListing] = useState<Listing | null>(null);
  const [request, setRequest] = useState<Request | null>(null);
  const [allRequests, setAllRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    load();
  }, [requestId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }

    const { data: listingData, error: listingErr } = await supabase
      .from("listings")
      .select("id, title, title_zh, image_url, price_per_day")
      .eq("id", listingId)
      .eq("owner_id", user.id)
      .single();

    if (listingErr || !listingData) {
      navigate("/my-listings");
      return;
    }
    setListing(listingData);

    const { data: reqData, error: reqErr } = await supabase
      .from("requests")
      .select("*, profiles!renter_id(id, name, email, phone)")
      .eq("id", requestId)
      .single();

    if (reqErr || !reqData) {
      setError(lang === "zh" ? "找不到該請求" : "Request not found.");
      setLoading(false);
      return;
    }
    setRequest(reqData as Request);

    // Fetch all requests for this listing to enforce one-acceptance rule
    const { data: allReqData } = await supabase
      .from("requests")
      .select("id, status")
      .eq("listing_id", listingId);
    setAllRequests((allReqData ?? []) as Request[]);

    setLoading(false);
  }

  async function handleAccept() {
    if (!request || !listingId) return;
    setActing(true);
    setShowConfirm(false);

    // Accept this request
    const { error: acceptErr } = await supabase
      .from("requests")
      .update({ status: "accepted" })
      .eq("id", request.id);

    if (acceptErr) {
      setError(lang === "zh" ? "接受請求時出錯，請重試" : "Failed to accept request. Please try again.");
      setActing(false);
      return;
    }

    // Reject all other pending requests for this listing
    await supabase
      .from("requests")
      .update({ status: "rejected" })
      .eq("listing_id", listingId)
      .eq("status", "pending")
      .neq("id", request.id);

    setRequest((prev) => prev ? { ...prev, status: "accepted" } : prev);
    setActing(false);
  }

  async function handleDecline() {
    if (!request) return;
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
        <p className="text-[#6B7280] text-sm">{error || (lang === "zh" ? "找不到請求" : "Request not found.")}</p>
        <button onClick={() => navigate(`/my-listings/${listingId}/requests`)} className="mt-4 text-[#1E6B1E] text-sm">
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
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
          {error}
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

        {/* Show phone prominently when accepted */}
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
      {request.status === "accepted" && (
        <div className="bg-[#22C55E]/10 border border-[#22C55E]/30 rounded-xl px-4 py-3 flex items-center gap-3">
          <CheckCircle size={20} className="text-[#22C55E] shrink-0" />
          <p className="text-sm text-[#15803D]" style={{ fontWeight: 500 }}>
            {t("requestAccepted")}
          </p>
        </div>
      )}

      {request.status === "rejected" && (
        <div className="bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl px-4 py-3">
          <p className="text-sm text-[#6B7280]">
            {lang === "zh" ? "你已拒絕此請求" : "You declined this request"}
          </p>
        </div>
      )}

      {request.status === "pending" && hasAcceptedOther && (
        <div className="bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl px-4 py-3">
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
