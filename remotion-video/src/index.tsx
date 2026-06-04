import { Composition, registerRoot } from "remotion";
import { Cinema67Presentation } from "./Root";

const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Cinema67Presentation"
        component={Cinema67Presentation}
        durationInFrames={3030}
        fps={24}
        width={1920}
        height={1080}
      />
    </>
  );
};

registerRoot(RemotionRoot);
