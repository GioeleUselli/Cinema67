import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

const GOLD = "#d4af37";
const DARK = "#0a0806";

const SHOP_STEPS = [
  { icon: "👕", title: "Prodotto", scale: 1.0, color: "#f59e0b" },
  { icon: "🛒", title: "Carrello", scale: 0.82, color: "#4285F4" },
  { icon: "💳", title: "Checkout", scale: 0.66, color: "#22c55e" },
  { icon: "📦", title: "Ordine", scale: 0.52, color: "#a855f7" },
  { icon: "🚚", title: "Spedizione", scale: 0.40, color: GOLD },
];

const Shop: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const stepData = SHOP_STEPS.map((_, i) => {
    const start = 8 + i * 20;
    return {
      opacity: interpolate(frame, [start, start + 14], [0, 1], {
        extrapolateRight: "clamp",
      }),
      slideY: interpolate(frame, [start, start + 14], [60, 0], {
        extrapolateRight: "clamp",
      }),
      scaleEntrance: spring({
        frame: Math.max(0, frame - start),
        fps,
        config: { mass: 0.3, damping: 7 },
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
      {/* Background gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            radial-gradient(ellipse at 50% 20%, ${GOLD}0C 0%, transparent 50%),
            radial-gradient(ellipse at 50% 80%, ${GOLD}05 0%, transparent 40%)
          `,
        }}
      />

      {/* Funnel outline */}
      <svg
        style={{
          position: "absolute",
          top: "10%",
          left: "50%",
          transform: "translateX(-50%)",
          overflow: "visible",
        }}
        width="320"
        height="520"
        viewBox="0 0 320 520"
      >
        <polygon
          points="0,0 320,0 240,520 80,520"
          fill="none"
          stroke={`${GOLD}15`}
          strokeWidth="2"
          strokeDasharray="8 6"
          opacity={interpolate(frame, [0, 30], [0, 1], {
            extrapolateRight: "clamp",
          })}
        />
      </svg>

      {/* Funnel steps */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "start",
          paddingTop: "8%",
          gap: 16,
        }}
      >
        {SHOP_STEPS.map((step, i) => {
          const w = 300 * step.scale;
          return (
            <div
              key={i}
              style={{
                width: w,
                padding: "16px 24px",
                borderRadius: 14,
                background: `#13100b`,
                border: `2px solid ${step.color}22`,
                boxShadow: `0 0 16px ${step.color}08`,
                display: "flex",
                alignItems: "center",
                gap: 16,
                opacity: stepData[i].opacity,
                transform: `translateY(${stepData[i].slideY}px) scale(${stepData[i].scaleEntrance})`,
              }}
            >
              <span style={{ fontSize: 28 }}>{step.icon}</span>
              <span
                style={{
                  fontFamily: "'Space Grotesk', Arial, sans-serif",
                  fontSize: 16,
                  fontWeight: 600,
                  color: "#f0e8e0",
                  flex: 1,
                }}
              >
                {step.title}
              </span>
              <span
                style={{
                  fontFamily: "'Space Grotesk', Arial, sans-serif",
                  fontSize: 10,
                  color: step.color,
                  textTransform: "uppercase",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                }}
              >
                {`${i + 1}/5`}
              </span>
            </div>
          );
        })}
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
          Varianti taglia/colore · Stock · Tracking · Ritiro al cinema
        </p>
      </div>
    </AbsoluteFill>
  );
};

export default Shop;
