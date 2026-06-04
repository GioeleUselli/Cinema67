import React from "react";
import { Slide, SubtitleBar, Card, GOLD, DARK } from "../components/Layout";
import { useCurrentFrame } from "remotion";

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, background: DARK }}>
      <Slide title="Biglietteria Digitale" subtitle="QR code e PDF automatici">
        <div style={{ display: "flex", gap: 40, alignItems: "center", justifyContent: "center" }}>
          <Card icon="🎫" label="Tipi Biglietto" sub="6 tipologie" delay={5} />
          <Card icon="📱" label="QR Code" sub="Univoco" delay={10} />
          <Card icon="📄" label="PDF" sub="Automatico" delay={15} />
          <Card icon="🏷️" label="Sconti" sub="3 fonti" delay={20} />
        </div>
      </Slide>
      <SubtitleBar text="Biglietteria digitale completa: QR code, PDF automatico, voucher e codici sconto." />
    </div>
  );
};
export default Scene;
