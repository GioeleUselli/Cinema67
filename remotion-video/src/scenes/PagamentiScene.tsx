import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from "remotion";
import { SceneContainer, MotionText, FeatureHighlight, BrowserFrame, Spotlight, GOLD, TEXT, MUTED } from "../components/CinemaComponents";

const ricaricaImg = require("../assets/admin_ricarica_credito.png");

const PaymentBadge: React.FC<{
  label: string;
  subtitle: string;
  gradient: string;
  badge: string;
  badgeBg: string;
  delay: number;
  index: number;
}> = ({ label, subtitle, gradient, badge, badgeBg, delay, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const d = delay + index * 10;
  const opacity = interpolate(frame, [d, d + 15], [0, 1], { extrapolateRight: "clamp" });
  const scale = spring({ frame: frame - d, fps, config: { mass: 0.4, damping: 8 } });

  return (
    <div style={{
      opacity,
      transform: `scale(${scale})`,
      padding: "18px 22px",
      borderRadius: 16,
      background: gradient,
      color: "#fff",
      fontFamily: "'Space Grotesk', Arial, sans-serif",
      width: 200,
      boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
    }}>
      <div style={{
        display: "inline-block",
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: 1,
        textTransform: "uppercase",
        padding: "2px 8px",
        borderRadius: 6,
        background: badgeBg,
        marginBottom: 8,
      }}>
        {badge}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 10, opacity: 0.8, marginTop: 2 }}>{subtitle}</div>
    </div>
  );
};

const PagamentiScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const browserOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateRight: "clamp" });
  const browserScale = interpolate(frame, [15, 35], [0.92, 1], { extrapolateRight: "clamp" });

  const paymentMethods = [
    { label: "Stripe", subtitle: "Pagamento con carta", gradient: "linear-gradient(135deg, #635BFF, #4F46E5)", badge: "LIVE", badgeBg: "rgba(255,255,255,0.25)", delay: 55 },
    { label: "PayPal", subtitle: "Wallet digitale", gradient: "linear-gradient(135deg, #009cde, #003087)", badge: "SANDBOX", badgeBg: "rgba(255,255,255,0.2)", delay: 55 },
    { label: "Credito", subtitle: "Credito prepagato", gradient: `linear-gradient(135deg, ${GOLD}, #b8860b)`, badge: "PREPAID", badgeBg: "rgba(0,0,0,0.25)", delay: 55 },
    { label: "Misto", subtitle: "Credito + carta", gradient: `linear-gradient(135deg, #635BFF, ${GOLD})`, badge: "MIXED", badgeBg: "rgba(0,0,0,0.25)", delay: 55 },
  ];

  const features = [
    { icon: "💳", text: "Stripe Live con webhook", delay: 65 },
    { icon: "🅿️", text: "PayPal Sandbox", delay: 78 },
    { icon: "💰", text: "Credito prepagato", delay: 91 },
    { icon: "🔄", text: "Metodo misto credito+carta", delay: 104 },
  ];

  return (
    <SceneContainer dark>
      <AbsoluteFill style={{ display: "flex" }}>
        <Spotlight x={900} y={350} radius={500} opacity={0.08} />

        <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "0 80px", gap: 80 }}>
          <div style={{
            flex: 1,
            opacity: browserOpacity,
            transform: `scale(${browserScale})`,
            position: "relative",
            zIndex: 20,
          }}>
            <BrowserFrame url="admin.cinema67.it/ricarica" scale={0.78}>
              <img src={ricaricaImg} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Ricarica Credito" />
            </BrowserFrame>
          </div>

          <div style={{ flex: "0 0 440px", zIndex: 20 }}>
            <MotionText text="Sistema pagamenti" delay={15} size={38} color={TEXT} glow />
            <MotionText text="integrato" delay={25} size={38} color={GOLD} glow />
            <div style={{ marginTop: 32, marginBottom: 28 }}>
              {features.map((f) => (
                <FeatureHighlight key={f.text} icon={f.icon} text={f.text} delay={f.delay} />
              ))}
            </div>
            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 12,
              justifyContent: "flex-start",
            }}>
              {paymentMethods.map((pm, i) => (
                <PaymentBadge
                  key={pm.label}
                  label={pm.label}
                  subtitle={pm.subtitle}
                  gradient={pm.gradient}
                  badge={pm.badge}
                  badgeBg={pm.badgeBg}
                  delay={pm.delay}
                  index={i}
                />
              ))}
            </div>
          </div>
        </div>
      </AbsoluteFill>
    </SceneContainer>
  );
};

export default PagamentiScene;
