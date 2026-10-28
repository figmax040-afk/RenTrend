export type PriceBreakdown = {
  months: number;
  weeks: number;
  days: number;
  total: number;
};

export type PriceLines = PriceBreakdown & {
  priceDay: number;
  priceWeek: number | null;
  priceMonth: number | null;
};

// Cheapest combination of monthly (30d), weekly (7d) and daily rates.
export function calculateOptimalPrice(
  totalDays: number,
  priceDay: number,
  priceWeek: number | null,
  priceMonth: number | null
): PriceBreakdown {
  const pw = priceWeek && priceWeek > 0 ? priceWeek : 0;
  const pm = priceMonth && priceMonth > 0 ? priceMonth : 0;

  const months = pm > 0 ? Math.floor(totalDays / 30) : 0;
  const remainingAfterMonths = totalDays - months * 30;
  const weeks = pw > 0 ? Math.floor(remainingAfterMonths / 7) : 0;
  const remainingDays = remainingAfterMonths - weeks * 7;

  const total = months * pm + weeks * pw + remainingDays * priceDay;
  return { months, weeks, days: remainingDays, total };
}

export function daysBetween(start: string, end: string) {
  return Math.max(1, Math.ceil((new Date(end).getTime() - new Date(start).getTime()) / 86400000));
}

type BreakdownJson = Partial<PriceLines> & { priceDay?: number | null };

// Prefer the breakdown saved with the request; otherwise recompute from the listing's rates.
export function breakdownFromRequest(
  request: { start_date: string; end_date: string; total_price: number | null; breakdown_json?: BreakdownJson | null },
  listing: { price_per_day: number; price_weekly?: number | null; price_monthly?: number | null } | null
): PriceLines | null {
  const b = request.breakdown_json;
  if (b && typeof b.total === "number" && typeof b.priceDay === "number") {
    return {
      months: b.months ?? 0,
      weeks: b.weeks ?? 0,
      days: b.days ?? 0,
      total: request.total_price ?? b.total,
      priceDay: b.priceDay,
      priceWeek: b.priceWeek ?? null,
      priceMonth: b.priceMonth ?? null,
    };
  }
  if (!listing) return null;
  const days = daysBetween(request.start_date, request.end_date);
  const calc = calculateOptimalPrice(days, listing.price_per_day, listing.price_weekly ?? null, listing.price_monthly ?? null);
  return {
    ...calc,
    total: request.total_price ?? calc.total,
    priceDay: listing.price_per_day,
    priceWeek: listing.price_weekly ?? null,
    priceMonth: listing.price_monthly ?? null,
  };
}
