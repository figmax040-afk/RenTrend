import {
  AD_SETS, BOOST_DAYS, DELIVERY_FEE, FEE_TIERS, FREQUENT_RENTER_MIN, LOCKERS, LOCKER_FEE,
  MAX_FEE_PCT, POWER_LENDER, PROMO_CODES, REFERRAL_BONUS, REFERRAL_PREFIX,
  type AdSet, type Copy, type FeeTier,
} from "./demoConfig";

export type PickupMethod = "meetup" | "locker" | "delivery";
export type EscrowStatus = "unpaid" | "held" | "released" | "refunded";

/** Pick the { en, zh } text for the current language; `zh` converts to Simplified when needed. */
export function copy(c: Copy, isZh: boolean, zh: (s: string) => string) {
  return isZh ? zh(c.zh) : c.en;
}

export function feeTierFor(completedRentals: number): FeeTier {
  const tier = [...FEE_TIERS]
    .sort((a, b) => b.minRentals - a.minRentals)
    .find((t) => completedRentals >= t.minRentals) ?? FEE_TIERS[0];
  return { ...tier, pct: Math.min(tier.pct, MAX_FEE_PCT) };
}

export function nextFeeTier(completedRentals: number): FeeTier | null {
  return [...FEE_TIERS].sort((a, b) => a.minRentals - b.minRentals).find((t) => t.minRentals > completedRentals) ?? null;
}

export function payoutFor(rentalPrice: number, completedRentals: number) {
  const tier = feeTierFor(completedRentals);
  const fee = Math.round((rentalPrice * tier.pct) / 100);
  return { tier, fee, payout: rentalPrice - fee };
}

export function adSetFor(completedRentalsAsRenter: number): AdSet {
  return completedRentalsAsRenter >= FREQUENT_RENTER_MIN ? AD_SETS.frequentRenter : AD_SETS.newUser;
}

export function isPowerLender(completedRentals: number | null | undefined, rating: number | null | undefined) {
  return (completedRentals ?? 0) >= POWER_LENDER.minRentals && (rating ?? 0) >= POWER_LENDER.minRating;
}

export function isBoosted(boostedUntil: string | null | undefined, now = Date.now()) {
  return !!boostedUntil && new Date(boostedUntil).getTime() > now;
}

export function boostUntilFromNow() {
  return new Date(Date.now() + BOOST_DAYS * 86400000).toISOString();
}

/** Featured listings first, otherwise keep the incoming order. */
export function featuredFirst<T extends { featured?: boolean }>(items: T[]): T[] {
  return [...items.filter((i) => i.featured), ...items.filter((i) => !i.featured)];
}

export function pickupFee(method: PickupMethod | null | undefined, isPlus: boolean) {
  const base = method === "delivery" ? DELIVERY_FEE : method === "locker" ? LOCKER_FEE : 0;
  return { base, charged: isPlus ? 0 : base };
}

export function lockerById(id: string | null | undefined) {
  return LOCKERS.find((l) => l.id === id) ?? null;
}

export function randomLockerCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function referralCodeFor(userId: string, name: string | null | undefined) {
  const letters = (name ?? "").replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase() || "USER";
  return `${REFERRAL_PREFIX}${letters}${userId.replace(/-/g, "").slice(0, 4).toUpperCase()}`;
}

export type PromoResult =
  | { ok: true; code: string; amount: number; label: Copy }
  | { ok: false; reason: "invalid" | "firstRentalOnly" | "ownCode" };

export function validatePromo(raw: string, opts: { isFirstRental: boolean; ownReferralCode: string }): PromoResult {
  const code = raw.trim().toUpperCase();
  const promo = PROMO_CODES.find((p) => p.code === code);
  if (promo) {
    if (promo.firstRentalOnly && !opts.isFirstRental) return { ok: false, reason: "firstRentalOnly" };
    return { ok: true, code, amount: promo.amount, label: promo.label };
  }
  if (new RegExp(`^${REFERRAL_PREFIX}[A-Z]{1,4}[A-Z0-9]{4}$`).test(code)) {
    if (code === opts.ownReferralCode) return { ok: false, reason: "ownCode" };
    if (!opts.isFirstRental) return { ok: false, reason: "firstRentalOnly" };
    return { ok: true, code, amount: REFERRAL_BONUS, label: { en: "Friend referral", zh: "朋友推薦" } };
  }
  return { ok: false, reason: "invalid" };
}

/** Pickup method for display; requests made before this demo only stored collect/deliver. */
export function pickupMethodOf(r: { pickup_method?: string | null; pickup_preference?: string | null }): PickupMethod {
  if (r.pickup_method === "meetup" || r.pickup_method === "locker" || r.pickup_method === "delivery") return r.pickup_method;
  return r.pickup_preference === "deliver" ? "delivery" : "meetup";
}

export const PICKUP_LABEL_KEY: Record<PickupMethod, string> = {
  meetup: "pickupMeetup",
  locker: "pickupLocker",
  delivery: "pickupDelivery",
};
