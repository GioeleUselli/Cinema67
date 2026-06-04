import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { SceneContainer, MotionText, FeatureHighlight, BrowserFrame, AnimatedCursor, Spotlight, GOLD, TEXT, MUTED } from "../components/CinemaComponents";

const programmazioneImg = require("../assets/programmazione.png");

const CatalogoScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const browserOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const browserScale = interpolate(frame, [15, 35], [0.92, 1], { extrapolateRight: "clamp" });

  const spotX = interpolate(frame, [50, 90, 130], [300, 550, 800], { extrapolateRight: "clamp" });
  const spotY = interpolate(frame, [50, 90, 130], [380, 420, 380], { extrapolateRight: "clamp" });

  const cursorPath = [
    { x: 300, y: 300, atFrame: 30 },
    { x: 350, y: 400, atFrame: 55 },
    { x: 350, y: 400, atFrame: 70 },
  ];

  const features = [
    { icon: "⭐", text: "Import da TMDB", delay: 65 },
    { icon: "📝", text: "Recensioni e valutazioni", delay: 78 },
    { icon: "🎭", text: "Cast e dettagli", delay: 91 },
    { icon: "📅", text: "Programmazione flessibile", delay: 104 },
  ];

  return (
    <SceneContainer dark>
      <AbsoluteFill style={{ display: "flex" }}>
        <Spotlight x={250} y={300} radius={500} opacity={0.08} />

        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 80px", gap: 80 }}>
          <div style={{ flex: "0 0 420px", zIndex: 20 }}>
            <MotionText text="Catalogo completo" delay={20} size={42} color={TEXT} glow />
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
            <BrowserFrame url="cinema67.it/programmazione" scale={0.82}>
              <div style={{ position: "relative" }}>
                <img src={programmazioneImg} style={{ width: "100%", display: "block" }} alt="Programmazione" />
                <Spotlight x={spotX} y={spotY} radius={160} opacity={0.22} />
                <AnimatedCursor path={cursorPath} clicks={[60]} />
              </div>
            </BrowserFrame>
          </div>
        </div>
      </AbsoluteFill>
    </SceneContainer>
  );
};

export default CatalogoScene;
