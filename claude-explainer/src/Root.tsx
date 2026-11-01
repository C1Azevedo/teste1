import { Composition } from "remotion";
import { ClaudeExplainer } from "./ClaudeExplainer";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="ClaudeExplainer"
      component={ClaudeExplainer}
      durationInFrames={1260}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
