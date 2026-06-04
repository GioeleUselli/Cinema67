import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const GOLD = "#d4af37";
const DARK = "#0a0806";

interface TechPill {
  emoji: string;
  label: string;
  from: "left" | "right" | "top" | "bottom";
}

const TECHS: TechPill[] = [
  { emoji: "⚙️", label: "ASP.NET 9", from: "left" },
  { emoji: "🗄️", label: "MariaDB", from: "left" },
  { emoji: "🐳", label: "Docker", from: "left" },
  { emoji: "⚛️", label: "React", from: "right" },
  { emoji: "🎨", label: "Tailwind", from: "right" },
  { emoji: "💳", label: "Stripe", from: "right" },
  { emoji: "☁️", label: "Azure", from: "top" },
  { emoji: "🔄", label: "GitHub Actions", from: "top" },
  { emoji: "🎬", label: "TMDB API", from: "bottom" },
  { emoji: "🅿️", label: "PayPal", from: "bottom" },
  { emoji: "✉️", label: "MailKit", from: "bottom" },
];

const Tech: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [10, 35], [0, 1], {
    extrapolateRight: "clamp",
  });

  const centerScale = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { mass: 0.4, damping: 8 },
  });

  const centerGlow = interpolate(frame, [15, 60], [0, 1], {
    extrapolateRight: "clamp",
  });

  const pillAnimations = TECHS.map((tech, i) => {
    const start = 15 + i * 8;
    return {
      opacity: interpolate(frame, [start, start + 16], [0, 1], {
        extrapolateRight: "clamp",
      }),
      slide: spring({
        frame: Math.max(0, frame - start),
        fps,
        config: { mass: 0.35, damping: 8 },
      }),
      scale: spring({
        frame: Math.max(0, frame - start),
        fps,
        config: { mass: 0.35, damping: 10 },
      }),
    };
  });

  const lineAnimations = TECHS.map((_, i) => {
    const start = 25 + i * 8;
    return {
      progress: spring({
        frame: Math.max(0, frame - start),
        fps,
        config: { mass: 0.2, damping: 6 },
      }),
      opacity: interpolate(frame, [start, start + 12], [0, 0.5], {
        extrapolateRight: "clamp",
      }),
    };
  });

  const bottomTextOpacity = interpolate(frame, [125, 148], [0, 1], {
    extrapolateRight: "clamp",
  });
  const bottomTextY = interpolate(frame, [125, 148], [12, 0], {
    extrapolateRight: "clamp",
  });

  const centerX = 50;
  const centerY = 50;

  const getPillPosition = (from: string, index: number, total: number) => {
    const spacing = 100 / (total + 1);
    const offset = spacing * (index + 1);
    const margin = 13;

    switch (from) {
      case "left":
        return { x: margin, y: 26 + (index / total) * 48 };
      case "right":
        return { x: 100 - margin, y: 26 + (index / total) * 48 };
      case "top":
        return { x: 38 + (index / (total - 1)) * 24, y: margin + 8 };
      case "bottom":
        return { x: 38 + (index / (total - 1)) * 24, y: 100 - margin - 8 };
      default:
        return { x: 50, y: 50 };
    }
  };

  const fromGroups: Record<string, number[]> = {};
  TECHS.forEach((tech, i) => {
    if (!fromGroups[tech.from]) fromGroups[tech.from] = [];
    fromGroups[tech.from].push(i);
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
            radial-gradient(ellipse at 50% 50%, ${GOLD}10 0%, transparent 50%),
            radial-gradient(ellipse at 30% 30%, ${GOLD}04 0%, transparent 40%),
            radial-gradient(ellipse at 70% 70%, ${GOLD}04 0%, transparent 40%)
          `,
        }}
      />

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: "7%",
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
          Stack Tecnologico
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
        {TECHS.map((tech, i) => {
          const groupIndices = fromGroups[tech.from];
          const groupIndex = groupIndices.indexOf(i);
          const pos = getPillPosition(tech.from, groupIndex, groupIndices.length);
          const lineAnim = lineAnimations[i];
          const dx = centerX - pos.x;
          const dy = centerY - pos.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const ux = dx / dist;
          const uy = dy / dist;

          return (
            <line
              key={i}
              x1={pos.x}
              y1={pos.y}
              x2={pos.x + ux * dist * lineAnim.progress}
              y2={pos.y + uy * dist * lineAnim.progress}
              stroke={GOLD}
              strokeWidth="0.2"
              strokeDasharray="1.5 1"
              opacity={Math.min(lineAnim.progress, lineAnim.opacity)}
              style={{
                filter: `drop-shadow(0 0 3px ${GOLD}33)`,
              }}
            />
          );
        })}
      </svg>

      {/* Tech pills */}
      {TECHS.map((tech, i) => {
        const anim = pillAnimations[i];
        const groupIndices = fromGroups[tech.from];
        const groupIndex = groupIndices.indexOf(i);
        const pos = getPillPosition(tech.from, groupIndex, groupIndices.length);

        // Calculate slide offset based on from direction
        let slideX = 0;
        let slideY = 0;
        const slideDist = 15;
        const baseSlide = (1 - anim.slide) * slideDist;

        switch (tech.from) {
          case "left":
            slideX = -baseSlide;
            break;
          case "right":
            slideX = baseSlide;
            break;
          case "top":
            slideY = -baseSlide;
            break;
          case "bottom":
            slideY = baseSlide;
            break;
        }

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `${pos.y}%`,
              left: `${pos.x}%`,
              transform: `translate(-50%, -50%) translate(${slideX}%, ${slideY}%) scale(${anim.scale})`,
              opacity: anim.opacity,
              zIndex: 5,
            }}
          >
            <div
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                background: `#13100b`,
                border: `2px solid ${GOLD}33`,
                boxShadow: `0 0 20px ${GOLD}08`,
                display: "flex",
                alignItems: "center",
                gap: 8,
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: 18 }}>{tech.emoji}</span>
              <span
                style={{
                  fontFamily: "'Space Grotesk', Arial, sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#f0e8e0",
                }}
              >
                {tech.label}
              </span>
            </div>
          </div>
        );
      })}

      {/* Center CINEMA67 */}
      <div
        style={{
          position: "absolute",
          top: `${centerY}%`,
          left: `${centerX}%`,
          transform: `translate(-50%, -50%) scale(${centerScale})`,
          zIndex: 10,
        }}
      >
        <div
          style={{
            padding: "20px 36px",
            borderRadius: 16,
            background: `#13100b`,
            border: `3px solid ${GOLD}66`,
            boxShadow: `0 0 ${40 + centerGlow * 60}px ${GOLD}${centerGlow > 0.5 ? "22" : "0C"}`,
          }}
        >
          <span
            style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 26,
              color: GOLD,
              fontWeight: 400,
            }}
          >
            CINEMA67
          </span>
        </div>
      </div>

      {/* Bottom text */}
      <div
        style={{
          position: "absolute",
          bottom: 90,
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
          .NET 9 · React 19 · MariaDB · Docker · Azure · Stripe · PayPal · TMDB · MailKit
        </p>
      </div>
    </AbsoluteFill>
  );
};

export default Tech;
