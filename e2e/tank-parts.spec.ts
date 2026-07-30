import { test, expect } from '@playwright/test';
import { BARREL_LENGTH } from '../shared/src/engine/Tank';
import {
  TANK_KIT_IDS,
  TANK_PART_ATLAS_HEIGHT,
  TANK_PART_ATLAS_WIDTH,
  TANK_PART_CELL_HEIGHT,
  TANK_PART_CELL_WIDTH,
  TANK_PART_SETS,
} from '../client/src/renderer/tankPartCatalog';

const ATLAS_PATH = 'art/tank-parts.webp';
const MAX_TRANSFER_BYTES = 250_000;

test.describe('modular authored tank atlas', () => {
  test('ships twelve independently occupied transparent gameplay parts', async ({
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
    const barrelDefinitions = TANK_KIT_IDS.map((kit) =>
      TANK_PART_SETS[kit].parts.barrel);
    const decoded = await page.evaluate(async ({
      src,
      atlasWidth,
      atlasHeight,
      cellWidth,
      cellHeight,
      barrels,
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

      const cells = Array.from({ length: 12 }, (_, cell) => {
        const row = Math.floor(cell / 4);
        const column = cell % 4;
        let visible = 0;
        let minX = cellWidth;
        let maxX = -1;
        let minY = cellHeight;
        let maxY = -1;
        let minLuminance = 255;
        let maxLuminance = 0;
        for (let y = 0; y < cellHeight; y++) {
          for (let x = 0; x < cellWidth; x++) {
            const atlasX = column * cellWidth + x;
            const atlasY = row * cellHeight + y;
            const offset = (atlasY * atlasWidth + atlasX) * 4;
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

      const mobilityMasks = Array.from({ length: 3 }, (_, row) => {
        const sample = document.createElement('canvas');
        sample.width = 36;
        sample.height = 24;
        const sampleCtx = sample.getContext('2d', {
          willReadFrequently: true,
        })!;
        sampleCtx.drawImage(
          image,
          0,
          row * cellHeight,
          cellWidth,
          cellHeight,
          0,
          0,
          sample.width,
          sample.height,
        );
        const data = sampleCtx.getImageData(
          0,
          0,
          sample.width,
          sample.height,
        ).data;
        return Array.from(
          { length: sample.width * sample.height },
          (_, index) => data[index * 4 + 3]! > 48,
        );
      });
      const silhouetteDistance = (a: boolean[], b: boolean[]): number => {
        let union = 0;
        let intersection = 0;
        for (let index = 0; index < a.length; index++) {
          if (a[index] || b[index]) union++;
          if (a[index] && b[index]) intersection++;
        }
        return union === 0 ? 0 : 1 - intersection / union;
      };
      const mobilityDistances = [
        silhouetteDistance(mobilityMasks[0]!, mobilityMasks[1]!),
        silhouetteDistance(mobilityMasks[0]!, mobilityMasks[2]!),
        silhouetteDistance(mobilityMasks[1]!, mobilityMasks[2]!),
      ];

      const alphaNear = (
        row: number,
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
              (
                (row * cellHeight + y) * atlasWidth
                + 3 * cellWidth
                + x
              ) * 4 + 3
            );
            if (pixels[offset]! > 32) return true;
          }
        }
        return false;
      };
      return {
        width: image.naturalWidth,
        height: image.naturalHeight,
        cells,
        mobilityDistances,
        barrels: barrels.map((barrel, row) => {
          const mountY = -barrel.offsetY / barrel.height * cellHeight;
          // One rendered logical pixel converted back into source-cell pixels.
          const sourceRadius = Math.ceil(cellWidth / barrel.width);
          return {
            pivotOccupied: alphaNear(
              row,
              barrel.pivotX / barrel.width * cellWidth,
              mountY,
              sourceRadius,
            ),
            muzzleOccupied: alphaNear(
              row,
              barrel.muzzleX / barrel.width * cellWidth,
              mountY,
              sourceRadius,
            ),
          };
        }),
      };
    }, {
      src: ATLAS_PATH,
      atlasWidth: TANK_PART_ATLAS_WIDTH,
      atlasHeight: TANK_PART_ATLAS_HEIGHT,
      cellWidth: TANK_PART_CELL_WIDTH,
      cellHeight: TANK_PART_CELL_HEIGHT,
      barrels: barrelDefinitions,
    });

    expect(decoded.width).toBe(TANK_PART_ATLAS_WIDTH);
    expect(decoded.height).toBe(TANK_PART_ATLAS_HEIGHT);
    expect(decoded.cells).toHaveLength(12);
    expect(Math.min(...decoded.mobilityDistances)).toBeGreaterThan(0.28);
    const minimumsBySlot = [
      { visible: 7_000, width: 200, height: 35 },
      { visible: 4_000, width: 190, height: 24 },
      { visible: 700, width: 80, height: 18 },
      { visible: 4_000, width: 200, height: 28 },
    ];
    for (const [index, cell] of decoded.cells.entries()) {
      const minimums = minimumsBySlot[index % 4]!;
      expect(cell.visible).toBeGreaterThan(minimums.visible);
      expect(cell.occupiedWidth).toBeGreaterThan(minimums.width);
      expect(cell.occupiedHeight).toBeGreaterThan(minimums.height);
      expect(cell.luminanceRange).toBeGreaterThan(60);
    }

    for (const [index, barrel] of barrelDefinitions.entries()) {
      expect(barrel.muzzleX - barrel.pivotX).toBe(BARREL_LENGTH);
      expect(decoded.barrels[index]!.pivotOccupied).toBe(true);
      expect(decoded.barrels[index]!.muzzleOccupied).toBe(true);
    }
  });

  test('keeps all three complete families distinct at gameplay scale', async ({
    page,
  }) => {
    await page.goto('.');
    const result = await page.evaluate(async ({
      atlasSrc,
      cellWidth,
      cellHeight,
    }) => {
      const image = new Image();
      image.src = atlasSrc;
      await image.decode();

      const masks = Array.from({ length: 3 }, (_, row) => {
        const canvas = document.createElement('canvas');
        canvas.width = 36;
        canvas.height = 24;
        const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
        for (let column = 0; column < 3; column++) {
          ctx.drawImage(
            image,
            column * cellWidth,
            row * cellHeight,
            cellWidth,
            cellHeight,
            0,
            0,
            canvas.width,
            canvas.height,
          );
        }
        const pixels = ctx.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        ).data;
        return Array.from(
          { length: canvas.width * canvas.height },
          (_, index) => pixels[index * 4 + 3]! > 48,
        );
      });
      const distance = (left: boolean[], right: boolean[]): number => {
        let union = 0;
        let intersection = 0;
        for (let index = 0; index < left.length; index++) {
          if (left[index] || right[index]) union++;
          if (left[index] && right[index]) intersection++;
        }
        return union === 0 ? 0 : 1 - intersection / union;
      };
      return {
        occupied: masks.map((mask) => mask.filter(Boolean).length),
        pairwise: [
          distance(masks[0]!, masks[1]!),
          distance(masks[0]!, masks[2]!),
          distance(masks[1]!, masks[2]!),
        ],
      };
    }, {
      atlasSrc: ATLAS_PATH,
      cellWidth: TANK_PART_CELL_WIDTH,
      cellHeight: TANK_PART_CELL_HEIGHT,
    });

    expect(Math.min(...result.occupied)).toBeGreaterThan(110);
    expect(Math.min(...result.pairwise)).toBeGreaterThan(0.2);
  });
});
