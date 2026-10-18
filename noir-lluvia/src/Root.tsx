import { Composition } from "remotion";
import { Noir } from "./Noir";
import timeline from "./timeline.json";

export const RemotionRoot: React.FC = () => (
  <Composition id="NoirLluvia" component={Noir} durationInFrames={Math.round((timeline.duration * timeline.renderFps) / timeline.fps)} fps={timeline.renderFps} width={1080} height={1920} />
);
