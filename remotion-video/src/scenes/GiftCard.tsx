import React from "react";
import { Slide, SubtitleBar, Card, GOLD, DARK } from "../components/Layout";
import { useCurrentFrame } from "remotion";

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, background: DARK }}>
      <Slide title="Gift Card Digitali" subtitle="Personalizzabili e programmabili">
        <div style={{ display: "flex", gap: 40, alignItems: "center", justifyContent: "center" }}>
          <Card icon="💶" label="Importi" sub="€5-500" delay={5} />
          <Card icon="📧" label="Invio" sub="Programmato" delay={10} />
          <Card icon="✏️" label="Messaggio" sub="Personalizzato" delay={15} />
          <Card icon="🔄" label="Riscatto" sub="Immediato" delay={20} />
        </div>
      </Slide>
      <SubtitleBar text="Gift card digitali personalizzabili. Invio programmato, messaggio dedicato, riscatto immediato." />
    </div>
  );
};
export default Scene;
