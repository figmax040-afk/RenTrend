import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router";
import { CheckCircle, AlertCircle, Loader2, MailCheck } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { IMAGES } from "../components/data";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

import logoImg from "../../assets/lendy-logo.png";

export function VerifyEmail() {
  const navigate = useNavigate();
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
      <div className="relative h-52 w-full overflow-hidden">
        <ImageWithFallback src={IMAGES.authHero} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/70 to-[#F9FAFB]" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/15 to-brand-green/15" />
        <div className="absolute inset-0 flex items-center justify-center">
          <img src={logoImg} alt="Lendy" className="h-16 w-auto max-w-[75vw] object-contain" />
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-md mx-auto w-full gap-6">
        {status === "verifying" && (
          <>
            <Loader2 size={40} className="text-brand animate-spin" />
            <p className="text-[#6B7280] text-sm">Verifying your email…</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center">
              <CheckCircle size={40} className="text-brand" />
            </div>
            <h1 className="text-brand-ink text-center" style={{ fontSize: 26 }}>Email verified!</h1>
            <button
              onClick={() => navigate("/home")}
              className="w-full py-3 bg-brand text-white rounded-xl hover:bg-brand-hover transition-colors"
            >
              Go to Home
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle size={40} className="text-red-500" />
            </div>
            <p className="text-[#1F2937] text-sm text-center">
              This verification link has expired or has already been used.
            </p>
            <button
              onClick={() => navigate("/signup")}
              className="w-full py-3 bg-white text-brand rounded-xl border border-brand-border hover:bg-brand-soft transition-colors"
            >
              Back to Sign Up
            </button>
          </>
        )}

        {status === "check-email" && (
          <>
            <div className="w-20 h-20 rounded-full bg-brand/10 flex items-center justify-center">
              <MailCheck size={40} className="text-brand" />
            </div>
            <h1 className="text-brand-ink text-center" style={{ fontSize: 26 }}>Check your email</h1>
            <p className="text-[#6B7280] text-sm text-center">
              {stateEmail
                ? `We sent a confirmation link to ${stateEmail}. Click it to activate your account.`
                : "Please check your email for a verification link and click it to activate your account."}
            </p>
            <p className="text-[#9CA3AF] text-xs text-center">Didn't receive it? Check your spam folder.</p>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3 bg-white text-brand rounded-xl border border-brand-border hover:bg-brand-soft transition-colors"
            >
              Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}
