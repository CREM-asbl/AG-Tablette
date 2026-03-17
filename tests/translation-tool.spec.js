import { expect, test } from '@playwright/test';

test('Translation tool should create a translated copy', async ({ page }) => {
  test.setTimeout(60000);

  await page.goto('http://localhost:4324');

  await page.getByText(/G[ée]om[ée]trie/).click();
  await expect(page.locator('ag-menu')).toBeVisible({ timeout: 30000 });

  const lineButton = page.locator('ag-menu icon-button[name="createLine"]');
  await lineButton.click({ force: true });

  const segmentTemplate = page.locator('shape-selector icon-button[name="Segment"]');
  await segmentTemplate.click({ force: true });

  await expect.poll(() => page.evaluate(() => window.app.tool?.currentStep), {
    timeout: 5000,
  }).toBe('drawPoint');

  const canvasContainer = page.locator('canvas-container');
  const box = await canvasContainer.boundingBox();
  if (!box) throw new Error('Canvas box not found');

  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;

  await page.mouse.click(x, y, { delay: 100 });
  await page.mouse.click(x + 100, y, { delay: 100 });
  await page.waitForTimeout(300);

  const initialShapeCount = await page.evaluate(() => window.app.mainCanvasLayer.shapes.length);

  const translationButton = page.locator('ag-menu icon-button[name="translation"]');
  await translationButton.click({ force: true });

  await expect.poll(() => page.evaluate(() => window.app.tool?.currentStep), {
    timeout: 5000,
  }).toBe('selectReference');

  await page.mouse.click(x + 20, y + 20, { delay: 100 });
  await expect.poll(() => page.evaluate(() => window.app.tool?.currentStep), {
    timeout: 5000,
  }).toBe('selectReference');

  await page.mouse.click(x + 120, y + 20, { delay: 100 });
  await expect.poll(() => page.evaluate(() => window.app.tool?.currentStep), {
    timeout: 5000,
  }).toBe('selectObject');

  await page.mouse.click(x + 50, y, { delay: 100 });

  await expect.poll(() => page.evaluate(() => window.app.mainCanvasLayer.shapes.length), {
    timeout: 15000,
  }).toBeGreaterThan(initialShapeCount);
});
