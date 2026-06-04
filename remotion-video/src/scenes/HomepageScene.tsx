import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { SceneContainer, MotionText, FeatureHighlight, BrowserFrame, AnimatedCursor, Spotlight, GOLD, TEXT, MUTED } from "../components/CinemaComponents";

const homeImg = require("../assets/home.png");

const HomepageScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const browserOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const browserScale = interpolate(frame, [15, 35], [0.92, 1], { extrapolateRight: "clamp" });

  const cursorPath = [
    { x: 450, y: 50, atFrame: 30 },
    { x: 600, y: 50, atFrame: 50 },
    { x: 700, y: 50, atFrame: 70 },
  ];

  const features = [
    { icon: "🎬", text: "Film in programmazione", delay: 60 },
    { icon: "🎟️", text: "Promozioni attive", delay: 72 },
    { icon: "🎁", text: "Gift card", delay: 84 },
    { icon: "🎉", text: "Eventi e feste", delay: 96 },
  ];

  return (
    <SceneContainer dark>
      <AbsoluteFill style={{ display: "flex" }}>
        <Spotlight x={300} y={350} radius={500} opacity={0.08} />

        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 80px", gap: 80 }}>
          <div style={{ flex: "0 0 420px", zIndex: 20 }}>
            <MotionText text="Un'unica esperienza" delay={20} size={42} color={TEXT} glow />
            <MotionText text="per spettatori e staff" delay={30} size={42} color={GOLD} glow />
            <div style={{ marginTop: 40 }}>
              {features.map((f) => (
                <FeatureHighlight key={f.text} icon={f.icon} text={f.text} delay={f.delay} />
              ))}
            </div>
            <div style={{
              marginTop: 32,
              opacity: interpolate(frame, [115, 135], [0, 1], { extrapolateRight: "clamp" }),
            }}>
              <span style={{ fontSize: 12, color: `${GOLD}55`, fontFamily: "'Space Grotesk', Arial, sans-serif", letterSpacing: 2 }}>
                cinema67.it
              </span>
            </div>
          </div>

          <div style={{
            flex: 1,
            opacity: browserOpacity,
            transform: `scale(${browserScale})`,
            position: "relative",
          }}>
            <BrowserFrame url="cinema67.it" scale={0.82}>
              <div style={{ position: "relative" }}>
                <img src={homeImg} style={{ width: "100%", display: "block" }} alt="Homepage" />
                <AnimatedCursor path={cursorPath} clicks={[75]} />
              </div>
            </BrowserFrame>
          </div>
        </div>
      </AbsoluteFill>
    </SceneContainer>
  );
};

export default HomepageScene;
