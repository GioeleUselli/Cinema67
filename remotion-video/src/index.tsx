import { Composition } from "remotion";
import { Cinema67Presentation } from "./Root";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Cinema67Presentation"
        component={Cinema67Presentation}
        durationInFrames={30 * 60 * 3.5} // ~3.5 minutes at 30fps
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{}}
      />
    </>
  );
};
