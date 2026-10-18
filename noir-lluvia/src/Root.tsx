import { Composition } from "remotion";
import { Noir } from "./Noir";
import timeline from "./timeline.json";

export const RemotionRoot: React.FC = () => (
  <Composition id="NoirLluvia" component={Noir} durationInFrames={timeline.duration} fps={timeline.fps} width={1080} height={1920} />
);
