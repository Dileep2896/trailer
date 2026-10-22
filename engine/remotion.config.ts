import { Config } from '@remotion/cli/config';

// Web delivery: H.264 + AAC at high quality.
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(18);
Config.setPixelFormat('yuv420p');
Config.setOverwriteOutput(true);
Config.setEntryPoint('src/index.ts');

// Remotion downloads its own headless Chrome on first render. Where that download is blocked,
// point it at Playwright's headless shell (trailer.mjs does this automatically as a fallback):
//   REMOTION_BROWSER=~/Library/Caches/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-mac-arm64/chrome-headless-shell
if (process.env.REMOTION_BROWSER) Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
