import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { SceneContainer, MotionText, FeatureHighlight, FloatingCards, BrowserFrame, AnimatedCursor, Spotlight, GOLD, TEXT } from "../components/CinemaComponents";

const festeImg = require("../assets/feste.png");

const FesteScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const browserOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const browserScale = interpolate(frame, [15, 35], [0.92, 1], { extrapolateRight: "clamp" });

  const cursorPath = [
    { x: 500, y: 50, atFrame: 30 },
    { x: 650, y: 50, atFrame: 55 },
    { x: 720, y: 50, atFrame: 75 },
    { x: 550, y: 50, atFrame: 100 },
  ];

  const features = [
    { icon: "🎉", text: "3 tipi: MovieParty, GameRoom, Both", delay: 50 },
    { icon: "💎", text: "3 pacchetti: Basic, Premium, VIP", delay: 63 },
    { icon: "🎫", text: "QR code all'ingresso", delay: 76 },
    { icon: "🔙", text: "Rimborso automatico su cancellazione", delay: 89 },
  ];

  const cards = [
    { title: "MovieParty", subtitle: "Film + sala feste", color: "#9333ea" },
    { title: "GameRoom", subtitle: "Sala giochi", color: "#2563eb" },
    { title: "Both", subtitle: "Esperienza completa", color: GOLD },
  ];

  return (
    <SceneContainer dark>
      <AbsoluteFill style={{ display: "flex" }}>
        <Spotlight x={250} y={350} radius={500} opacity={0.08} />

        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 80px", gap: 80 }}>
          <div style={{ flex: "0 0 420px", zIndex: 20 }}>
            <MotionText text="Organizzazione eventi" delay={20} size={40} color={TEXT} glow />
            <MotionText text="digitale" delay={30} size={40} color={GOLD} glow />
            <div style={{ marginTop: 40 }}>
              {features.map((f) => (
                <FeatureHighlight key={f.text} icon={f.icon} text={f.text} delay={f.delay} />
              ))}
            </div>
            <div style={{ marginTop: 24, maxWidth: 460 }}>
              <FloatingCards items={cards} delay={100} />
            </div>
          </div>

          <div style={{
            flex: 1,
            opacity: browserOpacity,
            transform: `scale(${browserScale})`,
            position: "relative",
          }}>
            <BrowserFrame url="cinema67.it/feste" scale={0.82}>
              <div style={{ position: "relative" }}>
                <img src={festeImg} style={{ width: "100%", display: "block" }} alt="Feste" />
                <AnimatedCursor path={cursorPath} clicks={[75]} />
              </div>
            </BrowserFrame>
          </div>
        </div>
      </AbsoluteFill>
    </SceneContainer>
  );
};

export default FesteScene;
