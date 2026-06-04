import React from "react";
import { Slide, SubtitleBar, Pill, GOLD, DARK } from "../components/Layout";
import { useCurrentFrame } from "remotion";

const Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const techs = [
    { text: "ASP.NET 9", color: "#b84cf0" },
    { text: "MariaDB", color: "#c0765a" },
    { text: "Docker", color: "#2496ed" },
    { text: "Azure", color: "#0078d4" },
    { text: "Stripe", color: "#635bff" },
    { text: "PayPal", color: "#009cde" },
    { text: "TMDB API", color: "#01b4e4" },
    { text: "Tailwind CSS", color: "#06b6d4" },
    { text: "GitHub Actions", color: "#2088ff" },
    { text: "MailKit", color: "#e05a00" },
    { text: "QuestPDF", color: "#d93448" },
    { text: "Remotion", color: GOLD },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, background: DARK }}>
      <Slide title="Stack Tecnologico" subtitle="Tecnologie moderne">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, maxWidth: 1000, alignItems: "center", justifyContent: "center" }}>
          {techs.map((t, i) => (
            <Pill key={i} text={t.text} color={t.color} delay={i * 3} />
          ))}
        </div>
      </Slide>
      <SubtitleBar text="Stack tecnologico moderno: ASP.NET nove, MariaDB, Docker, Stripe, Tailwind CSS e molto altro." />
    </div>
  );
};
export default Scene;
