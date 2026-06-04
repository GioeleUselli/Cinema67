import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const GOLD = "#d4af37";
const DARK = "#0a0806";

const SPOKES = [
  { emoji: "🎫", label: "Biglietti", angle: -90 },
  { emoji: "🎁", label: "Gift Card", angle: -18 },
  { emoji: "👑", label: "Membership", angle: 54 },
  { emoji: "📰", label: "Newsletter", angle: 126 },
  { emoji: "📦", label: "Tracking", angle: 198 },
];

const Email: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const centerScale = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: { mass: 0.4, damping: 8 },
  });

  const centerGlow = interpolate(frame, [10, 40], [0, 1], {
    extrapolateRight: "clamp",
  });

  const titleOpacity = interpolate(frame, [15, 40], [0, 1], {
    extrapolateRight: "clamp",
  });

  const bottomTextOpacity = interpolate(frame, [115, 138], [0, 1], {
    extrapolateRight: "clamp",
  });
  const bottomTextY = interpolate(frame, [115, 138], [12, 0], {
    extrapolateRight: "clamp",
  });

  const centerX = 50;
  const centerY = 46;

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
            radial-gradient(ellipse at 50% 46%, ${GOLD}10 0%, transparent 45%),
            radial-gradient(ellipse at 50% 50%, ${GOLD}05 0%, transparent 50%)
          `,
        }}
      />

      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: "10%",
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
          Sistema Email Integrato
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
        {SPOKES.map((spoke, i) => {
          const rad = (spoke.angle * Math.PI) / 180;
          const spokeX = centerX + Math.cos(rad) * 30;
          const spokeY = centerY + Math.sin(rad) * 30;
          const lineProgress = spring({
            frame: Math.max(0, frame - (25 + i * 10)),
            fps,
            config: { mass: 0.3, damping: 8 },
          });
          return (
            <line
              key={i}
              x1={centerX}
              y1={centerY}
              x2={centerX + (spokeX - centerX) * lineProgress}
              y2={centerY + (spokeY - centerY) * lineProgress}
              stroke={GOLD}
              strokeWidth="0.2"
              strokeDasharray="1.5 1"
              opacity={lineProgress * 0.6}
              style={{
                filter: `drop-shadow(0 0 4px ${GOLD}44)`,
              }}
            />
          );
        })}
      </svg>

      {/* Center envelope */}
      <div
        style={{
          position: "absolute",
          top: `${centerY}%`,
          left: `${centerX}%`,
          transform: `translate(-50%, -50%) scale(${centerScale})`,
        }}
      >
        <div
          style={{
            width: 140,
            height: 140,
            borderRadius: 32,
            background: `#13100b`,
            border: `3px solid ${GOLD}44`,
            boxShadow: `0 0 ${40 + centerGlow * 60}px ${GOLD}${centerGlow > 0.5 ? "22" : "0C"}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 64 }}>✉️</span>
        </div>
      </div>

      {/* Spokes */}
      {SPOKES.map((spoke, i) => {
        const rad = (spoke.angle * Math.PI) / 180;
        const spokeX = centerX + Math.cos(rad) * 30;
        const spokeY = centerY + Math.sin(rad) * 30;
        const spokeStart = 25 + i * 10;
        const spokeProgress = spring({
          frame: Math.max(0, frame - spokeStart),
          fps,
          config: { mass: 0.3, damping: 8 },
        });
        const spokeOpacity = interpolate(
          frame,
          [spokeStart, spokeStart + 20],
          [0, 1],
          { extrapolateRight: "clamp" }
        );

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `${spokeY}%`,
              left: `${spokeX}%`,
              transform: `translate(-50%, -50%) translateY(${(1 - spokeProgress) * 30}px)`,
              opacity: spokeOpacity,
            }}
          >
            <div
              style={{
                padding: "10px 20px",
                borderRadius: 12,
                background: `#13100b`,
                border: `2px solid ${GOLD}33`,
                boxShadow: `0 0 20px ${GOLD}08`,
                display: "flex",
                alignItems: "center",
                gap: 10,
                whiteSpace: "nowrap",
              }}
            >
              <span style={{ fontSize: 22 }}>{spoke.emoji}</span>
              <span
                style={{
                  fontFamily: "'Space Grotesk', Arial, sans-serif",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "#f0e8e0",
                }}
              >
                {spoke.label}
              </span>
            </div>
          </div>
        );
      })}

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
          19 template email · Dark/Light mode · Fire-and-forget · SMTP authsmtp.securemail.pro
        </p>
      </div>
    </AbsoluteFill>
  );
};

export default Email;
