import { useState, useEffect } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { useI18n } from "../components/i18n";
import { ListingCard } from "../components/ListingCard";
import { listings as mockListings, IMAGES } from "../components/data";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../lib/useAuth";

const categoryKeys = ["kitchen", "electronics", "furniture", "camera", "cooling", "other"];
const conditionKeys = ["worksPerf", "minorIssues", "forParts"];
const conditionValues: Record<string, string> = {
  worksPerf: "Works perfectly",
  minorIssues: "Minor issues",
  forParts: "For parts",
};

type UiListing = {
  id: string | number;
  image: string;
  title: string;
  titleZh: string;
  price: number;
  distance: string;
  category: string;
  available: boolean;
  brand: string;
  condition: string;
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
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [availableOnly, setAvailableOnly] = useState(false);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [allListings, setAllListings] = useState<UiListing[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) { navigate("/login"); return; }

    supabase
      .from("listings")
      .select("id, title, title_zh, image_url, price_per_day, district, category, is_active, created_at, brand, condition")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error("Browse fetch error:", error);
        }

        if (data && data.length > 0) {
          const mapped: UiListing[] = data.map((l) => ({
            id: l.id,
            image: l.image_url ?? "https://placehold.co/400x300?text=RenTrend",
            title: l.title,
            titleZh: l.title_zh ?? l.title,
            price: l.price_per_day,
            distance: l.district ?? "HK",
            category: l.category,
            available: l.is_active,
            brand: l.brand ?? "",
            condition: l.condition ?? "",
          }));
          setAllListings(mapped);

          const uniqueBrands = [...new Set(mapped.map((l) => l.brand).filter(Boolean))].sort();
          setBrands(uniqueBrands);
          const uniqueDistricts = [...new Set(mapped.map((l) => l.distance).filter(Boolean))].sort();
          setDistricts(uniqueDistricts);
        } else {
          const mapped: UiListing[] = mockListings.map((l) => ({
            id: l.id, image: l.image, title: l.title, titleZh: l.titleZh,
            price: l.price, distance: l.distance,
            category: l.category, available: l.available,
            brand: "", condition: "Works perfectly",
          }));
          setAllListings(mapped);
        }
        setDataLoading(false);
      });
  }, [authLoading, user, navigate]);

  const filtered = allListings.filter((l) => {
    const matchQ = query === "" || l.title.toLowerCase().includes(query.toLowerCase()) || l.titleZh.includes(query);
    const matchCat = !selectedCat || l.category.toLowerCase() === selectedCat;
    const matchPrice = l.price <= priceRange;
    const matchBrand = selectedBrands.length === 0 || selectedBrands.includes(l.brand);
    const matchCond = selectedConditions.length === 0 || selectedConditions.includes(l.condition);
    const matchAvail = !availableOnly || l.available;
    const matchDistrict = selectedDistricts.length === 0 || selectedDistricts.includes(l.distance);
    return matchQ && matchCat && matchPrice && matchBrand && matchCond && matchAvail && matchDistrict;
  });

  const handleCatClick = (c: string) => {
    const next = selectedCat === c ? null : c;
    setSelectedCat(next);
    if (next) { setSearchParams({ category: next }); } else { setSearchParams({}); }
  };

  function toggleArr<T>(arr: T[], val: T): T[] {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  }

  const activeFilterCount = (
    (priceRange < 100 ? 1 : 0) +
    (selectedBrands.length > 0 ? 1 : 0) +
    (selectedConditions.length > 0 ? 1 : 0) +
    (availableOnly ? 1 : 0) +
    (selectedDistricts.length > 0 ? 1 : 0)
  );

  function clearAll() {
    setPriceRange(100);
    setSelectedBrands([]);
    setSelectedConditions([]);
    setAvailableOnly(false);
    setSelectedDistricts([]);
  }

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
          className="relative p-2.5 rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#1E6B1E]"
        >
          <SlidersHorizontal size={18} />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-[#1E6B1E] text-white rounded-full text-[10px] flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
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
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 mb-4 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm" style={{ fontWeight: 500 }}>Filters</span>
            <div className="flex items-center gap-3">
              {activeFilterCount > 0 && (
                <button onClick={clearAll} className="text-xs text-[#EF4444]">Clear all</button>
              )}
              <button onClick={() => setShowFilter(false)}><X size={16} className="text-[#6B7280]" /></button>
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="text-xs text-[#6B7280]">Max price: HK${priceRange}/day</label>
            <input
              type="range" min={5} max={100} value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full mt-1 accent-[#1E6B1E]"
            />
          </div>

          {/* Condition */}
          <div>
            <label className="text-xs text-[#6B7280] block mb-2">Condition</label>
            <div className="flex flex-wrap gap-2">
              {conditionKeys.map((key) => {
                const val = conditionValues[key];
                const active = selectedConditions.includes(val);
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedConditions(toggleArr(selectedConditions, val))}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${active ? "bg-[#1E6B1E] text-white border-[#1E6B1E]" : "bg-white text-[#6B7280] border-[#E5E7EB]"}`}
                  >
                    {t(key)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Available only toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6B7280]">Available now only</span>
            <button
              onClick={() => setAvailableOnly(!availableOnly)}
              className={`w-10 h-5 rounded-full transition-colors relative ${availableOnly ? "bg-[#1E6B1E]" : "bg-[#E5E7EB]"}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${availableOnly ? "left-5" : "left-0.5"}`} />
            </button>
          </div>

          {/* Brand chips */}
          {brands.length > 0 && (
            <div>
              <label className="text-xs text-[#6B7280] block mb-2">Brand</label>
              <div className="flex flex-wrap gap-2">
                {brands.map((brand) => {
                  const active = selectedBrands.includes(brand);
                  return (
                    <button
                      key={brand}
                      onClick={() => setSelectedBrands(toggleArr(selectedBrands, brand))}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${active ? "bg-[#1E6B1E] text-white border-[#1E6B1E]" : "bg-white text-[#6B7280] border-[#E5E7EB]"}`}
                    >
                      {brand}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* District chips */}
          {districts.length > 1 && (
            <div>
              <label className="text-xs text-[#6B7280] block mb-2">District</label>
              <div className="flex flex-wrap gap-2">
                {districts.map((district) => {
                  const active = selectedDistricts.includes(district);
                  return (
                    <button
                      key={district}
                      onClick={() => setSelectedDistricts(toggleArr(selectedDistricts, district))}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${active ? "bg-[#1E6B1E] text-white border-[#1E6B1E]" : "bg-white text-[#6B7280] border-[#E5E7EB]"}`}
                    >
                      {district}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-[#6B7280]">
          <p className="text-sm">{lang === "zh" ? "附近找不到物品 — 嘗試擴大搜尋範圍" : "No items found — try adjusting your filters"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((l) => (
            <ListingCard
              key={String(l.id)} id={l.id} image={l.image}
              title={lang === "zh" ? l.titleZh : l.title}
              price={l.price}
              distance={l.distance}
              category={l.category}
              available={l.available}
            />
          ))}
        </div>
      )}
    </div>
  );
}
