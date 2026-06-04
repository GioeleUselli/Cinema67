import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { SceneContainer, MotionText, FloatingCards, Spotlight, GOLD, DARK, TEXT, MUTED } from "../components/CinemaComponents";

const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });
  const titleY = spring({ frame: frame - 10, fps, config: { mass: 0.4, damping: 8 } });
  const titleScale = spring({ frame: frame - 10, fps, config: { mass: 0.5, damping: 7 } });

  const subtitleOpacity = interpolate(frame, [35, 55], [0, 1], { extrapolateRight: "clamp" });
  const subtitleBlur = interpolate(frame, [35, 55], [10, 0], { extrapolateRight: "clamp" });

  const cards = [
    { title: "🎬 Gestisci film e spettacoli", icon: "", color: GOLD },
    { title: "🛒 Shop e merchandise", icon: "", color: GOLD },
    { title: "👑 Membership e fedeltà", icon: "", color: GOLD },
    { title: "🎉 Feste ed eventi", icon: "", color: GOLD },
    { title: "💳 Pagamenti integrati", icon: "", color: GOLD },
    { title: "📧 19 template email", icon: "", color: GOLD },
  ];

  return (
    <SceneContainer dark>
      <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <Spotlight x={960} y={250} radius={600} opacity={0.12} />

        <div style={{
          opacity: titleOpacity,
          transform: `translateY(${(1 - titleY) * 40}px) scale(${0.85 + titleScale * 0.15})`,
          marginBottom: 24,
        }}>
          <h1 style={{
            fontSize: 90,
            color: GOLD,
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontWeight: 700,
            margin: 0,
            letterSpacing: 6,
            textShadow: `0 0 80px ${GOLD}33`,
            lineHeight: 1,
          }}>
            CINEMA67
          </h1>
        </div>

        <div style={{
          opacity: subtitleOpacity,
          filter: `blur(${subtitleBlur}px)`,
          transform: `translateY(${(1 - subtitleOpacity) * 20}px)`,
          marginBottom: 60,
        }}>
          <p style={{
            fontSize: 22,
            color: MUTED,
            fontFamily: "'Space Grotesk', Arial, sans-serif",
            fontWeight: 400,
            margin: 0,
            letterSpacing: 2,
          }}>
            La piattaforma completa per il cinema moderno
          </p>
        </div>

        <div style={{ maxWidth: 900 }}>
          <FloatingCards items={cards} delay={65} />
        </div>

        <div style={{
          position: "absolute",
          bottom: 40,
          opacity: interpolate(frame, [100, 120], [0, 1], { extrapolateRight: "clamp" }),
        }}>
          <span style={{ fontSize: 12, color: `${GOLD}66`, fontFamily: "'Space Grotesk', Arial, sans-serif", letterSpacing: 3 }}>
            www.cinema67.it
          </span>
        </div>
      </AbsoluteFill>
    </SceneContainer>
  );
};

export default IntroScene;
