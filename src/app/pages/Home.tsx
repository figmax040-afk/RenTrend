import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Search, ChefHat, Monitor, Sofa, Wind, MoreHorizontal, Package } from "lucide-react";
import { useI18n } from "../components/i18n";
import { ListingCard } from "../components/ListingCard";
import { BANNERS } from "../components/data";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { supabase } from "../../lib/supabase";
import listingPlaceholder from "../../assets/listing-placeholder.svg";
import { useAuth } from "../../lib/useAuth";
import { fetchListingExtras, listingIsFeatured, type ListingExtras } from "../../lib/listingExtras";
import { featuredFirst } from "../../demo/demo";
import { HomeAdBanner } from "../components/Ads";

const categories = [
  { key: "kitchen", icon: ChefHat },
  { key: "electronics", icon: Monitor },
  { key: "furniture", icon: Sofa },
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
  owner_id: string | null;
  featured: boolean;
};

function dbToUi(l: Record<string, any>): UiListing {
  return {
    id: l.id,
    image: l.image_url ?? listingPlaceholder,
    title: l.title,
    titleZh: l.title_zh ?? l.title,
    price: l.price_per_day,
    distance: l.district ?? "HK",
    distanceZh: l.district ?? "HK",
    category: l.category,
    categoryZh: l.category,
    available: l.is_active,
    owner_id: l.owner_id ?? null,
    featured: listingIsFeatured(l),
  };
}

export function Home() {
  const navigate = useNavigate();
  const { t, isZh, zh } = useI18n();
  const { user, loading: authLoading } = useAuth();
  const [listings, setListings] = useState<UiListing[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [extras, setExtras] = useState<ListingExtras>({ ratings: {}, powerOwners: new Set() });

  useEffect(() => {
    if (authLoading) return;

    supabase
      .from("listings")
      .select("*")
      .eq("is_active", true)
      .eq("approval_status", "approved")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("Home fetch error:", error);
        }

        const ui = featuredFirst((data ?? []).map(dbToUi));
        setListings(ui);
        setDataLoading(false);
        fetchListingExtras(ui).then(setExtras).catch((err) => console.error("Listing extras failed:", err));
      });
  }, [authLoading, user, navigate]);

  const cardExtras = (l: UiListing) => ({
    rating: extras.ratings[String(l.id)] ?? null,
    featured: l.featured,
    powerLender: !!l.owner_id && extras.powerOwners.has(l.owner_id),
  });

  if (authLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
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
        </div>
      </div>

      {/* Hero banner */}
      <div className="mx-4 mt-4 rounded-2xl overflow-hidden relative h-40 md:h-56">
        <picture>
          {BANNERS.homeBannerMobile && <source media="(max-width: 767px)" srcSet={BANNERS.homeBannerMobile} />}
          <ImageWithFallback src={BANNERS.homeBanner} alt="" className="w-full h-full object-cover object-[70%_center]" />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-r from-brand/85 via-brand/45 to-transparent flex items-center pl-6">
          <div>
            <h2 className="text-white mb-1" style={{ fontSize: 20 }}>{t("heroTitle")}</h2>
            <p className="text-white/80 text-sm">{t("heroSub")}</p>
          </div>
        </div>
      </div>

      {/* Sponsored banner (hidden for Plus members) */}
      <HomeAdBanner />

      {/* Categories */}
      <div className="px-4 mt-6">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat.key}
              onClick={() => navigate(`/browse?category=${cat.key}`)}
              className="flex flex-col items-center gap-1.5 min-w-[64px] py-3 px-2 rounded-xl bg-white border border-[#E5E7EB] hover:border-brand transition-colors"
            >
              <cat.icon size={20} className="text-brand" />
              <span className="text-[11px] text-[#6B7280] whitespace-nowrap">{t(cat.key)}</span>
            </button>
          ))}
        </div>
      </div>

      {listings.length === 0 ? (
        <div className="mx-4 mt-8 p-8 rounded-2xl bg-white border border-[#E5E7EB] text-center">
          <Package size={28} className="mx-auto text-brand mb-3" />
          <p className="text-sm text-[#1F2937]" style={{ fontWeight: 500 }}>{t("homeEmptyTitle")}</p>
          <p className="text-xs text-[#6B7280] mt-1">{t("homeEmptySub")}</p>
          <button
            onClick={() => navigate("/create")}
            className="mt-4 px-4 py-2 rounded-xl bg-brand text-white text-sm hover:bg-brand-hover transition-colors"
          >
            {t("listItem")}
          </button>
        </div>
      ) : (
        <>
        {/* Near you section */}
        <Section title={t("nearYou")} onSeeAll={() => navigate("/browse")}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {listings.slice(0, 4).map((l) => (
              <ListingCard
                key={String(l.id)} id={l.id} image={l.image}
                title={isZh ? zh(l.titleZh) : l.title}
                price={l.price}
                distance={isZh ? zh(l.distanceZh) : l.distance}
                category={isZh ? zh(l.categoryZh) : l.category}
                available={l.available}
                {...cardExtras(l)}
              />
            ))}
          </div>
        </Section>

        {/* Recently Added */}
        <Section title={t("recentlyAdded")} onSeeAll={() => navigate("/browse")}>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {listings.slice(2, 6).map((l) => (
              <div key={String(l.id)} className="w-[200px] shrink-0">
                <ListingCard
                  id={l.id} image={l.image}
                  title={isZh ? zh(l.titleZh) : l.title}
                  price={l.price}
                  distance={isZh ? zh(l.distanceZh) : l.distance}
                  category={isZh ? zh(l.categoryZh) : l.category}
                  available={l.available}
                  {...cardExtras(l)}
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
                title={isZh ? zh(l.titleZh) : l.title}
                price={l.price}
                distance={isZh ? zh(l.distanceZh) : l.distance}
                category={isZh ? zh(l.categoryZh) : l.category}
                available={l.available}
                {...cardExtras(l)}
              />
            ))}
          </div>
        </Section>
        </>
      )}
    </div>
  );
}

function Section({ title, onSeeAll, children }: { title: string; onSeeAll: () => void; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <div className="px-4 mt-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[#1F2937]">{title}</h3>
        <button onClick={onSeeAll} className="text-sm text-brand">{t("seeAll")}</button>
      </div>
      {children}
    </div>
  );
}
