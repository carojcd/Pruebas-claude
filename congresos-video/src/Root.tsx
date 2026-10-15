import { Composition } from "remotion";
import { Congresos } from "./Congresos";
import { DURATION, FPS, HEIGHT, WIDTH } from "./montaje";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="Congresos"
      component={Congresos}
      durationInFrames={DURATION}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
    />
  );
};
