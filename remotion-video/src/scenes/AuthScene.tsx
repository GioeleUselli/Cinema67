import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { SceneContainer, MotionText, FeatureHighlight, BrowserFrame, AnimatedCursor, Spotlight, GOLD, TEXT, MUTED } from "../components/CinemaComponents";

const loginImg = require("../assets/user_login.png");

const AuthScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const browserOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const browserScale = interpolate(frame, [15, 35], [0.92, 1], { extrapolateRight: "clamp" });

  const cursorPath = [
    { x: 520, y: 420, atFrame: 30 },
    { x: 520, y: 480, atFrame: 55 },
    { x: 520, y: 480, atFrame: 75 },
  ];

  const features = [
    { icon: "📧", text: "Login email/password", delay: 55 },
    { icon: "🔐", text: "Google OAuth 2.0", delay: 67 },
    { icon: "⊞", text: "Microsoft OAuth", delay: 79 },
    { icon: "🔄", text: "JWT + Refresh token", delay: 91 },
    { icon: "📱", text: "Sessioni tab isolate", delay: 103 },
  ];

  return (
    <SceneContainer dark>
      <AbsoluteFill style={{ display: "flex" }}>
        <Spotlight x={300} y={350} radius={500} opacity={0.08} />

        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 80px", gap: 80 }}>
          <div style={{ flex: "0 0 420px", zIndex: 20 }}>
            <MotionText text="Accesso" delay={20} size={42} color={TEXT} glow />
            <MotionText text="multi-provider" delay={30} size={42} color={GOLD} glow />
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
            <BrowserFrame url="cinema67.it/login" scale={0.82}>
              <div style={{ position: "relative" }}>
                <img src={loginImg} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Login" />
                <AnimatedCursor path={cursorPath} clicks={[65]} />
              </div>
            </BrowserFrame>
          </div>
        </div>
      </AbsoluteFill>
    </SceneContainer>
  );
};

export default AuthScene;
