import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { profiloScreenshot } from "./screenshots";

const GOLD = "#b8860b";
const RED = "#b91c1c";

export const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const screenshotOpacity = interpolate(frame, [0, 30], [1, 0], { extrapolateRight: "clamp" });
  const overlayOpacity = interpolate(frame, [10, 40], [0, 1], { extrapolateRight: "clamp" });

  const logoScale = spring({ frame: frame - 30, fps, config: { mass: 0.5, damping: 8 } });
  const logoOpacity = interpolate(frame, [30, 42], [0, 1], { extrapolateRight: "clamp" });

  const subtitleOpacity = interpolate(frame, [42, 56], [0, 1], { extrapolateRight: "clamp" });
  const subY = interpolate(frame, [42, 56], [20, 0], { extrapolateRight: "clamp" });

  const urlsOpacity = interpolate(frame, [56, 72], [0, 1], { extrapolateRight: "clamp" });
  const urlsY = interpolate(frame, [56, 72], [20, 0], { extrapolateRight: "clamp" });

  const techOpacity = interpolate(frame, [72, 92], [0, 1], { extrapolateRight: "clamp" });
  const techY = interpolate(frame, [72, 92], [20, 0], { extrapolateRight: "clamp" });

  const thanksOpacity = interpolate(frame, [92, 110], [0, 1], { extrapolateRight: "clamp" });

  const techs = [
    { name: "ASP.NET 9", color: "#512BD4" },
    { name: "React", color: "#61DAFB" },
    { name: "MariaDB", color: "#C0765A" },
    { name: "Azure Container Apps", color: "#0078D4" },
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
        background: "#0f0c09",
        fontFamily: "'Space Grotesk', Arial, sans-serif",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Screenshot fading out */}
      <div style={{ opacity: screenshotOpacity, position: "absolute", inset: 0 }}>
        <Img
          src={profiloScreenshot}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </div>

      {/* Dark overlay fading in */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: overlayOpacity,
          background: "linear-gradient(160deg, #1a1410 0%, #0f0c09 40%, #1a1614 100%)",
        }}
      />

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
          background: `radial-gradient(circle, ${GOLD}15 0%, transparent 55%)`,
          opacity: overlayOpacity,
        }}
      />

      {/* Decorative lines */}
      <div style={{ position: "absolute", top: 120, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${GOLD}33, transparent)` }} />
      <div style={{ position: "absolute", bottom: 120, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${GOLD}33, transparent)` }} />

      {/* Logo */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          opacity: logoOpacity,
          fontSize: 64,
          fontWeight: 900,
          color: GOLD,
          letterSpacing: 8,
          textShadow: "0 0 60px rgba(184,134,11,0.25)",
          marginBottom: 24,
          fontFamily: "'DM Serif Display', Georgia, serif",
        }}
      >
        CINEMA67
      </div>

      {/* Subtitle */}
      <div
        style={{
          opacity: subtitleOpacity,
          transform: `translateY(${subY}px)`,
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
          transform: `translateY(${urlsY}px)`,
          display: "flex",
          gap: 24,
          fontSize: 14,
          color: "#a89888",
          fontFamily: "'Space Grotesk', Arial, sans-serif",
          marginBottom: 36,
        }}
      >
        <span style={{ padding: "8px 20px", borderRadius: 10, background: `rgba(184,134,11,0.08)`, border: `1px solid ${GOLD}22`, color: GOLD, fontWeight: 600, backdropFilter: "blur(8px)" }}>
          www.cinema67.it
        </span>
        <span style={{ padding: "8px 20px", borderRadius: 10, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)", border: "1px solid #2a2520", fontWeight: 600, color: "#f0e8e0" }}>
          api.cinema67.it
        </span>
      </div>

      {/* Technology stack pills */}
      <div
        style={{
          opacity: techOpacity,
          transform: `translateY(${techY}px)`,
          display: "flex",
          flexWrap: "wrap",
          gap: 10,
          justifyContent: "center",
          maxWidth: 700,
          padding: "0 20px",
        }}
      >
        {techs.map((t) => (
          <div
            key={t.name}
            style={{
              padding: "8px 18px",
              borderRadius: 22,
              border: `1px solid ${t.color}55`,
              background: `${t.color}15`,
              color: t.color,
              fontSize: 12,
              fontWeight: 600,
              fontFamily: "'Space Grotesk', Arial, sans-serif",
              backdropFilter: "blur(8px)",
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
    </AbsoluteFill>
  );
};
