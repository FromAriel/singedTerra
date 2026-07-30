import { expect, test, type Page } from '@playwright/test';

async function openGarage(page: Page): Promise<void> {
  await page.goto('.');
  await page.evaluate(() => document.getElementById('st-splash')?.remove());
  await expect(page.locator('.lobby-garage')).toHaveCount(2);
}

async function expectTouchSized(locator: ReturnType<Page['locator']>): Promise<void> {
  const boxes = await locator.evaluateAll((elements) => elements.map((element) => {
    const box = element.getBoundingClientRect();
    return { width: box.width, height: box.height };
  }));
  expect(boxes.length).toBeGreaterThan(0);
  for (const box of boxes) {
    expect(Math.min(box.width, box.height)).toBeGreaterThanOrEqual(24);
  }
}

async function openCompactGarage(page: Page, ownerLabel: string): Promise<void> {
  if (await page.locator('#app').evaluate((app) => app.classList.contains('is-compact'))) {
    await page.getByRole('button', {
      name: `Customize ${ownerLabel} tank`,
    }).click();
  }
}

async function closeCompactGarage(page: Page): Promise<void> {
  const done = page.getByRole('button', { name: 'Done customizing tank' });
  if (await done.isVisible()) await done.click();
}

async function installTankPartDrawProbe(page: Page): Promise<void> {
  await page.evaluate(() => {
    const state = window as typeof window & {
      __tankPartDraws?: Array<{ target: string; hash: number }>;
      __tankPartProbeInstalled?: boolean;
    };
    state.__tankPartDraws = [];
    if (state.__tankPartProbeInstalled) return;
    state.__tankPartProbeInstalled = true;

    const prototype = CanvasRenderingContext2D.prototype;
    const original = prototype.drawImage;
    prototype.drawImage = (function (
      this: CanvasRenderingContext2D,
      image: CanvasImageSource,
      ...args: number[]
    ): void {
      const targetCanvas = this.canvas;
      const target = targetCanvas.id === 'game'
        ? 'game'
        : targetCanvas.classList.contains('lobby-preview__canvas')
          ? 'preview'
          : '';

      if (
        target
        && image instanceof HTMLCanvasElement
        && (
          (image.width === 36 && image.height === 24)
          || (image.width === 30 && image.height === 14)
        )
      ) {
        const source = image.getContext('2d', { willReadFrequently: true });
        if (source) {
          const pixels = source.getImageData(
            0,
            0,
            image.width,
            image.height,
          ).data;
          let hash = 2166136261;
          for (const byte of pixels) {
            hash = Math.imul(hash ^ byte, 16777619);
          }
          state.__tankPartDraws!.push({ target, hash: hash >>> 0 });
        }
      }
      Reflect.apply(original, this, [image, ...args]);
    }) as typeof prototype.drawImage;
  });
}

