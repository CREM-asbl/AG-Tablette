import { test, expect } from '@playwright/test';

test('Duplicate tool should duplicate a shape', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('http://localhost:4324');
  
  // Select Geometry environment
  await page.getByText('Géométrie').click();
  await expect(page.locator('ag-menu')).toBeVisible({ timeout: 30000 });
  
  // Create a Segment
  const lineButton = page.locator('ag-menu icon-button[name="createLine"]');
  await lineButton.click();
  const segmentButton = page.locator('shape-selector icon-button[name="Segment"]');
  await segmentButton.click({ force: true });
  
  const canvasContainer = page.locator('canvas-container');
  const box = await canvasContainer.boundingBox();
  if (!box) throw new Error('Canvas box not found');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  
  await page.mouse.click(x, y);
  await page.waitForTimeout(200);
  await page.mouse.click(x + 100, y);
  await page.waitForTimeout(500);
  
  // Verify 1 segment exists
  let shapeCount = await page.evaluate(() => window.app.mainCanvasLayer.shapes.length);
  // Might be 3 because of points
  const initialShapeCount = shapeCount;
  console.log('Initial shape count:', initialShapeCount);
  
  // Select Duplicate tool
  const duplicateButton = page.locator('ag-menu icon-button[name="duplicate"]');
  await duplicateButton.click();
  await page.waitForTimeout(500);
  
  // Click on the shape to duplicate it
  await page.mouse.click(x + 50, y); 
  await page.waitForTimeout(1000);
  
  // Verify shape count increased
  shapeCount = await page.evaluate(() => window.app.mainCanvasLayer.shapes.length);
  console.log('Final shape count:', shapeCount);
  expect(shapeCount).toBeGreaterThan(initialShapeCount);
  
  const names = await page.evaluate(() => window.app.mainCanvasLayer.shapes.map(s => s.name));
  const segmentCount = names.filter(n => n === 'Segment').length;
  expect(segmentCount).toBe(2);
});
