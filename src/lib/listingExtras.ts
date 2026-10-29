import { supabase } from "./supabase";
import { isBoosted, isPowerLender } from "../demo/demo";

export type ListingExtras = {
  ratings: Record<string, { avg: number; count: number }>;
  powerOwners: Set<string>;
};

/** Star rating per listing and which owners are Power Lenders, for listing cards. */
export async function fetchListingExtras(listings: { id: string | number; owner_id?: string | null }[]): Promise<ListingExtras> {
  const ids = listings.map((l) => String(l.id));
  const ownerIds = [...new Set(listings.map((l) => l.owner_id).filter((v): v is string => !!v))];
  if (ids.length === 0) return { ratings: {}, powerOwners: new Set() };

  const [{ data: reviews }, { data: owners }] = await Promise.all([
    supabase.from("reviews").select("listing_id, rating").in("listing_id", ids).eq("role", "renter"),
    ownerIds.length > 0
      ? supabase.from("profiles").select("*").in("id", ownerIds)
      : Promise.resolve({ data: [] as Record<string, any>[] }),
  ]);

  const sums: Record<string, { total: number; count: number }> = {};
  for (const r of reviews ?? []) {
    if (!r.listing_id) continue;
    const s = (sums[r.listing_id] ??= { total: 0, count: 0 });
    s.total += r.rating;
    s.count += 1;
  }
  const ratings = Object.fromEntries(Object.entries(sums).map(([id, s]) => [id, { avg: s.total / s.count, count: s.count }]));
  const powerOwners = new Set(
    (owners ?? []).filter((p) => isPowerLender(p.completed_rentals_as_lender, p.rating_as_lister)).map((p) => p.id as string)
  );
  return { ratings, powerOwners };
}

export function listingIsFeatured(l: { boosted_until?: string | null }) {
  return isBoosted(l.boosted_until);
}
