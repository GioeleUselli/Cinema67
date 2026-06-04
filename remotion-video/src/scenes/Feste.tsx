import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { festeScreenshot } from "./screenshots";

const GOLD = "#b8860b";
const RED = "#b91c1c";

export const PartiesRefundsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const screenshotOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const headingY = interpolate(frame, [0, 12], [-40, 0], { extrapolateRight: "clamp" });
  const headingOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  const cardHighlight = spring({ frame: frame - 15, fps, config: { mass: 0.4, damping: 7 } });

  const badgesOpacity = interpolate(frame, [40, 58], [0, 1], { extrapolateRight: "clamp" });
  const badgesY = interpolate(frame, [40, 58], [30, 0], { extrapolateRight: "clamp" });

  const badgeList = [
    { icon: "🎉", text: "Prenotazione personalizzata" },
    { icon: "📋", text: "3 tipi + 3 pacchetti" },
    { icon: "🎫", text: "QR code ingresso" },
    { icon: "💵", text: "Rimborso su cancellazione" },
  ];

  return (
    <AbsoluteFill
      style={{
        background: "#0f0c09",
        fontFamily: "'Space Grotesk', Arial, sans-serif",
        overflow: "hidden",
      }}
    >
      {/* Screenshot background */}
      <div style={{ opacity: screenshotOpacity, position: "absolute", inset: 0 }}>
        <Img
          src={festeScreenshot}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </div>

      {/* Dark overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(15,12,9,0.6) 0%, rgba(15,12,9,0.72) 40%, rgba(15,12,9,0.85) 100%)",
        }}
      />

      {/* Heading */}
      <div
        style={{
          position: "absolute",
          top: 40,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: headingOpacity,
          transform: `translateY(${headingY}px)`,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 4, color: GOLD, marginBottom: 6 }}>
          Feste
        </div>
        <h2 style={{ fontSize: 38, fontWeight: 700, color: "#f0e8e0", fontFamily: "'DM Serif Display', Georgia, serif", margin: 0 }}>
          Feste ed Eventi
        </h2>
      </div>

      {/* Gold highlight around a party booking card */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: "30%",
            left: "32%",
            width: "36%",
            height: "42%",
            borderRadius: 12,
            border: `2px solid ${GOLD}`,
            opacity: cardHighlight,
            boxShadow: `0 0 30px ${GOLD}55, inset 0 0 30px ${GOLD}22`,
          }}
        />
      </div>

      {/* Feature badges at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 40,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 20,
          opacity: badgesOpacity,
          transform: `translateY(${badgesY}px)`,
        }}
      >
        {badgeList.map((b) => (
          <div
            key={b.text}
            style={{
              padding: "14px 28px",
              borderRadius: 16,
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(8px)",
              border: `1px solid ${GOLD}33`,
              fontSize: 15,
              fontWeight: 600,
              color: "#f0e8e0",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: 20 }}>{b.icon}</span>
            {b.text}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
