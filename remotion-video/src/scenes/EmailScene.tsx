import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { SceneContainer, MotionText, FeatureHighlight, BrowserFrame, Spotlight, GOLD, TEXT } from "../components/CinemaComponents";

const profiloImg = require("../assets/user_profilo.png");

const emailIcons = [
  { icon: "🎫", label: "Biglietti", delay: 30 },
  { icon: "🎁", label: "Gift Card", delay: 45 },
  { icon: "🎉", label: "Feste", delay: 60 },
  { icon: "👑", label: "Membership", delay: 75 },
];

const EmailIconCard: React.FC<{ icon: string; label: string; delay: number }> = ({ icon, label, delay }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: "clamp" });
  const y = interpolate(frame, [delay, delay + 15], [20, 0], { extrapolateRight: "clamp" });

  return (
    <div style={{
      opacity,
      transform: `translateY(${y}px)`,
      padding: "12px 18px",
      borderRadius: 12,
      border: `1px solid ${GOLD}20`,
      background: `${GOLD}08`,
      textAlign: "center",
      fontFamily: "'Space Grotesk', Arial, sans-serif",
      backdropFilter: "blur(8px)",
    }}>
      <div style={{ fontSize: 20, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 10, color: GOLD, fontWeight: 600 }}>{label}</div>
    </div>
  );
};

const EmailScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const browserOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const browserScale = interpolate(frame, [15, 35], [0.92, 1], { extrapolateRight: "clamp" });

  const features = [
    { icon: "📧", text: "19 template brandizzati Cinema67", delay: 50 },
    { icon: "🌓", text: "Dark/Light mode automatico", delay: 63 },
    { icon: "🔥", text: "Invio fire-and-forget (non bloccante)", delay: 76 },
    { icon: "📬", text: "SMTP authsmtp.securemail.pro:465", delay: 89 },
  ];

  return (
    <SceneContainer dark>
      <AbsoluteFill style={{ display: "flex" }}>
        <Spotlight x={300} y={350} radius={500} opacity={0.08} />

        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 80px", gap: 80 }}>
          <div style={{ flex: "0 0 420px", zIndex: 20 }}>
            <MotionText text="Sistema email" delay={20} size={40} color={TEXT} glow />
            <MotionText text="automatizzato" delay={30} size={40} color={GOLD} glow />
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
            <BrowserFrame url="cinema67.it/profilo" scale={0.82}>
              <div style={{ position: "relative" }}>
                <img src={profiloImg} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Profilo" />
                <div style={{ position: "absolute", top: 12, left: 12 }}>
                  <EmailIconCard {...emailIcons[0]} />
                </div>
                <div style={{ position: "absolute", top: 12, right: 12 }}>
                  <EmailIconCard {...emailIcons[1]} />
                </div>
                <div style={{ position: "absolute", bottom: 12, left: 12 }}>
                  <EmailIconCard {...emailIcons[2]} />
                </div>
                <div style={{ position: "absolute", bottom: 12, right: 12 }}>
                  <EmailIconCard {...emailIcons[3]} />
                </div>
              </div>
            </BrowserFrame>
          </div>
        </div>
      </AbsoluteFill>
    </SceneContainer>
  );
};

export default EmailScene;
