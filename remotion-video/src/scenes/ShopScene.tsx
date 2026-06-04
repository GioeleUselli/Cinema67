import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { SceneContainer, MotionText, FeatureHighlight, BrowserFrame, Spotlight, GOLD, TEXT, MUTED } from "../components/CinemaComponents";

const shopImg = require("../assets/shop.png");

const ShopScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const browserOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const browserScale = interpolate(frame, [15, 35], [0.92, 1], { extrapolateRight: "clamp" });

  const featuresRow1 = [
    { icon: "👕", text: "Abbigliamento", delay: 50 },
    { icon: "🖼️", text: "Poster", delay: 60 },
    { icon: "🍿", text: "Snack", delay: 70 },
    { icon: "⭐", text: "Collezionabili", delay: 80 },
  ];

  const featuresRow2 = [
    { icon: "🛒", text: "Carrello cross-device", delay: 90 },
    { icon: "📦", text: "Tracking spedizione", delay: 100 },
    { icon: "🏪", text: "Ritiro al cinema", delay: 110 },
  ];

  return (
    <SceneContainer dark>
      <AbsoluteFill style={{ display: "flex" }}>
        <Spotlight x={200} y={350} radius={500} opacity={0.08} />

        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 80px", gap: 80 }}>
          <div style={{ flex: "0 0 420px", zIndex: 20 }}>
            <MotionText text="Merchandising" delay={20} size={42} color={TEXT} glow />
            <MotionText text="integrato" delay={30} size={42} color={GOLD} glow />
            <div style={{ marginTop: 40 }}>
              {featuresRow1.map((f) => (
                <FeatureHighlight key={f.text} icon={f.icon} text={f.text} delay={f.delay} />
              ))}
            </div>
            <div style={{
              marginTop: 8,
              paddingTop: 16,
              borderTop: `1px solid ${GOLD}15`,
            }}>
              {featuresRow2.map((f) => (
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
              <img src={shopImg} style={{ width: "100%", display: "block" }} alt="Merchandising Shop" />
            </BrowserFrame>
          </div>
        </div>
      </AbsoluteFill>
    </SceneContainer>
  );
};

export default ShopScene;
