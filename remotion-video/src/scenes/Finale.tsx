import React from "react";
import { Slide, SubtitleBar, Card, GOLD, DARK } from "../components/Layout";
import { useCurrentFrame } from "remotion";

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, background: DARK }}>
      <Slide title="Cinema67" subtitle="La piattaforma completa per il cinema del futuro">
        <div style={{ display: "flex", flexDirection: "column", gap: 32, alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", gap: 28, alignItems: "center", justifyContent: "center" }}>
            <Card icon="📡" label="137+" sub="Endpoint API" large delay={5} />
            <Card icon="📧" label="19" sub="Template Email" large delay={10} />
            <Card icon="💳" label="9" sub="Flussi Pagamento" large delay={15} />
          </div>
          <div style={{ display: "flex", gap: 36, alignItems: "center", justifyContent: "center" }}>
            <Card icon="👑" label="4" sub="Livelli Membership" large delay={20} />
            <Card icon="∞" label="Illimitate" sub="Possibilità" large delay={25} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 600, color: "#c4b8a8", textAlign: "center", fontFamily: "'Space Grotesk', Arial, sans-serif", marginTop: 8 }}>
            www.cinema67.it · api.cinema67.it
          </div>
        </div>
      </Slide>
      <SubtitleBar text="Centotrentasette endpoint API. Diciannove template email. Nove flussi di pagamento. Quattro livelli membership. CINEMA67, la piattaforma completa per il cinema del futuro." />
    </div>
  );
};
export default Scene;
