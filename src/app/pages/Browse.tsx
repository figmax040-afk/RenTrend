import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { useI18n } from "../components/i18n";
import { ListingCard } from "../components/ListingCard";
import { listings as mockListings, IMAGES } from "../components/data";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/useAuth";

const categoryKeys = ["kitchen", "electronics", "furniture", "camera", "cooling", "other"];

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

export function Browse() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const initialCat = searchParams.get("category");
  const [selectedCat, setSelectedCat] = useState<string | null>(initialCat);
  const [showFilter, setShowFilter] = useState(false);
  const [priceRange, setPriceRange] = useState(100);
  const [allListings, setAllListings] = useState<UiListing[]>([]);
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
          setAllListings(data.map((l) => ({
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
          })));
        } else {
          setAllListings(mockListings.map((l) => ({
            id: l.id, image: l.image, title: l.title, titleZh: l.titleZh,
            price: l.price, distance: l.distance, distanceZh: l.distanceZh,
            category: l.category, categoryZh: l.categoryZh, available: l.available,
          })));
        }
        setDataLoading(false);
      });
  }, [authLoading, user, navigate]);

  const filtered = allListings.filter((l) => {
    const matchQ = query === "" || l.title.toLowerCase().includes(query.toLowerCase()) || l.titleZh.includes(query);
    const matchCat = !selectedCat || l.category.toLowerCase() === selectedCat;
    const matchPrice = l.price <= priceRange;
    return matchQ && matchCat && matchPrice;
  });

  const handleCatClick = (c: string) => {
    const next = selectedCat === c ? null : c;
    setSelectedCat(next);
    if (next) {
      setSearchParams({ category: next });
    } else {
      setSearchParams({});
    }
  };

  if (authLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-[#1E6B1E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 pt-4">
      {/* Search */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
          <input
            value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white focus:outline-none focus:border-[#1E6B1E] text-sm"
          />
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="p-2.5 rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#1E6B1E]"
        >
          <SlidersHorizontal size={18} />
        </button>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-4">
        {categoryKeys.map((c) => (
          <button
            key={c}
            onClick={() => handleCatClick(c)}
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-colors ${selectedCat === c ? "bg-[#1E6B1E] text-white border-[#1E6B1E]" : "bg-white text-[#6B7280] border-[#E5E7EB]"}`}
          >
            {t(c)}
          </button>
        ))}
      </div>

      {/* Filter drawer */}
      {showFilter && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 mb-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm" style={{ fontWeight: 500 }}>Filters</span>
            <button onClick={() => setShowFilter(false)}><X size={16} className="text-[#6B7280]" /></button>
          </div>
          <label className="text-xs text-[#6B7280]">Max price: HK${priceRange}/day</label>
          <input
            type="range" min={5} max={100} value={priceRange}
            onChange={(e) => setPriceRange(Number(e.target.value))}
            className="w-full mt-1 accent-[#1E6B1E]"
          />
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[#6B7280]">
          <p className="text-sm">{lang === "zh" ? "附近找不到物品 — 嘗試擴大搜尋範圍" : "No items found near you — try widening your search"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((l) => (
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
      )}
    </div>
  );
}
