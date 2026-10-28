import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { ChevronRight, Recycle, Clock, Package } from "lucide-react";
import { useI18n } from "../components/i18n";
import { LanguageSelect } from "../components/LanguageSelect";
import { IMAGES } from "../components/data";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import logoImg from "../../assets/lendy-logo.png";
import { useAuth } from "../../lib/useAuth";

const slides = [
  { key: "slide1Title", icon: Package, color: "#1A7A86" },
  { key: "slide2Title", icon: Clock,   color: "#3F94CA" },
  { key: "slide3Title", icon: Recycle, color: "#3E9E74" },
];

export function Onboarding() {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const { t } = useI18n();
  const { user, loading } = useAuth();

  // Returning users who are already signed in skip the intro
  useEffect(() => {
    if (!loading && user) navigate("/home", { replace: true });
  }, [loading, user, navigate]);

  return (
    <div className="min-h-screen bg-brand-soft flex flex-col">
      {/* Skip + language toggle */}
      <div className="flex items-center justify-between p-4">
        {current < 2 ? (
          <button onClick={() => setCurrent(2)} className="px-3 py-1.5 text-sm text-[#6B7280] hover:text-brand">
            {t("skip")}
          </button>
        ) : <span />}
        <LanguageSelect
          iconSize={16}
          className="gap-1.5 px-3 py-1.5 rounded-full border border-brand-border bg-white text-sm text-[#6B7280] hover:text-brand"
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 max-w-md mx-auto w-full">
        {/* Lendy logo */}
        <img src={logoImg} alt="Lendy" className="h-20 w-auto max-w-full object-contain mb-6" />

        {/* Hero image — home electronics, not students */}
        <div className="w-full h-44 rounded-2xl overflow-hidden mb-8 shadow-sm">
          <ImageWithFallback
            src={IMAGES.campus}
            alt="Home electronics"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Slide content */}
        <div className="text-center mb-8">
          {(() => {
            const Icon = slides[current].icon;
            return (
              <div
                className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
                style={{ backgroundColor: slides[current].color + "18" }}
              >
                <Icon size={32} style={{ color: slides[current].color }} />
              </div>
            );
          })()}
          <h1
            className="text-brand-ink whitespace-pre-line"
            style={{ fontSize: 24, lineHeight: 1.35 }}
          >
            {t(slides[current].key)}
          </h1>
        </div>

        {/* Dot indicators */}
        <div className="flex gap-2 mb-8">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`${i + 1} / ${slides.length}`}
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i === current ? "bg-brand" : "bg-brand-border"
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        {current < 2 ? (
          <button
            onClick={() => setCurrent(current + 1)}
            className="w-full py-3 bg-brand text-white rounded-xl flex items-center justify-center gap-1 hover:bg-brand-hover transition-colors"
          >
            {t("next")}
            <ChevronRight size={18} />
          </button>
        ) : (
          <div className="w-full space-y-3">
            <button
              onClick={() => navigate("/signup")}
              className="w-full py-3 bg-brand text-white rounded-xl hover:bg-brand-hover transition-colors"
            >
              {t("getStarted")}
            </button>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3 bg-white text-brand rounded-xl border border-brand-border hover:bg-brand-soft transition-colors"
            >
              {t("haveAccount")}
            </button>
            <button
              onClick={() => navigate("/browse")}
              className="w-full py-2 text-sm text-brand hover:underline"
            >
              {t("browseFirst")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
