import React from "react";
import { Slide, SubtitleBar, Card, Pill, GOLD, DARK } from "../components/Layout";
import { useCurrentFrame } from "remotion";

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, background: DARK }}>
      <Slide title="Sistema Email" subtitle="19 template brandizzati">
        <div style={{ display: "flex", flexDirection: "column", gap: 36, alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", gap: 32, alignItems: "center", justifyContent: "center" }}>
            <Card icon="🎫" label="Biglietti" delay={5} />
            <Card icon="🎁" label="Gift Card" delay={10} />
            <Card icon="👑" label="Membership" delay={15} />
            <Card icon="📰" label="Newsletter" delay={20} />
            <Card icon="📦" label="Tracking" delay={25} />
          </div>
          <div style={{ display: "flex", gap: 20, alignItems: "center", justifyContent: "center" }}>
            <Pill text="Dark/Light Mode" color={GOLD} delay={30} />
            <Pill text="Fire-and-forget" color={GOLD} delay={35} />
            <Pill text="SMTP SSL:465" color={GOLD} delay={40} />
          </div>
        </div>
      </Slide>
      <SubtitleBar text="Diciannove template email brandizzati. Dark e light mode automatico. Invio fire and forget." />
    </div>
  );
};
export default Scene;
