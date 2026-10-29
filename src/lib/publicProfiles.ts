import { supabase } from "./supabase";

export type PublicProfile = {
  id: string;
  name: string;
  avatar_url: string | null;
  university: string | null;
  member_since: string | null;
  completed_rentals_as_lender: number;
  rating_as_lister: number | null;
  review_count_as_lister: number;
};

/** Public fields of other users (RLS hides their profiles rows). Keyed by user id. */
export async function fetchPublicProfiles(ids: string[]): Promise<Record<string, PublicProfile>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return {};
  const { data, error } = await supabase.rpc("get_public_profiles", { p_ids: unique });
  if (error) {
    console.error("get_public_profiles failed:", error.message);
    return {};
  }
  return Object.fromEntries(((data ?? []) as PublicProfile[]).map((p) => [p.id, p]));
}
