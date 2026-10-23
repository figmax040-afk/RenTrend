import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { Home, Search, PlusCircle, Package, User, Globe } from "lucide-react";
import { useI18n } from "./i18n";
import { supabase } from "../../lib/supabase";
import logoImg from "../../assets/lendy-logo.png";

// Brand colours come from the Lendy logo; tokens (brand, brand-hover, …) live in styles/theme.css

const navItems = [
  { key: "home",     icon: Home,       path: "/home" },
  { key: "browse",   icon: Search,     path: "/browse" },
  { key: "listItem", icon: PlusCircle, path: "/create" },
  { key: "activity", icon: Package,    path: "/activity" },
  { key: "profile",  icon: User,       path: "/profile" },
];

// Top-level tabs get the mobile brand bar; detail pages keep their own headers
const mobileBrandBarPaths = ["/home", "/browse", "/create", "/activity", "/profile"];

export function Layout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { t, lang, setLang } = useI18n();
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function checkCounts() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setPendingCount(0); setUnreadCount(0); return; }

      // Pending requests for lister
      const { data: listings } = await supabase
        .from("listings")
        .select("id")
        .eq("owner_id", user.id);

      const listingIds = (listings || []).map((l) => l.id);
      if (listingIds.length > 0) {
        const { count } = await supabase
          .from("requests")
          .select("id", { count: "exact", head: true })
          .in("listing_id", listingIds)
          .eq("status", "pending");
        setPendingCount(count || 0);
      } else {
        setPendingCount(0);
      }

      // Unread messages: get all request IDs where user is renter or lister
      const { data: renterReqs } = await supabase
        .from("requests")
        .select("id")
        .eq("renter_id", user.id);

      const { data: listerReqs } = listingIds.length > 0
        ? await supabase.from("requests").select("id").in("listing_id", listingIds)
        : { data: [] };

      const allRequestIds = [
        ...((renterReqs || []).map((r) => r.id)),
        ...((listerReqs || []).map((r) => r.id)),
      ];

      if (allRequestIds.length > 0) {
        const { count: msgCount } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .is("read_at", null)
          .neq("sender_id", user.id)
          .in("request_id", allRequestIds);
        setUnreadCount(msgCount || 0);
      } else {
        setUnreadCount(0);
      }
    }
    checkCounts();

    // Also refresh when the user comes back to the tab
    window.addEventListener("focus", checkCounts);
    return () => window.removeEventListener("focus", checkCounts);
  }, [location.pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFB]">
      {/* ── Desktop top bar ── */}
      <header className="hidden md:flex items-center justify-between px-8 py-2 bg-white border-b border-[#E5E7EB] sticky top-0 z-50">
        {/* Logo */}
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-2 focus:outline-none"
        >
          <img src={logoImg} alt="Lendy" className="h-12 w-auto object-contain" />
        </button>

        {/* Navigation links */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <button
                key={item.key}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  active
                    ? "bg-brand/10 text-brand"
                    : "text-[#6B7280] hover:text-brand"
                }`}
              >
                <div className="relative">
                  <item.icon size={18} />
                  {item.key === "activity" && (pendingCount + unreadCount) > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#EF4444] text-white rounded-full flex items-center justify-center text-[8px] font-medium">
                      {(pendingCount + unreadCount) > 9 ? "9+" : pendingCount + unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-sm">{t(item.key)}</span>
              </button>
            );
          })}

          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === "en" ? "zh" : "en")}
            className="flex items-center gap-1 ml-2 px-3 py-1.5 rounded-lg text-[#6B7280] hover:text-brand border border-[#E5E7EB]"
          >
            <Globe size={16} />
            <span className="text-sm">{lang === "en" ? "中文" : "EN"}</span>
          </button>
        </nav>
      </header>

      {/* ── Mobile brand bar ── */}
      {mobileBrandBarPaths.includes(location.pathname) && (
        <header className="md:hidden flex items-center justify-between px-4 pt-3 pb-1 bg-[#F9FAFB]">
          <button onClick={() => navigate("/home")} className="focus:outline-none" aria-label="Lendy home">
            <img src={logoImg} alt="Lendy" className="h-8 w-auto object-contain" />
          </button>
          <button
            onClick={() => setLang(lang === "en" ? "zh" : "en")}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[#6B7280] hover:text-brand border border-[#E5E7EB] bg-white"
          >
            <Globe size={14} />
            <span className="text-xs">{lang === "en" ? "中文" : "EN"}</span>
          </button>
        </header>
      )}

      {/* ── Page content ── */}
      <main className="flex-1 pb-20 md:pb-4">
        <Outlet />
      </main>

      {/* ── Mobile bottom nav ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#E5E7EB] flex justify-around py-2 z-50">
        {navItems.map((item) => {
          const active = location.pathname.startsWith(item.path);
          return (
            <button
              key={item.key}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 ${
                active ? "text-brand" : "text-[#6B7280]"
              }`}
            >
              <div className="relative">
                <item.icon size={20} />
                {item.key === "activity" && (pendingCount + unreadCount) > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#EF4444] text-white rounded-full flex items-center justify-center text-[8px] font-medium">
                    {(pendingCount + unreadCount) > 9 ? "9+" : pendingCount + unreadCount}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 10 }}>{t(item.key)}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
