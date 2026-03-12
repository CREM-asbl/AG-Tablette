import { test, expect } from '@playwright/test';

test('Create Quadrilateral tool should create a square', async ({ page }) => {
  test.setTimeout(60000);
  
  await page.goto('http://localhost:4324');
  
  // 1. Charger l'environnement Géométrie
  await page.getByText('Géométrie').click();
  await expect(page.locator('ag-menu')).toBeVisible({ timeout: 30000 });
  
  // 2. Sélectionner l'outil de création de quadrilatère
  const toolButton = page.locator('ag-menu icon-button[name="createQuadrilateral"]');
  await toolButton.click();
  await expect(page.locator('shape-selector')).toBeVisible();
  
  // 3. Sélectionner le template "Carré" (Square)
  const squareTemplate = page.locator('shape-selector icon-button[name="Square"]');
  await squareTemplate.click({ force: true });
  
  // Attendre que l'outil soit prêt (drawPoint)
  await expect.poll(() => page.evaluate(() => window.app.tool?.currentStep), {
    timeout: 5000
  }).toBe('drawPoint');

  const canvasContainer = page.locator('canvas-container');
  const box = await canvasContainer.boundingBox();
  if (!box) throw new Error('Canvas box not found');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  
  // 4. Cliquer pour placer les points (Carré nécessite 2 points)
  // Premier point
  await page.mouse.move(x, y);
  await page.mouse.click(x, y, { delay: 100 });
  
  await expect.poll(() => page.evaluate(() => window.app.tool?.currentStep), {
    timeout: 5000
  }).toBe('drawPoint');

  // Second point
  await page.mouse.move(x + 100, y);
  await page.mouse.click(x + 100, y, { delay: 100 });
  
  // 5. Vérifier la création finale du carré dans la couche principale
  await page.waitForFunction(() => {
    return window.app.mainCanvasLayer.shapes.some(s => s.name === 'Square');
  }, { timeout: 10000 });
  
  const finalShapes = await page.evaluate(() => 
    window.app.mainCanvasLayer.shapes.map(s => ({ name: s.name, id: s.id }))
  );
  
  expect(finalShapes.some(s => s.name === 'Square')).toBe(true);
});
