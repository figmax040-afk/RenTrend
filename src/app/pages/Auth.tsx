import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { Mail, Lock, ArrowLeft, Globe, AlertCircle, User, Phone, MailCheck, CheckCircle } from "lucide-react";
import { useI18n } from "../components/i18n";
import { IMAGES } from "../components/data";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { supabase } from "../../lib/supabase";

const logoImg = "https://placehold.co/400x300?text=RenTrend";

/* ── Shared hero banner ── */
function AuthHero() {
  return (
    <div className="relative h-52 w-full overflow-hidden">
      <ImageWithFallback
        src={IMAGES.authHero}
        alt="Home electronics"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#1E6B1E]/60 to-[#1E6B1E]/10" />
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
  const [name,      setName]      = useState("");
  const [phone,     setPhone]     = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState("");
  const [emailSent, setEmailSent] = useState(false);

  async function handleSignUp() {
    setError("");
    if (!name || !phone || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name, phone } },
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message);
    } else if (data.session === null) {
      // Email confirmation required — show inline confirmation
      setEmailSent(true);
    } else {
      navigate("/home");
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
        <AuthHero />
        <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-md mx-auto w-full gap-4 text-center">
          <div className="w-20 h-20 rounded-full bg-[#1E6B1E]/10 flex items-center justify-center">
            <CheckCircle size={40} className="text-[#1E6B1E]" />
          </div>
          <h1 className="text-[#1B3D1B]" style={{ fontSize: 26 }}>Check your email</h1>
          <p className="text-[#6B7280] text-sm">
            We sent a confirmation link to <span className="text-[#1E6B1E] font-medium">{email}</span>. Click it to activate your account.
          </p>
          <p className="text-[#9CA3AF] text-xs">Didn't receive it? Check your spam folder.</p>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-3 bg-white text-[#1E6B1E] rounded-xl border border-[#C8E6C9] hover:bg-[#F0F7F0] transition-colors mt-2"
          >
            {t("backToLogin")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
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

      <AuthHero />

      <div className="flex-1 flex flex-col px-6 max-w-md mx-auto w-full pt-6">
        <h1 className="text-[#1B3D1B] mb-1" style={{ fontSize: 26 }}>Join RenTrend</h1>
        <p className="text-[#6B7280] text-sm mb-6">{t("verifyStudent")}</p>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="relative">
            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="text"
              placeholder={t("fullName")}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#C8E6C9] bg-white focus:outline-none focus:border-[#1E6B1E] text-sm"
            />
          </div>

          <div className="relative">
            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="tel"
              placeholder={t("phone")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#C8E6C9] bg-white focus:outline-none focus:border-[#1E6B1E] text-sm"
            />
          </div>

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

          <button
            onClick={handleSignUp}
            disabled={loading}
            className="w-full py-3 bg-[#1E6B1E] text-white rounded-xl hover:bg-[#155215] transition-colors disabled:opacity-60"
          >
            {loading ? "Creating account..." : t("signUp")}
          </button>
        </div>

        <p className="text-center text-sm text-[#6B7280] mt-6">
          {t("hasAccount")}{" "}
          <button onClick={() => navigate("/login")} className="text-[#1E6B1E]" style={{ fontWeight: 500 }}>
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
  const location = useLocation();
  const { t, lang, setLang } = useI18n();
  const [email,         setEmail]         = useState("");
  const [password,      setPassword]      = useState("");
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState("");
  const [showForgot,    setShowForgot]    = useState(false);
  const [forgotEmail,   setForgotEmail]   = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent,    setForgotSent]    = useState(false);
  const [forgotError,   setForgotError]   = useState("");

  const successBanner = (location.state as { successBanner?: string })?.successBanner ?? "";

  async function handleLogin() {
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (loginError) {
      if (loginError.message.toLowerCase().includes("email not confirmed")) {
        navigate("/verify-email", { state: { email } });
      } else {
        setError(loginError.message);
      }
    } else {
      navigate("/home");
    }
  }

  async function handleForgot() {
    setForgotError("");
    if (!forgotEmail) { setForgotError("Please enter your email."); return; }
    setForgotLoading(true);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setForgotLoading(false);
    if (resetError) { setForgotError(resetError.message); } else { setForgotSent(true); }
  }

  function openForgot() {
    setForgotEmail(email);
    setForgotSent(false);
    setForgotError("");
    setShowForgot(true);
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
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

      <AuthHero />

      <div className="flex-1 flex flex-col px-6 max-w-md mx-auto w-full pt-6">
        <h1 className="text-[#1B3D1B] mb-6" style={{ fontSize: 26 }}>{t("logIn")}</h1>

        {successBanner && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-4">
            <CheckCircle size={16} />
            {successBanner}
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

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
            <button onClick={openForgot} className="text-sm text-[#1E6B1E]">{t("forgotPassword")}</button>
          </div>

          {/* Forgot password inline panel */}
          {showForgot && (
            <div className="bg-[#F0F7F0] border border-[#C8E6C9] rounded-xl p-4 space-y-3">
              <p className="text-sm" style={{ fontWeight: 500 }}>Reset your password</p>
              {forgotSent ? (
                <div className="flex items-center gap-2 text-green-700 text-sm">
                  <MailCheck size={16} />
                  {t("resetPasswordSent")}
                </div>
              ) : (
                <>
                  {forgotError && (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded-xl">
                      <AlertCircle size={14} />{forgotError}
                    </div>
                  )}
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
                    <input
                      type="email"
                      placeholder={t("email")}
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#C8E6C9] bg-white focus:outline-none focus:border-[#1E6B1E] text-sm"
                    />
                  </div>
                  <button
                    onClick={handleForgot}
                    disabled={forgotLoading}
                    className="w-full py-2.5 bg-[#1E6B1E] text-white rounded-xl text-sm disabled:opacity-60"
                  >
                    {forgotLoading ? "Sending..." : t("sendResetLink")}
                  </button>
                </>
              )}
              <button onClick={() => setShowForgot(false)} className="text-xs text-[#6B7280] w-full text-center">
                {t("backToLogin")}
              </button>
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full py-3 bg-[#1E6B1E] text-white rounded-xl hover:bg-[#155215] transition-colors disabled:opacity-60"
          >
            {loading ? "Logging in..." : t("logIn")}
          </button>
        </div>

        <p className="text-center text-sm text-[#6B7280] mt-6">
          {t("noAccount")}{" "}
          <button onClick={() => navigate("/signup")} className="text-[#1E6B1E]" style={{ fontWeight: 500 }}>
            {t("signUp")}
          </button>
        </p>
      </div>
    </div>
  );
}

/* ── Verify Email ── */
export function VerifyEmail() {
  const navigate = useNavigate();
  const { t, lang, setLang } = useI18n();
  const location = useLocation();
  const email = (location.state as { email?: string })?.email ?? "";
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleResend() {
    if (!email) return;
    setResendSuccess(false);
    setError("");
    setResendLoading(true);
    const { error: resendError } = await supabase.auth.resend({ type: "signup", email });
    setResendLoading(false);
    if (resendError) {
      setError(resendError.message);
    } else {
      setResendSuccess(true);
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      <div className="flex items-center justify-between p-4 absolute top-0 left-0 right-0 z-10">
        <button onClick={() => navigate("/login")} className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-[#1E6B1E]">
          <ArrowLeft size={18} />
        </button>
        <button
          onClick={() => setLang(lang === "en" ? "zh" : "en")}
          className="flex items-center gap-1 text-sm text-white bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full"
        >
          <Globe size={14} />{lang === "en" ? "中文" : "EN"}
        </button>
      </div>

      <AuthHero />

      <div className="flex-1 flex flex-col items-center px-6 max-w-md mx-auto w-full pt-10">
        <div className="w-20 h-20 rounded-full bg-[#1E6B1E]/10 flex items-center justify-center mb-6">
          <MailCheck size={40} className="text-[#1E6B1E]" />
        </div>

        <h1 className="text-[#1B3D1B] text-center mb-3" style={{ fontSize: 26 }}>
          {t("checkYourEmail")}
        </h1>
        <p className="text-[#6B7280] text-sm text-center mb-2">{t("verifyEmailMsg")}</p>
        {email && (
          <p className="text-[#1E6B1E] text-sm font-medium text-center mb-8">{email}</p>
        )}

        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4 w-full">
            <AlertCircle size={16} />
            {error}
          </div>
        )}
        {resendSuccess && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-4 w-full">
            <MailCheck size={16} />
            {t("emailResent")}
          </div>
        )}

        <div className="w-full space-y-3">
          <button
            onClick={handleResend}
            disabled={resendLoading || !email}
            className="w-full py-3 bg-[#1E6B1E] text-white rounded-xl hover:bg-[#155215] transition-colors disabled:opacity-60"
          >
            {resendLoading ? "Sending..." : t("resendEmail")}
          </button>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-3 bg-white text-[#1E6B1E] rounded-xl border border-[#C8E6C9] hover:bg-[#F0F7F0] transition-colors"
          >
            {t("backToLogin")}
          </button>
        </div>
      </div>
    </div>
  );
}
