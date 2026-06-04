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
const SILVER = "#a8a8a8";
const BRONZE = "#a89888";

interface Tier {
  name: string;
  color: string;
  multiplier: string;
  threshold: string;
  emoji: string;
}

const TIERS: Tier[] = [
  { name: "Base", color: BRONZE, multiplier: "1×", threshold: "", emoji: "🎬" },
  { name: "Silver", color: SILVER, multiplier: "1.2×", threshold: "500pt", emoji: "🥈" },
  { name: "Gold", color: GOLD, multiplier: "1.5×", threshold: "2000pt", emoji: "🥇" },
  { name: "Platinum", color: RED, multiplier: "2×", threshold: "5000pt", emoji: "💎" },
];

const Membership: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const tierAnimations = TIERS.map((_, i) => {
    const start = 8 + i * 18;
    return {
      opacity: interpolate(frame, [start, start + 15], [0, 1], {
        extrapolateRight: "clamp",
      }),
      scale: spring({
        frame: Math.max(0, frame - start),
        fps,
        config: { mass: 0.3, damping: 8 },
      }),
      y: interpolate(frame, [start, start + 15], [40, 0], {
        extrapolateRight: "clamp",
      }),
    };
  });

  // Progress bar fills left to right, color transition
  const progressStart = 80;
  const progressFill = interpolate(frame, [progressStart, progressStart + 40], [0, 100], {
    extrapolateRight: "clamp",
  });

  const titleOpacity = interpolate(frame, [5, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

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
            radial-gradient(ellipse at 50% 30%, ${GOLD}0C 0%, transparent 50%),
            radial-gradient(ellipse at 50% 70%, ${GOLD}05 0%, transparent 40%)
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
            fontSize: 52,
            color: GOLD,
            fontWeight: 400,
            margin: 0,
          }}
        >
          Programma Fedeltà
        </h2>
      </div>

      {/* Tier cards in a row */}
      <div
        style={{
          position: "absolute",
          top: "38%",
          left: "5%",
          right: "5%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 20,
        }}
      >
        {TIERS.map((tier, i) => {
          const anim = tierAnimations[i];
          const isLast = i === TIERS.length - 1;
          const cardHeight = 200 + i * 22;

          return (
            <div
              key={i}
              style={{
                width: 170,
                height: cardHeight,
                borderRadius: 16,
                background: `#13100b`,
                border: `2px solid ${tier.color}33`,
                boxShadow: `0 0 24px ${tier.color}0C`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                opacity: anim.opacity,
                transform: `translateY(${anim.y}px) scale(${anim.scale})`,
              }}
            >
              <span style={{ fontSize: 36 }}>{tier.emoji}</span>
              <span
                style={{
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  fontSize: 22,
                  color: tier.color,
                  fontWeight: 400,
                }}
              >
                {tier.name}
              </span>
              <span
                style={{
                  fontFamily: "'Space Grotesk', Arial, sans-serif",
                  fontSize: 24,
                  fontWeight: 600,
                  color: "#f0e8e0",
                }}
              >
                {tier.multiplier}
              </span>
              {tier.threshold && (
                <span
                  style={{
                    fontFamily: "'Space Grotesk', Arial, sans-serif",
                    fontSize: 11,
                    color: "#8c7b6b",
                    fontWeight: 500,
                  }}
                >
                  {tier.threshold}
                </span>
              )}
              {isLast && (
                <div
                  style={{
                    marginTop: 4,
                    padding: "2px 10px",
                    borderRadius: 20,
                    background: `${RED}22`,
                    border: `1px solid ${RED}44`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Space Grotesk', Arial, sans-serif",
                      fontSize: 10,
                      color: RED,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    TOP
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div
        style={{
          position: "absolute",
          top: "76%",
          left: "10%",
          right: "10%",
          height: 8,
          borderRadius: 4,
          background: "#1a1510",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progressFill}%`,
            height: "100%",
            borderRadius: 4,
            background: `linear-gradient(90deg, ${BRONZE} 0%, ${SILVER} 33%, ${GOLD} 66%, ${RED} 100%)`,
            boxShadow: `0 0 12px ${GOLD}33`,
          }}
        />
      </div>

      {/* Progress bar labels */}
      <div
        style={{
          position: "absolute",
          top: "80%",
          left: "10%",
          right: "10%",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        {TIERS.map((tier, i) => (
          <span
            key={i}
            style={{
              fontFamily: "'Space Grotesk', Arial, sans-serif",
              fontSize: 10,
              color: tier.color,
              fontWeight: 500,
            }}
          >
            {tier.name}
          </span>
        ))}
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
          Accumulo punti automatico · Sconto compleanno · Promozioni festive
        </p>
      </div>
    </AbsoluteFill>
  );
};

export default Membership;
