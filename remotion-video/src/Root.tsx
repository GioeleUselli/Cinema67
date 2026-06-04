import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import Hero from "./scenes/Hero";
import Auth from "./scenes/Auth";
import Films from "./scenes/Films";
import Proiezioni from "./scenes/Proiezioni";
import MappaPosti from "./scenes/MappaPosti";
import Biglietteria from "./scenes/Biglietteria";
import Shop from "./scenes/Shop";
import Carrello from "./scenes/Carrello";
import GiftCard from "./scenes/GiftCard";
import Pagamenti from "./scenes/Pagamenti";
import Membership from "./scenes/Membership";
import Premi from "./scenes/Premi";
import Eventi from "./scenes/Eventi";
import Rimborsi from "./scenes/Rimborsi";
import Email from "./scenes/Email";
import Dashboard from "./scenes/Dashboard";
import Marketing from "./scenes/Marketing";
import DarkMode from "./scenes/DarkMode";
import Cloud from "./scenes/Cloud";
import Finale from "./scenes/Finale";

const D = 300;
const scenes = [Hero, Auth, Films, Proiezioni, MappaPosti, Biglietteria, Shop, Carrello, GiftCard, Pagamenti, Membership, Premi, Eventi, Rimborsi, Email, Dashboard, Marketing, DarkMode, Cloud, Finale];

export const Cinema67Presentation: React.FC = () => {
  let c = 0;
  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0806" }}>
      {scenes.map((S, i) => {
        const f = c;
        c += D;
        return (
          <Sequence key={i} from={f} durationInFrames={D}>
            <S />
          </Sequence>
        );
      })}
      <ProgressBar total={scenes.length * D} />
    </AbsoluteFill>
  );
};

const ProgressBar: React.FC<{ total: number }> = ({ total }) => {
  const frame = useCurrentFrame();
  const pct = interpolate(frame, [0, total], [0, 100], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2 }}>
      <div style={{ height: "100%", width: `${pct}%`, background: "#d4af37", opacity: 0.5 }} />
    </div>
  );
};
