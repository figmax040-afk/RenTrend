import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Search, MapPin, ChefHat, Monitor, Sofa, Camera, Wind, MoreHorizontal } from "lucide-react";
import { useI18n } from "../components/i18n";
import { ListingCard } from "../components/ListingCard";
import { listings as mockListings, IMAGES } from "../components/data";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/useAuth";

const categories = [
  { key: "kitchen", icon: ChefHat },
  { key: "electronics", icon: Monitor },
  { key: "furniture", icon: Sofa },
  { key: "camera", icon: Camera },
  { key: "cooling", icon: Wind },
  { key: "other", icon: MoreHorizontal },
];

type UiListing = {
  id: string | number;
  image: string;
  title: string;
  titleZh: string;
  price: number;
  distance: string;
  distanceZh: string;
  category: string;
  categoryZh: string;
  available: boolean;
};

function dbToUi(l: Record<string, any>): UiListing {
  return {
    id: l.id,
    image: l.image_url ?? IMAGES.kettle,
    title: l.title,
    titleZh: l.title_zh ?? l.title,
    price: l.price_per_day,
    distance: l.district ?? "HK",
    distanceZh: l.district ?? "HK",
    category: l.category,
    categoryZh: l.category,
    available: l.is_active,
  };
}

export function Home() {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<UiListing[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }

    supabase
      .from("listings")
      .select("id, title, title_zh, image_url, price_per_day, district, category, is_active")
      .eq("is_active", true)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setListings(data.map(dbToUi));
        } else {
          setListings(mockListings.map((l) => ({
            id: l.id, image: l.image, title: l.title, titleZh: l.titleZh,
            price: l.price, distance: l.distance, distanceZh: l.distanceZh,
            category: l.category, categoryZh: l.categoryZh, available: l.available,
          })));
        }
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

  return (
    <div className="max-w-6xl mx-auto">
      {/* Search bar */}
      <div className="sticky top-0 z-40 bg-[#F9FAFB] px-4 pt-4 pb-2 md:hidden">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative" onClick={() => navigate("/browse")}>
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <div className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm text-[#6B7280] cursor-pointer">
              {t("searchPlaceholder")}
            </div>
          </div>
          <div className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-xs text-[#6B7280]">
            <MapPin size={12} />
            <span>HKU</span>
          </div>
        </div>
      </div>

      {/* Hero banner */}
      <div className="mx-4 mt-4 rounded-2xl overflow-hidden relative h-40 md:h-56">
        <ImageWithFallback src={IMAGES.campus} alt="Home electronics" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1E6B1E]/80 to-transparent flex items-center pl-6">
          <div>
            <h2 className="text-white mb-1" style={{ fontSize: 20 }}>{t("heroTitle")}</h2>
            <p className="text-white/80 text-sm">HKD · Hong Kong</p>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 mt-6">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => navigate(`/browse?category=${cat.key}`)}
              className="flex flex-col items-center gap-1.5 min-w-[64px] py-3 px-2 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#1E6B1E] transition-colors"
            >
              <cat.icon size={20} className="text-[#1E6B1E]" />
              <span className="text-[11px] text-[#6B7280] whitespace-nowrap">{t(cat.key)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Near you section */}
      <Section title={t("nearYou")} onSeeAll={() => navigate("/browse")}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {listings.slice(0, 4).map((l) => (
            <ListingCard
              key={String(l.id)} id={l.id} image={l.image}
              title={lang === "zh" ? l.titleZh : l.title}
              price={l.price}
              distance={lang === "zh" ? l.distanceZh : l.distance}
              category={lang === "zh" ? l.categoryZh : l.category}
              available={l.available}
            />
          ))}
        </div>
      </Section>

      {/* Recently Added */}
      <Section title={t("recentlyAdded")} onSeeAll={() => navigate("/browse")}>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {listings.slice(2, 6).map((l) => (
            <div key={String(l.id)} className="min-w-[160px] max-w-[180px]">
              <ListingCard
                id={l.id} image={l.image}
                title={lang === "zh" ? l.titleZh : l.title}
                price={l.price}
                distance={lang === "zh" ? l.distanceZh : l.distance}
                category={lang === "zh" ? l.categoryZh : l.category}
                available={l.available}
              />
            </div>
          ))}
        </div>
      </Section>

      {/* Last Minute */}
      <Section title={t("lastMinute")} onSeeAll={() => navigate("/browse")}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {listings.filter((l) => l.available).slice(0, 3).map((l) => (
            <ListingCard
              key={String(l.id)} id={l.id} image={l.image}
              title={lang === "zh" ? l.titleZh : l.title}
              price={l.price}
              distance={lang === "zh" ? l.distanceZh : l.distance}
              category={lang === "zh" ? l.categoryZh : l.category}
              available={l.available}
            />
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, onSeeAll, children }: { title: string; onSeeAll: () => void; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="px-4 mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[#1F2937]">{title}</h3>
        <button onClick={onSeeAll} className="text-sm text-[#1E6B1E]">{t("seeAll")}</button>
      </div>
      {children}
    </div>
  );
}
