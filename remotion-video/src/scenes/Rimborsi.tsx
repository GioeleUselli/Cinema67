import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const GOLD = "#d4af37";
const RED = "#b91c1c";
const DARK = "#0a0806";
const GREEN = "#22c55e";
const BLUE = "#4285F4";

interface FlowBox {
  label: string;
  emoji: string;
  color: string;
  row: number;
  col: number;
}

const FLOW: FlowBox[] = [
  { label: "Show Cancellato", emoji: "📅", color: RED, row: 0, col: 1 },
  { label: "Rimborso Automatico", emoji: "🔙", color: GOLD, row: 1, col: 1 },
  { label: "Credito Utente", emoji: "💰", color: GREEN, row: 2, col: 0 },
  { label: "Rimborso Stripe", emoji: "💳", color: BLUE, row: 2, col: 2 },
  { label: "Email Inviata", emoji: "📧", color: GOLD, row: 3, col: 1 },
];

// Arrows connecting boxes: from (row,col) to (row,col)
const ARROWS = [
  { from: { row: 0, col: 1 }, to: { row: 1, col: 1 } },
  { from: { row: 1, col: 1 }, to: { row: 2, col: 0 } },
  { from: { row: 1, col: 1 }, to: { row: 2, col: 2 } },
  { from: { row: 2, col: 0 }, to: { row: 3, col: 1 } },
  { from: { row: 2, col: 2 }, to: { row: 3, col: 1 } },
];

const Rimborsi: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const boxAnimations = FLOW.map((_, i) => {
    const start = 8 + i * 18;
    return {
      opacity: interpolate(frame, [start, start + 16], [0, 1], {
        extrapolateRight: "clamp",
      }),
      scale: spring({
        frame: Math.max(0, frame - start),
        fps,
        config: { mass: 0.3, damping: 8 },
      }),
      y: interpolate(frame, [start, start + 16], [20, 0], {
        extrapolateRight: "clamp",
      }),
    };
  });

  const arrowAnimations = ARROWS.map((_, i) => {
    const start = 16 + i * 15;
    return {
      opacity: interpolate(frame, [start, start + 12], [0, 1], {
        extrapolateRight: "clamp",
      }),
      progress: spring({
        frame: Math.max(0, frame - start),
        fps,
        config: { mass: 0.2, damping: 6 },
      }),
    };
  });

  const bottomTextOpacity = interpolate(frame, [115, 138], [0, 1], {
    extrapolateRight: "clamp",
  });
  const bottomTextY = interpolate(frame, [115, 138], [12, 0], {
    extrapolateRight: "clamp",
  });

  const cellW = 22;
  const cellH = 20;
  const startX = 50;
  const startY = 16;

  const boxPos = (row: number, col: number) => ({
    x: startX + col * cellW,
    y: startY + row * cellH,
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
          background: `
            radial-gradient(ellipse at 50% 30%, ${GOLD}0C 0%, transparent 50%),
            radial-gradient(ellipse at 50% 70%, ${GOLD}05 0%, transparent 40%)
          `,
        }}
      />

      {/* Flow chart */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          transform: "translateX(-50%)",
          width: 400,
          height: 360,
        }}
      >
        {/* SVG arrows */}
        <svg
          style={{
            position: "absolute",
            inset: 0,
            overflow: "visible",
            pointerEvents: "none",
          }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {ARROWS.map((arrow, i) => {
            const from = boxPos(arrow.from.row, arrow.from.col);
            const to = boxPos(arrow.to.row, arrow.to.col);
            const anim = arrowAnimations[i];
            return (
              <line
                key={i}
                x1={from.x}
                y1={from.y + 6}
                x2={to.x}
                y2={to.y - 6}
                stroke={GOLD}
                strokeWidth="0.35"
                strokeDasharray="1.5 1"
                opacity={anim.opacity * anim.progress}
                style={{
                  filter: `drop-shadow(0 0 3px ${GOLD}33)`,
                }}
              />
            );
          })}
        </svg>

        {/* Flow boxes */}
        {FLOW.map((box, i) => {
          const anim = boxAnimations[i];
          const pos = boxPos(box.row, box.col);

          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: `translate(-50%, -50%) scale(${anim.scale}) translateY(${anim.y}px)`,
                opacity: anim.opacity,
                zIndex: 5,
              }}
            >
              <div
                style={{
                  padding: "12px 22px",
                  borderRadius: 12,
                  background: `#13100b`,
                  border: `2px solid ${box.color}44`,
                  boxShadow: `0 0 20px ${box.color}0C`,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ fontSize: 20 }}>{box.emoji}</span>
                <span
                  style={{
                    fontFamily: "'Space Grotesk', Arial, sans-serif",
                    fontSize: 13,
                    fontWeight: 600,
                    color: box.color,
                  }}
                >
                  {box.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom text */}
      <div
        style={{
          position: "absolute",
          bottom: 110,
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
          Idempotente · Revisione manuale · Dashboard unificata · Rimborso feste
        </p>
      </div>
    </AbsoluteFill>
  );
};

export default Rimborsi;
