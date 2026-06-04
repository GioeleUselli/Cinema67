import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { SceneContainer, MotionText, FloatingCards, BrowserFrame, Spotlight, GOLD, TEXT, MUTED } from "../components/CinemaComponents";

const profiloImg = require("../assets/profilo.png");

const DashboardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const browserOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const browserScale = interpolate(frame, [15, 35], [0.92, 1], { extrapolateRight: "clamp" });

  const cardsRow1 = [
    { title: "🔙 Rimborsi automatici", icon: "", color: GOLD },
    { title: "📊 Dashboard admin", icon: "", color: GOLD },
    { title: "👥 Gestione utenti", icon: "", color: GOLD },
  ];

  const cardsRow2 = [
    { title: "🏷️ Promozioni", icon: "", color: GOLD },
    { title: "⭐ Recensioni", icon: "", color: GOLD },
    { title: "📦 Ordini merch", icon: "", color: GOLD },
  ];

  return (
    <SceneContainer dark>
      <AbsoluteFill style={{ display: "flex" }}>
        <Spotlight x={250} y={350} radius={500} opacity={0.08} />

        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 80px", gap: 80 }}>
          <div style={{ flex: "0 0 420px", zIndex: 20 }}>
            <MotionText text="Automazione" delay={20} size={42} color={TEXT} glow />
            <MotionText text="completa" delay={30} size={42} color={GOLD} glow />
            <div style={{ marginTop: 48 }}>
              <div style={{ marginBottom: 16, maxWidth: 440 }}>
                <FloatingCards items={cardsRow1} delay={50} />
              </div>
              <div style={{ maxWidth: 440 }}>
                <FloatingCards items={cardsRow2} delay={75} />
              </div>
            </div>
            <div style={{
              marginTop: 32,
              opacity: interpolate(frame, [105, 120], [0, 1], { extrapolateRight: "clamp" }),
            }}>
              <span style={{ fontSize: 12, color: `${GOLD}55`, fontFamily: "'Space Grotesk', Arial, sans-serif", letterSpacing: 2 }}>
                admin.cinema67.it
              </span>
            </div>
          </div>

          <div style={{
            flex: 1,
            opacity: browserOpacity,
            transform: `scale(${browserScale})`,
            position: "relative",
          }}>
            <BrowserFrame url="cinema67.it/dashboard" scale={0.82}>
              <img src={profiloImg} style={{ width: "100%", display: "block" }} alt="Dashboard" />
            </BrowserFrame>
          </div>
        </div>
      </AbsoluteFill>
    </SceneContainer>
  );
};

export default DashboardScene;
