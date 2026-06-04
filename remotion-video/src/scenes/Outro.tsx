import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";

const GOLD = "#b8860b";
const RED = "#b91c1c";

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { mass: 0.5, damping: 8 } });
  const subtitleOpacity = interpolate(frame, [12, 28], [0, 1], { extrapolateRight: "clamp" });
  const urlsOpacity = interpolate(frame, [24, 38], [0, 1], { extrapolateRight: "clamp" });
  const techOpacity = interpolate(frame, [35, 52], [0, 1], { extrapolateRight: "clamp" });
  const thanksOpacity = interpolate(frame, [55, 72], [0, 1], { extrapolateRight: "clamp" });

  const techs = [
    { name: "ASP.NET 9", color: "#512BD4" },
    { name: "React", color: "#61DAFB" },
    { name: "MariaDB", color: "#C0765A" },
    { name: "Azure", color: "#0078D4" },
    { name: "Stripe", color: "#635BFF" },
    { name: "Docker", color: "#2496ED" },
    { name: "TMDB API", color: "#01D277" },
    { name: "Tailwind CSS", color: "#06B6D4" },
    { name: "MailKit", color: "#e05d44" },
    { name: "Remotion", color: "#ff3366" },
  ];

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(160deg, #1a1410 0%, #0f0c09 40%, #1a1614 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Serif Display', Georgia, serif",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${GOLD}10 0%, transparent 55%)`,
        }}
      />

      {/* Decorative lines */}
      <div style={{ position: "absolute", top: 120, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${GOLD}33, transparent)` }} />
      <div style={{ position: "absolute", bottom: 120, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${GOLD}33, transparent)` }} />

      {/* Logo */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          fontSize: 64,
          fontWeight: 900,
          color: GOLD,
          letterSpacing: 8,
          textShadow: "0 0 60px rgba(184,134,11,0.25)",
          marginBottom: 24,
        }}
      >
        CINEMA67
      </div>

      {/* Subtitle */}
      <div
        style={{
          opacity: subtitleOpacity,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 20,
            color: "#f0e8e0",
            fontFamily: "'Space Grotesk', Arial, sans-serif",
            fontWeight: 500,
            marginBottom: 10,
          }}
        >
          Piattaforma completa per il tuo cinema
        </div>
      </div>

      {/* URLs */}
      <div
        style={{
          opacity: urlsOpacity,
          display: "flex",
          gap: 24,
          fontSize: 14,
          color: "#a89888",
          fontFamily: "'Space Grotesk', Arial, sans-serif",
          marginBottom: 36,
        }}
      >
        <span style={{ padding: "6px 18px", borderRadius: 8, background: `rgba(184,134,11,0.08)`, border: `1px solid ${GOLD}22`, color: GOLD, fontWeight: 600 }}>
          www.cinema67.it
        </span>
        <span style={{ padding: "6px 18px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid #2a2520", fontWeight: 600 }}>
          api.cinema67.it
        </span>
      </div>

      {/* Technology stack pills */}
      <div
        style={{
          opacity: techOpacity,
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          justifyContent: "center",
          maxWidth: 700,
        }}
      >
        {techs.map((t) => (
          <div
            key={t.name}
            style={{
              padding: "7px 18px",
              borderRadius: 22,
              border: `1px solid ${t.color}44`,
              background: `${t.color}11`,
              color: t.color,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "'Space Grotesk', Arial, sans-serif",
            }}
          >
            {t.name}
          </div>
        ))}
      </div>

      {/* Thank you */}
      <div
        style={{
          opacity: thanksOpacity,
          marginTop: 44,
          fontSize: 18,
          color: "#a89888",
          fontFamily: "'Space Grotesk', Arial, sans-serif",
          fontWeight: 500,
          letterSpacing: 1,
        }}
      >
        Grazie per l'attenzione
      </div>

      {/* Scroll indicator */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          opacity: interpolate(frame, [150, 170], [0, 1], { extrapolateRight: "clamp" }),
          fontSize: 16,
          color: GOLD,
        }}
      >
        ▼
      </div>
    </AbsoluteFill>
  );
};
