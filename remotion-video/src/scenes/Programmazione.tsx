import React from "react";
import { Slide, SubtitleBar, Card, GOLD, DARK, TEXT } from "../components/Layout";
import { useCurrentFrame, interpolate } from "remotion";

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const pubOpacity = interpolate(frame, [40, 55], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", inset: 0, background: DARK }}>
      <Slide title="Programmazione Cinema" subtitle="Sale, orari, prezzi, supplementi">
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 36 }}>
          <div style={{ display: "flex", gap: 40, alignItems: "center", justifyContent: "center" }}>
            <Card icon="🏛️" label="Cinema" delay={5} />
            <Card icon="🪑" label="Sale" delay={10} />
            <Card icon="📅" label="Orari" delay={15} />
            <Card icon="💰" label="Prezzi" delay={20} />
          </div>
          <div style={{ opacity: pubOpacity }}>
            <p style={{ fontSize: 20, color: GOLD, fontFamily: "'DM Serif Display', Georgia, serif", margin: 0 }}>
              Pubblica con un click
            </p>
          </div>
        </div>
      </Slide>
      <SubtitleBar text="Crea la programmazione: sale, orari, prezzi. Pubblica con un click." />
    </div>
  );
};
export default Scene;
