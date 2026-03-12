import { test, expect } from '@playwright/test';

test('Create Circle tool should create a circle', async ({ page }) => {
  test.setTimeout(60000);
  
  // Capture console logs pour le debug
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.text().includes('BROWSER')) {
      console.log(`[BROWSER ${msg.type()}] ${msg.text()}`);
    }
  });

  await page.goto('http://localhost:4324');
  
  // 1. Charger l'environnement Géométrie
  await page.getByText('Géométrie').click();
  await expect(page.locator('ag-menu')).toBeVisible({ timeout: 30000 });
  
  // 2. Sélectionner l'outil de création de cercle
  const circleButton = page.locator('ag-menu icon-button[name="createCircle"]');
  await circleButton.click();
  await expect(page.locator('shape-selector')).toBeVisible();
  
  // 3. Sélectionner le template "Cercle" (centre-rayon)
  const circleTemplate = page.locator('shape-selector icon-button[name="Circle"]');
  await circleTemplate.click({ force: true });
  
  // ATTENTE CRITIQUE : L'outil doit être prêt (currentStep: drawPoint)
  await expect.poll(() => page.evaluate(() => window.app.tool?.currentStep), {
    message: "L'outil n'est pas passé en mode dessin après sélection du template",
    timeout: 5000
  }).toBe('drawPoint');

  const canvasContainer = page.locator('canvas-container');
  const box = await canvasContainer.boundingBox();
  if (!box) throw new Error('Canvas box not found');
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  
  // 4. Cliquer pour placer le centre
  // Utilisation d'un delay pour laisser le temps au watcher de traiter les signaux
  await page.mouse.move(x, y);
  await page.mouse.click(x, y, { delay: 100 });
  
  // Vérifier que le premier point est bien pris en compte (retour à drawPoint pour le 2ème point)
  await expect.poll(() => page.evaluate(() => window.app.tool?.currentStep), {
    message: "L'outil n'est pas prêt pour le second point",
    timeout: 5000
  }).toBe('drawPoint');

  // 5. Cliquer pour définir le rayon
  await page.mouse.move(x + 150, y);
  await page.mouse.click(x + 150, y, { delay: 100 });
  
  // 6. Vérifier la création finale du cercle dans la couche principale
  await page.waitForFunction(() => {
    return window.app.mainCanvasLayer.shapes.some(s => s.name === 'Circle');
  }, { timeout: 10000 });
  
  const finalShapes = await page.evaluate(() => 
    window.app.mainCanvasLayer.shapes.map(s => ({ name: s.name, id: s.id }))
  );
  
  expect(finalShapes.some(s => s.name === 'Circle')).toBe(true);
});
