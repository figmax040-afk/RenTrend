import { Outlet, useNavigate, useLocation } from "react-router";
import { Home, Search, PlusCircle, Package, User, Globe } from "lucide-react";
import { useI18n } from "./i18n";
const logoImg = "https://placehold.co/400x300?text=RenTrend";

// Brand colour palette derived from the RenTrend logo greens
// Primary: #1E6B1E  |  Hover: #155215  |  Light tint: rgba(30,107,30,0.1)

const navItems = [
  { key: "home",      icon: Home,       path: "/home" },
  { key: "browse",    icon: Search,     path: "/browse" },
  { key: "listItem",  icon: PlusCircle, path: "/create" },
  { key: "myListings",icon: Package,    path: "/my-listings" },
  { key: "profile",   icon: User,       path: "/profile" },
];

export function Layout() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { t, lang, setLang } = useI18n();

  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFB]">
      {/* ── Desktop top bar ── */}
      <header className="hidden md:flex items-center justify-between px-8 py-2 bg-white border-b border-[#E5E7EB] sticky top-0 z-50">
        {/* Logo */}
        <button
          onClick={() => navigate("/home")}
          className="flex items-center gap-2 focus:outline-none"
        >
          <img src={logoImg} alt="RenTrend" className="h-20 w-auto object-contain" />
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
                    ? "bg-[#1E6B1E]/10 text-[#1E6B1E]"
                    : "text-[#6B7280] hover:text-[#1E6B1E]"
                }`}
              >
                <item.icon size={18} />
                <span className="text-sm">{t(item.key)}</span>
              </button>
            );
          })}

          {/* Language toggle */}
          <button
            onClick={() => setLang(lang === "en" ? "zh" : "en")}
            className="flex items-center gap-1 ml-2 px-3 py-1.5 rounded-lg text-[#6B7280] hover:text-[#1E6B1E] border border-[#E5E7EB]"
          >
            <Globe size={16} />
            <span className="text-sm">{lang === "en" ? "中文" : "EN"}</span>
          </button>
        </nav>
      </header>

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
                active ? "text-[#1E6B1E]" : "text-[#6B7280]"
              }`}
            >
              <item.icon size={20} />
              <span style={{ fontSize: 10 }}>{t(item.key)}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
