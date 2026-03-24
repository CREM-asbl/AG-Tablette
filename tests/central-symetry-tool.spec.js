import { expect, test } from '@playwright/test';

test('Central Symetry tool should create a symmetrical copy', async ({ page }) => {
  test.setTimeout(60000);

  await page.goto('http://localhost:4324');

  await page.getByText(/G[ée]om[ée]trie/).click();
  await expect(page.locator('ag-menu')).toBeVisible({ timeout: 30000 });

  const triangleButton = page.locator('ag-menu icon-button[name="createTriangle"]');
  await triangleButton.click({ force: true });

  const irregularTriangleTemplate = page.locator('shape-selector icon-button[name="IrregularTriangle"]');
  await irregularTriangleTemplate.click({ force: true });

  const canvasContainer = page.locator('canvas-container');
  const box = await canvasContainer.boundingBox();
  if (!box) throw new Error('Canvas box not found');

  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  await page.mouse.click(x - 80, y + 40, { delay: 100 });
  await page.mouse.click(x + 80, y + 40, { delay: 100 });
  await page.mouse.click(x, y - 80, { delay: 100 });
  await page.waitForTimeout(400);

  const initialShapeCount = await page.evaluate(() => window.app.mainCanvasLayer.shapes.length);

  const centralSymetryButton = page.locator('ag-menu icon-button[name="centralSymetry"]');
  await centralSymetryButton.click({ force: true });

  await expect.poll(() => page.evaluate(() => window.app.tool?.currentStep), {
    timeout: 5000,
  }).toBe('selectCharacteristicElement');

  await page.mouse.click(x + 140, y, { delay: 100 });
  await page.waitForTimeout(300);

  await expect.poll(() => page.evaluate(() => window.app.tool?.currentStep), {
    timeout: 5000,
  }).toBe('selectObject');

  await page.mouse.click(x, y, { delay: 100 });

  await expect.poll(() => page.evaluate(() => window.app.mainCanvasLayer.shapes.length), {
    timeout: 15000,
  }).toBeGreaterThan(initialShapeCount);
});
