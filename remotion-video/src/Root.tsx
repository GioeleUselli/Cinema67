import { AbsoluteFill, Sequence, interpolate, useCurrentFrame } from "remotion";
import IntroScene from "./scenes/IntroScene";
import HomepageScene from "./scenes/HomepageScene";
import AuthScene from "./scenes/AuthScene";
import CatalogoScene from "./scenes/CatalogoScene";
import AdminDashboardScene from "./scenes/AdminDashboardScene";
import AdminFilmsScene from "./scenes/AdminFilmsScene";
import AdminProiezioniScene from "./scenes/AdminProiezioniScene";
import ShopScene from "./scenes/ShopScene";
import GiftCardScene from "./scenes/GiftCardScene";
import RiscattaScene from "./scenes/RiscattaScene";
import MembershipScene from "./scenes/MembershipScene";
import FesteScene from "./scenes/FesteScene";
import PagamentiScene from "./scenes/PagamentiScene";
import RimborsiScene from "./scenes/RimborsiScene";
import MerchAdminScene from "./scenes/MerchAdminScene";
import EmailScene from "./scenes/EmailScene";
import TechScene from "./scenes/TechScene";
import FinaleScene from "./scenes/FinaleScene";

const GOLD = "#d4af37";

const scenes = [
  { component: IntroScene, duration: 120 },
  { component: HomepageScene, duration: 130 },
  { component: AuthScene, duration: 130 },
  { component: CatalogoScene, duration: 130 },
  { component: AdminDashboardScene, duration: 130 },
  { component: AdminFilmsScene, duration: 130 },
  { component: AdminProiezioniScene, duration: 130 },
  { component: ShopScene, duration: 130 },
  { component: GiftCardScene, duration: 120 },
  { component: RiscattaScene, duration: 100 },
  { component: MembershipScene, duration: 140 },
  { component: FesteScene, duration: 130 },
  { component: PagamentiScene, duration: 130 },
  { component: RimborsiScene, duration: 130 },
  { component: MerchAdminScene, duration: 120 },
  { component: EmailScene, duration: 120 },
  { component: TechScene, duration: 120 },
  { component: FinaleScene, duration: 150 },
];

const totalFrames = scenes.reduce((sum, s) => sum + s.duration, 0);

export const Cinema67Presentation: React.FC = () => {
  let currentFrame = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0806" }}>
      {scenes.map((scene, index) => {
        const startFrame = currentFrame;
        const duration = scene.duration;
        currentFrame += duration;

        return (
          <Sequence key={index} from={startFrame} durationInFrames={duration} name={`Scene${index}`}>
            <scene.component />
          </Sequence>
        );
      })}
      <ProgressBar totalFrames={totalFrames} />
    </AbsoluteFill>
  );
};

const ProgressBar: React.FC<{ totalFrames: number }> = ({ totalFrames }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, totalFrames], [0, 100], { extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "transparent" }}>
      <div style={{ height: "100%", width: `${progress}%`, background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`, opacity: 0.6 }} />
    </div>
  );
};
