import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
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
const TOTAL_FRAMES = 3000;

const ProgressBar: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, TOTAL_FRAMES], [0, 100], {
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        background: "#1a1410",
        zIndex: 100,
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background: `linear-gradient(90deg, ${GOLD}88, ${GOLD})`,
          boxShadow: `0 0 8px ${GOLD}66`,
          borderRadius: "0 2px 2px 0",
        }}
      />
    </div>
  );
};

export const Cinema67Presentation: React.FC = () => {
  return (
    <AbsoluteFill style={{ background: "#0a0806" }}>
      <Sequence from={0} durationInFrames={120}>
        <Hero />
      </Sequence>
      <Sequence from={120} durationInFrames={150}>
        <Auth />
      </Sequence>
      <Sequence from={270} durationInFrames={150}>
        <Films />
      </Sequence>
      <Sequence from={420} durationInFrames={150}>
        <Programmazione />
      </Sequence>
      <Sequence from={570} durationInFrames={150}>
        <MappaPosti />
      </Sequence>
      <Sequence from={720} durationInFrames={150}>
        <Biglietteria />
      </Sequence>
      <Sequence from={870} durationInFrames={150}>
        <Shop />
      </Sequence>
      <Sequence from={1020} durationInFrames={150}>
        <CarrelloCrossDevice />
      </Sequence>
      <Sequence from={1170} durationInFrames={150}>
        <GiftCard />
      </Sequence>
      <Sequence from={1320} durationInFrames={150}>
        <Pagamenti />
      </Sequence>
      <Sequence from={1470} durationInFrames={150}>
        <Membership />
      </Sequence>
      <Sequence from={1620} durationInFrames={150}>
        <Premi />
      </Sequence>
      <Sequence from={1770} durationInFrames={150}>
        <Eventi />
      </Sequence>
      <Sequence from={1920} durationInFrames={150}>
        <Rimborsi />
      </Sequence>
      <Sequence from={2070} durationInFrames={150}>
        <Email />
      </Sequence>
      <Sequence from={2220} durationInFrames={150}>
        <Marketing />
      </Sequence>
      <Sequence from={2370} durationInFrames={150}>
        <DarkMode />
      </Sequence>
      <Sequence from={2520} durationInFrames={150}>
        <Cloud />
      </Sequence>
      <Sequence from={2670} durationInFrames={150}>
        <Tech />
      </Sequence>
      <Sequence from={2820} durationInFrames={180}>
        <Finale />
      </Sequence>
      <ProgressBar />
    </AbsoluteFill>
  );
};
