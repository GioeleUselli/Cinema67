import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { SceneContainer, MotionText, FeatureHighlight, FloatingCards, BrowserFrame, AnimatedCursor, Spotlight, GOLD, TEXT } from "../components/CinemaComponents";

const membershipImg = require("../assets/user_membership.png");

const MembershipScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const browserOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const browserScale = interpolate(frame, [15, 35], [0.92, 1], { extrapolateRight: "clamp" });

  const spotlightX = interpolate(frame, [30, 150], [400, 750], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });
  const spotlightY = interpolate(frame, [30, 150], [200, 550], { extrapolateRight: "clamp", extrapolateLeft: "clamp" });

  const cursorPath = [
    { x: 550, y: 60, atFrame: 30 },
    { x: 700, y: 60, atFrame: 55 },
    { x: 780, y: 60, atFrame: 75 },
    { x: 650, y: 60, atFrame: 100 },
  ];

  const features = [
    { icon: "👑", text: "Tier progressivi", delay: 50 },
    { icon: "✨", text: "Punti automatici", delay: 63 },
    { icon: "🎁", text: "Catalogo premi", delay: 76 },
    { icon: "🎂", text: "Sconto compleanno", delay: 89 },
  ];

  const cards = [
    { title: "Base", subtitle: "1x punti", color: "#a89888" },
    { title: "Silver", subtitle: "500pt · 1.2x", color: "#a8a8a8" },
    { title: "Gold", subtitle: "2000pt · 1.5x", color: GOLD },
    { title: "Platinum", subtitle: "5000pt · 2x", color: "#b91c1c" },
  ];

  return (
    <SceneContainer dark>
      <AbsoluteFill style={{ display: "flex" }}>
        <Spotlight x={300} y={350} radius={500} opacity={0.08} />

        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 80px", gap: 80 }}>
          <div style={{ flex: "0 0 420px", zIndex: 20 }}>
            <MotionText text="Programma fedeltà" delay={20} size={40} color={TEXT} glow />
            <MotionText text="a 4 livelli" delay={30} size={40} color={GOLD} glow />
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
            <BrowserFrame url="cinema67.it/membership" scale={0.82}>
              <div style={{ position: "relative" }}>
                <img src={membershipImg} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Membership" />
                <Spotlight x={spotlightX} y={spotlightY} radius={280} opacity={0.12} />
                <AnimatedCursor path={cursorPath} clicks={[75]} />
              </div>
            </BrowserFrame>
          </div>
        </div>
      </AbsoluteFill>
    </SceneContainer>
  );
};

export default MembershipScene;
