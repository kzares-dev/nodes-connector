import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const rootDir = process.cwd();
const storybookDir = join(rootDir, "storybook-static");
const outputDir = join(rootDir, "docs", "images");

const contentTypes = new Map([
  [".css", "text/css"],
  [".html", "text/html"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript"],
  [".json", "application/json"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"]
]);

const screenshots = [
  ["nodes-connector-board--static-props", "static-board.png"],
  ["nodes-connector-board--custom-nodes", "custom-nodes.png"],
  ["nodes-connector-board--phase-five-elements", "geometric-nodes.png"],
  ["nodes-connector-customization--theme-tokens", "theme-customization.png"]
];

function createStaticServer() {
  return createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? "/", "http://127.0.0.1:6007");
      const pathname = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
      const filePath = normalize(join(storybookDir, pathname));

      if (!filePath.startsWith(storybookDir) || !existsSync(filePath)) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }

      response.writeHead(200, {
        "content-type": contentTypes.get(extname(filePath)) ?? "application/octet-stream"
      });
      response.end(await readFile(filePath));
    } catch (error) {
      response.writeHead(500);
      response.end(String(error));
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (!existsSync(join(storybookDir, "iframe.html"))) {
    throw new Error("storybook-static was not found. Run `npm run build:storybook` first.");
  }

  await mkdir(outputDir, { recursive: true });

  const server = createStaticServer();
  await new Promise((resolve) => server.listen(6007, "127.0.0.1", resolve));

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1
  });

  try {
    for (const [storyId, fileName] of screenshots) {
      const destination = join(outputDir, fileName);
      await mkdir(dirname(destination), { recursive: true });
      await page.goto(`http://127.0.0.1:6007/iframe.html?id=${storyId}&viewMode=story`, {
        waitUntil: "networkidle"
      });
      await page.locator(".nodes-connector-board").waitFor({ timeout: 15000 });
      await page.screenshot({ path: destination, fullPage: false });
      console.log(`Captured ${destination}`);
    }
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
}
