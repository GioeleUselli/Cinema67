import React from "react";
import { Slide, SubtitleBar, Pill, GOLD, DARK } from "../components/Layout";
import { useCurrentFrame } from "remotion";
import { interpolate } from "remotion";

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, background: DARK }}>
      <Slide title="Marketing" subtitle="Campagne e promozioni">
        <div style={{ display: "flex", flexDirection: "column", gap: 36, alignItems: "center", justifyContent: "center" }}>
          <div style={{ display: "flex", gap: 24, alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 600 }}>
            <span style={{ fontSize: 48 }}>👤</span>
            <span style={{ color: GOLD, fontSize: 28 }}>→</span>
            <span style={{ fontSize: 34, color: GOLD, fontFamily: "'DM Serif Display', Georgia, serif" }}>📢 Crea Campagna</span>
            <span style={{ color: GOLD, fontSize: 28 }}>→</span>
            <span style={{ fontSize: 48 }}>👤👤👤</span>
          </div>
          <div style={{ display: "flex", gap: 20, alignItems: "center", justifyContent: "center" }}>
            <Pill text="Codici sconto" color={GOLD} delay={10} />
            <Pill text="Newsletter" color={GOLD} delay={15} />
            <Pill text="Promozioni festive" color={GOLD} delay={20} />
          </div>
        </div>
      </Slide>
      <SubtitleBar text="Marketing integrato: campagne, codici sconto, promozioni festive e newsletter programmata." />
    </div>
  );
};
export default Scene;
