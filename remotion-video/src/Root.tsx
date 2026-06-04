import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import Hero from "./scenes/Hero";
import Auth from "./scenes/Auth";
import Films from "./scenes/Films";
import Programmazione from "./scenes/Programmazione";
import MappaPosti from "./scenes/MappaPosti";
import Biglietteria from "./scenes/Biglietteria";
import Shop from "./scenes/Shop";
import CarrelloCrossDevice from "./scenes/CarrelloCrossDevice";
import GiftCard from "./scenes/GiftCard";
import Pagamenti from "./scenes/Pagamenti";
import Membership from "./scenes/Membership";
import Premi from "./scenes/Premi";
import Eventi from "./scenes/Eventi";
import Rimborsi from "./scenes/Rimborsi";
import Email from "./scenes/Email";
import Marketing from "./scenes/Marketing";
import DarkMode from "./scenes/DarkMode";
import Cloud from "./scenes/Cloud";
import Tech from "./scenes/Tech";
import Finale from "./scenes/Finale";

const GOLD = "#d4af37";
const DURATION = 300;
const scenes = [
  Hero, Auth, Films, Programmazione, MappaPosti,
  Biglietteria, Shop, CarrelloCrossDevice, GiftCard, Pagamenti,
  Membership, Premi, Eventi, Rimborsi, Email,
  Marketing, DarkMode, Cloud, Tech, Finale,
];

export const Cinema67Presentation: React.FC = () => {
  let current = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0806" }}>
      {scenes.map((Scene, i) => {
        const from = current;
        current += DURATION;
        return <Sequence key={i} from={from} durationInFrames={DURATION}><Scene /></Sequence>;
      })}
      <Progress total={scenes.length * DURATION} />
    </AbsoluteFill>
  );
};

const Progress: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  const pct = interpolate(frame, [0, total], [0, 100], { extrapolateRight: "clamp" });
  return <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${GOLD}, transparent)`, width: `${pct}%`, opacity: 0.5 }} />;
};
