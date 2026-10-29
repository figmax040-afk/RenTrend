// Everything the pitch demo mocks lives here: fees, plans, lockers, promo codes and ads.
// Edit freely — the app reads these values at runtime. Business names are invented.
// Copy is { en, zh } with Traditional Chinese; Simplified is derived automatically.

export type Copy = { en: string; zh: string };

// ── Lendy fee (taken from the lender's rental price, never above 10%) ──
export type FeeTier = { key: string; name: Copy; pct: number; minRentals: number; maxRentals: number | null };

export const FEE_TIERS: FeeTier[] = [
  { key: "bronze", name: { en: "Bronze", zh: "銅級" }, pct: 10, minRentals: 0, maxRentals: 9 },
  { key: "silver", name: { en: "Silver", zh: "銀級" }, pct: 8, minRentals: 10, maxRentals: 29 },
  { key: "gold", name: { en: "Gold", zh: "金級" }, pct: 6, minRentals: 30, maxRentals: null },
];
export const MAX_FEE_PCT = 10;

// ── Pickup ──
export const DELIVERY_FEE = 30; // HK$, free for Plus
export const LOCKER_FEE = 10; // HK$, free for Plus

export type Locker = { id: string; name: Copy; station: Copy; address: Copy; hours: Copy };

export const LOCKERS: Locker[] = [
  {
    id: "kennedy-town",
    name: { en: "Lendy Locker Kennedy Town", zh: "Lendy 儲物櫃 堅尼地城" },
    station: { en: "Kennedy Town MTR · Exit B", zh: "堅尼地城站 · B 出口" },
    address: { en: "Smithfield Rd, next to the bus terminus", zh: "士美菲路，近巴士總站" },
    hours: { en: "24 hours", zh: "24 小時" },
  },
  {
    id: "hku",
    name: { en: "Lendy Locker HKU", zh: "Lendy 儲物櫃 香港大學" },
    station: { en: "HKU MTR · Exit A2", zh: "香港大學站 · A2 出口" },
    address: { en: "Pok Fu Lam Rd, opposite Centennial Campus", zh: "薄扶林道，百周年校園對面" },
    hours: { en: "24 hours", zh: "24 小時" },
  },
  {
    id: "university",
    name: { en: "Lendy Locker University", zh: "Lendy 儲物櫃 大學站" },
    station: { en: "University MTR · Exit B", zh: "大學站 · B 出口" },
    address: { en: "Station concourse, near the minibus stop", zh: "車站大堂，近小巴站" },
    hours: { en: "6am – 1am", zh: "早上 6 時至凌晨 1 時" },
  },
  {
    id: "wan-chai",
    name: { en: "Lendy Locker Wan Chai", zh: "Lendy 儲物櫃 灣仔" },
    station: { en: "Wan Chai MTR · Exit A3", zh: "灣仔站 · A3 出口" },
    address: { en: "Johnston Rd, ground floor arcade", zh: "莊士敦道，地下商場" },
    hours: { en: "24 hours", zh: "24 小時" },
  },
];

// ── Promo and referral codes ──
export type PromoCode = { code: string; amount: number; firstRentalOnly: boolean; label: Copy };

export const PROMO_CODES: PromoCode[] = [
  { code: "HKUFRESH", amount: 20, firstRentalOnly: true, label: { en: "HK$20 off your first rental", zh: "首次租用減 HK$20" } },
];

// Referral codes look like LENDY-ABCD1234; a friend's code works as a promo on their first rental.
export const REFERRAL_PREFIX = "LENDY-";
export const REFERRAL_BONUS = 20;

// ── Lendy Plus ──
export const PLUS_PLAN = {
  monthlyPrice: 70,
  yearlyPrice: 600, // shown as HK$50/month
  firstMonthFree: true,
  renterBenefits: [
    { en: "Free locker pickup and delivery", zh: "免費儲物櫃取貨及送貨" },
    { en: "No ads", zh: "無廣告" },
    { en: "Priority support", zh: "優先客戶支援" },
  ] as Copy[],
  lenderBenefits: [
    { en: "Lender Booster analytics: views, requests and earnings", zh: "Lender Booster 數據分析：瀏覽、請求及收益" },
    { en: "Unlimited listings", zh: "無限刊登" },
    { en: "3 Boost credits every month", zh: "每月 3 次 Boost" },
    { en: "Power Lender badge fast-track", zh: "Power Lender 徽章快速通道" },
  ] as Copy[],
};

// ── Listings ──
export const FREE_LISTING_CAP = 5;
export const BOOST_DAYS = 7;
export const BOOST_PRICE_FREE = 15; // HK$ per Boost on the free plan (mock)

// ── Power Lender ──
export const POWER_LENDER = { minRentals: 10, minRating: 4.5 };

// ── Ad targeting ──
export const FREQUENT_RENTER_MIN = 3; // completed rentals before the frequentRenter set is shown

export type AdIcon = "truck" | "box" | "sparkles" | "camera" | "wrench";

