import { describe, it, expect, beforeEach, vi } from 'vitest';

// Test pour comprendre le problème de zoom dans l'app réelle
describe('Zoom Problem Investigation', () => {
  let mockApp;

  beforeEach(() => {
    // Mock de base de app
    mockApp = {
      workspace: {
        zoomLevel: 1.0,
        translateOffset: { x: 0, y: 0 }
      }
    };

    // Mock de Coordinates pour tester les conversions
    global.Coordinates = class {
      constructor({ x = 0, y = 0 }) {
        this.x = x;
        this.y = y;
      }

      toCanvasCoordinates() {
        return new Coordinates({
          x: this.x * mockApp.workspace.zoomLevel + mockApp.workspace.translateOffset.x,
          y: this.y * mockApp.workspace.zoomLevel + mockApp.workspace.translateOffset.y
        });
      }

      fromCanvasCoordinates() {
        return new Coordinates({
          x: (this.x - mockApp.workspace.translateOffset.x) / mockApp.workspace.zoomLevel,
          y: (this.y - mockApp.workspace.translateOffset.y) / mockApp.workspace.zoomLevel
        });
      }

      dist(other) {
        return Math.sqrt(Math.pow(this.x - other.x, 2) + Math.pow(this.y - other.y, 2));
      }
    };
  });

  it('should show how coordinates behave during zoom changes', () => {
    // Simuler un point créé sur la grille avec zoom 1.0
    mockApp.workspace.zoomLevel = 1.0;
    
    // Point en espace monde (stocké dans l'objet)
    const worldPoint = new Coordinates({ x: 37.795, y: 37.795 }); // 1cm, 1cm
    
    // Conversion vers canvas avec zoom 1.0
    let canvasPoint = worldPoint.toCanvasCoordinates();
    console.log('Zoom 1.0 - World:', worldPoint, 'Canvas:', canvasPoint);
    
    // Maintenant on change le zoom à 2.0
    mockApp.workspace.zoomLevel = 2.0;
    
    // Le même point monde converti avec le nouveau zoom
    canvasPoint = worldPoint.toCanvasCoordinates();
    console.log('Zoom 2.0 - World:', worldPoint, 'Canvas:', canvasPoint);
    
    // Simuler ce qui se passe avec la grille
    const gridSize = 1; // 1cm
    const pixelsPerCm = 37.795;
    
    // Grille avec zoom 1.0
    const gridStep1 = gridSize * pixelsPerCm * 1.0; // 37.795
    console.log('Grid step zoom 1.0:', gridStep1);
    
    // Grille avec zoom 2.0
    const gridStep2 = gridSize * pixelsPerCm * 2.0; // 75.59
    console.log('Grid step zoom 2.0:', gridStep2);
    
    // Le problème : le point canvas est maintenant à (75.59, 75.59)
    // mais la grille est aussi redimensionnée, donc il devrait toujours être aligné
    // SAUF si quelque chose d'autre ne suit pas le zoom
    
    expect(canvasPoint.x).toBe(75.59);
    expect(canvasPoint.y).toBe(75.59);
    expect(gridStep2).toBe(75.59);
  });

  it('should test getClosestGridPoint behavior', () => {
    // Simuler getClosestGridPoint simplifié
    function getClosestGridPoint(checkingCoordinates, zoomLevel) {
      const gridSize = 1; // 1cm
      const pixelsPerCm = 37.795;
      const calculatedGridStep = gridSize * pixelsPerCm * zoomLevel;
      
      // Trouver le point de grille le plus proche
      const gridX = Math.round(checkingCoordinates.x / calculatedGridStep) * calculatedGridStep;
      const gridY = Math.round(checkingCoordinates.y / calculatedGridStep) * calculatedGridStep;
      
      return new Coordinates({ x: gridX, y: gridY });
    }
    
    // Test avec zoom 1.0
    mockApp.workspace.zoomLevel = 1.0;
    let testPoint = new Coordinates({ x: 38, y: 38 }); // Proche de 37.795
    let closest = getClosestGridPoint(testPoint, 1.0);
    console.log('Zoom 1.0 - Test point:', testPoint, 'Closest grid:', closest);
    
    // Test avec zoom 2.0
    mockApp.workspace.zoomLevel = 2.0;
    testPoint = new Coordinates({ x: 76, y: 76 }); // Proche de 75.59
    closest = getClosestGridPoint(testPoint, 2.0);
    console.log('Zoom 2.0 - Test point:', testPoint, 'Closest grid:', closest);
    
    // Les deux devraient donner des résultats cohérents
    expect(closest.x).toBeCloseTo(75.59, 2);
    expect(closest.y).toBeCloseTo(75.59, 2);
  });
});

// Juste pour voir la sortie
console.log('Running zoom investigation tests...');
