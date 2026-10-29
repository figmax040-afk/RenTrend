import { useState } from "react";
import { useNavigate, useLocation, useSearchParams } from "react-router";
import { Mail, Lock, ArrowLeft, AlertCircle, User, Phone, MailCheck, CheckCircle } from "lucide-react";
import { useI18n } from "../components/i18n";
import { LanguageSelect } from "../components/LanguageSelect";
import { AuthHero } from "../components/AuthHero";
import { supabase } from "../../lib/supabase";
import { safeNext } from "../../lib/authRedirect";

/* ── Sign Up ── */
export function SignUp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextParam = searchParams.get("next");
  const next = safeNext(nextParam);
  const loginLink = nextParam ? `/login?next=${encodeURIComponent(next)}` : "/login";
  const { t } = useI18n();
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
      setError(t("errFillAllFields"));
      return;
    }
    if (password.length < 6) {
      setError(t("errPasswordLength"));
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
      navigate(next);
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
        <AuthHero />
        <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-md mx-auto w-full gap-4 text-center">
          <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center">
            <CheckCircle size={40} className="text-brand" />
          </div>
          <h1 className="text-brand-ink" style={{ fontSize: 26 }}>{t("checkYourEmail")}</h1>
          <p className="text-[#6B7280] text-sm">
            {t("confirmLinkSentPre")}<span className="text-brand font-medium">{email}</span>{t("confirmLinkSentPost")}
          </p>
          <p className="text-[#9CA3AF] text-xs">{t("checkSpam")}</p>
          <button
            onClick={() => navigate(loginLink)}
            className="w-full py-3 bg-white text-brand rounded-xl border border-brand-border hover:bg-brand-soft transition-colors mt-2"
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
        <button onClick={() => navigate("/")} className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-brand">
          <ArrowLeft size={18} />
        </button>
        <LanguageSelect className="text-sm text-brand bg-white/80 border border-brand-border backdrop-blur-sm px-3 py-1 rounded-full" />
      </div>

      <AuthHero />

      <div className="flex-1 flex flex-col px-6 max-w-md mx-auto w-full pt-6">
        <h1 className="text-brand-ink mb-1" style={{ fontSize: 26 }}>{t("joinLendy")}</h1>
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
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-brand-border bg-white focus:outline-none focus:border-brand text-sm"
            />
          </div>

          <div className="relative">
            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="tel"
              placeholder={t("phone")}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-brand-border bg-white focus:outline-none focus:border-brand text-sm"
            />
          </div>

          <div className="relative">
            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="email"
              placeholder={t("email")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-brand-border bg-white focus:outline-none focus:border-brand text-sm"
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="password"
              placeholder={t("password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-brand-border bg-white focus:outline-none focus:border-brand text-sm"
            />
          </div>

          <button
            onClick={handleSignUp}
            disabled={loading}
            className="w-full py-3 bg-brand text-white rounded-xl hover:bg-brand-hover transition-colors disabled:opacity-60"
          >
            {loading ? t("creatingAccount") : t("signUp")}
          </button>
        </div>

        <p className="text-center text-sm text-[#6B7280] mt-6">
          {t("hasAccount")}{" "}
          <button onClick={() => navigate(loginLink)} className="text-brand" style={{ fontWeight: 500 }}>
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
  const [searchParams] = useSearchParams();
  const nextParam = searchParams.get("next");
  const next = safeNext(nextParam);
  const signupLink = nextParam ? `/signup?next=${encodeURIComponent(next)}` : "/signup";
  const { t } = useI18n();
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
      setError(t("errEmailPassword"));
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
      navigate(next);
    }
  }

  async function handleForgot() {
    setForgotError("");
    if (!forgotEmail) { setForgotError(t("errEnterEmail")); return; }
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
        <button onClick={() => navigate("/")} className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-brand">
          <ArrowLeft size={18} />
        </button>
        <LanguageSelect className="text-sm text-brand bg-white/80 border border-brand-border backdrop-blur-sm px-3 py-1 rounded-full" />
      </div>

      <AuthHero />

      <div className="flex-1 flex flex-col px-6 max-w-md mx-auto w-full pt-6">
        <h1 className="text-brand-ink mb-6" style={{ fontSize: 26 }}>{t("logIn")}</h1>

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
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-brand-border bg-white focus:outline-none focus:border-brand text-sm"
            />
          </div>

          <div className="relative">
            <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
            <input
              type="password"
              placeholder={t("password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-brand-border bg-white focus:outline-none focus:border-brand text-sm"
            />
          </div>

          <div className="text-right">
            <button onClick={openForgot} className="text-sm text-brand">{t("forgotPassword")}</button>
          </div>

          {/* Forgot password inline panel */}
          {showForgot && (
            <div className="bg-brand-soft border border-brand-border rounded-xl p-4 space-y-3">
              <p className="text-sm" style={{ fontWeight: 500 }}>{t("resetYourPassword")}</p>
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
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-brand-border bg-white focus:outline-none focus:border-brand text-sm"
                    />
                  </div>
                  <button
                    onClick={handleForgot}
                    disabled={forgotLoading}
                    className="w-full py-2.5 bg-brand text-white rounded-xl text-sm disabled:opacity-60"
                  >
                    {forgotLoading ? t("sending") : t("sendResetLink")}
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
            className="w-full py-3 bg-brand text-white rounded-xl hover:bg-brand-hover transition-colors disabled:opacity-60"
          >
            {loading ? t("loggingIn") : t("logIn")}
          </button>
        </div>

        <p className="text-center text-sm text-[#6B7280] mt-6">
          {t("noAccount")}{" "}
          <button onClick={() => navigate(signupLink)} className="text-brand" style={{ fontWeight: 500 }}>
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
  const { t } = useI18n();
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
        <button onClick={() => navigate("/login")} className="w-8 h-8 rounded-full bg-white/80 flex items-center justify-center text-brand">
          <ArrowLeft size={18} />
        </button>
        <LanguageSelect className="text-sm text-brand bg-white/80 border border-brand-border backdrop-blur-sm px-3 py-1 rounded-full" />
      </div>

      <AuthHero />

      <div className="flex-1 flex flex-col items-center px-6 max-w-md mx-auto w-full pt-10">
        <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center mb-6">
          <MailCheck size={40} className="text-brand" />
        </div>

        <h1 className="text-brand-ink text-center mb-3" style={{ fontSize: 26 }}>
          {t("checkYourEmail")}
        </h1>
        <p className="text-[#6B7280] text-sm text-center mb-2">{t("verifyEmailMsg")}</p>
        {email && (
          <p className="text-brand text-sm font-medium text-center mb-8">{email}</p>
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
            className="w-full py-3 bg-brand text-white rounded-xl hover:bg-brand-hover transition-colors disabled:opacity-60"
          >
            {resendLoading ? t("sending") : t("resendEmail")}
          </button>
          <button
            onClick={() => navigate("/login")}
            className="w-full py-3 bg-white text-brand rounded-xl border border-brand-border hover:bg-brand-soft transition-colors"
          >
            {t("backToLogin")}
          </button>
        </div>
      </div>
    </div>
  );
}