export type Ad = {
  id: string;
  advertiser: string;
  icon: AdIcon;
  gradient: [string, string];
  headline: Copy;
  body: Copy;
  cta: Copy;
};

const ADS: Record<string, Ad> = {
  moveEasy: {
    id: "moveeasy",
    advertiser: "MoveEasy HK",
    icon: "truck",
    gradient: ["#3F94CA", "#1A7A86"],
    headline: { en: "Moving into halls? We'll carry it.", zh: "搬入宿舍？我們幫你搬。" },
    body: { en: "Student removals from HK$280 across Hong Kong Island.", zh: "港島區學生搬運 HK$280 起。" },
    cta: { en: "Get a quote", zh: "立即報價" },
  },
  boxSpace: {
    id: "boxspace",
    advertiser: "BoxSpace",
    icon: "box",
    gradient: ["#5AB98F", "#1A7A86"],
    headline: { en: "Summer storage, sorted", zh: "暑假儲存，輕鬆搞掂" },
    body: { en: "Mini storage rooms near Kennedy Town from HK$199/month.", zh: "堅尼地城迷你倉，每月 HK$199 起。" },
    cta: { en: "Book a room", zh: "預約倉位" },
  },
  sparkleClean: {
    id: "sparkleclean",
    advertiser: "SparkleClean",
    icon: "sparkles",
    gradient: ["#7CC4E8", "#3F94CA"],
    headline: { en: "Move-out cleaning, deposit-back ready", zh: "退租清潔，助你取回按金" },
    body: { en: "Flat cleaning in 3 hours. 10% off with Lendy.", zh: "3 小時完成全屋清潔，Lendy 用戶 9 折。" },
    cta: { en: "See prices", zh: "查看價錢" },
  },
  lensCo: {
    id: "lensco",
    advertiser: "Lens & Co",
    icon: "camera",
    gradient: ["#123B47", "#1A7A86"],
    headline: { en: "Loved the camera? Own one.", zh: "愛上這部相機？不如擁有一部。" },
    body: { en: "Certified pre-owned cameras with a 6-month warranty.", zh: "認證二手相機，附 6 個月保養。" },
    cta: { en: "Shop cameras", zh: "選購相機" },
  },
  homeFix: {
    id: "homefix",
    advertiser: "HomeFix Appliances",
    icon: "wrench",
    gradient: ["#F4A261", "#E07A3F"],
    headline: { en: "Appliance acting up?", zh: "電器出問題？" },
    body: { en: "Same-day repairs for fridges, fans and rice cookers.", zh: "雪櫃、風扇、電飯煲即日維修。" },
    cta: { en: "Book a repair", zh: "預約維修" },
  },
};

// Frequent renters see loyalty-style offers from the same invented advertisers.
const LOYAL: Record<string, Ad> = {
  moveEasy: { ...ADS.moveEasy, id: "moveeasy-loyal", headline: { en: "Regular mover? 20% off your next move", zh: "常搬屋？下次搬運 8 折" }, body: { en: "Lendy regulars get 20% off removals this month.", zh: "Lendy 常客本月搬運享 8 折。" } },
  boxSpace: { ...ADS.boxSpace, id: "boxspace-loyal", headline: { en: "First month HK$1 for Lendy regulars", zh: "Lendy 常客首月只需 HK$1" } },
  sparkleClean: { ...ADS.sparkleClean, id: "sparkleclean-loyal", headline: { en: "Your 4th clean is free", zh: "第 4 次清潔免費" } },
  lensCo: { ...ADS.lensCo, id: "lensco-loyal", headline: { en: "Renting often? Trade up and save 15%", zh: "經常租相機？換購即減 15%" } },
  homeFix: { ...ADS.homeFix, id: "homefix-loyal", headline: { en: "Free check-up with any repair", zh: "任何維修免費檢查" } },
};

export type AdSet = {
  homeBanner: Ad;
  browse: Ad[]; // one sponsored card after every 6 listings, cycling through these
  byCategory: Record<string, Ad> & { default: Ad }; // listing detail
};

function adSet(a: Record<string, Ad>): AdSet {
  return {
    homeBanner: a.moveEasy,
    browse: [a.boxSpace, a.sparkleClean, a.homeFix, a.lensCo, a.moveEasy],
    byCategory: {
      kitchen: a.homeFix,
      electronics: a.homeFix,
      cooling: a.homeFix,
      furniture: a.moveEasy,
      other: a.boxSpace,
      default: a.sparkleClean,
    },
  };
}

export const AD_SETS: Record<"newUser" | "frequentRenter", AdSet> = {
  newUser: adSet(ADS),
  frequentRenter: adSet(LOYAL),
};

// ── Lender stats: shown when the account has little real activity yet ──
export const STATS_SEED = {
  views: 486,
  requests: 23,
  completed: 9,
  earnings: 2340,
  weeklyViews: [42, 58, 51, 77, 69, 94, 95],
  topListingViews: 182,
  topListingRequests: 9,
};
