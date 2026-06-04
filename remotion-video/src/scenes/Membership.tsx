import React from "react";
import { Slide, SubtitleBar, Card, Pill, GOLD, DARK } from "../components/Layout";
import { useCurrentFrame } from "remotion";

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, background: DARK }}>
      <Slide title="Programma Fedeltà" subtitle="4 livelli progressivi">
        <div style={{ display: "flex", flexDirection: "column", gap: 36, alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", gap: 32, alignItems: "center", justifyContent: "center" }}>
            <Card icon="⬜" label="Base" sub="1× punti" color="#a89888" delay={5} />
            <Card icon="🥈" label="Silver" sub="500pt · 1.2×" color="#a8a8a8" delay={10} />
            <Card icon="🥇" label="Gold" sub="2000pt · 1.5×" color={GOLD} delay={15} />
            <Card icon="👑" label="Platinum" sub="5000pt · 2×" color="#b91c1c" delay={20} />
          </div>
          <div style={{ display: "flex", gap: 20, alignItems: "center", justifyContent: "center" }}>
            <Pill text="Punti automatici" color={GOLD} delay={25} />
            <Pill text="Sconto compleanno" color={GOLD} delay={30} />
            <Pill text="Promozioni festive" color={GOLD} delay={35} />
          </div>
        </div>
      </Slide>
      <SubtitleBar text="Programma fedeltà a quattro livelli: Base, Silver, Gold e Platinum. Punti automatici ad ogni acquisto." />
    </div>
  );
};
export default Scene;
