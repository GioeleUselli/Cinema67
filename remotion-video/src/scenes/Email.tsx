import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { profiloScreenshot } from "./screenshots";

const GOLD = "#b8860b";
const RED = "#b91c1c";

const floatingIcons = [
  { emoji: "🎫", label: "biglietti" },
  { emoji: "🎁", label: "gift card" },
  { emoji: "🎉", label: "feste" },
  { emoji: "👑", label: "membership" },
];

export const EmailScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const screenshotOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const headingY = interpolate(frame, [0, 12], [-40, 0], { extrapolateRight: "clamp" });
  const headingOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });

  const badgesOpacity = interpolate(frame, [40, 58], [0, 1], { extrapolateRight: "clamp" });
  const badgesY = interpolate(frame, [40, 58], [30, 0], { extrapolateRight: "clamp" });

  const badgeList = [
    { icon: "📧", text: "19 template brandizzati" },
    { icon: "🌓", text: "Supporto dark/light mode" },
    { icon: "🎨", text: "Design Cinema67 unificato" },
    { icon: "📬", text: "Invio non bloccante" },
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
          src={profiloScreenshot}
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
          Email
        </div>
        <h2 style={{ fontSize: 38, fontWeight: 700, color: "#f0e8e0", fontFamily: "'DM Serif Display', Georgia, serif", margin: 0 }}>
          Sistema Email
        </h2>
      </div>

      {/* Floating email icons */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {floatingIcons.map((item, i) => {
          const delay = 25 + i * 10;
          const iconOpacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: "clamp" });
          const floatY = spring({ frame: frame - delay, fps, config: { mass: 0.5, damping: 9 } });
          const positions = [
            { top: "22%", left: "18%" },
            { top: "18%", left: "72%" },
            { top: "45%", left: "75%" },
            { top: "48%", left: "15%" },
          ];
          return (
            <div
              key={item.label}
              style={{
                position: "absolute",
                ...positions[i],
                opacity: iconOpacity,
                transform: `translateY(${(1 - floatY) * -20}px)`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <div
                style={{
                  fontSize: 28,
                  background: "rgba(0,0,0,0.75)",
                  backdropFilter: "blur(8px)",
                  borderRadius: 14,
                  padding: "10px 14px",
                  border: `1px solid ${GOLD}44`,
                }}
              >
                {item.emoji}
              </div>
              <span style={{ fontSize: 9, color: "#a89888", fontWeight: 500 }}>
                {item.label}
              </span>
            </div>
          );
        })}
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
