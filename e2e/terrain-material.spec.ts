import { test, expect, type Page } from '@playwright/test';
import { gotoRunningGame } from './support';

const MATERIAL_PATH = 'art/terrain-material.webp';
const MAX_TRANSFER_BYTES = 100_000;

async function sampleDeepTerrain(page: Page): Promise<number[]> {
  return page.locator<HTMLCanvasElement>('#game').evaluate((canvas) => {
    const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
    const samples: number[] = [];
    for (let y = canvas.height - 80; y < canvas.height - 20; y += 4) {
      for (let x = 20; x < canvas.width - 20; x += 8) {
        const pixel = ctx.getImageData(x, y, 1, 1).data;
        samples.push(pixel[0]!, pixel[1]!, pixel[2]!);
      }
    }
    return samples;
  });
}

async function fireAndWaitForNextTurn(page: Page): Promise<void> {
  const action = page.locator('.st-hud__primary-action');
  await expect(action).toBeEnabled();
  await action.click();
  await expect(action).toBeDisabled();
  await expect(action).toBeEnabled({ timeout: 15_000 });
}

function meanChannelDelta(left: number[], right: number[]): number {
  expect(right).toHaveLength(left.length);
  return left.reduce(
    (sum, channel, index) => sum + Math.abs(channel - right[index]!),
    0,
  ) / left.length;
}

test.describe('authored terrain material asset', () => {
  test('is a bounded opaque 256px WebP with usable grain', async ({
    page,
    request,
  }) => {
    const response = await request.get(MATERIAL_PATH);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/webp');
    expect((await response.body()).byteLength).toBeLessThanOrEqual(MAX_TRANSFER_BYTES);

    await page.goto('.');
    const decoded = await page.evaluate(async (src) => {
      const image = new Image();
      image.src = src;
      await image.decode();

      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(image, 0, 0);

      const pixels = ctx.getImageData(
        0,
        0,
        canvas.width,
        canvas.height,
      ).data;
      let minAlpha = 255;
      let minLuminance = 255;
      let maxLuminance = 0;
      let luminanceTotal = 0;
      let luminanceSquaredTotal = 0;
      let sampleCount = 0;
      for (let offset = 0; offset < pixels.length; offset += 4) {
        minAlpha = Math.min(minAlpha, pixels[offset + 3]!);
        if ((offset / 4) % 8 !== 0) continue;
        const luminance = (
          pixels[offset]! * 0.2126
          + pixels[offset + 1]! * 0.7152
          + pixels[offset + 2]! * 0.0722
        );
        minLuminance = Math.min(minLuminance, luminance);
        maxLuminance = Math.max(maxLuminance, luminance);
        luminanceTotal += luminance;
        luminanceSquaredTotal += luminance * luminance;
        sampleCount++;
      }
      const mean = luminanceTotal / sampleCount;
      const variance = luminanceSquaredTotal / sampleCount - mean * mean;
      let edgeSquaredError = 0;
      let edgeChannelCount = 0;
      for (let index = 0; index < canvas.width; index++) {
        const left = index * canvas.width * 4;
        const right = (index * canvas.width + canvas.width - 1) * 4;
        const top = index * 4;
        const bottom = (
          (canvas.height - 1) * canvas.width + index
        ) * 4;
        for (let channel = 0; channel < 3; channel++) {
          edgeSquaredError += (
            pixels[left + channel]! - pixels[right + channel]!
          ) ** 2;
          edgeSquaredError += (
            pixels[top + channel]! - pixels[bottom + channel]!
          ) ** 2;
          edgeChannelCount += 2;
        }
      }

      return {
        width: image.naturalWidth,
        height: image.naturalHeight,
        minAlpha,
        luminanceRange: maxLuminance - minLuminance,
        luminanceDeviation: Math.sqrt(Math.max(variance, 0)),
        edgeRmse: Math.sqrt(edgeSquaredError / edgeChannelCount),
      };
    }, MATERIAL_PATH);

    expect(decoded.width).toBe(256);
    expect(decoded.height).toBe(256);
    expect(decoded.minAlpha).toBe(255);
    expect(decoded.luminanceRange).toBeGreaterThan(20);
    expect(decoded.luminanceDeviation).toBeGreaterThan(4);
    expect(decoded.edgeRmse).toBeLessThan(24);
  });
});

test.describe('authored terrain material integration', () => {
  test('reaches the live terrain cache instead of leaving the flat fallback', async ({
    page,
    context,
  }) => {
    await page.route(`**/${MATERIAL_PATH}`, (route) => route.abort());
    await gotoRunningGame(page);
    await fireAndWaitForNextTurn(page);
    const fallbackTerrain = await sampleDeepTerrain(page);

    const authoredPage = await context.newPage();
    const assetResponse = authoredPage.waitForResponse((response) =>
      response.url().endsWith(`/${MATERIAL_PATH}`),
    );
    await gotoRunningGame(authoredPage);
    const response = await assetResponse;
    expect(response.status()).toBe(200);
    expect(new URL(response.url()).pathname).toBe(
      new URL(MATERIAL_PATH, authoredPage.url()).pathname,
    );
    await fireAndWaitForNextTurn(authoredPage);

    await expect.poll(async () =>
      meanChannelDelta(
        fallbackTerrain,
        await sampleDeepTerrain(authoredPage),
      ),
    ).toBeGreaterThan(0.8);

    const geometry = await authoredPage.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      scrollHeight: document.documentElement.scrollHeight,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    }));
    expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.viewportWidth);
    expect(geometry.scrollHeight).toBeLessThanOrEqual(geometry.viewportHeight);

    await authoredPage.close();
  });
});
