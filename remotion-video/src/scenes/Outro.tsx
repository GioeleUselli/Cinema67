import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { mass: 0.5, damping: 8 } });
  const textOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });

  const techs = [
    { name: "ASP.NET 9", color: "#512BD4" },
    { name: "React", color: "#61DAFB" },
    { name: "MariaDB", color: "#C0765A" },
    { name: "Azure", color: "#0078D4" },
    { name: "Stripe", color: "#635BFF" },
    { name: "Docker", color: "#2496ED" },
    { name: "TMDB API", color: "#01D277" },
    { name: "Tailwind CSS", color: "#06B6D4" },
  ];

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #0f0c09, #14100c, #1a1614)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Serif Display', Georgia, serif",
      }}
    >
      <div
        style={{
          transform: `scale(${logoScale})`,
          fontSize: 60,
          fontWeight: 900,
          color: "#d4af37",
          letterSpacing: 6,
          marginBottom: 30,
        }}
      >
        CINEMA67
      </div>

      <div style={{ opacity: textOpacity, textAlign: "center", marginBottom: 40 }}>
        <div
          style={{
            fontSize: 22,
            color: "#f0e8e0",
            fontFamily: "'Space Grotesk', Arial, sans-serif",
            marginBottom: 8,
          }}
        >
          Piattaforma completa per la gestione del tuo cinema
        </div>
        <div style={{ fontSize: 14, color: "#a89888", fontFamily: "'Space Grotesk', Arial, sans-serif" }}>
          www.cinema67.it · api.cinema67.it
        </div>
      </div>

      {/* Tech stack */}
      <div
        style={{
          opacity: interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" }),
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          justifyContent: "center",
          maxWidth: 600,
        }}
      >
        {techs.map((t, i) => (
          <div
            key={t.name}
            style={{
              padding: "6px 16px",
              borderRadius: 20,
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

      <div
        style={{
          opacity: interpolate(frame, [50, 70], [0, 1], { extrapolateRight: "clamp" }),
          marginTop: 40,
          fontSize: 16,
          color: "#a89888",
          fontFamily: "'Space Grotesk', Arial, sans-serif",
        }}
      >
        Grazie per l'attenzione
      </div>
    </AbsoluteFill>
  );
};
