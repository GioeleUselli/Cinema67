import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { SceneContainer, FloatingCards, Spotlight, GOLD, DARK, TEXT, MUTED } from "../components/CinemaComponents";

const FinaleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateRight: "clamp" });
  const titleY = spring({ frame: frame - 10, fps, config: { mass: 0.4, damping: 8 } });
  const titleScale = spring({ frame: frame - 10, fps, config: { mass: 0.5, damping: 7 } });

  const subtitleOpacity = interpolate(frame, [35, 55], [0, 1], { extrapolateRight: "clamp" });
  const subtitleBlur = interpolate(frame, [35, 55], [10, 0], { extrapolateRight: "clamp" });

  const urlOpacity = interpolate(frame, [130, 145], [0, 1], { extrapolateRight: "clamp" });
  const grazieOpacity = interpolate(frame, [125, 148], [0, 1], { extrapolateRight: "clamp" });

  const stats = [
    { title: "🎬 137+ endpoint API", color: GOLD },
    { title: "📧 19 template email", color: GOLD },
    { title: "💳 9 flussi pagamento", color: GOLD },
  ];

  return (
    <SceneContainer dark>
      <AbsoluteFill style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <Spotlight x={960} y={200} radius={600} opacity={0.1} />
        <Spotlight x={600} y={500} radius={400} opacity={0.06} />

        <div style={{
          opacity: titleOpacity,
          transform: `translateY(${(1 - titleY) * 40}px) scale(${0.85 + titleScale * 0.15})`,
          marginBottom: 16,
        }}>
          <h1 style={{
            fontSize: 72,
            color: GOLD,
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontWeight: 700,
            margin: 0,
            letterSpacing: 8,
            textShadow: `0 0 60px ${GOLD}33`,
            lineHeight: 1,
          }}>
            CINEMA67
          </h1>
        </div>

        <div style={{
          opacity: subtitleOpacity,
          filter: `blur(${subtitleBlur}px)`,
          transform: `translateY(${(1 - subtitleOpacity) * 20}px)`,
          marginBottom: 56,
        }}>
          <p style={{
            fontSize: 20,
            color: MUTED,
            fontFamily: "'Space Grotesk', Arial, sans-serif",
            fontWeight: 400,
            margin: 0,
            letterSpacing: 1.5,
          }}>
            La piattaforma completa per il cinema moderno
          </p>
        </div>

        <div style={{ marginBottom: 48 }}>
          <FloatingCards items={stats} delay={65} />
        </div>

        <div style={{
          opacity: urlOpacity,
          textAlign: "center",
          marginBottom: 32,
        }}>
          <p style={{
            fontSize: 14,
            color: `${GOLD}88`,
            fontFamily: "'Space Grotesk', Arial, sans-serif",
            fontWeight: 500,
            margin: 0,
            letterSpacing: 1,
          }}>
            www.cinema67.it · api.cinema67.it
          </p>
        </div>

        <div style={{
          opacity: grazieOpacity,
          transform: `translateY(${(1 - grazieOpacity) * 15}px)`,
        }}>
          <p style={{
            fontSize: 28,
            color: TEXT,
            fontFamily: "'DM Serif Display', Georgia, serif",
            fontWeight: 700,
            margin: 0,
            letterSpacing: 2,
          }}>
            Grazie per l'attenzione
          </p>
        </div>
      </AbsoluteFill>
    </SceneContainer>
  );
};

export default FinaleScene;
