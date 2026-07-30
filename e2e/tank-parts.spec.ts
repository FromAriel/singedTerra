import { test, expect } from '@playwright/test';
import { BARREL_LENGTH } from '../shared/src/engine/Tank';
import {
  DEFAULT_TANK_PART_SET,
  TANK_PART_CELL_HEIGHT,
  TANK_PART_CELL_WIDTH,
} from '../client/src/renderer/tankPartCatalog';

const ATLAS_PATH = 'art/tank-parts.webp';
const ATLAS_WIDTH = 1024;
const ATLAS_HEIGHT = 128;
const CELL_WIDTH = 256;
const MAX_TRANSFER_BYTES = 150_000;

test.describe('modular authored tank atlas', () => {
  test('ships four independently occupied transparent gameplay parts', async ({
    page,
    request,
  }) => {
    const response = await request.get(ATLAS_PATH);
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/webp');
    expect((await response.body()).byteLength).toBeLessThanOrEqual(
      MAX_TRANSFER_BYTES,
    );

    await page.goto('.');
    const barrelDefinition = DEFAULT_TANK_PART_SET.parts.barrel;
    const decoded = await page.evaluate(async ({
      src,
      atlasWidth,
      atlasHeight,
      cellWidth,
      cellHeight,
      barrel,
    }) => {
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

      const cells = Array.from({ length: 4 }, (_, cell) => {
        let visible = 0;
        let minX = cellWidth;
        let maxX = -1;
        let minY = atlasHeight;
        let maxY = -1;
        let minLuminance = 255;
        let maxLuminance = 0;
        for (let y = 0; y < atlasHeight; y++) {
          for (let x = 0; x < cellWidth; x++) {
            const atlasX = cell * cellWidth + x;
            const offset = (y * atlasWidth + atlasX) * 4;
            const alpha = pixels[offset + 3]!;
            if (alpha <= 32) continue;
            visible++;
            minX = Math.min(minX, x);
            maxX = Math.max(maxX, x);
            minY = Math.min(minY, y);
            maxY = Math.max(maxY, y);
            if (alpha < 128) continue;
            const luminance = (
              pixels[offset]! * 0.2126
              + pixels[offset + 1]! * 0.7152
              + pixels[offset + 2]! * 0.0722
            );
            minLuminance = Math.min(minLuminance, luminance);
            maxLuminance = Math.max(maxLuminance, luminance);
          }
        }
        return {
          visible,
          occupiedWidth: maxX - minX + 1,
          occupiedHeight: maxY - minY + 1,
          luminanceRange: maxLuminance - minLuminance,
          minX,
          maxX,
        };
      });

      const barrelCellX = 3 * cellWidth;
      const alphaNear = (
        centerX: number,
        centerY: number,
        radius: number,
      ): boolean => {
        for (
          let y = Math.max(0, Math.floor(centerY - radius));
          y <= Math.min(cellHeight - 1, Math.ceil(centerY + radius));
          y++
        ) {
          for (
            let x = Math.max(0, Math.floor(centerX - radius));
            x <= Math.min(cellWidth - 1, Math.ceil(centerX + radius));
            x++
          ) {
            const offset = (
              (y * atlasWidth + barrelCellX + x) * 4 + 3
            );
            if (pixels[offset]! > 32) return true;
          }
        }
        return false;
      };
      const mountY = -barrel.offsetY / barrel.height * cellHeight;
      // One rendered logical pixel converted back into source-cell pixels.
      const sourceRadius = Math.ceil(cellWidth / barrel.width);

      return {
        width: image.naturalWidth,
        height: image.naturalHeight,
        cells,
        barrelPivotOccupied: alphaNear(
          barrel.pivotX / barrel.width * cellWidth,
          mountY,
          sourceRadius,
        ),
        barrelMuzzleOccupied: alphaNear(
          barrel.muzzleX / barrel.width * cellWidth,
          mountY,
          sourceRadius,
        ),
      };
    }, {
      src: ATLAS_PATH,
      atlasWidth: ATLAS_WIDTH,
      atlasHeight: ATLAS_HEIGHT,
      cellWidth: CELL_WIDTH,
      cellHeight: TANK_PART_CELL_HEIGHT,
      barrel: barrelDefinition,
    });

    expect(decoded.width).toBe(ATLAS_WIDTH);
    expect(decoded.height).toBe(ATLAS_HEIGHT);
    expect(decoded.cells).toHaveLength(4);
    const minimums = [
      { visible: 8_000, width: 220, height: 40 },
      { visible: 5_000, width: 220, height: 28 },
      { visible: 2_000, width: 170, height: 20 },
      { visible: 5_000, width: 210, height: 35 },
    ];
    for (const [index, cell] of decoded.cells.entries()) {
      expect(cell.visible).toBeGreaterThan(minimums[index]!.visible);
      expect(cell.occupiedWidth).toBeGreaterThan(minimums[index]!.width);
      expect(cell.occupiedHeight).toBeGreaterThan(minimums[index]!.height);
      expect(cell.luminanceRange).toBeGreaterThan(70);
    }

    expect(barrelDefinition.muzzleX - barrelDefinition.pivotX)
      .toBe(BARREL_LENGTH);
    expect(TANK_PART_CELL_WIDTH).toBe(CELL_WIDTH);
    expect(decoded.barrelPivotOccupied).toBe(true);
    expect(decoded.barrelMuzzleOccupied).toBe(true);
  });
});
