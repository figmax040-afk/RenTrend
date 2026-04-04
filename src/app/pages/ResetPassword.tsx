import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Lock, AlertCircle, CheckCircle } from "lucide-react";
import { useI18n } from "../components/i18n";
import { supabase } from "../../lib/supabase";
import { IMAGES } from "../components/data";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const logoImg = "https://placehold.co/400x300?text=RenTrend";

export function ResetPassword() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [ready,    setReady]    = useState(false);
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [done,     setDone]     = useState(false);

  useEffect(() => {
    // Supabase fires PASSWORD_RECOVERY when user arrives via the reset link
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

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
      setDone(true);
      setTimeout(() => navigate("/login"), 2000);
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex flex-col">
      {/* Hero */}
      <div className="relative h-52 w-full overflow-hidden">
        <ImageWithFallback src={IMAGES.authHero} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#1E6B1E]/60 to-[#1E6B1E]/10" />
        <div className="absolute inset-0 flex items-center justify-center">
          <img src={logoImg} alt="RenTrend" className="h-20 w-auto object-contain drop-shadow-lg" />
        </div>
      </div>

      <div className="flex-1 flex flex-col px-6 max-w-md mx-auto w-full pt-8">
        <h1 className="text-[#1B3D1B] mb-2" style={{ fontSize: 26 }}>Set new password</h1>

        {done ? (
          <div className="flex flex-col items-center py-10 gap-3">
            <CheckCircle size={40} className="text-[#22C55E]" />
            <p className="text-[#1F2937] text-sm text-center">{t("passwordUpdated")}</p>
          </div>
        ) : !ready ? (
          <p className="text-[#6B7280] text-sm mt-4">
            Waiting for the reset link… Make sure you opened this page from the link in your email.
          </p>
        ) : (
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
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#C8E6C9] bg-white focus:outline-none focus:border-[#1E6B1E] text-sm"
              />
            </div>

            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B7280]" />
              <input
                type="password"
                placeholder={t("confirmPassword")}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#C8E6C9] bg-white focus:outline-none focus:border-[#1E6B1E] text-sm"
              />
            </div>

            <button
              onClick={handleUpdate}
              disabled={loading}
              className="w-full py-3 bg-[#1E6B1E] text-white rounded-xl hover:bg-[#155215] transition-colors disabled:opacity-60"
            >
              {loading ? "Updating..." : t("updatePassword")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
