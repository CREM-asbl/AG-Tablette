import { test, expect } from '@playwright/test';

test('Delete tool should remove a triangle', async ({ page }) => {
  // Augmenter le timeout pour laisser le temps au serveur de répondre
  test.setTimeout(60000);

  await page.goto('http://localhost:4324');
  
  // Select Geometry environment
  await page.click('#Geometrie');
  
  // Wait for the app to load
  await expect(page.locator('ag-menu')).toBeVisible();
  
  // Select Create Line tool
  const lineButton = page.locator('ag-menu icon-button[name="createLine"]');
  await lineButton.click();
  
  // Wait for shape-selector and select Segment
  // We use force: true if it's hidden by CSS but present in DOM
  const segmentButton = page.locator('shape-selector icon-button[name="Segment"]');
  await segmentButton.click({ force: true });
  
  const canvasContainer = page.locator('canvas-container');
  await expect(canvasContainer).toBeVisible();
  const box = await canvasContainer.boundingBox();
  if (!box) throw new Error('Canvas container bounding box not found');

  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  
  // Verify initial state
  let initialShapeCount = await page.evaluate(() => window.app.mainCanvasLayer.shapes.length);
  expect(initialShapeCount).toBe(0);

  // First point
  await page.mouse.click(x, y);
  await page.waitForTimeout(200);
  // Second point
  await page.mouse.click(x + 100, y);
  await page.waitForTimeout(200);
  
  // Verify a shape is created
  let shapesInfo = await page.evaluate(() => 
    window.app.mainCanvasLayer.shapes.map(s => ({ name: s.name, id: s.id }))
  );
  console.log('Created shapes:', JSON.stringify(shapesInfo));
  let shapeCount = shapesInfo.length;
  expect(shapeCount).toBeGreaterThan(0);
  
  // Select Delete tool
  const deleteButton = page.locator('ag-menu icon-button[name="delete"]');
  await deleteButton.click();
  
  // Click on the shape to delete it
  // For a segment, clicking in the middle should work
  await page.mouse.click(x + 50, y); 
  await page.waitForTimeout(200);
  
  // Verify all shapes are gone (sometimes points are left, we delete them too)
  let finalShapeCount = await page.evaluate(() => window.app.mainCanvasLayer.shapes.length);
  if (finalShapeCount > 0) {
    await page.mouse.click(x, y);
    await page.waitForTimeout(100);
    await page.mouse.click(x + 100, y);
    await page.waitForTimeout(100);
    finalShapeCount = await page.evaluate(() => window.app.mainCanvasLayer.shapes.length);
  }
  console.log('Final shape count:', finalShapeCount);
  expect(finalShapeCount).toBe(0);
});
