import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { SceneContainer, MotionText, FloatingCards, Spotlight, GOLD, DARK, TEXT } from "../components/CinemaComponents";

const TechScene: React.FC = () => {
  const frame = useCurrentFrame();

  const spotlightX = interpolate(frame, [0, 120], [300, 1100], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const spotlightY = interpolate(frame, [0, 120], [300, 600], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const techPills = [
    { title: "ASP.NET 9", color: "#512BD4" },
    { title: "MariaDB", color: "#C0765A" },
    { title: "Azure Container Apps", color: "#0078D4" },
    { title: "Docker", color: "#2496ED" },
    { title: "Stripe", color: "#635BFF" },
    { title: "GitHub Actions", color: "#2088FF" },
    { title: "TMDB API", color: "#01D277" },
    { title: "Tailwind CSS", color: "#06B6D4" },
    { title: "PayPal", color: "#009cde" },
    { title: "MailKit", color: "#FF6C2C" },
    { title: "QuestPDF", color: "#E53E3E" },
    { title: "Remotion", color: "#ffffff" },
  ];

  return (
    <SceneContainer dark>
      <AbsoluteFill style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Spotlight x={spotlightX} y={spotlightY} radius={350} opacity={0.1} />
        <Spotlight x={spotlightX + 200} y={spotlightY - 150} radius={500} opacity={0.06} />

        <div style={{ marginBottom: 50, textAlign: "center" }}>
          <MotionText text="Architettura cloud" delay={15} size={42} color={TEXT} glow centered />
          <MotionText text="moderna e scalabile" delay={25} size={42} color={GOLD} glow centered />
        </div>

        <div style={{ maxWidth: 750, zIndex: 20 }}>
          <FloatingCards items={techPills} delay={40} />
        </div>

        <div style={{
          marginTop: 48,
          opacity: interpolate(frame, [95, 115], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          <span style={{ fontSize: 12, color: `${GOLD}55`, fontFamily: "'Space Grotesk', Arial, sans-serif", letterSpacing: 2 }}>
            INFRASTRUCTURE · API · DEVOPS
          </span>
        </div>
      </AbsoluteFill>
    </SceneContainer>
  );
};

export default TechScene;
