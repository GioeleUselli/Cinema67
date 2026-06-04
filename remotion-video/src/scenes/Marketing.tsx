import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const GOLD = "#d4af37";
const DARK = "#0a0806";

const USERS = [
  { icon: "👤", label: "Utente 1" },
  { icon: "👤", label: "Utente 2" },
  { icon: "👤", label: "Utente 3" },
  { icon: "👤", label: "Utente 4" },
];

const Marketing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [10, 35], [0, 1], {
    extrapolateRight: "clamp",
  });

  const adminScale = spring({
    frame: Math.max(0, frame - 10),
    fps,
    config: { mass: 0.4, damping: 8 },
  });

  const arrowAdmin = interpolate(frame, [25, 45], [0, 1], {
    extrapolateRight: "clamp",
  });

  const campaignScale = spring({
    frame: Math.max(0, frame - 35),
    fps,
    config: { mass: 0.4, damping: 8 },
  });

  const fanOutProgress = interpolate(frame, [55, 80], [0, 1], {
    extrapolateRight: "clamp",
  });

  const userAnimations = USERS.map((_, i) => ({
    scale: spring({
      frame: Math.max(0, frame - (65 + i * 12)),
      fps,
      config: { mass: 0.3, damping: 8 },
    }),
    opacity: interpolate(frame, [65 + i * 12, 85 + i * 12], [0, 1], {
      extrapolateRight: "clamp",
    }),
  }));

  const bottomTextOpacity = interpolate(frame, [115, 138], [0, 1], {
    extrapolateRight: "clamp",
  });
  const bottomTextY = interpolate(frame, [115, 138], [12, 0], {
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
          background: `
            radial-gradient(ellipse at 30% 50%, ${GOLD}0C 0%, transparent 50%),
            radial-gradient(ellipse at 70% 50%, ${GOLD}05 0%, transparent 40%)
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
          Marketing & Campagne
        </h2>
      </div>

      {/* Admin (left) */}
      <div
        style={{
          position: "absolute",
          top: "42%",
          left: "10%",
          transform: `translate(-50%, -50%) scale(${adminScale})`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          zIndex: 5,
        }}
      >
        <div
          style={{
            width: 90,
            height: 90,
            borderRadius: 20,
            background: "#13100b",
            border: `2px solid ${GOLD}33`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 30px ${GOLD}0C`,
          }}
        >
          <span style={{ fontSize: 40 }}>👤</span>
        </div>
        <span
          style={{
            fontFamily: "'Space Grotesk', Arial, sans-serif",
            fontSize: 13,
            color: "#8c7b6b",
            fontWeight: 500,
          }}
        >
          Admin
        </span>
      </div>

      {/* SVG arrows */}
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
        {/* Arrow admin -> campaign */}
        <line
          x1="18"
          y1="49"
          x2="45"
          y2="49"
          stroke={GOLD}
          strokeWidth="0.35"
          strokeDasharray="2 1.5"
          opacity={arrowAdmin}
          style={{
            filter: `drop-shadow(0 0 6px ${GOLD}44)`,
          }}
        />

        {/* Fan-out arrows campaign -> users */}
        {USERS.map((_, i) => {
          const angles = [-30, -10, 10, 30];
          const rad = (angles[i] * Math.PI) / 180;
          const cx = 52;
          const cy = 49;
          const tx = 82 + Math.cos(rad) * 5;
          const ty = cy + Math.sin(rad) * 20;
          const progress = Math.min(1, Math.max(0, (fanOutProgress * 4 - i) / 3));

          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={cx + (tx - cx) * progress}
              y2={cy + (ty - cy) * progress}
              stroke={GOLD}
              strokeWidth="0.25"
              strokeDasharray="1.5 1"
              opacity={progress * 0.5}
              style={{
                filter: `drop-shadow(0 0 4px ${GOLD}33)`,
              }}
            />
          );
        })}
      </svg>

      {/* Center campaign card */}
      <div
        style={{
          position: "absolute",
          top: "42%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${campaignScale})`,
          zIndex: 5,
        }}
      >
        <div
          style={{
            padding: "18px 28px",
            borderRadius: 14,
            background: `#13100b`,
            border: `2px solid ${GOLD}44`,
            boxShadow: `0 0 40px ${GOLD}10`,
            display: "flex",
            alignItems: "center",
            gap: 12,
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontSize: 28 }}>📢</span>
          <span
            style={{
              fontFamily: "'Space Grotesk', Arial, sans-serif",
              fontSize: 16,
              fontWeight: 600,
              color: "#f0e8e0",
            }}
          >
            Crea Campagna
          </span>
        </div>
      </div>

      {/* User icons (right) - fan out */}
      {USERS.map((user, i) => {
        const anim = userAnimations[i];
        const angles = [-30, -10, 10, 30];
        const angle = (angles[i] * Math.PI) / 180;
        const x = 84 + Math.cos(angle) * 3;
        const y = 48 + Math.sin(angle) * 18;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: `${y}%`,
              left: `${x}%`,
              transform: `translate(-50%, -50%) scale(${anim.scale})`,
              opacity: anim.opacity,
              zIndex: 4,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: "#13100b",
                border: `2px solid ${GOLD}22`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 24 }}>{user.icon}</span>
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
          Campagne · Codici sconto · Promozioni festive · Newsletter programmata
        </p>
      </div>
    </AbsoluteFill>
  );
};

export default Marketing;
