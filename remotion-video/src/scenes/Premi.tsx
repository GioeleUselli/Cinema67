import React from "react";
import { Slide, SubtitleBar, Card, GOLD, DARK } from "../components/Layout";
import { useCurrentFrame } from "remotion";

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, background: DARK }}>
      <Slide title="Catalogo Premi" subtitle="Riscatta punti per vantaggi esclusivi">
        <div style={{ display: "flex", flexDirection: "column", gap: 40, alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", gap: 36, alignItems: "center", justifyContent: "center" }}>
            <Card icon="🎫" label="Biglietti" delay={5} />
            <Card icon="🎁" label="Gift Card" delay={10} />
            <Card icon="👕" label="Merchandise" delay={15} />
            <Card icon="🏷️" label="Sconti" delay={20} />
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, color: GOLD, fontFamily: "'DM Serif Display', Georgia, serif", textAlign: "center", padding: "16px 48px", border: `2px solid ${GOLD}44`, borderRadius: 16, background: `${GOLD}0d` }}>
            💰 Punti → 🎁 Premio
          </div>
        </div>
      </Slide>
      <SubtitleBar text="Catalogo premi: riscatta i punti per biglietti gratis, gift card, merchandise e sconti." />
    </div>
  );
};
export default Scene;
