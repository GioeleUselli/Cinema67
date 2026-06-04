import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";

const GOLD = "#d4af37";
const DARK = "#0a0806";

const FEATURE_CARDS = [
  { icon: "💶", text: "Importo personalizzato", from: "left" },
  { icon: "📧", text: "Invio programmato", from: "right" },
  { icon: "✏️", text: "Messaggio personalizzato", from: "bottom" },
];

const GiftCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Gift card glow pulse
  const cardPulse = interpolate(frame, [0, 150], [1, 1.02], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Feature cards animate in sequence
  const featureAnimations = FEATURE_CARDS.map((_, i) => {
    const start = 10 + i * 20;
    const p = spring({
      frame: Math.max(0, frame - start),
      fps,
      config: { mass: 0.4, damping: 10 },
    });
    const opacity = interpolate(frame, [start, start + 15], [0, 1], {
      extrapolateRight: "clamp",
    });
    return { progress: p, opacity };
  });

  // After all features appear, gift card flies to envelope (frame 80-110)
  const flyStart = 80;
  const flyProgress = interpolate(frame, [flyStart, flyStart + 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  const giftX = interpolate(flyProgress, [0, 1], [0, 350]);
  const giftY = interpolate(flyProgress, [0, 1], [0, -60]);
  const giftScale = interpolate(flyProgress, [0, 1], [1, 0.6]);
  const giftRotate = interpolate(flyProgress, [0, 1], [0, -15]);

  const bottomTextOpacity = interpolate(frame, [110, 135], [0, 1], {
    extrapolateRight: "clamp",
  });
  const bottomTextY = interpolate(frame, [110, 135], [10, 0], {
    extrapolateRight: "clamp",
  });

  const envelopePulse =
    1 +
    spring({
      frame: Math.max(0, frame - 100),
      fps,
      config: { mass: 0.2, damping: 4 },
    }) *
      0.15;

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
            radial-gradient(ellipse at 50% 40%, ${GOLD}0C 0%, transparent 50%),
            radial-gradient(ellipse at 80% 60%, ${GOLD}06 0%, transparent 40%)
          `,
        }}
      />

      {/* Envelope on the right */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          right: "12%",
          transform: `scale(${envelopePulse})`,
          transition: "transform 0.1s",
        }}
      >
        <span style={{ fontSize: 80, filter: `drop-shadow(0 0 20px ${GOLD}33)` }}>✉️</span>
      </div>

      {/* Center gift card */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) translate(${giftX}px, ${giftY}px) scale(${giftScale * cardPulse}) rotate(${giftRotate}deg)`,
          zIndex: 10,
        }}
      >
        <div
          style={{
            width: 220,
            height: 140,
            borderRadius: 0,
            background: `linear-gradient(135deg, ${GOLD}22, ${GOLD}0C)`,
            border: `3px dashed ${GOLD}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 6,
            boxShadow: `0 0 40px ${GOLD}22, 0 0 80px ${GOLD}0C, inset 0 0 30px ${GOLD}08`,
          }}
        >
          <span style={{ fontSize: 28 }}>🎬</span>
          <span
            style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: 20,
              color: GOLD,
              fontWeight: 400,
            }}
          >
            CINEMA67
          </span>
          <span
            style={{
              fontFamily: "'Space Grotesk', Arial, sans-serif",
              fontSize: 10,
              color: "#8c7b6b",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Gift Card
          </span>
        </div>
      </div>

      {/* Feature cards floating in */}
      {FEATURE_CARDS.map((card, i) => {
        const anim = featureAnimations[i];
        const fromX =
          card.from === "left" ? -280 : card.from === "right" ? 280 : 0;
        const fromY = card.from === "bottom" ? 200 : 0;
        const x = interpolate(anim.progress, [0, 1], [fromX, 0]);
        const y = interpolate(anim.progress, [0, 1], [fromY, 0]);

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              top: card.from === "bottom" ? "72%" : card.from === "right" ? "48%" : "48%",
              left: card.from === "bottom" ? "50%" : card.from === "right" ? "75%" : "22%",
              transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
              opacity: anim.opacity,
              zIndex: 5,
            }}
          >
            <div
              style={{
                padding: "14px 22px",
                borderRadius: 14,
                background: "#13100b",
                border: `2px solid ${GOLD}22`,
                boxShadow: `0 0 20px ${GOLD}06`,
                display: "flex",
                alignItems: "center",
                gap: 12,
              }}
            >
              <span style={{ fontSize: 24 }}>{card.icon}</span>
              <span
                style={{
                  fontFamily: "'Space Grotesk', Arial, sans-serif",
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#f0e8e0",
                  whiteSpace: "nowrap",
                }}
              >
                {card.text}
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
          Acquisto → Invio automatico → Riscatto immediato
        </p>
      </div>
    </AbsoluteFill>
  );
};

export default GiftCard;
