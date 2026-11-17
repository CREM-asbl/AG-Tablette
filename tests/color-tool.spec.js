import { test, expect } from '@playwright/test';

test('Color tool should change shape color', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('http://localhost:4324');
  
  // Select Geometry environment
  await page.click('#Geometrie');
  await expect(page.locator('ag-menu')).toBeVisible();
  
  // Create a Segment
  const lineButton = page.locator('ag-menu icon-button[name="createLine"]');
  await lineButton.click({ force: true });
  const segmentButton = page.locator('shape-selector icon-button[name="Segment"]');
  await segmentButton.click({ force: true });
  
  await expect.poll(() => page.evaluate(() => window.app.tool?.currentStep), {
    timeout: 5000
  }).toBe('drawPoint');

  const canvasContainer = page.locator('canvas-container');
  const box = await canvasContainer.boundingBox();
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  
  await page.mouse.click(x, y, { delay: 100 });
  await page.waitForTimeout(200);
  await page.mouse.click(x + 100, y, { delay: 100 });
  await page.waitForTimeout(500);
  
  // Verify segment color (initial)
  let initialColor = await page.evaluate(() => window.app.mainCanvasLayer.shapes[0].strokeColor);
  console.log('Initial color:', initialColor);
  
  // Select Color tool
  const colorButton = page.locator('ag-menu icon-button[name="color"]');
  await colorButton.click({ force: true });
  
  // Attendre que l'outil soit prêt
  await expect.poll(() => page.evaluate(() => window.app.tool?.currentStep), {
    timeout: 5000
  }).toBe('listen');
  
  // Click on the shape to color it
  await page.mouse.click(x + 50, y, { delay: 100 }); 
  await page.waitForTimeout(500);
  
  // Verify color changed
  let finalColor = await page.evaluate(() => window.app.mainCanvasLayer.shapes[0].strokeColor);
  console.log('Final color:', finalColor);
  expect(finalColor).not.toBe(initialColor);
  
  // It should match app.settings.shapesDrawColor
  const expectedColor = await page.evaluate(() => window.app.settings.shapesDrawColor);
  expect(finalColor).toBe(expectedColor);
});
