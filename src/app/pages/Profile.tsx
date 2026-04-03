import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Shield, Edit, Bell, Mail, LogOut, Globe, ChevronRight, BarChart3 } from "lucide-react";
import { useI18n } from "../components/i18n";
import { supabase } from "../../lib/supabase";

export function Profile() {
  const navigate = useNavigate();
  const { t, lang, setLang } = useI18n();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [initials, setInitials] = useState("?");
  const [memberSince, setMemberSince] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login");
        return;
      }
      const email = user.email ?? "";
      setEmail(email);

      // Display name: use metadata name if set, otherwise derive from email
      const name = user.user_metadata?.name || email.split("@")[0];
      setDisplayName(name);
      setInitials(name.charAt(0).toUpperCase());

      // Member since: format the created_at date
      const date = new Date(user.created_at);
      setMemberSince(date.toLocaleDateString("en-US", { month: "short", year: "numeric" }));
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
        <div className="w-8 h-8 border-2 border-[#1E6B1E] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-6">
      {/* Avatar + name */}
      <div className="flex flex-col items-center mb-6">
        <div className="w-20 h-20 rounded-full bg-[#1E6B1E] flex items-center justify-center text-white text-2xl mb-3">
          {initials}
        </div>
        <h2 className="text-[#1F2937]">{displayName}</h2>
        <p className="text-xs text-[#6B7280] mt-0.5">{email}</p>
        <div className="flex items-center gap-1 mt-1">
          <Shield size={12} className="text-[#22C55E]" />
          <span className="text-xs text-[#22C55E]">{t("verified")}</span>
        </div>
        <span className="text-xs text-[#6B7280] mt-0.5">{t("memberSince")} {memberSince}</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 text-center">
          <p className="text-2xl text-[#1E6B1E]" style={{ fontWeight: 600 }}>0</p>
          <p className="text-xs text-[#6B7280]">{t("itemsListed")}</p>
        </div>
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 text-center">
          <p className="text-2xl text-[#1E6B1E]" style={{ fontWeight: 600 }}>0</p>
          <p className="text-xs text-[#6B7280]">{t("rentalsCompleted")}</p>
        </div>
      </div>

      {/* Menu */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] divide-y divide-[#E5E7EB]">
        <MenuItem icon={Edit} label={t("editProfile")} onClick={() => navigate("/edit-profile")} />
        <MenuItem icon={BarChart3} label={t("admin")} onClick={() => navigate("/admin")} />
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Globe size={18} className="text-[#6B7280]" />
            <span className="text-sm">{t("language")}</span>
          </div>
          <button
            onClick={() => setLang(lang === "en" ? "zh" : "en")}
            className="px-3 py-1 rounded-full text-xs border border-[#E5E7EB] text-[#1E6B1E]"
          >
            {lang === "en" ? "中文" : "English"}
          </button>
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
        <div className={`w-10 h-5 rounded-full transition-colors ${on ? "bg-[#1E6B1E]" : "bg-[#E5E7EB]"} relative`}>
          <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-all ${on ? "left-5" : "left-0.5"}`} />
        </div>
      ) : (
        <ChevronRight size={16} className="text-[#6B7280]" />
      )}
    </button>
  );
}
