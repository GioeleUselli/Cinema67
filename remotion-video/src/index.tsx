import { Composition, registerRoot } from "remotion";
import { Cinema67Presentation } from "./Root";

const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Cinema67Presentation"
        component={Cinema67Presentation}
        durationInFrames={30 * 60 * 3.5}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

registerRoot(RemotionRoot);
