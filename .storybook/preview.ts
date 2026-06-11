import "../src/react/styles.css";
import "../src/stories/story.css";

import type { Preview } from "@storybook/react-vite";

const preview: Preview = {
  parameters: {
    layout: "fullscreen",
    docs: {
      canvas: {
        sourceState: "shown"
      }
    }
  }
};

export default preview;
