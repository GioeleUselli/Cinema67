import React from "react";
import { Slide, SubtitleBar, Card, GOLD, DARK } from "../components/Layout";
import { useCurrentFrame } from "remotion";

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, background: DARK }}>
      <Slide title="Rimborsi Automatici" subtitle="Workflow completamente automatizzato">
        <div style={{ display: "flex", flexDirection: "column", gap: 28, alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", gap: 20, alignItems: "center", justifyContent: "center" }}>
            <Card icon="📅" label="Show" sub="Cancellato" delay={5} />
            <span style={{ fontSize: 32, color: GOLD, fontWeight: 700 }}>→</span>
            <Card icon="🔙" label="Rimborso" sub="Automatico" delay={10} />
          </div>
          <div style={{ fontSize: 28, color: `${GOLD}88`, fontWeight: 700 }}>↘ ↙</div>
          <div style={{ display: "flex", gap: 24, alignItems: "center", justifyContent: "center" }}>
            <Card icon="💰" label="Credito" sub="Wallet" delay={15} />
            <span style={{ fontSize: 24, color: `${GOLD}66`, fontWeight: 700 }}>+</span>
            <Card icon="💳" label="Stripe" sub="Carta" delay={20} />
          </div>
          <div style={{ fontSize: 28, color: `${GOLD}88`, fontWeight: 700 }}>↓</div>
          <Card icon="📧" label="Email" sub="Notifica Inviata" delay={25} />
        </div>
      </Slide>
      <SubtitleBar text="Rimborsi automatici. Show cancellato? Rimborso immediato su credito e carta. Email inviata." />
    </div>
  );
};
export default Scene;
