import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";

const GOLD = "#b8860b";
const RED = "#b91c1c";
const BG = "#fdfaf6";
const TEXT = "#1c1108";
const MUTED = "#6b5a4e";

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { mass: 0.4, damping: 6 } });
  const heroOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const btn1Opacity = interpolate(frame, [35, 50], [0, 1], { extrapolateRight: "clamp" });
  const btn2Opacity = interpolate(frame, [45, 60], [0, 1], { extrapolateRight: "clamp" });
  const scrollOpacity = interpolate(frame, [60, 80], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(160deg, #1a1410 0%, #0f0c09 40%, #1a1614 100%)`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Spotlight */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 800,
          height: 800,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${GOLD}10 0%, transparent 60%)`,
        }}
      />

      {/* Decorative filmstrip lines */}
      <div style={{ position: "absolute", top: 80, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${GOLD}44, transparent)` }} />
      <div style={{ position: "absolute", bottom: 80, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${GOLD}44, transparent)` }} />

      {/* Logo */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          fontSize: 72,
          fontWeight: 900,
          color: GOLD,
          letterSpacing: 10,
          fontFamily: "'DM Serif Display', Georgia, serif",
          textShadow: "0 0 80px rgba(184,134,11,0.3)",
        }}
      >
        CINEMA67
      </div>

      {/* Subtitle */}
      <div
        style={{
          marginTop: 16,
          opacity: heroOpacity,
          fontSize: 14,
          color: MUTED,
          letterSpacing: 5,
          textTransform: "uppercase",
          fontFamily: "'Space Grotesk', Arial, sans-serif",
        }}
      >
        Piattaforma Cinema Completa
      </div>

      <div
        style={{
          marginTop: 24,
          fontSize: 18,
          color: "#c4b8a8",
          opacity: heroOpacity,
          fontFamily: "'Space Grotesk', Arial, sans-serif",
          textAlign: "center",
          maxWidth: 600,
          lineHeight: 1.6,
        }}
      >
        Dalla vendita biglietti al rimborso automatico.
        Shop, gift card, membership, feste, newsletter e molto altro.
      </div>

      {/* CTA Buttons */}
      <div style={{ display: "flex", gap: 16, marginTop: 40 }}>
        <div
          style={{
            opacity: btn1Opacity,
            padding: "14px 36px",
            borderRadius: 12,
            background: `linear-gradient(135deg, ${GOLD}, #92600a)`,
            color: "#fff",
            fontSize: 15,
            fontWeight: 700,
            fontFamily: "'Space Grotesk', Arial, sans-serif",
          }}
        >
          Scopri le funzionalità ▼
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          opacity: scrollOpacity,
          fontSize: 20,
          color: GOLD,
        }}
      >
        ▼
      </div>
    </AbsoluteFill>
  );
};
