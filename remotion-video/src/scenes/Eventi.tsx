import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const GOLD = "#d4af37";
const DARK = "#0a0806";

interface EventCard {
  name: string;
  emoji: string;
  multiplier: string;
  price: string;
  scale: number;
  color: string;
}

const EVENT_CARDS: EventCard[] = [
  { name: "Basic", emoji: "🍿", multiplier: "1×", price: "da €15/ospite", scale: 1.0, color: "#a89888" },
  { name: "Premium", emoji: "🎂", multiplier: "1.5×", price: "da €22.50/ospite", scale: 1.18, color: GOLD },
  { name: "VIP", emoji: "👑", multiplier: "2.5×", price: "da €37.50/ospite", scale: 1.38, color: "#b91c1c" },
];

const Eventi: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [5, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  const cardAnimations = EVENT_CARDS.map((_, i) => {
    const start = 15 + i * 20;
    return {
      opacity: interpolate(frame, [start, start + 18], [0, 1], {
        extrapolateRight: "clamp",
      }),
      scale: spring({
        frame: Math.max(0, frame - start),
        fps,
        config: { mass: 0.3, damping: 8 },
      }),
      y: interpolate(frame, [start, start + 18], [50, 0], {
        extrapolateRight: "clamp",
      }),
    };
  });

  const bottomTextOpacity = interpolate(frame, [110, 135], [0, 1], {
    extrapolateRight: "clamp",
  });
  const bottomTextY = interpolate(frame, [110, 135], [12, 0], {
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
            radial-gradient(ellipse at 50% 80%, ${GOLD}05 0%, transparent 40%)
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
          Eventi Privati
        </h2>
      </div>

      {/* Cards side by side */}
      <div
        style={{
          position: "absolute",
          top: "38%",
          left: "5%",
          right: "5%",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "center",
          gap: 24,
        }}
      >
        {EVENT_CARDS.map((card, i) => {
          const anim = cardAnimations[i];
          const baseWidth = 200;
          const baseHeight = 260;
          const cardWidth = baseWidth * card.scale;
          const cardHeight = baseHeight * card.scale;

          return (
            <div
              key={i}
              style={{
                width: cardWidth,
                height: cardHeight,
                borderRadius: 18,
                background: `#13100b`,
                border: `2px solid ${card.color}33`,
                boxShadow: `0 0 30px ${card.color}0C`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                opacity: anim.opacity,
                transform: `translateY(${anim.y}px) scale(${anim.scale})`,
              }}
            >
              <span style={{ fontSize: 40 }}>{card.emoji}</span>
              <span
                style={{
                  fontFamily: "'DM Serif Display', Georgia, serif",
                  fontSize: 28,
                  color: card.color,
                  fontWeight: 400,
                }}
              >
                {card.name}
              </span>
              <span
                style={{
                  fontFamily: "'Space Grotesk', Arial, sans-serif",
                  fontSize: 22,
                  fontWeight: 600,
                  color: "#f0e8e0",
                }}
              >
                {card.multiplier}
              </span>
              <span
                style={{
                  fontFamily: "'Space Grotesk', Arial, sans-serif",
                  fontSize: 13,
                  color: "#8c7b6b",
                  fontWeight: 500,
                }}
              >
                {card.price}
              </span>
              {card.name === "VIP" && (
                <div
                  style={{
                    marginTop: 6,
                    padding: "3px 12px",
                    borderRadius: 20,
                    background: `#b91c1c22`,
                    border: `1px solid #b91c1c44`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'Space Grotesk', Arial, sans-serif",
                      fontSize: 10,
                      color: "#b91c1c",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                    }}
                  >
                    Best Value
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

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
          MovieParty · GameRoom · Both — 3 tipi × 3 pacchetti
        </p>
      </div>
    </AbsoluteFill>
  );
};

export default Eventi;
