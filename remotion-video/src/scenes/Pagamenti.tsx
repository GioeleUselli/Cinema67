import React from "react";
import { Slide, SubtitleBar, Card, GOLD, DARK } from "../components/Layout";
import { useCurrentFrame } from "remotion";

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, background: DARK }}>
      <Slide title="Sistema Pagamenti" subtitle="Stripe, PayPal, Credito, Misto">
        <div style={{ display: "flex", gap: 40, alignItems: "center", justifyContent: "center" }}>
          <Card icon="💳" label="Stripe" color="#635BFF" delay={5} />
          <Card icon="🅿️" label="PayPal" color="#009cde" delay={10} />
          <Card icon="💰" label="Credito" color={GOLD} delay={15} />
          <Card icon="🔄" label="Misto" color="#22c55e" delay={20} />
        </div>
      </Slide>
      <SubtitleBar text="Quattro metodi di pagamento: Stripe, PayPal, Credito prepagato e metodo misto." />
    </div>
  );
};
export default Scene;
