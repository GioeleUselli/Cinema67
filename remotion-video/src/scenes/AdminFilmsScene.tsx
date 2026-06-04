import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { SceneContainer, MotionText, FeatureHighlight, BrowserFrame, AnimatedCursor, Spotlight, GOLD, TEXT, MUTED } from "../components/CinemaComponents";

const filmsImg = require("../assets/admin_films.png");

const AdminFilmsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const browserOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const browserScale = interpolate(frame, [15, 35], [0.92, 1], { extrapolateRight: "clamp" });

  const cursorPath = [
    { x: 500, y: 200, atFrame: 35 },
    { x: 550, y: 240, atFrame: 55 },
    { x: 600, y: 320, atFrame: 80 },
  ];

  const features = [
    { icon: "🎬", text: "CRUD film completo", delay: 50 },
    { icon: "📥", text: "Import da TMDB", delay: 62 },
    { icon: "🎭", text: "Cast e registi", delay: 74 },
    { icon: "🖼️", text: "Gestione copertine", delay: 86 },
  ];

  return (
    <SceneContainer dark>
      <AbsoluteFill style={{ display: "flex" }}>
        <Spotlight x={250} y={350} radius={500} opacity={0.08} />

        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 80px", gap: 80 }}>
          <div style={{ flex: "0 0 420px", zIndex: 20 }}>
            <MotionText text="Gestione completa" delay={20} size={42} color={TEXT} glow />
            <MotionText text="dei film" delay={30} size={42} color={GOLD} glow />
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
            <BrowserFrame url="admin.cinema67.it/films" scale={0.82}>
              <div style={{ position: "relative" }}>
                <img src={filmsImg} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Admin Films" />
                <AnimatedCursor path={cursorPath} clicks={[65]} />
              </div>
            </BrowserFrame>
          </div>
        </div>
      </AbsoluteFill>
    </SceneContainer>
  );
};

export default AdminFilmsScene;
