import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { SceneContainer, MotionText, FeatureHighlight, FloatingCards, BrowserFrame, Spotlight, GOLD, TEXT, MUTED } from "../components/CinemaComponents";

const programmazioneImg = require("../assets/programmazione.png");

const PrenotazioneScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const browserOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const browserScale = interpolate(frame, [15, 35], [0.92, 1], { extrapolateRight: "clamp" });

  const spotOpacity = interpolate(frame, [70, 90], [0, 0.25], { extrapolateRight: "clamp" });

  const features = [
    { icon: "💺", text: "Mappa interattiva", delay: 55 },
    { icon: "🔒", text: "Hold temporaneo 4min", delay: 68 },
    { icon: "🎫", text: "QR code univoco", delay: 81 },
    { icon: "📱", text: "Validazione all'ingresso", delay: 94 },
  ];

  const cards = [
    { title: "Intero", icon: "🎬", color: GOLD },
    { title: "Ridotto", icon: "🎟️", color: GOLD },
    { title: "Bambino", icon: "👶", color: GOLD },
    { title: "Over 65", icon: "🧓", color: GOLD },
    { title: "Militare", icon: "🪖", color: GOLD },
  ];

  return (
    <SceneContainer dark>
      <AbsoluteFill style={{ display: "flex" }}>
        <Spotlight x={200} y={400} radius={500} opacity={0.08} />

        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 80px", gap: 80 }}>
          <div style={{ flex: "0 0 420px", zIndex: 20 }}>
            <MotionText text="Selezione visuale" delay={20} size={42} color={TEXT} glow />
            <MotionText text="dei posti" delay={30} size={42} color={GOLD} glow />
            <div style={{ marginTop: 40 }}>
              {features.map((f) => (
                <FeatureHighlight key={f.text} icon={f.icon} text={f.text} delay={f.delay} />
              ))}
            </div>
            <div style={{ marginTop: 24, maxWidth: 440 }}>
              <FloatingCards items={cards} delay={110} />
            </div>
          </div>

          <div style={{
            flex: 1,
            opacity: browserOpacity,
            transform: `scale(${browserScale})`,
            position: "relative",
          }}>
            <BrowserFrame url="cinema67.it/prenotazione" scale={0.82}>
              <div style={{ position: "relative" }}>
                <img src={programmazioneImg} style={{ width: "100%", display: "block" }} alt="Prenotazione" />
                <Spotlight x={920} y={550} radius={200} opacity={spotOpacity} />
              </div>
            </BrowserFrame>
          </div>
        </div>
      </AbsoluteFill>
    </SceneContainer>
  );
};

export default PrenotazioneScene;
