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

export type ContactProfile = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
};

/** Name, email and phone of people you share a rental request with (anyone else is left out). */
export async function fetchContactProfiles(ids: string[]): Promise<Record<string, ContactProfile>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return {};
  const { data, error } = await supabase.rpc("get_contact_profiles", { p_ids: unique });
  if (error) {
    console.error("get_contact_profiles failed:", error.message);
    return {};
  }
  return Object.fromEntries(((data ?? []) as ContactProfile[]).map((p) => [p.id, p]));
}

/** Open (or create) the chat thread for a listing. Owners pass the renter they're replying to. */
export async function openChatThread(listingId: string, renterId?: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("get_or_create_chat_thread", {
    p_listing_id: listingId,
    ...(renterId ? { p_renter_id: renterId } : {}),
  });
  if (error) {
    console.error("get_or_create_chat_thread failed:", error.message);
    return null;
  }
  return data as string;
}
