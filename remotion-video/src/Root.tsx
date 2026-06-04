import { AbsoluteFill, useCurrentFrame, interpolate, Sequence } from "remotion";
import { IntroScene } from "./scenes/Intro";
import { AuthScene } from "./scenes/Auth";
import { AdminScene } from "./scenes/Admin";
import { ShopScene } from "./scenes/Shop";
import { PaymentsScene } from "./scenes/Payments";
import { MembershipScene } from "./scenes/Membership";
import { PartiesRefundsScene } from "./scenes/PartiesRefunds";
import { EmailScene } from "./scenes/Email";
import { OutroScene } from "./scenes/Outro";

const SCENE_DURATION = 180; // 6 seconds each
const SCENES = [
  { component: IntroScene, label: "Intro" },
  { component: AuthScene, label: "Auth" },
  { component: AdminScene, label: "Admin" },
  { component: ShopScene, label: "Shop" },
  { component: PaymentsScene, label: "Payments" },
  { component: MembershipScene, label: "Membership" },
  { component: PartiesRefundsScene, label: "PartiesRefunds" },
  { component: EmailScene, label: "Email" },
  { component: OutroScene, label: "Outro" },
];

export const Cinema67Presentation: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ backgroundColor: "#14100c" }}>
      {SCENES.map((scene, index) => {
        const startFrame = index * SCENE_DURATION;
        const endFrame = startFrame + SCENE_DURATION;

        return (
          <Sequence
            key={scene.label}
            from={startFrame}
            durationInFrames={SCENE_DURATION}
            name={scene.label}
          >
            <scene.component />
          </Sequence>
        );
      })}

      {/* Progress bar */}
      <ProgressBar totalFrames={SCENES.length * SCENE_DURATION} />
    </AbsoluteFill>
  );
};

const ProgressBar: React.FC<{ totalFrames: number }> = ({ totalFrames }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [0, totalFrames], [0, 100], { extrapolateRight: "clamp" });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        background: "#2a2520",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${progress}%`,
          background: "linear-gradient(90deg, #d4af37, #b8860b)",
          borderRadius: "0 2px 2px 0",
        }}
      />
    </div>
  );
};
