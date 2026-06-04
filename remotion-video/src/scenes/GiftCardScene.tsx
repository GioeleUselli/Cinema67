import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { SceneContainer, MotionText, FeatureHighlight, FloatingCards, BrowserFrame, Spotlight, GOLD, TEXT } from "../components/CinemaComponents";

const giftcardImg = require("../assets/user_giftcard.png");

const GiftCardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const browserOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const browserScale = interpolate(frame, [15, 35], [0.92, 1], { extrapolateRight: "clamp" });

  const features = [
    { icon: "💶", text: "€25, €50, €100 o personalizzato", delay: 50 },
    { icon: "📧", text: "Invio programmato con messaggio", delay: 63 },
    { icon: "🎁", text: "Carrello gift card dedicato", delay: 76 },
    { icon: "🔄", text: "Riscatto immediato", delay: 89 },
  ];

  const cards = [
    { title: "€25", icon: "🎁", color: GOLD },
    { title: "€50", icon: "🎁", color: GOLD },
    { title: "€100", icon: "🎁", color: GOLD },
    { title: "Custom", icon: "✨", color: GOLD },
  ];

  return (
    <SceneContainer dark>
      <AbsoluteFill style={{ display: "flex" }}>
        <Spotlight x={250} y={350} radius={500} opacity={0.08} />

        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 80px", gap: 80 }}>
          <div style={{ flex: "0 0 420px", zIndex: 20 }}>
            <MotionText text="Gift card" delay={20} size={42} color={TEXT} glow />
            <MotionText text="digitali" delay={30} size={42} color={GOLD} glow />
            <div style={{ marginTop: 40 }}>
              {features.map((f) => (
                <FeatureHighlight key={f.text} icon={f.icon} text={f.text} delay={f.delay} />
              ))}
            </div>
            <div style={{ marginTop: 24, maxWidth: 440 }}>
              <FloatingCards items={cards} delay={100} />
            </div>
          </div>

          <div style={{
            flex: 1,
            opacity: browserOpacity,
            transform: `scale(${browserScale})`,
            position: "relative",
          }}>
            <BrowserFrame url="cinema67.it/gift-card" scale={0.82}>
              <img src={giftcardImg} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Gift Card" />
            </BrowserFrame>
          </div>
        </div>
      </AbsoluteFill>
    </SceneContainer>
  );
};

export default GiftCardScene;
