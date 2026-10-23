import { useState } from "react";
import { useNavigate } from "react-router";
import { ChevronRight, Recycle, Clock, Package, Globe } from "lucide-react";
import { useI18n } from "../components/i18n";
import { IMAGES } from "../components/data";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import logoImg from "../../assets/lendy-logo.png";

const slides = [
  { key: "slide1Title", icon: Package, color: "#1E6B1E" },
  { key: "slide2Title", icon: Clock,   color: "#F4A261" },
  { key: "slide3Title", icon: Recycle, color: "#4CAF50" },
];

export function Onboarding() {
  const [current, setCurrent] = useState(0);
  const navigate = useNavigate();
  const { t, lang, setLang } = useI18n();

  return (
    <div className="min-h-screen bg-[#F0F7F0] flex flex-col">
      {/* Language toggle */}
      <div className="flex justify-end p-4">
        <button
          onClick={() => setLang(lang === "en" ? "zh" : "en")}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#C8E6C9] bg-white text-[#6B7280] hover:text-[#1E6B1E]"
        >
          <Globe size={16} />
          <span className="text-sm">{lang === "en" ? "中文" : "EN"}</span>
        </button>
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
            className="text-[#1B3D1B] whitespace-pre-line"
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
              className={`w-2.5 h-2.5 rounded-full transition-colors ${
                i === current ? "bg-[#1E6B1E]" : "bg-[#C8E6C9]"
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        {current < 2 ? (
          <button
            onClick={() => setCurrent(current + 1)}
            className="w-full py-3 bg-[#1E6B1E] text-white rounded-xl flex items-center justify-center gap-1 hover:bg-[#155215] transition-colors"
          >
            <ChevronRight size={18} />
          </button>
        ) : (
          <div className="w-full space-y-3">
            <button
              onClick={() => navigate("/signup")}
              className="w-full py-3 bg-[#1E6B1E] text-white rounded-xl hover:bg-[#155215] transition-colors"
            >
              {t("getStarted")}
            </button>
            <button
              onClick={() => navigate("/login")}
              className="w-full py-3 bg-white text-[#1E6B1E] rounded-xl border border-[#C8E6C9] hover:bg-[#F0F7F0] transition-colors"
            >
              {t("haveAccount")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
