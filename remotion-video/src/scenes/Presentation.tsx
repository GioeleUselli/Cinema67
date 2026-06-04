import { AbsoluteFill, Img, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { 
  homeScreenshot, loginScreenshot, shopScreenshot, giftcardScreenshot,
  membershipScreenshot, festeScreenshot, programmazioneScreenshot, profiloScreenshot 
} from "./screenshots";

const GOLD = "#d4af37";
const RED = "#b91c1c";
const LIGHT_BG = "#fdfaf6";
const DARK_BG = "#14100c";
const TEXT = "#1c1108";
const MUTED = "#6b5a4e";
const DARK_TEXT = "#f0e8e0";
const DARK_MUTED = "#a89888";

// Slide layout: split screen with text on left, screenshot on right
export const Slide: React.FC<{
  title: string;
  subtitle?: string;
  bullets: string[];
  screenshot: string;
  screenshotLabel?: string;
  reverse?: boolean;
}> = ({ title, subtitle, bullets, screenshot, screenshotLabel, reverse }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const imgOpacity = interpolate(frame, [5, 20], [0, 1], { extrapolateRight: "clamp" });

  const textSide = (
    <div style={{ flex: 1, padding: "50px 50px 50px 70px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
      <div style={{ opacity: titleOpacity }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 4, color: GOLD, marginBottom: 8, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
          {subtitle || "Funzionalità"}
        </div>
        <h2 style={{ fontSize: 32, fontWeight: 700, color: DARK_TEXT, margin: "0 0 20px", fontFamily: "'DM Serif Display', Georgia, serif", lineHeight: 1.2 }}>
          {title}
        </h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {bullets.map((b, i) => {
          const bulletFrame = 10 + i * 8;
          const opacity = interpolate(frame, [bulletFrame, bulletFrame + 10], [0, 1], { extrapolateRight: "clamp" });
          const slideX = interpolate(frame, [bulletFrame, bulletFrame + 10], [20, 0], { extrapolateRight: "clamp" });
          return (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, opacity, transform: `translateX(${slideX}px)` }}>
              <span style={{ color: GOLD, fontSize: 8, marginTop: 6 }}>◆</span>
              <span style={{ fontSize: 14, color: DARK_MUTED, lineHeight: 1.5, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>{b}</span>
            </div>
          );
        })}
      </div>
    </div>
  );

  const imgSide = (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 30, opacity: imgOpacity }}>
      <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid #38302a", boxShadow: "0 8px 40px rgba(0,0,0,0.4)", width: "100%", maxHeight: "75%" }}>
        <Img src={screenshot} style={{ width: "100%", height: "100%", objectFit: "contain", background: LIGHT_BG }} />
      </div>
      {screenshotLabel && (
        <div style={{ marginTop: 10, fontSize: 11, color: DARK_MUTED, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
          {screenshotLabel}
        </div>
      )}
    </div>
  );

  return (
    <AbsoluteFill style={{ background: DARK_BG, display: "flex" }}>
      {reverse ? imgSide : textSide}
      {reverse ? textSide : imgSide}
    </AbsoluteFill>
  );
};

// Cover slide
export const CoverSlide: React.FC<{
  title: string;
  subtitle: string;
  details?: string[];
}> = ({ title, subtitle, details }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoScale = spring({ frame, fps, config: { mass: 0.4, damping: 7 } });
  const titleOpacity = interpolate(frame, [5, 20], [0, 1], { extrapolateRight: "clamp" });
  const subOpacity = interpolate(frame, [15, 30], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, #0f0c09 0%, ${DARK_BG} 50%, #1a1614 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 600, height: 600, borderRadius: "50%", background: `radial-gradient(circle, ${GOLD}10 0%, transparent 60%)` }} />
      <div style={{ transform: `scale(${logoScale})`, fontSize: 64, fontWeight: 900, color: GOLD, letterSpacing: 10, fontFamily: "'DM Serif Display', Georgia, serif", textShadow: "0 0 80px rgba(212,175,55,0.3)", opacity: titleOpacity }}>{title}</div>
      <div style={{ marginTop: 16, fontSize: 18, color: DARK_MUTED, letterSpacing: 5, textTransform: "uppercase", fontFamily: "'Space Grotesk', Arial, sans-serif", opacity: subOpacity }}>{subtitle}</div>
      {details && (
        <div style={{ display: "flex", gap: 30, marginTop: 40, opacity: interpolate(frame, [25, 45], [0, 1], { extrapolateRight: "clamp" }) }}>
          {details.map((d, i) => (
            <div key={i} style={{ fontSize: 13, color: "#8c7b6b", fontFamily: "'Space Grotesk', Arial, sans-serif", textAlign: "center" }}>
              <div style={{ fontSize: 26, marginBottom: 4 }}>{d.split(" ")[0]}</div>
              <div>{d.split(" ").slice(1).join(" ")}</div>
            </div>
          ))}
        </div>
      )}
    </AbsoluteFill>
  );
};

// Tech stack slide
export const TechSlide: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logoScale = spring({ frame, fps, config: { mass: 0.4, damping: 7 } });
  const techOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });

  const techs = [
    { name: "ASP.NET 9", color: "#512BD4" },
    { name: "React", color: "#61DAFB" },
    { name: "MariaDB", color: "#C0765A" },
    { name: "Azure Container Apps", color: "#0078D4" },
    { name: "Stripe", color: "#635BFF" },
    { name: "Docker", color: "#2496ED" },
    { name: "TMDB API", color: "#01D277" },
    { name: "Tailwind CSS", color: "#06B6D4" },
    { name: "MailKit", color: "#FF6C2C" },
    { name: "GitHub Actions", color: "#2088FF" },
    { name: "PayPal", color: "#009cde" },
    { name: "QuestPDF", color: "#E040FB" },
    { name: "BCrypt", color: "#22c55e" },
    { name: "Puppeteer", color: "#40B5A4" },
  ];

  return (
    <AbsoluteFill style={{ background: `linear-gradient(160deg, #0f0c09, ${DARK_BG})`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `scale(${logoScale})`, fontSize: 40, fontWeight: 900, color: GOLD, letterSpacing: 6, fontFamily: "'DM Serif Display', Georgia, serif", marginBottom: 30 }}>Stack Tecnologico</div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, maxWidth: 800, opacity: techOpacity }}>
        {techs.map((t, i) => {
          const delay = 10 + i * 4;
          const pillOpacity = interpolate(frame, [delay, delay + 10], [0, 1], { extrapolateRight: "clamp" });
          return (
            <div key={t.name} style={{ opacity: pillOpacity, padding: "8px 18px", borderRadius: 20, border: `1px solid ${t.color}44`, background: `${t.color}11`, color: t.color, fontSize: 13, fontWeight: 600, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>{t.name}</div>
          );
        })}
      </div>
      <div style={{ marginTop: 36, opacity: interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" }), fontSize: 14, color: DARK_MUTED, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>www.cinema67.it · api.cinema67.it</div>
    </AbsoluteFill>
  );
};
