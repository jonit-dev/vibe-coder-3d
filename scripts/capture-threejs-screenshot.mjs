import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { setTimeout } from 'timers/promises';

const SCENE_NAME = process.argv[2] || 'testcube';
const OUTPUT_PATH = process.argv[3] || `/tmp/threejs-${SCENE_NAME}.png`;
const DEV_SERVER_PORT = 5173;
const DEV_SERVER_URL = `http://localhost:${DEV_SERVER_PORT}`;

async function isServerRunning() {
  try {
    const response = await fetch(DEV_SERVER_URL);
    return response.ok;
  } catch {
    return false;
  }
}

async function startDevServer() {
  console.log('Starting dev server...');
  const devServer = spawn('yarn', ['dev:nosync'], {
    stdio: 'pipe',
    detached: false,
  });

  // Wait for server to be ready
  let attempts = 0;
  while (attempts < 30) {
    await setTimeout(1000);
    if (await isServerRunning()) {
      console.log('Dev server is ready!');
      return devServer;
    }
    attempts++;
  }

  throw new Error('Dev server failed to start after 30 seconds');
}

async function captureScreenshot() {
  let devServer = null;
  const serverWasRunning = await isServerRunning();

  if (!serverWasRunning) {
    devServer = await startDevServer();
  } else {
    console.log('Dev server already running!');
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
  });
  const page = await context.newPage();

  console.log(`Loading editor at ${DEV_SERVER_URL}...`);
  await page.goto(DEV_SERVER_URL, { waitUntil: 'networkidle' });

  console.log(`Setting localStorage to load scene: ${SCENE_NAME}`);
  await page.evaluate((sceneName) => {
    localStorage.setItem('lastLoadedScene', sceneName);
  }, SCENE_NAME);

  console.log('Reloading page to load scene...');
  await page.reload({ waitUntil: 'networkidle' });

  console.log('Clicking play button...');
  const playButton = await page.locator('button[title="Play (Space)"]');
  await playButton.click();

  console.log('Waiting for scene to render (5 seconds)...');
  await page.waitForTimeout(5000);

  console.log(`Capturing screenshot to: ${OUTPUT_PATH}`);
  await page.screenshot({ path: OUTPUT_PATH, fullPage: false });

  await browser.close();
  console.log('Screenshot captured successfully!');

  // Cleanup: kill dev server if we started it
  if (devServer && !serverWasRunning) {
    console.log('Stopping dev server...');
    devServer.kill();
  }

  return true;
}

captureScreenshot().catch((error) => {
  console.error('Error capturing screenshot:', error);
  process.exit(1);
});
