import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const GOLD = "#d4af37";
const DARK = "#0a0806";
const BLUE = "#4285F4";

interface StackItem {
  emoji: string;
  label: string;
  color: string;
}

const STACK: StackItem[] = [
  { emoji: "☁️", label: "Microsoft Azure", color: "#0078D4" },
  { emoji: "📦", label: "Container Apps", color: BLUE },
  { emoji: "⚡", label: "API ASP.NET 9", color: GOLD },
  { emoji: "🗄️", label: "MariaDB", color: "#c0765a" },
  { emoji: "🎨", label: "Frontend Vanilla JS + Tailwind", color: "#38bdf8" },
];

const Cloud: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [10, 35], [0, 1], {
    extrapolateRight: "clamp",
  });

  const itemAnimations = STACK.map((_, i) => {
    const start = 10 + i * 18;
    return {
      y: interpolate(frame, [start, start + 16], [30, 0], {
        extrapolateRight: "clamp",
        extrapolateLeft: "clamp",
      }),
      opacity: interpolate(frame, [start, start + 14], [0, 1], {
        extrapolateRight: "clamp",
      }),
      scale: spring({
        frame: Math.max(0, frame - start),
        fps,
        config: { mass: 0.35, damping: 8 },
      }),
    };
  });

  const lineAnimations = STACK.slice(1).map((_, i) => {
    const start = 22 + i * 18;
    return {
      progress: spring({
        frame: Math.max(0, frame - start),
        fps,
        config: { mass: 0.2, damping: 6 },
      }),
      opacity: interpolate(frame, [start, start + 12], [0, 1], {
        extrapolateRight: "clamp",
      }),
    };
  });

  const bottomTextOpacity = interpolate(frame, [115, 138], [0, 1], {
    extrapolateRight: "clamp",
  });
  const bottomTextY = interpolate(frame, [115, 138], [12, 0], {
    extrapolateRight: "clamp",
  });

  const blockW = 28;
  const blockH = 10;
  const startY = 14;

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
            radial-gradient(ellipse at 50% 60%, ${GOLD}0C 0%, transparent 50%),
            radial-gradient(ellipse at 50% 30%, ${BLUE}08 0%, transparent 40%)
          `,
        }}
      />

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: "8%",
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: titleOpacity,
        }}
      >
        <h2
          style={{
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontSize: 48,
            color: GOLD,
            fontWeight: 400,
            margin: 0,
          }}
        >
          Architettura Cloud-Native
        </h2>
      </div>

      {/* SVG connecting lines */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          overflow: "visible",
          pointerEvents: "none",
        }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {STACK.slice(1).map((_, i) => {
          const lineAnim = lineAnimations[i];
          const y1 = startY + i * blockH + 4;
          const y2 = startY + (i + 1) * blockH - 4;
          const x = 50 + blockW / 2;

          return (
            <line
              key={i}
              x1={50}
              y1={y1}
              x2={50}
              y2={y1 + (y2 - y1) * lineAnim.progress}
              stroke={GOLD}
              strokeWidth="0.3"
              strokeDasharray="1.5 1"
              opacity={lineAnim.opacity * lineAnim.progress * 0.6}
              style={{
                filter: `drop-shadow(0 0 4px ${GOLD}33)`,
              }}
            />
          );
        })}
      </svg>

      {/* Stack items */}
      {STACK.map((item, i) => {
        const anim = itemAnimations[i];
        const top = startY + i * blockH;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `${top}%`,
              left: "50%",
              transform: `translate(-50%, ${anim.y}%) scale(${anim.scale})`,
              opacity: anim.opacity,
              zIndex: 5 - i,
            }}
          >
            <div
              style={{
                padding: "14px 32px",
                borderRadius: 12,
                background: `#13100b`,
                border: `2px solid ${item.color}33`,
                boxShadow: `0 0 25px ${item.color}0C`,
                display: "flex",
                alignItems: "center",
                gap: 14,
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: 24 }}>{item.emoji}</span>
              <span
                style={{
                  fontFamily: "'Space Grotesk', Arial, sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  color: item.color,
                }}
              >
                {item.label}
              </span>
            </div>
          </div>
        );
      })}

      {/* Bottom text */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
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
          CI/CD GitHub Actions · Azure Container Registry · Azure File Share · Scaling automatico
        </p>
      </div>
    </AbsoluteFill>
  );
};

export default Cloud;
