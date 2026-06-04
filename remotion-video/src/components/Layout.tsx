import { interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";

const GOLD = "#d4af37";
const DARK = "#0a0806";
const TEXT = "#f0e8e0";
const MUTED = "#8c7b6b";

export const Slide: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const titleOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const titleY = interpolate(frame, [0, 12], [20, 0], { extrapolateRight: "clamp" });
  const contentOpacity = interpolate(frame, [8, 25], [0, 1], { extrapolateRight: "clamp" });

  return (
    <div style={{ position: "absolute", inset: 0, background: DARK, display: "flex", flexDirection: "column", padding: "50px 80px 120px 80px", fontFamily: "'Space Grotesk', Arial, sans-serif", overflow: "hidden" }}>
      <div style={{ opacity: titleOpacity, transform: `translateY(${titleY}px)`, marginBottom: 30 }}>
        <h1 style={{ fontSize: 52, fontWeight: 700, color: GOLD, fontFamily: "'DM Serif Display', Georgia, serif", margin: 0, lineHeight: 1.2 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 20, color: MUTED, margin: "8px 0 0", fontWeight: 400 }}>{subtitle}</p>}
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", opacity: contentOpacity }}>{children}</div>
    </div>
  );
};

export const SubtitleBar: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.9))", padding: "30px 80px 24px", opacity }}>
      <p style={{ fontSize: 22, color: "#c4b8a8", margin: 0, fontFamily: "'Space Grotesk', Arial, sans-serif", fontWeight: 500, lineHeight: 1.5, maxWidth: 1200, textAlign: "center", marginLeft: "auto", marginRight: "auto" }}>
        {text}
      </p>
    </div>
  );
};

export const Card: React.FC<{
  icon: string; label: string; sub?: string; color?: string; delay?: number; large?: boolean;
}> = ({ icon, label, sub, color = GOLD, delay = 0, large = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [delay, delay + 12], [0, 1], { extrapolateRight: "clamp" });
  const scale = spring({ frame: frame - delay, fps, config: { mass: 0.4, damping: 7 } });
  const size = large ? 42 : 32;
  const labelSize = large ? 22 : 17;

  return (
    <div style={{ opacity, transform: `scale(${scale})`, textAlign: "center", padding: large ? "24px 32px" : "16px 24px" }}>
      <div style={{ fontSize: size, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: labelSize, fontWeight: 700, color, fontFamily: "'DM Serif Display', Georgia, serif" }}>{label}</div>
      {sub && <div style={{ fontSize: 13, color: MUTED, marginTop: 4 }}>{sub}</div>}
    </div>
  );
};

export const Pill: React.FC<{ text: string; color: string; delay?: number }> = ({ text, color, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame, [delay, delay + 10], [0, 1], { extrapolateRight: "clamp" });
  const scale = spring({ frame: frame - delay, fps, config: { mass: 0.3, damping: 6 } });
  return (
    <div style={{ opacity, transform: `scale(${scale})`, padding: "10px 24px", borderRadius: 25, border: `1px solid ${color}33`, background: `${color}11`, color, fontSize: 15, fontWeight: 600 }}>{text}</div>
  );
};

export { GOLD, DARK, TEXT, MUTED };
