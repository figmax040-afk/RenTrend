import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { Lock, AlertCircle } from "lucide-react";
import { useI18n } from "../components/i18n";
import { supabase } from "../../lib/supabase";
import { IMAGES } from "../components/data";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

import logoImg from "../../assets/lendy-logo.png";

export function ResetPassword() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<"verifying" | "ready" | "error">("verifying");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  useEffect(() => {
    const token_hash = searchParams.get("token_hash");
    const type       = searchParams.get("type");
    if (!token_hash || type !== "recovery") {
      setStatus("error");
      return;
    }
    supabase.auth.verifyOtp({ token_hash, type: "recovery" }).then(({ error: e }) => {
      setStatus(e ? "error" : "ready");
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpdate() {
    setError("");
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
    } else {
      navigate("/login", { state: { successBanner: "Password updated successfully — please log in" } });
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      {/* Hero */}
      <div className="relative h-52 w-full overflow-hidden">
        <ImageWithFallback src={IMAGES.authHero} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/70 to-[#F9FAFB]" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/15 to-brand-green/15" />
        <div className="absolute inset-0 flex items-center justify-center">
          <img src={logoImg} alt="Lendy" className="h-16 w-auto max-w-[75vw] object-contain" />
        </div>
      </div>

      <div className="flex-1 flex flex-col px-6 max-w-md mx-auto w-full pt-8">
        <h1 className="text-brand-ink mb-2" style={{ fontSize: 26 }}>Set new password</h1>

        {status === "verifying" && (
          <p className="text-[#6B7280] text-sm mt-4">Verifying reset link…</p>
        )}

        {status === "error" && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              <AlertCircle size={16} />
              This reset link has expired or is invalid. Please request a new one.
            </div>
            <Link to="/login" className="block text-center text-sm text-brand font-medium">
              Back to Login
            </Link>
          </div>
        )}

        {status === "ready" && (
          <div className="space-y-4 mt-4">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                <AlertCircle size={16} />{error}
              </div>
            )}

            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <input
                type="password"
                placeholder={t("newPassword")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-brand-border bg-white focus:outline-none focus:border-brand text-sm"
              />
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <input
                type="password"
                placeholder={t("confirmPassword")}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-brand-border bg-white focus:outline-none focus:border-brand text-sm"
              />
            </div>

            <button
              onClick={handleUpdate}
              disabled={loading}
              className="w-full py-3 bg-brand text-white rounded-xl hover:bg-brand-hover transition-colors disabled:opacity-60"
            >
              {loading ? "Updating..." : t("updatePassword")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
