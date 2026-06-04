import React from "react";
import { Slide, SubtitleBar, Card, Pill, GOLD, DARK } from "../components/Layout";
import { useCurrentFrame } from "remotion";

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, background: DARK }}>
      <Slide title="Sistema di Autenticazione" subtitle="Multi-provider e sicuro">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
          <div style={{ display: "flex", gap: 48, alignItems: "center", justifyContent: "center" }}>
            <Card icon="📧" label="Email" sub="BCrypt" delay={5} />
            <Card icon="🔐" label="Google" sub="OAuth 2.0" color="#4285F4" delay={10} />
            <Card icon="⊞" label="Microsoft" sub="OAuth 2.0" color="#00A4EF" delay={15} />
          </div>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
            <Pill text="JWT 15min" color={GOLD} delay={20} />
            <Pill text="Refresh Token 30gg" color={GOLD} delay={24} />
            <Pill text="Route Guard" color={GOLD} delay={28} />
            <Pill text="4 Ruoli" color={GOLD} delay={32} />
          </div>
        </div>
      </Slide>
      <SubtitleBar text="Login classico, Google, Microsoft. JWT, ruoli e massima sicurezza." />
    </div>
  );
};
export default Scene;
