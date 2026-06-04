import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const GOLD = "#d4af37";
const DARK = "#0a0806";
const STRIPE_COLOR = "#635BFF";
const PAYPAL_COLOR = "#009cde";
const GREEN = "#22c55e";

interface Branch {
  label: string;
  color: string;
  icon: string;
  angle: number;
}

const BRANCHES: Branch[] = [
  { label: "Stripe", color: STRIPE_COLOR, icon: "💳", angle: -90 },
  { label: "PayPal", color: PAYPAL_COLOR, icon: "🅿️", angle: 0 },
  { label: "Credito Prepagato", color: GOLD, icon: "💰", angle: 90 },
  { label: "Misto (Credito + Carta)", color: `${GOLD}`, icon: "🔀", angle: 180 },
];

const Pagamenti: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const centerX = 50;
  const centerY = 48;

  const centerScale = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: { mass: 0.4, damping: 10 },
  });

  const branchAnimations = BRANCHES.map((_, i) => {
    const start = 20 + i * 15;
    return {
      opacity: interpolate(frame, [start, start + 15], [0, 1], {
        extrapolateRight: "clamp",
      }),
      progress: spring({
        frame: Math.max(0, frame - start),
        fps,
        config: { mass: 0.3, damping: 8 },
      }),
    };
  });

  const bottomTextOpacity = interpolate(frame, [110, 135], [0, 1], {
    extrapolateRight: "clamp",
  });
  const bottomTextY = interpolate(frame, [110, 135], [12, 0], {
    extrapolateRight: "clamp",
  });

  // Misto dual color
  const mistoColors = [GOLD, STRIPE_COLOR];

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
          background: `
            radial-gradient(ellipse at 50% 48%, ${GOLD}0C 0%, transparent 50%),
            radial-gradient(ellipse at 20% 20%, ${STRIPE_COLOR}05 0%, transparent 40%),
            radial-gradient(ellipse at 80% 20%, ${PAYPAL_COLOR}05 0%, transparent 40%)
          `,
        }}
      />

      {/* Connecting lines from center to branches */}
      <svg
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          overflow: "visible",
          pointerEvents: "none",
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
      >
        {BRANCHES.map((branch, i) => {
          const angleRad = (branch.angle * Math.PI) / 180;
          const endX = centerX + branchAnimations[i].progress * 30 * Math.cos(angleRad);
          const endY = centerY + branchAnimations[i].progress * 30 * Math.sin(angleRad);
          return (
            <line
              key={i}
              x1={centerX}
              y1={centerY}
              x2={endX}
              y2={endY}
              stroke={branch.color}
              strokeWidth="0.3"
              strokeDasharray="1.5 1"
              opacity={branchAnimations[i].opacity}
              style={{
                filter: `drop-shadow(0 0 4px ${branch.color}44)`,
              }}
            />
          );
        })}
      </svg>

      {/* Center circle */}
      <div
        style={{
          position: "absolute",
          top: `${centerY}%`,
          left: `${centerX}%`,
          transform: `translate(-50%, -50%) scale(${centerScale})`,
          width: 130,
          height: 130,
          borderRadius: "50%",
          background: `#13100b`,
          border: `2px solid ${GOLD}44`,
          boxShadow: `0 0 40px ${GOLD}18, 0 0 80px ${GOLD}06`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10,
        }}
      >
        <span
          style={{
            fontFamily: "'Space Grotesk', Arial, sans-serif",
            fontSize: 16,
            fontWeight: 600,
            color: "#f0e8e0",
            textAlign: "center",
          }}
        >
          💳
          <br />
          Checkout
        </span>
      </div>

      {/* Branch nodes */}
      {BRANCHES.map((branch, i) => {
        const angleRad = (branch.angle * Math.PI) / 180;
        const distance = branchAnimations[i].progress * 32;
        const nodeX = centerX + distance * Math.cos(angleRad);
        const nodeY = centerY + distance * Math.sin(angleRad);
        const isMisto = branch.label.includes("Misto");

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `${nodeY}%`,
              left: `${nodeX}%`,
              transform: "translate(-50%, -50%)",
              opacity: branchAnimations[i].opacity,
              zIndex: 5,
            }}
          >
            <div
              style={{
                padding: isMisto ? "14px 20px" : "12px 20px",
                borderRadius: 12,
                background: `#13100b`,
                border: isMisto
                  ? `2px solid transparent`
                  : `2px solid ${branch.color}33`,
                borderImage: isMisto
                  ? `linear-gradient(135deg, ${mistoColors[0]}, ${mistoColors[1]}) 1`
                  : undefined,
                boxShadow: isMisto
                  ? `0 0 16px ${GOLD}0C`
                  : `0 0 16px ${branch.color}0C`,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 16 }}>
                {branch.icon}
              </span>
              <span
                style={{
                  fontFamily: "'Space Grotesk', Arial, sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  color: isMisto ? GOLD : branch.color,
                  whiteSpace: "nowrap",
                }}
              >
                {branch.label}
              </span>
            </div>
          </div>
        );
      })}

      {/* Bottom text */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
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
          Idempotenza · Webhook · Metodo Misto · Rimborsi automatici
        </p>
      </div>
    </AbsoluteFill>
  );
};

export default Pagamenti;
