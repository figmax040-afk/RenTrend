import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Shield, Edit, Bell, Mail, LogOut, Globe, ChevronRight, BarChart3, Star } from "lucide-react";
import { useI18n, LANGS } from "../components/i18n";
import { supabase } from "../../lib/supabase";
import { loginPath } from "../../lib/authRedirect";

type ProfileRow = {
  name: string | null;
  avatar_url: string | null;
  phone: string | null;
  university: string | null;
  rating_as_lister: number | null;
  review_count_as_lister: number | null;
};

export function Profile() {
  const navigate = useNavigate();
  const { t, lang, setLang, isZh, zh } = useI18n();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [initials, setInitials] = useState("?");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [memberSince, setMemberSince] = useState("");
  const [loading, setLoading] = useState(true);
  const [itemsListed, setItemsListed] = useState(0);
  const [rentalsCompleted, setRentalsCompleted] = useState(0);
  const [ratingAsLister, setRatingAsLister] = useState<number | null>(null);
  const [reviewCountAsLister, setReviewCountAsLister] = useState(0);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate(loginPath()); return; }

      const userEmail = user.email ?? "";
      setEmail(userEmail);

      const date = new Date(user.created_at);
      setMemberSince(date.toLocaleDateString("en-US", { month: "short", year: "numeric" }));

      // Fetch profile row
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, avatar_url, phone, university, rating_as_lister, review_count_as_lister")
        .eq("id", user.id)
        .single();

      if (!profile) {
        // Create profile row for new user
        await supabase.from("profiles").upsert({ id: user.id });
      }

      const name = (profile?.name) || userEmail.split("@")[0];
      setDisplayName(name);
      setInitials(name.charAt(0).toUpperCase());
      setAvatarUrl(profile?.avatar_url ?? null);
      setRatingAsLister(profile?.rating_as_lister ?? null);
      setReviewCountAsLister(profile?.review_count_as_lister ?? 0);

      // Items Listed (owner)
      const { count: listedCount } = await supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", user.id);
      setItemsListed(listedCount ?? 0);

      // Rentals Completed (renter perspective — only truly completed)
      const { count: completedCount } = await supabase
        .from("requests")
        .select("id", { count: "exact", head: true })
        .eq("renter_id", user.id)
        .eq("status", "completed");
      setRentalsCompleted(completedCount ?? 0);

      setLoading(false);
    }
    loadUser();
  }, [navigate]);

  async function handleLogOut() {
    await supabase.auth.signOut();
    navigate("/");
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      {/* Avatar + name */}
      <div className="flex flex-col items-center mb-6">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-20 h-20 rounded-full object-cover mb-3"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-brand flex items-center justify-center text-white text-2xl mb-3">
            {initials}
          </div>
        )}
        <h2 className="text-[#1F2937]">{displayName}</h2>
        <p className="text-xs text-[#6B7280] mt-0.5">{email}</p>
        <div className="flex items-center gap-1 mt-1">
          <Shield size={12} className="text-[#22C55E]" />
          <span className="text-xs text-[#22C55E]">{t("verified")}</span>
        </div>
        {ratingAsLister !== null && ratingAsLister > 0 && reviewCountAsLister > 0 && (
          <div className="flex items-center gap-1 mt-1">
            <Star size={12} className="text-[#F59E0B] fill-[#F59E0B]" />
            <span className="text-xs" style={{ color: "#F59E0B" }}>
              {ratingAsLister.toFixed(1)} ({reviewCountAsLister} {isZh ? zh("個評價") : "reviews"})
            </span>
          </div>
        )}
        <span className="text-xs text-[#6B7280] mt-0.5">{t("memberSince")} {memberSince}</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 text-center">
          <p className="text-2xl text-brand" style={{ fontWeight: 600 }}>{itemsListed}</p>
          <p className="text-xs text-[#6B7280]">{t("itemsListed")}</p>
        </div>
        <button
          onClick={() => navigate("/earnings")}
          className="bg-white rounded-xl border border-[#E5E7EB] p-4 text-center hover:border-brand transition-colors relative"
        >
          <p className="text-2xl text-brand" style={{ fontWeight: 600 }}>{rentalsCompleted}</p>
          <p className="text-xs text-[#6B7280]">{t("rentalsCompleted")}</p>
          <ChevronRight size={12} className="absolute top-2 right-2 text-[#D1D5DB]" />
        </button>
      </div>

      {/* Menu */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] divide-y divide-[#E5E7EB]">
        <MenuItem icon={Edit} label={t("editProfile")} onClick={() => navigate("/edit-profile")} />
        <MenuItem icon={BarChart3} label={t("admin")} onClick={() => navigate("/admin")} />
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Globe size={18} className="text-[#6B7280]" />
            <span className="text-sm font-medium">{t("language")}</span>
          </div>
          <div className="flex rounded-full border border-[#E5E7EB] overflow-hidden text-xs">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => setLang(l.code)}
                aria-pressed={lang === l.code}
                title={l.label}
                className={`px-3 py-1 transition-colors ${lang === l.code ? "bg-brand text-white" : "text-brand"}`}
              >
                {l.short}
              </button>
            ))}
          </div>
        </div>
        <MenuItem icon={Bell} label={t("notifications")} onClick={() => {}} toggle />
        <MenuItem icon={Mail} label={t("emailPrefs")} onClick={() => navigate("/email-preferences")} />
      </div>

      {/* Log out */}
      <button
        onClick={handleLogOut}
        className="w-full mt-6 py-3 border border-[#EF4444] text-[#EF4444] rounded-xl flex items-center justify-center gap-2 hover:bg-[#EF4444]/5"
      >
        <LogOut size={16} />{t("logOut")}
      </button>
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick, toggle }: {
  icon: any; label: string; onClick: () => void; toggle?: boolean
}) {
  const [on, setOn] = useState(true);
  return (
    <button
      onClick={toggle ? () => setOn(!on) : onClick}
      className="w-full flex items-center justify-between px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <Icon size={18} className="text-[#6B7280]" />
        <span className="text-sm">{label}</span>
      </div>
      {toggle ? (
        <div className={`w-10 h-5 rounded-full transition-colors ${on ? "bg-brand" : "bg-[#E5E7EB]"} relative`}>
          <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${on ? "left-5" : "left-0.5"}`} />
        </div>
      ) : (
        <ChevronRight size={16} className="text-[#6B7280]" />
      )}
    </button>
  );
}
