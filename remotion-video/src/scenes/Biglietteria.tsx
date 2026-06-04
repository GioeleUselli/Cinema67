import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

const GOLD = "#d4af37";
const DARK = "#0a0806";

const Biglietteria: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const steps = [
    { icon: "🎬", title: "Selezione Film", color: "#4285F4" },
    { icon: "💳", title: "Pagamento", color: "#22c55e" },
    { icon: "📱", title: "QR Code", color: "#f59e0b" },
    { icon: "📄", title: "PDF Biglietto", color: "#a855f7" },
  ];

  const stepData = steps.map((_, i) => {
    const start = 10 + i * 25;
    return {
      opacity: interpolate(frame, [start, start + 15], [0, 1], {
        extrapolateRight: "clamp",
      }),
      x: interpolate(frame, [start, start + 15], [-40, 0], {
        extrapolateRight: "clamp",
      }),
      scale: spring({
        frame: Math.max(0, frame - start),
        fps,
        config: { mass: 0.3, damping: 7 },
      }),
    };
  });

  const lineProgress = steps.slice(1).map((_, i) => {
    const start = 20 + i * 25;
    return {
      height: spring({
        frame: Math.max(0, frame - start),
        fps,
        config: { mass: 0.2, damping: 5 },
      }),
      opacity: interpolate(frame, [start, start + 10], [0, 1], {
        extrapolateRight: "clamp",
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
          background: `radial-gradient(ellipse at 50% 50%, ${GOLD}08 0%, transparent 60%)`,
        }}
      />

      {/* Vertical steps */}
      <div
        style={{
          position: "absolute",
          top: "8%",
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0,
        }}
      >
        {steps.map((step, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 0,
            }}
          >
            {/* Step card */}
            <div
              style={{
                width: 340,
                padding: "22px 28px",
                borderRadius: 16,
                background: `#13100b`,
                border: `2px solid ${step.color}22`,
                boxShadow: `0 0 20px ${step.color}08`,
                display: "flex",
                alignItems: "center",
                gap: 18,
                opacity: stepData[i].opacity,
                transform: `translateX(${stepData[i].x}px) scale(${stepData[i].scale})`,
              }}
            >
              <span style={{ fontSize: 34 }}>{step.icon}</span>
              <div style={{ flex: 1 }}>
                <span
                  style={{
                    fontFamily: "'Space Grotesk', Arial, sans-serif",
                    fontSize: 18,
                    fontWeight: 600,
                    color: "#f0e8e0",
                  }}
                >
                  {step.title}
                </span>
              </div>
              <span
                style={{
                  fontFamily: "'Space Grotesk', Arial, sans-serif",
                  fontSize: 11,
                  color: step.color,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                }}
              >
                {`Step ${i + 1}`}
              </span>
            </div>

            {/* Connecting line */}
            {i < steps.length - 1 && (
              <div
                style={{
                  width: 3,
                  height: 40,
                  marginLeft: 0,
                  background: GOLD,
                  opacity: lineProgress[i].opacity * 0.4,
                  transform: `scaleY(${lineProgress[i].height})`,
                  transformOrigin: "top center",
                  borderRadius: 2,
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Bottom text */}
      <div
        style={{
          position: "absolute",
          bottom: 130,
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
            fontSize: 18,
            fontWeight: 400,
            color: "#8c7b6b",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          Tipi biglietto: Intero, Ridotto, Bambino, Over 65, Militare, Gruppo
        </p>
      </div>
    </AbsoluteFill>
  );
};

export default Biglietteria;
