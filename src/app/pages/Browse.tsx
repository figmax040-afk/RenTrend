import { useState, useEffect, useRef, useCallback, Fragment } from "react";
import { Search, SlidersHorizontal, X, MapPin, Heart, Recycle, ChevronRight } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";
import { useI18n } from "../components/i18n";
import { ListingCard } from "../components/ListingCard";
import { supabase } from "../../lib/supabase";
import listingPlaceholder from "../../assets/listing-placeholder.svg";
import { useAuth } from "../../lib/useAuth";
import { CONDITION_KEYS, CONDITION_VALUES, conditionKeyFromStored } from "../../lib/conditions";
import { fetchListingExtras, listingIsFeatured, type ListingExtras } from "../../lib/listingExtras";
import { featuredFirst } from "../../demo/demo";
import { SponsoredListingCard, useAdSet } from "../components/Ads";

declare global { interface Window { google: any; } }

const categoryKeys = ["kitchen", "electronics", "furniture", "cooling", "other"];
// A sponsored card follows every this many listings
const AD_EVERY = 6;
const conditionKeys = CONDITION_KEYS;
const conditionValues = CONDITION_VALUES;

type LocationFilter = { lat: number; lng: number; address: string };

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
  lat?: number | null;
  lng?: number | null;
  owner_id: string | null;
  featured: boolean;
};

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function Browse() {
  const { t, isZh, zh } = useI18n();
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
  const [locationFilter, setLocationFilter] = useState<LocationFilter | null>(null);
  const [locationInputValue, setLocationInputValue] = useState("");
  const locationInputRef = useRef<HTMLInputElement>(null);
  const [allListings, setAllListings] = useState<UiListing[]>([]);
  const [brands, setBrands] = useState<string[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [savedCount, setSavedCount] = useState(0);
  const [extras, setExtras] = useState<ListingExtras>({ ratings: {}, powerOwners: new Set() });
  const adSet = useAdSet();

  // Load Google Maps script
  useEffect(() => {
    if (window.google) { initAutocomplete(); return; }
    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing) {
      existing.addEventListener("load", initAutocomplete);
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = initAutocomplete;
    document.head.appendChild(script);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const initAutocomplete = useCallback(() => {
    if (!window.google || !locationInputRef.current) return;
    const ac = new window.google.maps.places.Autocomplete(locationInputRef.current, {
      componentRestrictions: { country: "hk" },
      fields: ["formatted_address", "geometry", "name"],
      types: ["establishment", "geocode"],
    });
    ac.addListener("place_changed", () => {
      const place = ac.getPlace();
      const address = place.formatted_address || place.name || "";
      const lat = place.geometry?.location?.lat() ?? null;
      const lng = place.geometry?.location?.lng() ?? null;
      setLocationInputValue(address);
      if (lat !== null && lng !== null) {
        setLocationFilter({ lat, lng, address });
      }
    });
  }, []);

  useEffect(() => {
    if (authLoading || !user) return;
    supabase
      .from("saved_listings")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .then(({ count }) => setSavedCount(count || 0));
  }, [authLoading, user]);

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
          console.error("Browse fetch error:", error);
        }

        if (data) {
          const mapped: UiListing[] = data.map((l) => ({
            id: l.id,
            image: l.image_url ?? listingPlaceholder,
            title: l.title,
            titleZh: l.title_zh ?? l.title,
            price: l.price_per_day,
            distance: l.district ?? "HK",
            category: l.category,
            available: l.is_active,
            brand: l.brand ?? "",
            condition: (() => { const k = conditionKeyFromStored(l.condition); return k ? CONDITION_VALUES[k] : (l.condition ?? ""); })(),
            lat: l.location_lat ?? null,
            lng: l.location_lng ?? null,
            owner_id: l.owner_id ?? null,
            featured: listingIsFeatured(l),
          }));
          setAllListings(featuredFirst(mapped));
          fetchListingExtras(mapped).then(setExtras).catch((err) => console.error("Listing extras failed:", err));

          const uniqueBrands = [...new Set(mapped.map((l) => l.brand).filter(Boolean))].sort();
          setBrands(uniqueBrands);
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
    const matchLocation = !locationFilter || !l.lat || !l.lng
      ? true
      : distanceKm(locationFilter.lat, locationFilter.lng, l.lat, l.lng) <= 3;
    return matchQ && matchCat && matchPrice && matchBrand && matchCond && matchAvail && matchLocation;
  });

  // Compute display distance for each card
  function getDisplayDistance(l: UiListing): string {
    if (locationFilter && l.lat && l.lng) {
      const km = distanceKm(locationFilter.lat, locationFilter.lng, l.lat, l.lng);
      return `${km.toFixed(1)} ${t("kmAway")}`;
    }
    return l.distance;
  }

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
    (locationFilter ? 1 : 0)
  );

  function clearAll() {
    setPriceRange(100);
    setSelectedBrands([]);
    setSelectedConditions([]);
    setAvailableOnly(false);
    setLocationFilter(null);
    setLocationInputValue("");
  }

  if (authLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
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
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white focus:outline-none focus:border-brand text-sm"
          />
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className="relative p-2.5 rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-brand"
        >
          <SlidersHorizontal size={18} />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-brand text-white rounded-full text-[10px] flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
        <button
          onClick={() => navigate("/saved")}
          className="relative p-2.5 rounded-xl border border-[#E5E7EB] bg-white text-[#6B7280] hover:text-[#EF4444]"
        >
          <Heart size={18} />
          {savedCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#EF4444] text-white rounded-full text-[9px] flex items-center justify-center">
              {savedCount}
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
            className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap border transition-colors ${selectedCat === c ? "bg-brand text-white border-brand" : "bg-white text-[#6B7280] border-[#E5E7EB]"}`}
          >
            {t(c)}
          </button>
        ))}
      </div>

      {/* Filter drawer */}
      {showFilter && (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 mb-4 space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm" style={{ fontWeight: 500 }}>{t("filters")}</span>
            <div className="flex items-center gap-3">
              {activeFilterCount > 0 && (
                <button onClick={clearAll} className="text-xs text-[#EF4444]">{t("clearAll")}</button>
              )}
              <button onClick={() => setShowFilter(false)}><X size={16} className="text-[#6B7280]" /></button>
            </div>
          </div>

          {/* Location search */}
          <div>
            <label className="text-xs text-[#6B7280] block mb-2">{t("nearLocation")}</label>
            <div className="relative">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <input
                ref={locationInputRef}
                type="text"
                value={locationInputValue}
                onChange={(e) => {
                  setLocationInputValue(e.target.value);
                  if (!e.target.value) setLocationFilter(null);
                }}
                placeholder={t("searchLocationHK")}
                className="w-full pl-8 pr-8 py-2 rounded-xl border border-[#E5E7EB] bg-white text-sm focus:outline-none focus:border-brand"
              />
              {locationFilter && (
                <button
                  onClick={() => { setLocationFilter(null); setLocationInputValue(""); }}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <X size={14} className="text-[#6B7280]" />
                </button>
              )}
            </div>
            {locationFilter && (
              <p className="text-[10px] text-brand mt-1">{t("filteringNear")} {locationFilter.address}</p>
            )}
          </div>

          {/* Price */}
          <div>
            <label className="text-xs text-[#6B7280]">{t("maxPrice")} HK${priceRange}{t("perDay")}</label>
            <input
              type="range" min={5} max={100} value={priceRange}
              onChange={(e) => setPriceRange(Number(e.target.value))}
              className="w-full mt-1 accent-brand"
            />
          </div>

          {/* Condition */}
          <div>
            <label className="text-xs text-[#6B7280] block mb-2">{t("condition")}</label>
            <div className="flex flex-wrap gap-2">
              {conditionKeys.map((key) => {
                const val = conditionValues[key];
                const active = selectedConditions.includes(val);
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedConditions(toggleArr(selectedConditions, val))}
                    className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${active ? "bg-brand text-white border-brand" : "bg-white text-[#6B7280] border-[#E5E7EB]"}`}
                  >
                    {t(key)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Available only toggle */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6B7280]">{t("availableNowOnly")}</span>
            <button
              onClick={() => setAvailableOnly(!availableOnly)}
              className={`w-10 h-5 rounded-full transition-colors relative ${availableOnly ? "bg-brand" : "bg-[#E5E7EB]"}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${availableOnly ? "left-5" : "left-0.5"}`} />
            </button>
          </div>

          {/* Brand chips */}
          {brands.length > 0 && (
            <div>
              <label className="text-xs text-[#6B7280] block mb-2">{t("brand")}</label>
              <div className="flex flex-wrap gap-2">
                {brands.map((brand) => {
                  const active = selectedBrands.includes(brand);
                  return (
                    <button
                      key={brand}
                      onClick={() => setSelectedBrands(toggleArr(selectedBrands, brand))}
                      className={`px-3 py-1.5 rounded-full text-xs border transition-colors ${active ? "bg-brand text-white border-brand" : "bg-white text-[#6B7280] border-[#E5E7EB]"}`}
                    >
                      {brand}
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
          <p className="text-sm">{isZh ? zh("附近找不到物品 — 嘗試擴大搜尋範圍") : "No items found — try adjusting your filters"}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filtered.map((l, i) => (
            <Fragment key={String(l.id)}>
              <ListingCard
                id={l.id} image={l.image}
                title={isZh ? zh(l.titleZh) : l.title}
                price={l.price}
                distance={getDisplayDistance(l)}
                category={l.category}
                available={l.available}
                rating={extras.ratings[String(l.id)] ?? null}
                featured={l.featured}
                powerLender={!!l.owner_id && extras.powerOwners.has(l.owner_id)}
              />
              {adSet && (i + 1) % AD_EVERY === 0 && (
                <SponsoredListingCard ad={adSet.browse[((i + 1) / AD_EVERY - 1) % adSet.browse.length]} />
              )}
            </Fragment>
          ))}
        </div>
      )}

      {/* Recycle banner */}
      <div
        onClick={() => navigate("/recycle")}
        className="mx-0 mt-6 mb-4 p-4 rounded-xl bg-brand/8 border border-brand-border flex items-center gap-3 cursor-pointer hover:bg-brand/12 transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-brand/15 flex items-center justify-center flex-shrink-0">
          <Recycle size={20} className="text-brand" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium text-brand">{t("recycleTitle").split("\n")[0]}</p>
          <p className="text-xs text-[#6B7280] mt-0.5">{t("recycleSub").substring(0, 60)}...</p>
        </div>
        <ChevronRight size={16} className="text-brand" />
      </div>
    </div>
  );
}
