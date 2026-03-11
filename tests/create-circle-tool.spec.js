import { test, expect } from '@playwright/test';

test('Create Circle tool should create a circle', async ({ page }) => {
  test.setTimeout(60000);
  // Capture console logs
  page.on('console', msg => console.log('BROWSER:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  await page.goto('http://localhost:4324');
  
  // Select Geometry environment
  await page.click('#Geometrie');
  await expect(page.locator('ag-menu')).toBeVisible({ timeout: 30000 });
  
  // Select Create Circle tool
  const circleButton = page.locator('ag-menu icon-button[name="createCircle"]');
  await circleButton.click();
  await page.waitForTimeout(500);
  
  // Select Circle template in shape-selector
  const circleTemplate = page.locator('shape-selector icon-button[name="Circle"]');
  await circleTemplate.click({ force: true });
  await page.waitForTimeout(1000);
  
  const canvasContainer = page.locator('canvas-container');
  const box = await canvasContainer.boundingBox();
  if (!box) throw new Error('Canvas box not found');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  
  // Verify tool state
  const toolState = await page.evaluate(() => {
    return {
      name: window.app.tool?.name,
      step: window.app.tool?.currentStep,
      template: window.app.tool?.selectedTemplate?.name,
      numberOfPointsDrawn: window.app.tool?.numberOfPointsDrawn
    };
  });
  console.log('Tool state after selection:', JSON.stringify(toolState));

  // Click center
  await page.mouse.click(x, y);
  await page.waitForTimeout(500);
  
  // Check if first point created in upper layer
  const upperPointCount = await page.evaluate(() => window.app.upperCanvasLayer.points.length);
  console.log('Upper point count after first click:', upperPointCount);

  // Click radius point
  // We click a bit further to avoid magnetism issues
  await page.mouse.click(x + 100, y);
  
  // Wait for shape to appear in main layer (up to 5s)
  await page.waitForFunction(() => {
    return window.app.mainCanvasLayer.shapes.some(s => s.name === 'Circle');
  }, { timeout: 5000 }).catch(() => console.log('Timeout waiting for circle'));
  
  // Verify shape created
  const shapes = await page.evaluate(() => 
    window.app.mainCanvasLayer.shapes.map(s => ({ name: s.name, id: s.id }))
  );
  console.log('Final shapes:', JSON.stringify(shapes));
  
  const circle = shapes.find(s => s.name === 'Circle');
  expect(circle).toBeDefined();
});
