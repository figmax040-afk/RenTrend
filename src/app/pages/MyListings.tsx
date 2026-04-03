import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useI18n } from "../components/i18n";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { PlusCircle, MoreVertical, Bell } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/useAuth";
import { IMAGES } from "../components/data";

type DbListing = {
  id: string;
  title: string;
  title_zh: string | null;
  image_url: string | null;
  price_per_day: number;
  is_active: boolean;
};

const mockIncoming = [
  { id: 1, renter: "Sarah K.", university: "HKU", universityZh: "香港大學", message: "I'm arriving next week and need a kettle!", dates: "Apr 5 – Apr 19", listingId: 1 },
  { id: 2, renter: "Mark T.", university: "CUHK", universityZh: "中文大學", message: "Can I rent for 2 weeks?", dates: "Apr 8 – Apr 22", listingId: 1 },
];

export function MyListings() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [myListings, setMyListings] = useState<DbListing[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [showIncoming, setShowIncoming] = useState(false);
  const [accepted, setAccepted] = useState<number[]>([]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }

    supabase
      .from("listings")
      .select("id, title, title_zh, image_url, price_per_day, is_active")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setMyListings(data ?? []);
        setDataLoading(false);
      });
  }, [authLoading, user, navigate]);

  if (authLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-[#1E6B1E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (showIncoming) {
    return (
      <div className="max-w-lg mx-auto px-4 pt-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => setShowIncoming(false)} className="text-[#6B7280]">←</button>
          <h2 className="text-[#1F2937]">{t("incomingRequests")}</h2>
        </div>
        <div className="space-y-3">
          {mockIncoming.map((r) => (
            <div key={r.id} className="bg-white rounded-xl border border-[#E5E7EB] p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-[#1E6B1E] flex items-center justify-center text-white text-xs">{r.renter[0]}</div>
                <div>
                  <p className="text-sm" style={{ fontWeight: 500 }}>{r.renter}</p>
                  <p className="text-[10px] text-[#22C55E]">{t("verified")} · {lang === "zh" ? r.universityZh : r.university}</p>
                </div>
              </div>
              <p className="text-sm text-[#6B7280] mb-2">"{r.message}"</p>
              <p className="text-xs text-[#6B7280] mb-3">{r.dates}</p>
              {accepted.includes(r.id) ? (
                <div className="text-sm text-[#22C55E] bg-[#22C55E]/10 p-2 rounded-lg">
                  {t("accepted")} — {r.renter.toLowerCase().replace(" ", "")}@connect.hku.hk
                </div>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setAccepted([...accepted, r.id])} className="flex-1 py-2 bg-[#22C55E] text-white rounded-xl text-sm">{t("accept")}</button>
                  <button className="flex-1 py-2 border border-[#EF4444] text-[#EF4444] rounded-xl text-sm">{t("decline")}</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[#1F2937]">{t("myListings")}</h2>
        <button onClick={() => navigate("/create")} className="flex items-center gap-1 px-3 py-1.5 bg-[#1E6B1E] text-white rounded-lg text-sm">
          <PlusCircle size={14} />{t("createListing")}
        </button>
      </div>

      {myListings.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[#6B7280] text-sm mb-4">
            {lang === "zh" ? "你還沒有刊登物品" : "You haven't listed anything yet"}
          </p>
          <button
            onClick={() => navigate("/create")}
            className="px-6 py-2.5 bg-[#1E6B1E] text-white rounded-xl text-sm"
          >
            {lang === "zh" ? "建立你的第一個刊登" : "Create your first listing"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {myListings.map((listing) => (
            <div key={listing.id} className="bg-white rounded-xl border border-[#E5E7EB] p-3 flex gap-3">
              <div className="relative">
                <ImageWithFallback
                  src={listing.image_url ?? IMAGES.kettle}
                  alt=""
                  className="w-20 h-20 rounded-lg object-cover"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm" style={{ fontWeight: 500 }}>
                    {lang === "zh" && listing.title_zh ? listing.title_zh : listing.title}
                  </p>
                  <button className="text-[#6B7280]"><MoreVertical size={14} /></button>
                </div>
                <p className="text-xs text-[#1E6B1E]" style={{ fontWeight: 500 }}>HK${listing.price_per_day}/day</p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: listing.is_active ? "#22C55E15" : "#6B728015",
                      color: listing.is_active ? "#22C55E" : "#6B7280",
                    }}
                  >
                    {t(listing.is_active ? "active" : "unavailable")}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
