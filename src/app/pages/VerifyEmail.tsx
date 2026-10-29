import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router";
import { CheckCircle, AlertCircle, Loader2, MailCheck } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { AuthHero } from "../components/AuthHero";
import { useI18n } from "../components/i18n";

export function VerifyEmail() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "success" | "error" | "check-email">("verifying");

  // Email passed via router state (e.g. from Login when email not confirmed)
  const stateEmail = (location.state as { email?: string })?.email ?? "";

  useEffect(() => {
    const token_hash = searchParams.get("token_hash");
    const type       = searchParams.get("type");

    if (!token_hash) {
      // No token — navigated here without a link (e.g. from Login redirect)
      setStatus("check-email");
      return;
    }
    if (type !== "signup") {
      setStatus("error");
      return;
    }
    supabase.auth.verifyOtp({ token_hash, type: "signup" }).then(({ error }) => {
      setStatus(error ? "error" : "success");
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      <AuthHero />

      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-md mx-auto w-full gap-6">
        {status === "verifying" && (
          <>
            <Loader2 size={40} className="text-brand animate-spin" />
            <p className="text-[#6B7280] text-sm">{t("verifyingEmail")}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center">
              <CheckCircle size={40} className="text-brand" />
            </div>
            <h1 className="text-brand-ink text-center" style={{ fontSize: 26 }}>{t("emailVerified")}</h1>
            <button
              onClick={() => navigate("/home")}
              className="w-full py-3 bg-brand text-white rounded-xl hover:bg-brand-hover transition-colors"
            >
              {t("goToHome")}
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle size={40} className="text-red-500" />
            </div>
            <p className="text-[#1F2937] text-sm text-center">
              {t("verifyLinkExpired")}
            </p>
            <button
              onClick={() => navigate("/signup")}
              className="w-full py-3 bg-white text-brand rounded-xl border border-brand-border hover:bg-brand-soft transition-colors"
            >
              {t("backToSignUp")}
            </button>
          </>
        )}

        {status === "check-email" && (
          <>
            <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center">
              <MailCheck size={40} className="text-brand" />
            </div>
            <h1 className="text-brand-ink text-center" style={{ fontSize: 26 }}>{t("checkYourEmail")}</h1>
            <p className="text-[#6B7280] text-sm text-center">
              {stateEmail
                ? `${t("confirmLinkSentPre")}${stateEmail}${t("confirmLinkSentPost")}`
                : t("verifyEmailMsg")}
            </p>
            <p className="text-[#9CA3AF] text-xs text-center">{t("checkSpam")}</p>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3 bg-white text-brand rounded-xl border border-brand-border hover:bg-brand-soft transition-colors"
            >
              {t("backToLogin")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
