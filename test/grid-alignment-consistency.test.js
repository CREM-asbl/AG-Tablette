import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mocks pour les dépendances
const mockApp = {
  workspace: { zoomLevel: 1.0 },
  canvasWidth: 800,
  canvasHeight: 600
};

const mockGridStore = {
  getState: () => ({
    isVisible: true,
    gridType: 'square',
    gridSize: 1,
    gridColor: '#888888'
  })
};

const mockCoordinates = class {
  constructor({ x, y }) {
    this.x = x;
    this.y = y;
  }
  
  dist(other) {
    return Math.sqrt((this.x - other.x) ** 2 + (this.y - other.y) ** 2);
  }
  
  toCanvasCoordinates() {
    return new mockCoordinates({ 
      x: this.x * mockApp.workspace.zoomLevel, 
      y: this.y * mockApp.workspace.zoomLevel 
    });
  }
  
  fromCanvasCoordinates() {
    return new mockCoordinates({ 
      x: this.x / mockApp.workspace.zoomLevel, 
      y: this.y / mockApp.workspace.zoomLevel 
    });
  }
};

// Mock des modules
vi.mock('../src/controllers/Core/App', () => ({ app: mockApp }));
vi.mock('../src/store/gridStore.js', () => ({ gridStore: mockGridStore }));
vi.mock('../src/controllers/Core/Objects/Coordinates', () => ({ Coordinates: mockCoordinates }));

describe('Grid Alignment Consistency', () => {
  let canvasLayer;
  const PIXELS_PER_CM = 37.8;

  beforeEach(() => {
    // Mock canvas et context
    const mockCanvas = {
      getContext: () => ({
        clearRect: vi.fn(),
        beginPath: vi.fn(),
        arc: vi.fn(),
        fill: vi.fn(),
        fillStyle: null
      }),
      width: 800,
      height: 600
    };

    // Import du composant et setup
    const { CanvasLayer } = vi.importActual('../src/components/canvas-layer.js');
    canvasLayer = new CanvasLayer();
    canvasLayer.canvas = mockCanvas;
    canvasLayer.ctx = mockCanvas.getContext('2d');
  });

  it('should have consistent PIXELS_PER_CM between drawGridPoints and getClosestGridPoint', () => {
    // Test avec zoom 1.0
    mockApp.workspace.zoomLevel = 1.0;
    const gridSize = 1; // 1cm
    const expectedStep = gridSize * PIXELS_PER_CM * 1.0; // 37.8 pixels

    // Vérifier que getClosestGridPoint trouve un point à la position attendue
    const testCoord = new mockCoordinates({ x: expectedStep, y: expectedStep });
    const closestPoint = canvasLayer.getClosestGridPoint(testCoord);
    
    expect(closestPoint).toBeDefined();
    expect(closestPoint.x).toBe(expectedStep);
    expect(closestPoint.y).toBe(expectedStep);
  });

  it('should maintain alignment consistency with different zoom levels', () => {
    const testZooms = [0.5, 1.0, 1.5, 2.0];
    const gridSize = 1;

    testZooms.forEach(zoom => {
      mockApp.workspace.zoomLevel = zoom;
      const expectedStep = gridSize * PIXELS_PER_CM * zoom;

      // Point parfaitement aligné sur la grille
      const gridPoint = new mockCoordinates({ x: expectedStep, y: expectedStep });
      const closestPoint = canvasLayer.getClosestGridPoint(gridPoint);

      expect(closestPoint).toBeDefined();
      expect(Math.abs(closestPoint.x - expectedStep)).toBeLessThan(0.001);
      expect(Math.abs(closestPoint.y - expectedStep)).toBeLessThan(0.001);
    });
  });

  it('should find closest grid point correctly near grid intersections', () => {
    mockApp.workspace.zoomLevel = 1.0;
    const gridSize = 1;
    const step = gridSize * PIXELS_PER_CM;

    // Test un point légèrement décalé d'une intersection de grille
    const nearGridPoint = new mockCoordinates({ x: step + 2, y: step + 3 });
    const closestPoint = canvasLayer.getClosestGridPoint(nearGridPoint);

    expect(closestPoint).toBeDefined();
    expect(closestPoint.x).toBe(step);
    expect(closestPoint.y).toBe(step);
  });
});
