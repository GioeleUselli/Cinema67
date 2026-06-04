import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const GOLD = "#d4af37";
const DARK = "#0a0806";

const REWARDS = [
  { icon: "🎫", label: "Biglietti" },
  { icon: "🎁", label: "Gift Card" },
  { icon: "👕", label: "Merchandise" },
  { icon: "🏷️", label: "Sconti" },
];

const Premi: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Coin stack appears
  const coinScale = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: { mass: 0.5, damping: 8 },
  });

  // Coins shrink (spend) at frame 50-70
  const spendProgress = interpolate(frame, [50, 70], [1, 0.3], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Coin fade out
  const coinFade = interpolate(frame, [65, 75], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Reward card unlocks after spend (frame 70-90)
  const rewardScale = spring({
    frame: Math.max(0, frame - 72),
    fps,
    config: { mass: 0.3, damping: 7 },
  });

  const rewardOpacity = interpolate(frame, [72, 88], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Reward icons appear around (frame 90-110)
  const rewardIconAnims = REWARDS.map((_, i) => {
    const start = 90 + i * 8;
    return {
      opacity: interpolate(frame, [start, start + 15], [0, 1], {
        extrapolateRight: "clamp",
      }),
      scale: spring({
        frame: Math.max(0, frame - start),
        fps,
        config: { mass: 0.2, damping: 8 },
      }),
    };
  });

  const bottomTextOpacity = interpolate(frame, [115, 138], [0, 1], {
    extrapolateRight: "clamp",
  });
  const bottomTextY = interpolate(frame, [115, 138], [10, 0], {
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
            radial-gradient(ellipse at 50% 45%, ${GOLD}0C 0%, transparent 50%),
            radial-gradient(ellipse at 50% 70%, ${GOLD}05 0%, transparent 40%)
          `,
        }}
      />

      {/* Coin stack - center */}
      <div
        style={{
          position: "absolute",
          top: "42%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${coinScale * spendProgress})`,
          opacity: coinFade,
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
        >
          <span style={{ fontSize: 48 }}>💰</span>
          <span
            style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 42,
              color: GOLD,
              fontWeight: 400,
              marginTop: 8,
            }}
          >
            Punti
          </span>
          <span
            style={{
              fontFamily: "'Space Grotesk', Arial, sans-serif",
              fontSize: 14,
              color: "#8c7b6b",
              fontWeight: 500,
            }}
          >
            2,500 disponibili
          </span>
        </div>
      </div>

      {/* Reward card that unlocks */}
      <div
        style={{
          position: "absolute",
          top: "42%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${rewardScale})`,
          opacity: rewardOpacity,
          zIndex: 15,
        }}
      >
        <div
          style={{
            width: 240,
            padding: "28px 20px",
            borderRadius: 20,
            background: `#13100b`,
            border: `2px solid ${GOLD}66`,
            boxShadow: `0 0 60px ${GOLD}33, 0 0 120px ${GOLD}0C`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span style={{ fontSize: 44 }}>🎁</span>
          <span
            style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 22,
              color: GOLD,
              fontWeight: 400,
            }}
          >
            Premio Sbloccato!
          </span>
          <span
            style={{
              fontFamily: "'Space Grotesk', Arial, sans-serif",
              fontSize: 12,
              color: "#8c7b6b",
              fontWeight: 500,
            }}
          >
            Riscatta subito il tuo premio
          </span>
        </div>
      </div>

      {/* Reward icons around */}
      {REWARDS.map((reward, i) => {
        const anim = rewardIconAnims[i];
        const angle = (i * 90 * Math.PI) / 180;
        const radius = 180;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              marginLeft: x,
              marginTop: y,
              transform: `translate(-50%, -50%) scale(${anim.scale})`,
              opacity: anim.opacity,
              zIndex: 5,
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: "14px 18px",
                borderRadius: 14,
                background: "#13100b",
                border: `2px solid ${GOLD}22`,
                boxShadow: `0 0 16px ${GOLD}06`,
              }}
            >
              <span style={{ fontSize: 28 }}>{reward.icon}</span>
              <span
                style={{
                  fontFamily: "'Space Grotesk', Arial, sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#f0e8e0",
                }}
              >
                {reward.label}
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
          Catalogo premi: riscatta punti per vantaggi esclusivi
        </p>
      </div>
    </AbsoluteFill>
  );
};

export default Premi;
