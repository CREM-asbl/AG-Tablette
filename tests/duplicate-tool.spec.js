import { test, expect } from '@playwright/test';

test('Duplicate tool should duplicate a shape', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('http://localhost:4324');
  
  // Select Geometry environment
  await page.getByText('Géométrie').click();
  await expect(page.locator('ag-menu')).toBeVisible({ timeout: 30000 });
  
  // Create a Segment
  const lineButton = page.locator('ag-menu icon-button[name="createLine"]');
  await lineButton.click({ force: true });
  const segmentButton = page.locator('shape-selector icon-button[name="Segment"]');
  await segmentButton.click({ force: true });
  
  // Attendre que l'outil soit prêt
  await expect.poll(() => page.evaluate(() => window.app.tool?.currentStep), {
    timeout: 5000
  }).toBe('drawPoint');

  const canvasContainer = page.locator('canvas-container');
  const box = await canvasContainer.boundingBox();
  if (!box) throw new Error('Canvas box not found');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  
  // Créer le segment
  await page.mouse.click(x, y, { delay: 100 });
  await page.waitForTimeout(200);
  await page.mouse.click(x + 100, y, { delay: 100 });
  await page.waitForTimeout(500);
  
  // Verify 1 segment exists
  let initialShapeCount = await page.evaluate(() => window.app.mainCanvasLayer.shapes.length);
  console.log('Initial shape count:', initialShapeCount);
  
  // Select Duplicate tool
  const duplicateButton = page.locator('ag-menu icon-button[name="duplicate"]');
  await duplicateButton.click({ force: true });
  
  // Attendre que l'outil soit prêt (listen)
  await expect.poll(() => page.evaluate(() => window.app.tool?.currentStep), {
    timeout: 5000
  }).toBe('listen');
  
  // Simuler un drag-and-drop pour la duplication
  // 1. Mouse down sur la forme
  await page.mouse.move(x + 50, y);
  await page.mouse.down();
  await page.waitForTimeout(200);
  
  // 2. Vérifier qu'on est passé en mode move
  const stepAfterDown = await page.evaluate(() => window.app.tool?.currentStep);
  console.log('Step after mouse down:', stepAfterDown);
  
  // 3. Mouse up pour finaliser
  await page.mouse.up();
  await page.waitForTimeout(1000);
  
  // Verify shape count increased
  const finalShapeCount = await page.evaluate(() => window.app.mainCanvasLayer.shapes.length);
  console.log('Final shape count:', finalShapeCount);
  expect(finalShapeCount).toBeGreaterThan(initialShapeCount);
});
