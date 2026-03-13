import { test, expect } from '@playwright/test';

test('Rotate tool should change shape rotation', async ({ page }) => {
  test.setTimeout(60000);
  await page.goto('http://localhost:4324');
  
  // Select Geometry environment
  await page.getByText('Géométrie').click();
  await expect(page.locator('ag-menu')).toBeVisible();
  
  // Create a Segment
  const lineButton = page.locator('ag-menu icon-button[name="createLine"]');
  await lineButton.click({ force: true });
  const segmentButton = page.locator('shape-selector icon-button[name="Segment"]');
  await segmentButton.click({ force: true });
  await page.waitForTimeout(500);
  
  const canvasContainer = page.locator('canvas-container');
  const box = await canvasContainer.boundingBox();
  if (!box) throw new Error('Canvas box not found');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  
  // Click to create segment (horizontal)
  await page.mouse.click(x, y);
  await page.waitForTimeout(300);
  await page.mouse.click(x + 100, y);
  await page.waitForTimeout(500);
  
  // Get initial coordinates of second vertex
  const shapeInfo = await page.evaluate(() => {
    const shape = window.app.mainCanvasLayer.shapes[0];
    if (!shape) return null;
    return { 
      p2: { x: shape.vertexes[1].x, y: shape.vertexes[1].y }
    };
  });
  console.log('Initial p2:', JSON.stringify(shapeInfo.p2));

  // Select Rotate tool
  const rotateButton = page.locator('ag-menu icon-button[name="rotate"]');
  await rotateButton.click({ force: true });
  await page.waitForTimeout(500);
  
  // Drag to rotate
  // Start drag from the second vertex
  await page.mouse.move(x + 100, y);
  await page.waitForTimeout(200);
  await page.mouse.down();
  await page.waitForTimeout(200);
  // Rotate by moving mouse down (90 degrees roughly)
  await page.mouse.move(x + 50, y + 50, { steps: 10 });
  await page.waitForTimeout(200);
  await page.mouse.up();
  await page.waitForTimeout(500);
  
  // Verify coordinates changed
  let finalP2 = await page.evaluate(() => {
    const shape = window.app.mainCanvasLayer.shapes[0];
    return { x: shape.vertexes[1].x, y: shape.vertexes[1].y };
  });
  console.log('Final p2:', JSON.stringify(finalP2));
  
  expect(finalP2.x).not.toBeCloseTo(shapeInfo.p2.x);
  expect(finalP2.y).not.toBeCloseTo(shapeInfo.p2.y);
});
