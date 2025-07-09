import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock complet pour simuler le problème de double zoom
vi.mock('../../src/store/gridStore.js', () => ({
  gridStore: {
    getState: vi.fn(() => ({
      gridType: 'square',
      gridSize: 1, // 1 cm
      isVisible: true,
      gridColor: '#888888',
      pointRadius: 0.75,
      backgroundColor: '#F0F0F0',
    }))
  }
}));

// Mock de app avec différents niveaux de zoom
const mockApp = {
  workspace: {
    zoomLevel: 1.0,
    translateOffset: { x: 0, y: 0 }
  },
  canvasWidth: 800,
  canvasHeight: 600
};

vi.mock('../../src/controllers/Core/App', () => ({
  app: mockApp
}));

// Mock de Coordinates
const realCoordinates = vi.importActual('../../src/controllers/Core/Objects/Coordinates.js');

describe('Double Zoom Fix', () => {
  let canvasLayerElement;

  beforeEach(async () => {
    // Import dynamique pour éviter les problèmes de mock
    const { CanvasLayer } = await import('../../src/components/canvas-layer.js');
    
    canvasLayerElement = document.createElement('canvas-layer');
    document.body.appendChild(canvasLayerElement);
    await canvasLayerElement.updateComplete;
  });

  afterEach(() => {
    if (canvasLayerElement && canvasLayerElement.parentNode) {
      canvasLayerElement.parentNode.removeChild(canvasLayerElement);
    }
  });

  it('should not apply zoom twice in getClosestGridPoint', () => {
    const { Coordinates } = realCoordinates;
    
    // Test avec zoom 1.0 (pas de zoom)
    mockApp.workspace.zoomLevel = 1.0;
    
    // Point à 37.795 pixels du coin (should be exactly 1cm at 37.795px/cm)
    const testPoint = new Coordinates({ x: 37.795, y: 37.795 });
    const closest = canvasLayerElement.getClosestGridPoint(testPoint);
    
    // Devrait être exactement à (37.795, 37.795) car c'est un point de grille
    expect(closest.x).toBeCloseTo(37.795, 2);
    expect(closest.y).toBeCloseTo(37.795, 2);
  });

  it('should handle zoom correctly without double application', () => {
    const { Coordinates } = realCoordinates;
    
    // Test avec zoom 2.0
    mockApp.workspace.zoomLevel = 2.0;
    
    // Même point qu'avant, mais maintenant les coordonnées sont en "espace canvas zoomé"
    // Si on a un point monde à (18.8975, 18.8975), son équivalent canvas serait (37.795, 37.795)
    const worldPoint = new Coordinates({ x: 18.8975, y: 18.8975 });
    const canvasPoint = worldPoint.toCanvasCoordinates(); // devrait donner ~(37.795, 37.795)
    
    const closest = canvasLayerElement.getClosestGridPoint(canvasPoint);
    
    // Le point de grille le plus proche devrait toujours être à (37.795, 37.795) en espace canvas
    // car la grille n'est plus mise à l'échelle par le zoom
    expect(closest.x).toBeCloseTo(37.795, 2);
    expect(closest.y).toBeCloseTo(37.795, 2);
    
    // Et quand on reconvertit en espace monde, on devrait retrouver (~18.8975, ~18.8975)
    const worldResult = closest.fromCanvasCoordinates();
    expect(worldResult.x).toBeCloseTo(18.8975, 2);
    expect(worldResult.y).toBeCloseTo(18.8975, 2);
  });

  it('should work consistently at different zoom levels', () => {
    const { Coordinates } = realCoordinates;
    
    // Test que les conversions restent cohérentes
    const originalWorldPoint = new Coordinates({ x: 10, y: 10 });
    
    // Test avec zoom 0.5
    mockApp.workspace.zoomLevel = 0.5;
    let canvasPoint = originalWorldPoint.toCanvasCoordinates();
    let closest = canvasLayerElement.getClosestGridPoint(canvasPoint);
    let backToWorld = closest.fromCanvasCoordinates();
    
    // Le point devrait s'aligner sur une grille proche
    expect(backToWorld.x).toBeCloseTo(Math.round(backToWorld.x), 1);
    expect(backToWorld.y).toBeCloseTo(Math.round(backToWorld.y), 1);
    
    // Test avec zoom 3.0
    mockApp.workspace.zoomLevel = 3.0;
    canvasPoint = originalWorldPoint.toCanvasCoordinates();
    closest = canvasLayerElement.getClosestGridPoint(canvasPoint);
    backToWorld = closest.fromCanvasCoordinates();
    
    // Le point devrait toujours s'aligner sur une grille proche
    expect(backToWorld.x).toBeCloseTo(Math.round(backToWorld.x), 1);
    expect(backToWorld.y).toBeCloseTo(Math.round(backToWorld.y), 1);
  });
});
