import { BANNERS } from "./data";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import logoImg from "../../assets/lendy-logo.png";

/* Banner shared by the log in, sign up, verify email and reset password screens */
export function AuthHero() {
  return (
    <div className="relative h-52 w-full overflow-hidden">
      <ImageWithFallback src={BANNERS.authHero} alt="" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-white/75 via-white/45 to-[#F9FAFB]" />
      <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/10 to-brand-green/10" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.85)_0%,rgba(255,255,255,0)_60%)]" />
      <div className="absolute inset-0 flex items-center justify-center">
        <img src={logoImg} alt="Lendy" className="h-16 w-auto max-w-[75vw] object-contain" />
      </div>
    </div>
  );
}
