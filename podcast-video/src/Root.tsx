import { Composition } from "remotion";
import { Podcast } from "./Podcast";
import { DURATION, FPS, HEIGHT, WIDTH } from "./montaje";

export const RemotionRoot: React.FC = () => (
  <Composition id="Podcast" component={Podcast} durationInFrames={DURATION} fps={FPS} width={WIDTH} height={HEIGHT} />
);
