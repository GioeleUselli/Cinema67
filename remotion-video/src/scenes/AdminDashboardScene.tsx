import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { SceneContainer, MotionText, FeatureHighlight, BrowserFrame, Spotlight, GOLD, TEXT, MUTED } from "../components/CinemaComponents";

const dashboardImg = require("../assets/admin_dashboard.png");

const AdminDashboardScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const browserOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const browserScale = interpolate(frame, [15, 35], [0.92, 1], { extrapolateRight: "clamp" });

  const features = [
    { icon: "📊", text: "Statistiche in tempo reale", delay: 50 },
    { icon: "👥", text: "Gestione utenti e ruoli", delay: 62 },
    { icon: "🎬", text: "Controllo contenuti", delay: 74 },
    { icon: "⚙️", text: "Configurazione sistema", delay: 86 },
  ];

  return (
    <SceneContainer dark>
      <AbsoluteFill style={{ display: "flex" }}>
        <Spotlight x={250} y={350} radius={500} opacity={0.08} />

        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 80px", gap: 80 }}>
          <div style={{ flex: "0 0 420px", zIndex: 20 }}>
            <MotionText text="Dashboard" delay={20} size={42} color={TEXT} glow />
            <MotionText text="amministratore" delay={30} size={42} color={GOLD} glow />
            <div style={{ marginTop: 40 }}>
              {features.map((f) => (
                <FeatureHighlight key={f.text} icon={f.icon} text={f.text} delay={f.delay} />
              ))}
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
            <BrowserFrame url="admin.cinema67.it" scale={0.82}>
              <img src={dashboardImg} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Admin Dashboard" />
            </BrowserFrame>
          </div>
        </div>
      </AbsoluteFill>
    </SceneContainer>
  );
};

export default AdminDashboardScene;
