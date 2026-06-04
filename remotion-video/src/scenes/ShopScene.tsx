import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { SceneContainer, MotionText, FeatureHighlight, BrowserFrame, AnimatedCursor, Spotlight, GOLD, TEXT, MUTED } from "../components/CinemaComponents";

const shopImg = require("../assets/user_shop.png");

const ShopScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const browserOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const browserScale = interpolate(frame, [15, 35], [0.92, 1], { extrapolateRight: "clamp" });

  const cursorPath = [
    { x: 420, y: 380, atFrame: 30 },
    { x: 420, y: 420, atFrame: 50 },
    { x: 420, y: 420, atFrame: 70 },
  ];

  const features = [
    { icon: "👕", text: "Abbigliamento e accessori", delay: 50 },
    { icon: "🛒", text: "Carrello sync cross-device", delay: 62 },
    { icon: "📦", text: "Spedizione o ritiro", delay: 74 },
    { icon: "🏷️", text: "Codici sconto applicabili", delay: 86 },
  ];

  return (
    <SceneContainer dark>
      <AbsoluteFill style={{ display: "flex" }}>
        <Spotlight x={200} y={350} radius={500} opacity={0.08} />

        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 80px", gap: 80 }}>
          <div style={{ flex: "0 0 420px", zIndex: 20 }}>
            <MotionText text="Shop" delay={20} size={42} color={TEXT} glow />
            <MotionText text="merchandise" delay={30} size={42} color={GOLD} glow />
            <div style={{ marginTop: 40 }}>
              {features.map((f) => (
                <FeatureHighlight key={f.text} icon={f.icon} text={f.text} delay={f.delay} />
              ))}
            </div>
          </div>

          <div style={{
            flex: 1,
            opacity: browserOpacity,
            transform: `scale(${browserScale})`,
            position: "relative",
          }}>
            <BrowserFrame url="cinema67.it/shop" scale={0.82}>
              <div style={{ position: "relative" }}>
                <img src={shopImg} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Shop" />
                <AnimatedCursor path={cursorPath} clicks={[60]} />
              </div>
            </BrowserFrame>
          </div>
        </div>
      </AbsoluteFill>
    </SceneContainer>
  );
};

export default ShopScene;
