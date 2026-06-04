import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

const GOLD = "#d4af37";
const DARK = "#0a0806";

const Films: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const steps = [
    { icon: "🔍", title: "Ricerca TMDB", color: "#4285F4" },
    { icon: "📥", title: "Import Automatico", color: "#22c55e" },
    { icon: "🎬", title: "Film Aggiunto", color: GOLD },
    { icon: "🖼️", title: "Poster Visualizzato", color: "#a855f7" },
  ];

  const stepVisibility = steps.map((_, i) => {
    const stepStart = 10 + i * 28;
    return {
      opacity: interpolate(frame, [stepStart, stepStart + 15], [0, 1], {
        extrapolateRight: "clamp",
      }),
      y: interpolate(frame, [stepStart, stepStart + 15], [30, 0], {
        extrapolateRight: "clamp",
      }),
      scale: spring({
        frame: Math.max(0, frame - stepStart),
        fps,
        config: { mass: 0.3, damping: 6 },
      }),
    };
  });

  const arrowVisibility = steps.slice(1).map((_, i) => {
    const arrowStart = 22 + i * 28;
    return {
      opacity: interpolate(frame, [arrowStart, arrowStart + 10], [0, 1], {
        extrapolateRight: "clamp",
      }),
      width: spring({
        frame: Math.max(0, frame - arrowStart),
        fps,
        config: { mass: 0.2, damping: 5 },
      }),
    };
  });

  const bottomTextOpacity = interpolate(frame, [110, 135], [0, 1], {
    extrapolateRight: "clamp",
  });
  const bottomTextY = interpolate(frame, [110, 135], [16, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: DARK,
        overflow: "hidden",
      }}
    >
      {/* Background */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at 50% 30%, ${GOLD}0A 0%, transparent 60%)`,
        }}
      />

      {/* Pipeline */}
      <div
        style={{
          position: "absolute",
          top: "28%",
          left: 0,
          right: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 0,
        }}
      >
        {steps.map((step, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 0,
            }}
          >
            {/* Step card */}
            <div
              style={{
                width: 210,
                padding: "28px 20px",
                borderRadius: 18,
                background: `#13100b`,
                border: `2px solid ${step.color}22`,
                boxShadow: `0 0 30px ${step.color}08`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 14,
                opacity: stepVisibility[i].opacity,
                transform: `translateY(${stepVisibility[i].y}px) scale(${stepVisibility[i].scale})`,
              }}
            >
              <span style={{ fontSize: 40 }}>{step.icon}</span>
              <span
                style={{
                  fontFamily: "'Space Grotesk', Arial, sans-serif",
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#f0e8e0",
                  textAlign: "center",
                }}
              >
                {step.title}
              </span>
              <span
                style={{
                  fontFamily: "'Space Grotesk', Arial, sans-serif",
                  fontSize: 11,
                  color: step.color,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 500,
                }}
              >
                {`Step ${i + 1}`}
              </span>
            </div>

            {/* Arrow connector */}
            {i < steps.length - 1 && (
              <div
                style={{
                  opacity: arrowVisibility[i].opacity,
                  width: 60,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <svg width="60" height="24" viewBox="0 0 60 24">
                  <line
                    x1="0"
                    y1="12"
                    x2="48"
                    y2="12"
                    stroke={GOLD}
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                  <polygon points="48,4 60,12 48,20" fill={GOLD} />
                </svg>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bottom descriptive text */}
      <div
        style={{
          position: "absolute",
          bottom: 160,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: bottomTextOpacity,
          transform: `translateY(${bottomTextY}px)`,
        }}
      >
        <p
          style={{
            fontFamily: "'Space Grotesk', Arial, sans-serif",
            fontSize: 20,
            fontWeight: 400,
            color: "#8c7b6b",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          Cast, Regista, Durata, Data Rilascio — tutto importato automaticamente
        </p>
      </div>
    </AbsoluteFill>
  );
};

export default Films;
