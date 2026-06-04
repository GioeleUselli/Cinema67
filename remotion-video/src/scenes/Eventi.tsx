import React from "react";
import { Slide, SubtitleBar, Card, GOLD, DARK } from "../components/Layout";
import { useCurrentFrame } from "remotion";

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, background: DARK }}>
      <Slide title="Eventi e Feste" subtitle="Prenotazione privata al cinema">
        <div style={{ display: "flex", flexDirection: "column", gap: 36, alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", gap: 32, alignItems: "center", justifyContent: "center" }}>
            <Card icon="🍿" label="Basic" sub="da €15/ospite" large delay={5} />
            <Card icon="🎂" label="Premium" sub="da €22.50" large delay={10} />
            <Card icon="👑" label="VIP" sub="da €37.50" color="#b91c1c" large delay={15} />
          </div>
          <div style={{ display: "flex", gap: 28, alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 600, color: "#c4b8a8" }}>
            <span>MovieParty</span>
            <span style={{ color: `${GOLD}44` }}>·</span>
            <span>GameRoom</span>
            <span style={{ color: `${GOLD}44` }}>·</span>
            <span>Both</span>
          </div>
        </div>
      </Slide>
      <SubtitleBar text="Prenota feste private al cinema. Tre tipi di evento, tre pacchetti, dal Basic al VIP." />
    </div>
  );
};
export default Scene;
