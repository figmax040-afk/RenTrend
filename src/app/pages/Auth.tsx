import { useState } from "react";
import { useNavigate } from "react-router";
import { Mail, Lock, ArrowLeft, Globe } from "lucide-react";
import { useI18n } from "../components/i18n";
import { IMAGES } from "../components/data";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import logoImg from "figma:asset/bd9047f3cfe66a474b36f7d8d76e6866cb376b44.png";

/* ── Shared hero banner ── */
function AuthHero() {
  return (
    <div className="relative h-52 w-full overflow-hidden">
      <ImageWithFallback
        src={IMAGES.authHero}
        alt="Home electronics"
        className="w-full h-full object-cover"
      />
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1E6B1E]/60 to-[#1E6B1E]/10" />
      {/* Logo centred on the image */}
      <div className="absolute inset-0 flex items-center justify-center">
        <img src={logoImg} alt="RenTrend" className="h-20 w-auto object-contain drop-shadow-lg" />
      </div>
    </div>
  );
}

/* ── Sign Up ── */
export function SignUp() {
  const navigate = useNavigate();
  const { t, lang, setLang } = useI18n();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between p-4 absolute top-0 left-0 right-0 z-10">
        <button onClick={() => navigate("/")} className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-[#1E6B1E]">
          <ArrowLeft size={18} />
        </button>
        <button
          onClick={() => setLang(lang === "en" ? "zh" : "en")}
          className="flex items-center gap-1 text-sm text-white bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full"
        >
          <Globe size={14} />{lang === "en" ? "中文" : "EN"}
        </button>
      </div>

      {/* Hero */}
      <AuthHero />

      {/* Form */}
      <div className="flex-1 flex flex-col px-6 max-w-md mx-auto w-full pt-6">
        <h1 className="text-[#1B3D1B] mb-1" style={{ fontSize: 26 }}>{t("signUp")}</h1>
        <p className="text-[#6B7280] text-sm mb-6">{t("verifyStudent")}</p>

        <div className="space-y-4">
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="email"
              placeholder={t("email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#C8E6C9] bg-white focus:outline-none focus:border-[#1E6B1E] text-sm"
            />
          </div>
          <p className="text-[10px] text-[#6B7280] -mt-2 ml-1">e.g. student@connect.hku.hk</p>

          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="password"
              placeholder={t("password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#C8E6C9] bg-white focus:outline-none focus:border-[#1E6B1E] text-sm"
            />
          </div>

          <button
            onClick={() => navigate("/home")}
            className="w-full py-3 bg-[#1E6B1E] text-white rounded-xl hover:bg-[#155215] transition-colors"
          >
            {t("signUp")}
          </button>

          <div className="relative flex items-center my-2">
            <div className="flex-1 h-px bg-[#E5E7EB]" />
            <span className="px-3 text-xs text-[#6B7280]">or</span>
            <div className="flex-1 h-px bg-[#E5E7EB]" />
          </div>

          <button className="w-full py-3 bg-white border border-[#E5E7EB] rounded-xl text-sm text-[#1F2937] hover:bg-[#F0F7F0] transition-colors">
            {t("googleSignIn")}
          </button>
        </div>

        <p className="text-center text-sm text-[#6B7280] mt-6">
          {t("hasAccount")}{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-[#1E6B1E]"
            style={{ fontWeight: 500 }}
          >
            {t("logIn")}
          </button>
        </p>
      </div>
    </div>
  );
}

/* ── Log In ── */
export function Login() {
  const navigate = useNavigate();
  const { t, lang, setLang } = useI18n();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between p-4 absolute top-0 left-0 right-0 z-10">
        <button onClick={() => navigate("/")} className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-[#1E6B1E]">
          <ArrowLeft size={18} />
        </button>
        <button
          onClick={() => setLang(lang === "en" ? "zh" : "en")}
          className="flex items-center gap-1 text-sm text-white bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full"
        >
          <Globe size={14} />{lang === "en" ? "中文" : "EN"}
        </button>
      </div>

      {/* Hero */}
      <AuthHero />

      {/* Form */}
      <div className="flex-1 flex flex-col px-6 max-w-md mx-auto w-full pt-6">
        <h1 className="text-[#1B3D1B] mb-6" style={{ fontSize: 26 }}>{t("logIn")}</h1>

        <div className="space-y-4">
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="email"
              placeholder={t("email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#C8E6C9] bg-white focus:outline-none focus:border-[#1E6B1E] text-sm"
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="password"
              placeholder={t("password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#C8E6C9] bg-white focus:outline-none focus:border-[#1E6B1E] text-sm"
            />
          </div>

          <div className="text-right">
            <button className="text-sm text-[#1E6B1E]">{t("forgotPassword")}</button>
          </div>

          <button
            onClick={() => navigate("/home")}
            className="w-full py-3 bg-[#1E6B1E] text-white rounded-xl hover:bg-[#155215] transition-colors"
          >
            {t("logIn")}
          </button>

          <div className="relative flex items-center my-2">
            <div className="flex-1 h-px bg-[#E5E7EB]" />
            <span className="px-3 text-xs text-[#6B7280]">or</span>
            <div className="flex-1 h-px bg-[#E5E7EB]" />
          </div>

          <button className="w-full py-3 bg-white border border-[#E5E7EB] rounded-xl text-sm text-[#1F2937] hover:bg-[#F0F7F0] transition-colors">
            {t("googleSignIn")}
          </button>
        </div>

        <p className="text-center text-sm text-[#6B7280] mt-6">
          {t("noAccount")}{" "}
          <button
            onClick={() => navigate("/signup")}
            className="text-[#1E6B1E]"
            style={{ fontWeight: 500 }}
          >
            {t("signUp")}
          </button>
        </p>
      </div>
    </div>
  );
}
