import { AbsoluteFill, Img, interpolate, useCurrentFrame, useVideoConfig, spring } from "remotion";
import { shopScreenshot, giftcardScreenshot } from "./screenshots";

const GOLD = "#b8860b";

export const ShopScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const imgOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: "clamp" });
  const giftOpacity = interpolate(frame, [30, 50], [0, 1], { extrapolateRight: "clamp" });
  const callouts = interpolate(frame, [20, 45], [0, 1], { extrapolateRight: "clamp" });
  const cartScale = spring({ frame: frame - 40, fps, config: { mass: 0.3, damping: 5 } });

  return (
    <AbsoluteFill style={{ background: "#0f0c09" }}>
      {/* Real shop page */}
      <div style={{ position: "absolute", inset: 0, opacity: imgOpacity }}>
        <Img src={shopScreenshot} style={{ width: "100%", height: "100%", objectFit: "contain", background: "#fdfaf6" }} />
      </div>

      {/* Cart icon highlight + pulse */}
      <div
        style={{
          position: "absolute",
          top: 18,
          right: 60,
          transform: `scale(${1 + cartScale * 0.4})`,
          width: 50,
          height: 50,
          borderRadius: "50%",
          border: `3px solid ${GOLD}`,
          boxShadow: "0 0 20px rgba(184,134,11,0.6)",
          opacity: interpolate(frame, [40, 55], [0, 1], { extrapolateRight: "clamp" }),
        }}
      />

      {/* Gift card screenshot overlay */}
      <div
        style={{
          position: "absolute",
          right: 20,
          top: "50%",
          transform: "translateY(-50%)",
          width: 340,
          height: 400,
          borderRadius: 16,
          overflow: "hidden",
          border: `2px solid ${GOLD}`,
          boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
          opacity: giftOpacity,
        }}
      >
        <Img src={giftcardScreenshot} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            background: "rgba(0,0,0,0.8)",
            padding: "8px",
            textAlign: "center",
            fontSize: 11,
            color: GOLD,
            fontFamily: "'Space Grotesk', Arial, sans-serif",
            fontWeight: 700,
          }}
        >
          🎁 Gift Card
        </div>
      </div>

      {/* Feature badges */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 14,
          opacity: callouts,
        }}
      >
        {["🛒 Carrello cross-device", "🏷️ Codici sconto", "💳 Carta/Credito", "🎁 Gift Card"].map((c) => (
          <div
            key={c}
            style={{
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(8px)",
              borderRadius: 10,
              padding: "8px 16px",
              fontSize: 11,
              color: "#c4b8a8",
              fontFamily: "'Space Grotesk', Arial, sans-serif",
              fontWeight: 600,
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            {c}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};
