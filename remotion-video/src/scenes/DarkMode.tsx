import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { SubtitleBar, GOLD, DARK, TEXT, MUTED } from "../components/Layout";

const LIGHT_BG = "#fdfaf6";

const CinemaLogo: React.FC<{ dark: boolean }> = ({ dark }) => (
  <p style={{
    margin: 0, fontSize: 48, fontWeight: 700, fontFamily: "'Playfair Display', 'Georgia', serif",
    letterSpacing: 5, color: dark ? GOLD : DARK,
  }}>
    CINEMA67
  </p>
);

const BulbIcon: React.FC<{ color: string }> = ({ color }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 18h6" />
    <path d="M10 22h4" />
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14" />
  </svg>
);

const DarkMode: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Divider moves left to right revealing dark mode
  const dividerX = interpolate(frame, [40, 160], [0, 100], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const lightOpacity = interpolate(frame, [40, 160], [1, 0], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const darkOpacity = interpolate(frame, [40, 160], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  return (
    <AbsoluteFill style={{ background: DARK, position: "relative", overflow: "hidden" }}>
      {/* Light side */}
      <div style={{
        position: "absolute", inset: 0,
        background: LIGHT_BG,
        clipPath: `inset(0 ${100 - dividerX}% 0 0)`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 20,
        opacity: lightOpacity,
      }}>
        <BulbIcon color={DARK} />
        <CinemaLogo dark={false} />
        <p style={{ margin: 0, fontSize: 22, color: DARK, fontWeight: 500, fontFamily: "'Space Grotesk', Arial, sans-serif", letterSpacing: 1 }}>
          Light Mode
        </p>
        <p style={{ margin: 0, fontSize: 13, color: MUTED, fontWeight: 400, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
          Tema chiaro elegante
        </p>
      </div>

      {/* Dark side */}
      <div style={{
        position: "absolute", inset: 0,
        background: DARK,
        clipPath: `inset(0 0 0 ${dividerX}%)`,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 20,
        opacity: darkOpacity,
      }}>
        <BulbIcon color={GOLD} />
        <CinemaLogo dark={true} />
        <p style={{ margin: 0, fontSize: 22, color: GOLD, fontWeight: 500, fontFamily: "'Space Grotesk', Arial, sans-serif", letterSpacing: 1 }}>
          Dark Mode
        </p>
        <p style={{ margin: 0, fontSize: 13, color: MUTED, fontWeight: 400, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
          Tema scuro cinematografico
        </p>
      </div>

      {/* Animated divider line */}
      <div style={{
        position: "absolute",
        left: `${dividerX}%`,
        top: 0, bottom: 0,
        width: 3,
        background: GOLD,
        zIndex: 10,
        boxShadow: `0 0 16px ${GOLD}66`,
        opacity: interpolate(frame, [38, 42], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
      }} />

      {/* Auto-detect badge */}
      <div style={{
        position: "absolute", top: 50, left: "50%", transform: "translateX(-50%)",
        background: `linear-gradient(135deg, ${GOLD}22, ${GOLD}08)`,
        border: `1px solid ${GOLD}55`,
        borderRadius: 20,
        padding: "6px 24px",
        zIndex: 20,
        opacity: interpolate(frame, [140, 155], [0, 1], { extrapolateRight: "clamp", extrapolateLeft: "clamp" }),
      }}>
        <span style={{ fontSize: 14, color: GOLD, fontWeight: 600, fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
          Preferenze Dispositivo
        </span>
      </div>

      <SubtitleBar text="Tema automatico. L'app segue le preferenze del dispositivo: giorno e notte." />
    </AbsoluteFill>
  );
};

export { DarkMode };
export default DarkMode;
