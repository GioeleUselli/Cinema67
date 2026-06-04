import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

export const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoScale = spring({ frame, fps, config: { mass: 0.5, damping: 8 } });
  const titleOpacity = interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" });
  const subtitleOpacity = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: "clamp" });
  const bgOpacity = interpolate(frame, [0, 20], [0, 1]);

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #1a1614 0%, #14100c 50%, #0f0c09 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'DM Serif Display', Georgia, serif",
      }}
    >
      {/* Spotlight effect */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)",
          opacity: bgOpacity,
        }}
      />

      {/* Logo */}
      <div
        style={{
          transform: `scale(${logoScale})`,
          fontSize: 80,
          fontWeight: 900,
          color: "#d4af37",
          letterSpacing: 8,
          marginBottom: 20,
        }}
      >
        CINEMA67
      </div>

      {/* Decorative line */}
      <div
        style={{
          width: interpolate(frame, [10, 30], [0, 200], { extrapolateRight: "clamp" }),
          height: 2,
          background: "linear-gradient(90deg, transparent, #d4af37, transparent)",
          marginBottom: 30,
          opacity: titleOpacity,
        }}
      />

      {/* Title */}
      <div
        style={{
          fontSize: 28,
          color: "#f0e8e0",
          fontWeight: 300,
          letterSpacing: 4,
          opacity: titleOpacity,
          fontFamily: "'Space Grotesk', Arial, sans-serif",
        }}
      >
        PIATTAFORMA CINEMA
      </div>

      {/* Subtitle */}
      <div
        style={{
          marginTop: 16,
          fontSize: 16,
          color: "#a89888",
          fontWeight: 400,
          opacity: subtitleOpacity,
          fontFamily: "'Space Grotesk', Arial, sans-serif",
        }}
      >
        Gestione completa — dalla vendita biglietti al rimborso
      </div>

      {/* Particles */}
      <GoldParticle frame={frame} delay={0} x={100} y={200} />
      <GoldParticle frame={frame} delay={10} x={500} y={150} />
      <GoldParticle frame={frame} delay={20} x={300} y={350} />
      <GoldParticle frame={frame} delay={30} x={600} y={300} />
    </AbsoluteFill>
  );
};

const GoldParticle: React.FC<{ frame: number; delay: number; x: number; y: number }> = ({
  frame,
  delay,
  x,
  y,
}) => {
  const { fps } = useVideoConfig();
  const opacity = interpolate(frame - delay, [0, 30], [0, 0.6], { extrapolateRight: "clamp" });
  const translateY = interpolate(frame - delay, [0, 60], [0, -80], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y + translateY,
        width: 4,
        height: 4,
        borderRadius: "50%",
        backgroundColor: "#d4af37",
        opacity,
        boxShadow: "0 0 8px #d4af37",
      }}
    />
  );
};
