import React from "react";
import { Slide, SubtitleBar, Pill, GOLD, DARK } from "../components/Layout";
import { useCurrentFrame, interpolate } from "remotion";

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const items = [
    { icon: "☁️", label: "Azure" },
    { icon: "📦", label: "Container Apps" },
    { icon: "⚡", label: "ASP.NET 9 API" },
    { icon: "🗄️", label: "MariaDB" },
    { icon: "🎨", label: "Frontend" },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, background: DARK }}>
      <Slide title="Cloud Infrastructure" subtitle="Microsoft Azure">
        <div style={{ display: "flex", flexDirection: "column", gap: 36, alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "center" }}>
            {items.map((item, i) => {
              const opacity = interpolate(frame, [i * 4, i * 4 + 12], [0, 1], { extrapolateRight: "clamp" });
              return (
                <div key={i} style={{ opacity, display: "flex", gap: 16, alignItems: "center", padding: "12px 36px", border: `1px solid ${GOLD}33`, borderRadius: 12, background: `${GOLD}0d`, minWidth: 360 }}>
                  <span style={{ fontSize: 28 }}>{item.icon}</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: GOLD, fontFamily: "'DM Serif Display', Georgia, serif" }}>{item.label}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 20, alignItems: "center", justifyContent: "center" }}>
            <Pill text="CI/CD GitHub Actions" color={GOLD} delay={22} />
            <Pill text="Azure File Share" color={GOLD} delay={27} />
            <Pill text="Scaling automatico" color={GOLD} delay={32} />
          </div>
        </div>
      </Slide>
      <SubtitleBar text="Architettura cloud su Microsoft Azure. Container Apps, CI/CD con GitHub Actions, scaling automatico." />
    </div>
  );
};
export default Scene;
