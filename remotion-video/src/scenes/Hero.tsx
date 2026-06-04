import React from "react";
import { Slide, SubtitleBar, Card, GOLD, DARK } from "../components/Layout";
import { useCurrentFrame } from "remotion";

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <div style={{ position: "absolute", inset: 0, background: DARK }}>
      <Slide title="Cinema67" subtitle="">
        <div style={{ display: "flex", gap: 48, alignItems: "center", justifyContent: "center" }}>
          <Card icon="🎬" label="Gestisci Film" delay={5} />
          <Card icon="🛒" label="E-commerce" delay={9} />
          <Card icon="👑" label="Membership" delay={13} />
          <Card icon="💳" label="Pagamenti" delay={17} />
          <Card icon="📧" label="Email" delay={21} />
        </div>
      </Slide>
      <SubtitleBar text="Tutto ciò che serve per gestire un cinema moderno in un'unica piattaforma." />
    </div>
  );
};
export default Scene;
