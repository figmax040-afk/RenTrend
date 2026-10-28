import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { loginPath } from "../../lib/authRedirect";
import { useI18n } from "../components/i18n";

export function EditProfile() {
  const navigate = useNavigate();
  const { t, isZh, zh } = useI18n();
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate(loginPath()); return; }
      setUserId(user.id);

      const { data } = await supabase
        .from("profiles")
        .select("name, phone, avatar_url")
        .eq("id", user.id)
        .single();

      if (data) {
        setName(data.name ?? "");
        setPhone(data.phone ?? "");
        setAvatarUrl(data.avatar_url ?? null);
      }
      setLoading(false);
    }
    load();
  }, [navigate]);

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setUploadError("");
    setUploading(true);

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const path = `${userId}/avatar_${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (uploadErr) {
      setUploadError(t("uploadPhotoFailed"));
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
    const publicUrl = urlData.publicUrl;

    const { error: updateErr } = await supabase
      .from("profiles")
      .upsert({ id: userId, avatar_url: publicUrl });

    if (updateErr) {
      setUploadError(t("uploadPhotoSaveFailed"));
      setUploading(false);
      return;
    }

    setAvatarUrl(publicUrl);
    setAvatarPreview(publicUrl);
    setUploading(false);
  }

  async function handleSave() {
    setError("");
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate(loginPath()); return; }

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        name,
        phone,
        updated_at: new Date().toISOString(),
      });

    setSaving(false);
    if (upsertError) {
      setError(upsertError.message);
    } else {
      navigate("/profile");
    }
  }

  const displayAvatar = avatarPreview ?? avatarUrl;
  const initial = (name || "U").charAt(0).toUpperCase();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate("/profile")} className="text-[#6B7280]"><ArrowLeft size={20} /></button>
        <h2 className="text-[#1F2937]">{t("editProfile")}</h2>
      </div>

      {/* Avatar upload */}
      <div className="flex flex-col items-center mb-6">
        <div className="relative">
          {uploading ? (
            <div className="w-20 h-20 rounded-full bg-[#E5E7EB] flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            </div>
          ) : displayAvatar ? (
            <img
              src={displayAvatar}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-brand flex items-center justify-center text-white text-2xl">
              {initial}
            </div>
          )}
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="mt-2 text-sm text-brand disabled:opacity-50"
        >
          {t("changePhoto")}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.heic,.heif"
          className="hidden"
          onChange={handleAvatarChange}
        />
        {uploadError && (
          <p className="text-xs text-red-600 mt-1">{uploadError}</p>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-[#6B7280]">{t("displayName")}</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={isZh ? zh("你的名字") : "Your name"}
            className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm focus:outline-none focus:border-brand"
          />
        </div>
        <div>
          <label className="text-sm text-[#6B7280]">{t("phone")}</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+852 xxxx xxxx"
            className="w-full mt-1 px-4 py-2.5 rounded-xl border border-[#E5E7EB] bg-white text-sm focus:outline-none focus:border-brand"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">{error}</p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-brand text-white rounded-xl hover:bg-brand-hover transition-colors disabled:opacity-60"
        >
          {saving ? t("saving") : t("saveChanges")}
        </button>
      </div>
    </div>
  );
}
