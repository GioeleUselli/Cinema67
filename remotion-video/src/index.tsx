import { Composition, registerRoot } from "remotion";
import { Cinema67Presentation } from "./Root";

const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Cinema67Presentation"
        component={Cinema67Presentation}
        durationInFrames={17 * 180}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};

registerRoot(RemotionRoot);
