import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

const GOLD = "#d4af37";
const DARK = "#0a0806";

const Hero: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bgScale = interpolate(frame, [0, 120], [1.1, 1.0], {
    extrapolateRight: "clamp",
  });

  const titleProgress = spring({
    frame,
    fps,
    config: { mass: 0.4, damping: 8, stiffness: 120 },
  });

  const subtitleOpacity = interpolate(frame, [30, 55], [0, 1], {
    extrapolateRight: "clamp",
  });
  const subtitleY = interpolate(frame, [30, 55], [24, 0], {
    extrapolateRight: "clamp",
  });

  const secondLineOpacity = interpolate(frame, [50, 75], [0, 1], {
    extrapolateRight: "clamp",
  });
  const secondLineY = interpolate(frame, [50, 75], [20, 0], {
    extrapolateRight: "clamp",
  });

  const spotOpacity = interpolate(frame, [0, 40], [0, 0.18], {
    extrapolateRight: "clamp",
  });
  const spotScale = interpolate(frame, [0, 60], [0.6, 1.4], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: DARK,
        overflow: "hidden",
      }}
    >
      {/* Gold spotlight */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 1200,
          height: 1200,
          marginLeft: -600,
          marginTop: -700,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${GOLD}44 0%, transparent 55%)`,
          opacity: spotOpacity,
          transform: `scale(${spotScale})`,
        }}
      />

      {/* Background texture / zoom */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(ellipse at 50% 40%, ${GOLD}0A 0%, transparent 60%),
            radial-gradient(ellipse at 80% 20%, ${GOLD}06 0%, transparent 40%),
            radial-gradient(ellipse at 20% 80%, ${GOLD}04 0%, transparent 40%)
          `,
          transform: `scale(${bgScale})`,
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* CINEMA67 Title */}
        <h1
          style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 160,
            color: GOLD,
            fontWeight: 400,
            margin: 0,
            lineHeight: 1,
            letterSpacing: "0.02em",
            textShadow: `0 0 80px ${GOLD}33, 0 0 160px ${GOLD}11`,
            transform: `scale(${interpolate(titleProgress, [0, 1], [0.7, 1])})`,
            opacity: titleProgress,
          }}
        >
          CINEMA67
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: "'Space Grotesk', Arial, sans-serif",
            fontSize: 32,
            fontWeight: 400,
            color: "#f0e8e0",
            margin: "28px 0 0",
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
            textAlign: "center",
          }}
        >
          Tutto ciò che serve per gestire un cinema moderno
        </p>

        {/* Second line */}
        <p
          style={{
            fontFamily: "'Space Grotesk', Arial, sans-serif",
            fontSize: 28,
            fontWeight: 300,
            color: "#8c7b6b",
            margin: "10px 0 0",
            opacity: secondLineOpacity,
            transform: `translateY(${secondLineY}px)`,
          }}
        >
          in un&apos;unica piattaforma.
        </p>
      </div>

      {/* Subtle bottom glow line */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: "50%",
          width: 300,
          height: 1,
          marginLeft: -150,
          background: `linear-gradient(90deg, transparent 0%, ${GOLD}88 50%, transparent 100%)`,
          opacity: interpolate(frame, [80, 120], [0, 1], {
            extrapolateRight: "clamp",
          }),
        }}
      />
    </AbsoluteFill>
  );
};

export default Hero;
