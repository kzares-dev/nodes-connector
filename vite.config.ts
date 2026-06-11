import { isAbsolute, relative, resolve } from "node:path";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    react(),
    dts({
      entryRoot: resolve(__dirname, "src"),
      include: ["src/index.ts", "src/core", "src/react", "src/styles.d.ts"],
      exclude: ["src/**/*.stories.*", "src/stories/**", ".storybook/**", "vite.config.ts"],
      beforeWriteFile: (filePath, content) => {
        const distRoot = resolve(__dirname, "dist");
        const srcDistRoot = resolve(distRoot, "src");
        const sourceRelativePath = relative(srcDistRoot, filePath);

        if (!sourceRelativePath.startsWith("..") && !isAbsolute(sourceRelativePath)) {
          return {
            filePath: resolve(distRoot, sourceRelativePath),
            content
          };
        }

        return { filePath, content };
      }
    })
  ],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, "src/index.ts"),
        "core/index": resolve(__dirname, "src/core/index.ts"),
        "react/index": resolve(__dirname, "src/react/index.ts")
      },
      formats: ["es", "cjs"]
    },
    rollupOptions: {
      external: ["react", "react-dom", "react/jsx-runtime"],
      output: {
        assetFileNames: (assetInfo) =>
          assetInfo.name?.endsWith(".css") ? "react/styles.css" : "assets/[name][extname]"
      }
    },
    sourcemap: true
  }
});
