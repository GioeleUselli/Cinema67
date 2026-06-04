import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { SubtitleBar, GOLD, DARK, TEXT, MUTED } from "../components/Layout";

const STATS_DATA = [
  { label: "Endpoint API", value: 137, suffix: "+" },
  { label: "Template Email", value: 19, suffix: "" },
  { label: "Flussi Pagamento", value: 9, suffix: "" },
  { label: "Livelli Membership", value: 4, suffix: "" },
];

const StatItem: React.FC<{ label: string; value: number; suffix: string; color: string; delay: number }> = ({ label, value, suffix, color, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 10, stiffness: 70 }, durationInFrames: 25 });
  const opacity = interpolate(frame, [delay, delay + 8], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const displayed = interpolate(frame, [delay + 5, delay + 40], [0, value], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <div style={{
      opacity,
      transform: `scale(${Math.max(0, s)})`,
      background: `linear-gradient(135deg, #1c1814, #2a241e)`,
      border: `1px solid ${color}33`,
      borderRadius: 14,
      padding: "16px 28px",
      textAlign: "center",
      minWidth: 160,
    }}>
      <p style={{
        margin: 0, fontSize: 36, fontWeight: 900, color,
        fontFamily: "'Space Grotesk', Arial, sans-serif",
        textShadow: `0 0 30px ${color}44`,
      }}>
        {Math.round(displayed)}{suffix}
      </p>
      <p style={{ margin: "4px 0 0", fontSize: 12, color: MUTED, fontWeight: 600, fontFamily: "'Space Grotesk', Arial, sans-serif", letterSpacing: 1 }}>
        {label}
      </p>
    </div>
  );
};

const Finale: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { damping: 10, stiffness: 80 }, durationInFrames: 40 });
  const logoGlow = interpolate(frame, [30, 120], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const taglineOpacity = interpolate(frame, [80, 100], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ background: DARK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20 }}>
      {/* Logo */}
      <div style={{
        textAlign: "center",
        transform: `scale(${logoScale})`,
      }}>
        <h1 style={{
          margin: 0, fontSize: 80, fontWeight: 700, color: GOLD,
          fontFamily: "'Playfair Display', 'Georgia', serif",
          letterSpacing: 10,
          textShadow: `0 0 ${60 * logoGlow}px ${GOLD}${Math.round(logoGlow * 60).toString(16).padStart(2, "0")}`,
        }}>
          CINEMA67
        </h1>
      </div>

      {/* Tagline */}
      <p style={{
        margin: 0, fontSize: 18, color: TEXT, fontWeight: 300, opacity: taglineOpacity,
        fontFamily: "'Space Grotesk', Arial, sans-serif", letterSpacing: 2,
      }}>
        La piattaforma completa per il cinema del futuro
      </p>

      {/* Stats */}
      <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginTop: 10 }}>
        {STATS_DATA.map((stat, i) => (
          <StatItem key={stat.label} label={stat.label} value={stat.value} suffix={stat.suffix} color={GOLD} delay={100 + i * 15} />
        ))}
      </div>

      {/* Features text */}
      <div style={{
        textAlign: "center",
        opacity: interpolate(frame, [150, 170], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
      }}>
        <p style={{
          margin: 0, fontSize: 16, color: MUTED, fontFamily: "'Space Grotesk', Arial, sans-serif",
          fontWeight: 400, letterSpacing: 1, lineHeight: 1.8,
        }}>
          Carrello Cross Device &middot; Rimborsi Automatici &middot; CI/CD Azure
        </p>
      </div>

      {/* URLs */}
      <div style={{
        display: "flex", gap: 40, justifyContent: "center",
        opacity: interpolate(frame, [170, 190], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
      }}>
        <span style={{ fontSize: 15, color: GOLD, fontFamily: "'Space Grotesk', Arial, sans-serif", fontWeight: 600, letterSpacing: 1 }}>
          www.cinema67.it
        </span>
        <span style={{ fontSize: 15, color: MUTED, fontFamily: "'Space Grotesk', Arial, sans-serif", fontWeight: 500, letterSpacing: 1 }}>
          api.cinema67.it
        </span>
      </div>

      <SubtitleBar text="CINEMA67. La piattaforma completa per il cinema del futuro." />
    </AbsoluteFill>
  );
};

export { Finale };
export default Finale;
