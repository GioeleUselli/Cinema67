import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { SceneContainer, MotionText, FeatureHighlight, BrowserFrame, AnimatedCursor, Spotlight, GOLD, TEXT, MUTED } from "../components/CinemaComponents";

const proiezioniImg = require("../assets/admin_proiezioni.png");

const AdminProiezioniScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const browserOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const browserScale = interpolate(frame, [15, 35], [0.92, 1], { extrapolateRight: "clamp" });

  const cursorPath = [
    { x: 400, y: 200, atFrame: 35 },
    { x: 500, y: 300, atFrame: 55 },
    { x: 550, y: 350, atFrame: 75 },
  ];

  const features = [
    { icon: "📅", text: "Creazione proiezioni", delay: 50 },
    { icon: "💺", text: "Mappa posti interattiva", delay: 62 },
    { icon: "🎫", text: "Prezzi e supplementi", delay: 74 },
    { icon: "🔒", text: "Hold temporaneo 4min", delay: 86 },
  ];

  return (
    <SceneContainer dark>
      <AbsoluteFill style={{ display: "flex" }}>
        <Spotlight x={250} y={350} radius={500} opacity={0.08} />

        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 80px", gap: 80 }}>
          <div style={{ flex: "0 0 420px", zIndex: 20 }}>
            <MotionText text="Gestione proiezioni" delay={20} size={40} color={TEXT} glow />
            <MotionText text="e spettacoli" delay={30} size={40} color={GOLD} glow />
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
            <BrowserFrame url="admin.cinema67.it/proiezioni" scale={0.82}>
              <div style={{ position: "relative" }}>
                <img src={proiezioniImg} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Admin Proiezioni" />
                <AnimatedCursor path={cursorPath} clicks={[60]} />
              </div>
            </BrowserFrame>
          </div>
        </div>
      </AbsoluteFill>
    </SceneContainer>
  );
};

export default AdminProiezioniScene;
