import React from "react";
import { Slide, SubtitleBar, Card, GOLD, DARK } from "../components/Layout";
import { useCurrentFrame } from "remotion";

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, background: DARK }}>
      <Slide title="Shop Merchandise" subtitle="E-commerce integrato">
        <div style={{ display: "flex", gap: 36, alignItems: "center", justifyContent: "center" }}>
          <Card icon="👕" label="Prodotti" delay={5} />
          <Card icon="🛒" label="Carrello" delay={10} />
          <Card icon="💳" label="Checkout" delay={15} />
          <Card icon="📦" label="Ordine" delay={20} />
          <Card icon="🚚" label="Spedizione" delay={25} />
        </div>
      </Slide>
      <SubtitleBar text="Shop merchandise ufficiale. Varianti per taglia e colore, stock gestito, ordini tracciati." />
    </div>
  );
};
export default Scene;
