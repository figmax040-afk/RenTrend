import { Globe } from "lucide-react";
import { useI18n, LANGS, type Lang } from "./i18n";

/**
 * Compact language picker. Renders as a pill showing the current language;
 * a transparent native <select> sits on top so it works with touch, keyboard and screen readers.
 */
export function LanguageSelect({ className = "", iconSize = 14 }: { className?: string; iconSize?: number }) {
  const { t, lang, setLang } = useI18n();
  const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];
  return (
    <label className={`relative flex items-center gap-1 cursor-pointer ${className}`}>
      <Globe size={iconSize} />
      <span>{current.label}</span>
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value as Lang)}
        aria-label={t("language")}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      >
        {LANGS.map((l) => (
          <option key={l.code} value={l.code}>{l.label}</option>
        ))}
      </select>
    </label>
  );
}
