import { test, expect } from '@playwright/test';

test('Orthogonal Symetry tool should create a symetrical shape and axis should be visible', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('http://localhost:4324');
  
  // 1. Select Geometry environment
  await page.getByText('Géométrie').click();
  await expect(page.locator('ag-menu')).toBeVisible({ timeout: 30000 });
  
  // 2. Create an Irregular Triangle
  const toolButton = page.locator('ag-menu icon-button[name="createTriangle"]');
  await toolButton.click({ force: true });
  const triangleTemplate = page.locator('shape-selector icon-button[name="IrregularTriangle"]');
  await triangleTemplate.click({ force: true });
  
  const canvasContainer = page.locator('canvas-container');
  const box = await canvasContainer.boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  
  await page.mouse.click(x, y, { delay: 100 });
  await page.mouse.click(x + 50, y, { delay: 100 });
  await page.mouse.click(x + 25, y + 50, { delay: 100 });
  await page.waitForTimeout(500);

  // 3. Create a Vertical Line as Axis
  const lineButton = page.locator('ag-menu icon-button[name="createLine"]');
  await lineButton.click({ force: true });
  const segmentTemplate = page.locator('shape-selector icon-button[name="Segment"]');
  await segmentTemplate.click({ force: true });
  
  const axisX = x + 150;
  await page.mouse.click(axisX, y - 100, { delay: 100 });
  await page.mouse.click(axisX, y + 100, { delay: 100 });
  await page.waitForTimeout(500);
  
  const initialShapeCount = await page.evaluate(() => window.app.mainCanvasLayer.shapes.length);

  // 4. Select Orthogonal Symetry tool
  const symetryButton = page.locator('ag-menu icon-button[name="orthogonalSymetry"]');
  await symetryButton.click({ force: true });
  
  await expect.poll(() => page.evaluate(() => window.app.tool?.currentStep), {
    timeout: 5000
  }).toBe('selectReference');

  // 5. Select the axis
  await page.mouse.click(axisX, y, { delay: 100 });
  await page.waitForTimeout(500);
  
  // Wait for selectObject step (means axis was accepted)
  await expect.poll(() => page.evaluate(() => window.app.tool?.currentStep), {
    timeout: 5000
  }).toBe('selectObject');

  // 6. VERIFY AXIS IS VISIBLE on upper layer
  const axisVisible = await page.evaluate(() => {
      const axis = window.app.upperCanvasLayer.shapes.find(s => s.id === window.app.tool.referenceShapeId);
      return !!axis;
  });
  expect(axisVisible).toBe(true);

  // 7. Select the triangle
  await page.mouse.click(x + 25, y + 25, { delay: 100 });
  
  // 8. Wait for animation and verify
  await expect.poll(() => page.evaluate(() => window.app.mainCanvasLayer.shapes.length), {
    timeout: 15000
  }).toBeGreaterThan(initialShapeCount);
  
  const shapes = await page.evaluate(() => window.app.mainCanvasLayer.shapes.map(s => s.name));
  const triangleCount = shapes.filter(name => name === 'IrregularTriangle').length;
  expect(triangleCount).toBeGreaterThanOrEqual(2);
});
