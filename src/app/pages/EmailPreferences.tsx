import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";

type Prefs = {
  rentalRequests: boolean;
  requestUpdates: boolean;
  nearbyListings: boolean;
  weeklyDigest: boolean;
};

const defaultPrefs: Prefs = {
  rentalRequests: true,
  requestUpdates: true,
  nearbyListings: false,
  weeklyDigest: false,
};

const prefLabels: { key: keyof Prefs; label: string; desc: string }[] = [
  { key: "rentalRequests", label: "Rental request notifications", desc: "Email me when someone requests my listing" },
  { key: "requestUpdates", label: "Request status updates", desc: "Email me when my request is accepted or rejected" },
  { key: "nearbyListings", label: "New listings near me", desc: "Get notified about new items in your area" },
  { key: "weeklyDigest", label: "Weekly digest", desc: "A weekly summary of activity on RenTrend" },
];

export function EmailPreferences() {
  const navigate = useNavigate();
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }

      const { data } = await supabase
        .from("profiles")
        .select("email_preferences")
        .eq("id", user.id)
        .single();

      if (data?.email_preferences && Object.keys(data.email_preferences).length > 0) {
        setPrefs({ ...defaultPrefs, ...data.email_preferences });
      }
      setLoading(false);
    }
    load();
  }, [navigate]);

  function toggle(key: keyof Prefs) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  async function handleSave() {
    setError("");
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert({ id: user.id, email_preferences: prefs });

    setSaving(false);
    if (upsertError) {
      setError(upsertError.message);
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-[#1E6B1E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/profile")} className="text-[#6B7280]"><ArrowLeft size={20} /></button>
        <h2 className="text-[#1F2937]">Email Preferences</h2>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] divide-y divide-[#E5E7EB] mb-4">
        {prefLabels.map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between px-4 py-4">
            <div className="flex-1 pr-4">
              <p className="text-sm" style={{ fontWeight: 500 }}>{label}</p>
              <p className="text-xs text-[#6B7280] mt-0.5">{desc}</p>
            </div>
            <button
              onClick={() => toggle(key)}
              className={`w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ${prefs[key] ? "bg-[#1E6B1E]" : "bg-[#E5E7EB]"}`}
            >
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${prefs[key] ? "left-5.5" : "left-0.5"}`} />
            </button>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl mb-4">{error}</p>
      )}

      {saved && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-4">
          <CheckCircle size={16} />
          Preferences saved!
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 bg-[#1E6B1E] text-white rounded-xl hover:bg-[#155215] transition-colors disabled:opacity-60"
      >
        {saving ? "Saving..." : "Save Preferences"}
      </button>
    </div>
  );
}
