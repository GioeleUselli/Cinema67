import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";

const GOLD = "#d4af37";
const DARK = "#0a0806";

const Auth: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const leftShow = spring({ frame, fps, config: { mass: 0.3, damping: 6 } });
  const centerShow = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { mass: 0.3, damping: 6 },
  });
  const rightShow = spring({
    frame: Math.max(0, frame - 30),
    fps,
    config: { mass: 0.3, damping: 6 },
  });

  const shieldStart = 55;
  const shieldProgress = spring({
    frame: Math.max(0, frame - shieldStart),
    fps,
    config: { mass: 0.5, damping: 8 },
  });

  const textOpacity = interpolate(frame, [80, 105], [0, 1], {
    extrapolateRight: "clamp",
  });
  const textY = interpolate(frame, [80, 105], [20, 0], {
    extrapolateRight: "clamp",
  });

  const ColumnCard: React.FC<{
    icon: string;
    label: string;
    color: string;
    progress: number;
    delay: number;
  }> = ({ icon, label, color, progress, delay }) => {
    const opacity = interpolate(frame, [delay, delay + 20], [0, 1], {
      extrapolateRight: "clamp",
    });
    return (
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          opacity,
          transform: `translateY(${interpolate(frame, [delay, delay + 20], [40, 0], { extrapolateRight: "clamp" })}px) scale(${interpolate(progress, [0, 1], [0.85, 1])})`,
        }}
      >
        <div
          style={{
            width: 180,
            height: 200,
            borderRadius: 20,
            background: `#13100b`,
            border: `2px solid ${color}44`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            boxShadow: `0 0 40px ${color}11`,
          }}
        >
          <span style={{ fontSize: 48 }}>{icon}</span>
          <span
            style={{
              fontFamily: "'Space Grotesk', Arial, sans-serif",
              fontSize: 18,
              fontWeight: 600,
              color,
            }}
          >
            {label}
          </span>
        </div>

        {/* Form fields visual for Email card */}
        {label === "Email" && (
          <div
            style={{
              width: 140,
              display: "flex",
              flexDirection: "column",
              gap: 6,
              opacity,
            }}
          >
            <div
              style={{
                height: 8,
                borderRadius: 4,
                background: "#1c1713",
                width: "100%",
              }}
            />
            <div
              style={{
                height: 8,
                borderRadius: 4,
                background: "#1c1713",
                width: "70%",
              }}
            />
          </div>
        )}
      </div>
    );
  };

  return (
    <AbsoluteFill
      style={{
        background: DARK,
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 900,
          height: 900,
          marginLeft: -450,
          marginTop: -500,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${GOLD}0A 0%, transparent 60%)`,
        }}
      />

      {/* Three columns */}
      <div
        style={{
          position: "absolute",
          inset: "80px 120px 200px",
          display: "flex",
          gap: 40,
          alignItems: "center",
        }}
      >
        <ColumnCard
          icon="📧"
          label="Email"
          color={GOLD}
          progress={leftShow}
          delay={0}
        />
        <ColumnCard
          icon="🔐"
          label="Google"
          color="#4285F4"
          progress={centerShow}
          delay={15}
        />
        <ColumnCard
          icon="⊞"
          label="Microsoft"
          color="#00A4EF"
          progress={rightShow}
          delay={30}
        />
      </div>

      {/* Shield icon wrapping all columns */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${interpolate(shieldProgress, [0, 1], [0.3, 1])})`,
          opacity: shieldProgress,
          fontSize: 120,
          zIndex: 5,
          filter: `drop-shadow(0 0 30px ${GOLD}33)`,
        }}
      >
        🛡️
      </div>

      {/* Bottom text */}
      <div
        style={{
          position: "absolute",
          bottom: 120,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: textOpacity,
          transform: `translateY(${textY}px)`,
        }}
      >
        <p
          style={{
            fontFamily: "'Space Grotesk', Arial, sans-serif",
            fontSize: 22,
            fontWeight: 500,
            color: "#f0e8e0",
            margin: 0,
            letterSpacing: "0.04em",
          }}
        >
          JWT + Refresh Token &nbsp;·&nbsp; Route Guard &nbsp;·&nbsp; 4 Ruoli
        </p>
      </div>
    </AbsoluteFill>
  );
};

export default Auth;
