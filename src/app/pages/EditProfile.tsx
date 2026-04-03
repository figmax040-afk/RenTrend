import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";

export function EditProfile() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [phone, setPhone] = useState("");
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
        .select("name, university, phone")
        .eq("id", user.id)
        .single();

      if (data) {
        setName(data.name ?? "");
        setUniversity(data.university ?? "");
        setPhone(data.phone ?? "");
      }
      setLoading(false);
    }
    load();
  }, [navigate]);

  async function handleSave() {
    setError("");
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate("/login"); return; }

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert({ id: user.id, name, university, phone });

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
        <h2 className="text-[#1F2937]">Edit Profile</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-[#6B7280]">Display Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm focus:outline-none focus:border-[#1E6B1E]"
          />
        </div>
        <div>
          <label className="text-sm text-[#6B7280]">University</label>
          <select
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm focus:outline-none focus:border-[#1E6B1E]"
          >
            <option value="">Select university</option>
            <option>HKU</option>
            <option>CUHK</option>
            <option>HKUST</option>
            <option>PolyU</option>
            <option>CityU</option>
            <option>HKBU</option>
            <option>Other</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-[#6B7280]">Phone Number</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+852 xxxx xxxx"
            className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm focus:outline-none focus:border-[#1E6B1E]"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</p>
        )}

        {saved && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl">
            <CheckCircle size={16} />
            Profile saved!
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-[#1E6B1E] text-white rounded-xl hover:bg-[#155215] transition-colors disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
