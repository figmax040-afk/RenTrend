import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Heart } from "lucide-react";
import { useI18n } from "../components/i18n";
import { supabase } from "../../lib/supabase";
import listingPlaceholder from "../../assets/listing-placeholder.svg";
import { loginPath } from "../../lib/authRedirect";
import { ListingCard } from "../components/ListingCard";

type SavedItem = {
  id: string;
  listing_id: string;
  listings: {
    id: string;
    title: string;
    image_url: string | null;
    price_per_day: number;
    deposit: number | null;
    district: string | null;
    category: string;
    is_active: boolean;
    owner_id: string;
  };
};

export function SavedListings() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate(loginPath()); return; }

      const { data } = await supabase
        .from("saved_listings")
        .select("id, listing_id, listings!inner(id, title, image_url, price_per_day, deposit, district, category, is_active, owner_id)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      setItems((data as SavedItem[]) ?? []);
      setLoading(false);
    }
    load();
  }, [navigate]);

  async function handleUnsave(savedId: string) {
    await supabase.from("saved_listings").delete().eq("id", savedId);
    setItems((prev) => prev.filter((i) => i.id !== savedId));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-4 pb-10">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate("/browse")} className="text-[#6B7280]">
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-[#1F2937]">{t("savedListings")}</h2>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16">
          <Heart size={40} className="text-[#E5E7EB] mx-auto mb-3" />
          <p className="text-sm text-[#6B7280] mb-1">{t("noSavedItems")}</p>
          <p className="text-xs text-[#9CA3AF] mb-4">{t("browseToSave")}</p>
          <button
            onClick={() => navigate("/browse")}
            className="px-4 py-2 bg-brand text-white rounded-xl text-sm"
          >
            {t("browse")}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <div key={item.id} className="relative">
              <ListingCard
                id={item.listings.id}
                image={item.listings.image_url ?? listingPlaceholder}
                title={lang === "zh" ? item.listings.title : item.listings.title}
                price={item.listings.price_per_day}
                distance={item.listings.district ?? "HK"}
                category={item.listings.category}
                available={item.listings.is_active}
              />
              <button
                onClick={(e) => { e.stopPropagation(); handleUnsave(item.id); }}
                className="absolute top-2 right-2 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center shadow"
              >
                <Heart size={14} className="fill-red-500 text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
