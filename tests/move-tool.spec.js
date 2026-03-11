import { test, expect } from '@playwright/test';

test('Move tool should change shape coordinates', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('http://localhost:4324');
  
  // Select Geometry environment
  await page.click('#Geometrie');
  await expect(page.locator('ag-menu')).toBeVisible();
  
  // Create a Segment
  const lineButton = page.locator('ag-menu icon-button[name="createLine"]');
  await lineButton.click();
  const segmentButton = page.locator('shape-selector icon-button[name="Segment"]');
  await segmentButton.click({ force: true });
  await page.waitForTimeout(500);
  
  const canvasContainer = page.locator('canvas-container');
  const box = await canvasContainer.boundingBox();
  if (!box) throw new Error('Canvas box not found');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  
  // Click to create segment
  await page.mouse.click(x, y);
  await page.waitForTimeout(300);
  await page.mouse.click(x + 100, y);
  await page.waitForTimeout(500);
  
  // Verify shape exists and get its coordinates
  const shapeInfo = await page.evaluate(() => {
    const shape = window.app.mainCanvasLayer.shapes[0];
    if (!shape) return null;
    return { 
      id: shape.id, 
      name: shape.name,
      p1: { x: shape.vertexes[0].x, y: shape.vertexes[0].y },
      p2: { x: shape.vertexes[1].x, y: shape.vertexes[1].y }
    };
  });
  console.log('Created shape info:', JSON.stringify(shapeInfo));
  if (!shapeInfo) throw new Error('Shape not created');

  // Select Move tool
  const moveButton = page.locator('ag-menu icon-button[name="move"]');
  await moveButton.click();
  await page.waitForTimeout(500);
  
  // Drag the shape
  // Move to middle of segment
  await page.mouse.move(x + 50, y);
  await page.waitForTimeout(200);
  await page.mouse.down();
  await page.waitForTimeout(200);
  await page.mouse.move(x + 150, y + 50, { steps: 10 });
  await page.waitForTimeout(200);
  await page.mouse.up();
  await page.waitForTimeout(500);
  
  // Verify coordinates changed
  let finalCoords = await page.evaluate(() => {
    const shape = window.app.mainCanvasLayer.shapes[0];
    return { x: shape.vertexes[0].x, y: shape.vertexes[0].y };
  });
  console.log('Final coords:', finalCoords);
  
  expect(finalCoords.x).not.toBeCloseTo(shapeInfo.p1.x);
  expect(finalCoords.y).not.toBeCloseTo(shapeInfo.p1.y);
});
