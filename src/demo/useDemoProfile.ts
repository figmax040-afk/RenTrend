import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export type DemoProfile = {
  userId: string | null;
  name: string | null;
  plan: "free" | "plus";
  isPlus: boolean;
  planBilling: "monthly" | "yearly" | null;
  planStartedAt: string | null;
  lenderCompleted: number;
  renterCompleted: number;
  rating: number | null;
  reviewCount: number;
};

const SIGNED_OUT: DemoProfile = {
  userId: null, name: null, plan: "free", isPlus: false, planBilling: null, planStartedAt: null,
  lenderCompleted: 0, renterCompleted: 0, rating: null, reviewCount: 0,
};

// One shared copy for every component on the page; refreshDemoProfile() updates them all.
let cached: DemoProfile | null = null;
let inflight: Promise<DemoProfile> | null = null;
const listeners = new Set<(p: DemoProfile) => void>();

async function fetchProfile(): Promise<DemoProfile> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return SIGNED_OUT;
  // select("*") so the app keeps working if the demo migration hasn't been run yet
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const plan = data?.plan === "plus" ? "plus" : "free";
  return {
    userId: user.id,
    name: data?.name || user.email?.split("@")[0] || null,
    plan,
    isPlus: plan === "plus",
    planBilling: data?.plan_billing === "monthly" || data?.plan_billing === "yearly" ? data.plan_billing : null,
    planStartedAt: data?.plan_started_at ?? null,
    lenderCompleted: data?.completed_rentals_as_lender ?? 0,
    renterCompleted: data?.completed_rentals_as_renter ?? 0,
    rating: data?.rating_as_lister ?? null,
    reviewCount: data?.review_count_as_lister ?? 0,
  };
}

export function refreshDemoProfile() {
  inflight = fetchProfile().then((p) => {
    cached = p;
    inflight = null;
    listeners.forEach((l) => l(p));
    return p;
  });
  return inflight;
}

supabase.auth.onAuthStateChange((event) => {
  if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
    cached = null;
    if (listeners.size > 0) refreshDemoProfile();
  }
});

/** Current user's plan and rental counters. `loading` is true until the first fetch finishes. */
export function useDemoProfile() {
  const [profile, setProfile] = useState<DemoProfile | null>(cached);

  useEffect(() => {
    listeners.add(setProfile);
    if (cached) setProfile(cached);
    else (inflight ?? refreshDemoProfile()).then(setProfile);
    return () => { listeners.delete(setProfile); };
  }, []);

  return { profile: profile ?? SIGNED_OUT, loading: profile === null };
}