test.describe('tank Garage', () => {
  test('fits the stage and previews distinct authored kits', async ({ page }, testInfo) => {
    await openGarage(page);

    const fit = await page.locator('.lobby-card').evaluate((card) => ({
      clientHeight: card.clientHeight,
      scrollHeight: card.scrollHeight,
      documentHeight: document.documentElement.scrollHeight,
      viewportHeight: window.innerHeight,
    }));
    expect(fit.scrollHeight).toBeLessThanOrEqual(fit.clientHeight + 1);
    expect(fit.documentHeight).toBeLessThanOrEqual(fit.viewportHeight + 1);

    if (testInfo.project.name === 'pixel-touch') {
      await expectTouchSized(page.locator('.lobby-swatch:visible'));
      await expectTouchSized(page.locator('.lobby-garage__open:visible'));
      await openCompactGarage(page, 'Player 1');
      const firstPreset = page.getByRole('button', {
        name: 'Apply Foundry preset to Player 1',
      });
      const done = page.getByRole('button', {
        name: 'Done customizing tank',
      });
      await expect(page.getByRole('dialog', {
        name: 'Player 1 tank Garage',
      })).toBeVisible();
      await expect(firstPreset).toBeFocused();
      await page.keyboard.press('Shift+Tab');
      await expect(done).toBeFocused();
      await page.keyboard.press('Tab');
      await expect(firstPreset).toBeFocused();
      const rangerPreset = page.getByRole('button', {
        name: 'Apply Ranger preset to Player 1',
      });
      await rangerPreset.click();
      await expect(rangerPreset).toBeFocused();
      const turretSlot = page.getByRole('button', {
        name: 'Change Player 1 turret',
      });
      await turretSlot.click();
      await expect(turretSlot).toBeFocused();
      await expectTouchSized(page.locator(
        '.lobby-garage.editing button:visible',
      ));
      await page.keyboard.press('Escape');
      await expect(page.getByRole('button', {
        name: 'Customize Player 1 tank',
      })).toBeFocused();
    }

    await page.locator('.lobby-field select:not([id])').selectOption('4');
    await expect(page.locator('.lobby-garage')).toHaveCount(4);
    const fourPlayerFit = await page.locator('.lobby-card').evaluate((card) => ({
      clientHeight: card.clientHeight,
      scrollHeight: card.scrollHeight,
    }));
    expect(fourPlayerFit.scrollHeight).toBeLessThanOrEqual(
      fourPlayerFit.clientHeight + 1,
    );
    if (testInfo.project.name === 'pixel-touch') {
      await expectTouchSized(page.locator('.lobby-swatch:visible'));
      await expectTouchSized(page.locator('.lobby-garage__open:visible'));
    }

    await page.locator('.lobby-field select:not([id])').selectOption('2');
    await page.getByRole('button', { name: 'Play Online' }).click();
    await expect(page.locator('.lobby-garage')).toHaveCount(1);
    const onlineFit = await page.locator('.lobby-card').evaluate((card) => ({
      clientHeight: card.clientHeight,
      scrollHeight: card.scrollHeight,
    }));
    expect(onlineFit.scrollHeight).toBeLessThanOrEqual(
      onlineFit.clientHeight + 1,
    );
    await page.getByRole('button', { name: 'Hot Seat' }).click();

    await openCompactGarage(page, 'Player 1');
    await page.getByRole('button', {
      name: 'Apply Ranger preset to Player 1',
    }).click();
    await closeCompactGarage(page);
    await openCompactGarage(page, 'Player 2');
    await page.getByRole('button', {
      name: 'Apply Bulwark preset to Player 2',
    }).click();
    await closeCompactGarage(page);

    await expect(page.locator(
      'button[aria-label="Apply Ranger preset to Player 1"]',
    )).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator(
      'button[aria-label="Apply Bulwark preset to Player 2"]',
    )).toHaveAttribute('aria-pressed', 'true');

    await expect.poll(async () => page.evaluate(() => {
      const signatures = Array.from(
        document.querySelectorAll<HTMLCanvasElement>('.lobby-preview__canvas'),
      ).map((canvas) => {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx === null) return '';
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let signature = '';
        let visible = 0;
        for (let index = 3; index < pixels.length; index += 4) {
          if (pixels[index]! > 32) {
            visible++;
            signature += `${(index - 3) / 4},`;
          }
        }
        return `${visible}:${signature}`;
      });
      return {
        ready: signatures.every((signature) =>
          Number(signature.split(':', 1)[0]) > 100),
        distinct: signatures.length === 2 && signatures[0] !== signatures[1],
      };
    })).toEqual({ ready: true, distinct: true });
  });

  test('carries a mixed four-part selection into a running game', async ({
    page,
  }) => {
    await openGarage(page);
    await installTankPartDrawProbe(page);

    await openCompactGarage(page, 'Player 1');
    await page.getByRole('button', {
      name: 'Apply Ranger preset to Player 1',
    }).click();
    await page.getByRole('button', {
      name: 'Change Player 1 turret',
    }).click();

    await expect(page.getByRole('button', {
      name: 'Change Player 1 turret',
    })).toContainText('Bulwark');
    const expectedPartHashes = await page.evaluate(() => {
      const records = (window as typeof window & {
        __tankPartDraws?: Array<{ target: string; hash: number }>;
      }).__tankPartDraws ?? [];
      return records
        .filter(({ target }) => target === 'preview')
        .slice(-8, -4)
        .map(({ hash }) => hash);
    });
    expect(new Set(expectedPartHashes).size).toBe(4);
    await page.evaluate(() => {
      (window as typeof window & {
        __tankPartDraws?: Array<{ target: string; hash: number }>;
      }).__tankPartDraws = [];
    });
    await closeCompactGarage(page);
    await page.getByRole('button', { name: 'Start Game' }).click();

    await expect(page.locator('#game')).toBeVisible();
    await expect(page.locator('#hud.st-hud')).toBeVisible();
    await expect.poll(async () => page.evaluate((expected) => {
      const records = (window as typeof window & {
        __tankPartDraws?: Array<{ target: string; hash: number }>;
      }).__tankPartDraws ?? [];
      const gameHashes = new Set(
        records
          .filter(({ target }) => target === 'game')
          .map(({ hash }) => hash),
      );
      return expected.every((hash) => gameHashes.has(hash));
    }, expectedPartHashes)).toBe(true);
  });
});
