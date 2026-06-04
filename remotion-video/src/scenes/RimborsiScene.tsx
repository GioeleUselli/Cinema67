import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { SceneContainer, MotionText, FeatureHighlight, BrowserFrame, Spotlight, GOLD, TEXT, MUTED } from "../components/CinemaComponents";

const rimborsiImg = require("../assets/admin_rimborsi.png");

const RimborsiScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const browserOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const browserScale = interpolate(frame, [15, 35], [0.92, 1], { extrapolateRight: "clamp" });

  const features = [
    { icon: "🔙", text: "Rimborso automatico show cancellati", delay: 50 },
    { icon: "💵", text: "Rimborso feste cancellate", delay: 63 },
    { icon: "📋", text: "Coda revisione manuale", delay: 76 },
    { icon: "📊", text: "Dashboard rimborsi unificata", delay: 89 },
  ];

  return (
    <SceneContainer dark>
      <AbsoluteFill style={{ display: "flex" }}>
        <Spotlight x={250} y={350} radius={500} opacity={0.08} />

        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 80px", gap: 80 }}>
          <div style={{ flex: "0 0 420px", zIndex: 20 }}>
            <MotionText text="Rimborsi automatici" delay={20} size={38} color={TEXT} glow />
            <MotionText text="e manuali" delay={30} size={38} color={GOLD} glow />
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
            <BrowserFrame url="admin.cinema67.it/rimborsi" scale={0.82}>
              <img src={rimborsiImg} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Rimborsi" />
            </BrowserFrame>
          </div>
        </div>
      </AbsoluteFill>
    </SceneContainer>
  );
};

export default RimborsiScene;
