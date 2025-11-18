import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
// Removed vitest-canvas-mock as we're manually mocking ctx
import '../../src/components/canvas-layer.js'; // Assurer la définition de l'élément personnalisé
import { Coordinates } from '../../src/controllers/Core/Objects/Coordinates.js'; // AJOUT DE L'IMPORT
import { gridStore } from '../../src/store/gridStore'; // Assuming direct import for testing

// Mock the App module
vi.mock('../../src/controllers/Core/App', async () => {
  const mockAppInstance = {
    workspace: {
      zoomLevel: 1.0,
      translateOffset: { x: 0, y: 0 }, // Simplifié
      pixelDensity: 1,
      getPixelCoordinatesFromWorldCoordinates: vi.fn(coord => coord),
      getWorldCoordinatesFromPixelCoordinates: vi.fn(coord => coord),
      selectionConstraints: { eventType: 'click' },
    },
    settings: {
      get: vi.fn(key => {
        if (key === 'gridColor') return '#000000';
        if (key === 'mainCanvasPixelDensity') return 1;
        if (key === 'pointSize') return 1;
        if (key === 'areShapesPointed') return true;
        if (key === 'mainMenuWidth') return 0;
        return undefined;
      })
    },
    environment: {
      name: 'standard'
    },
    history: { steps: [] },
    fullHistory: { isRunning: false },
    listenerCounter: { objectSelected: false },
    tool: { name: 'dummyTool' },
    canvasWidth: 800,
    canvasHeight: 600,
  };
  return { app: mockAppInstance };
});

// Mock the gridStore module
vi.mock('../../src/store/gridStore', async () => {
  const actual = await vi.importActual('../../src/store/gridStore');
  return {
    ...actual,
    gridStore: {
      ...actual.gridStore,
      subscribe: vi.fn(),
      set: vi.fn(),
      update: vi.fn(),
      // Rename get to getState and ensure it returns the same mock structure
      getState: vi.fn(() => actual.initialState)
    },
    // These might be part of the actual store or helper functions, ensure they are mocked if used directly
    // If they are selectors that use gridStore.getState(), they might not need individual mocks
    // for gridStore.getState() is correctly mocked.
    // For now, assuming they might be used and keeping them, adjust as necessary.
    isGridVisible: vi.fn(),
    getGridType: vi.fn(),
    getGridSize: vi.fn(),
  };
});

describe('CanvasLayer', () => {
  let canvasLayerElement;

  beforeEach(async () => {
    // Create the element without appending to avoid event loops
    canvasLayerElement = document.createElement('canvas-layer');

    // Manually set up the canvas and context mocks to simulate initialization
    const mockCanvas = document.createElement('canvas');
    mockCanvas.width = 800;
    mockCanvas.height = 600;
    const mockCtx = {
      clearRect: vi.fn(),
      fillStyle: '',
      fillRect: vi.fn(),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      setTransform: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      // Add other methods as needed
    };
    mockCanvas.getContext = vi.fn(() => mockCtx);
    canvasLayerElement.canvas = mockCanvas;
    canvasLayerElement.ctx = mockCtx;

    // Mock methods to prevent actual drawing but allow clearing
    canvasLayerElement.redraw = vi.fn(() => canvasLayerElement.clear());
    canvasLayerElement.throttledRedraw = vi.fn();
    canvasLayerElement.clear = vi.fn(() => canvasLayerElement.ctx.clearRect(0, 0, 800, 600));
    // NE PAS mocker drawGridPoints - on veut tester la vraie implémentation
    canvasLayerElement.draw = vi.fn();

    // Simulate id for canvasName
    canvasLayerElement.id = 'mainCanvas';

    // vitest-canvas-mock devrait fournir un contexte moqué accessible via canvasLayerElement.ctx
    // Plus besoin de spyOn getContext manuellement ni de créer mockCtx.

    // Reset mocks for each test
    vi.clearAllMocks();

    // Mock gridStore
    gridStore.getState = vi.fn().mockReturnValue({
      gridType: 'none', // Default to no grid
      gridSize: 1,
      isVisible: false, // Default to not visible
      gridColor: '#888888',
      pointRadius: 0.75,
      backgroundColor: '#F0F0F0',
    });

    // Note: app is already mocked in setup.ts
  });

  afterEach(() => {
    if (canvasLayerElement && canvasLayerElement.parentNode) {
      canvasLayerElement.parentNode.removeChild(canvasLayerElement);
    }
    vi.restoreAllMocks();
  });

  describe('loadFromData robustness', () => {
    it('should not throw when called with null and should clear/redraw', () => {
      expect(() => canvasLayerElement.loadFromData(null)).not.toThrow();
      // After loadFromData(null), internal arrays should be empty and redraw called.
      expect(canvasLayerElement.shapes).toEqual([]);
      expect(canvasLayerElement.segments).toEqual([]);
      expect(canvasLayerElement.points).toEqual([]);
      // We can assert that clear was attempted via clearRect call count being >= 1
      expect(canvasLayerElement.ctx.clearRect).toHaveBeenCalled();
    });

    it('should not throw when called with undefined', () => {
      expect(() => canvasLayerElement.loadFromData(undefined)).not.toThrow();
    });

    it('should accept partial data objects (e.g., only shapesData array)', async () => {
      const partial = { shapesData: [], segmentsData: undefined, pointsData: undefined };
      expect(() => canvasLayerElement.loadFromData(partial)).not.toThrow();
      expect(canvasLayerElement.shapes).toEqual([]);
    });
  });

  describe('getClosestGridPoint', () => {
    it('should return undefined if grid is not visible', () => {
      gridStore.getState.mockReturnValue({ ...gridStore.getState(), isVisible: false });
      // await canvasLayerElement.updateComplete; // If component reacts to store changes via properties
      const point = canvasLayerElement.getClosestGridPoint(new Coordinates({ x: 10, y: 10 }));
      expect(point).toBeUndefined();
    });

    it('should return undefined if grid type is "none"', () => {
      gridStore.getState.mockReturnValue({ ...gridStore.getState(), gridType: 'none' });
      // await canvasLayerElement.updateComplete;
      const point = canvasLayerElement.getClosestGridPoint(new Coordinates({ x: 10, y: 10 }));
      expect(point).toBeUndefined();
    });

    it('should return undefined if checkingCoordinates is undefined', () => {
      // await canvasLayerElement.updateComplete;
      const point = canvasLayerElement.getClosestGridPoint(undefined);
      expect(point).toBeUndefined();
    });

    describe('Square Grid', () => {
      beforeEach(async () => {
        const currentState = gridStore.getState();
        gridStore.getState.mockReturnValue({
          ...currentState,
          gridType: 'square',
          gridSize: 1,
          isVisible: true,
        });
        // Trigger re-render or update if the component relies on properties for these values
        // For CanvasLayer, it subscribes to the store in connectedCallback and updates internal
        // properties like _gridType, _gridSize, _isVisible.
        // The LitElement lifecycle should handle this. If tests fail, we might need to manually
        // call the store update handler or set properties and await canvasLayerElement.updateComplete.
        // For now, assume the direct store read in getClosestGridPoint is sufficient.
      });

      it('should find the closest point on a square grid', () => {
        const checkingPixelCoords = new Coordinates({ x: 40, y: 40 });
        const closest = canvasLayerElement.getClosestGridPoint(checkingPixelCoords);
        expect(closest).toBeInstanceOf(Coordinates);
        expect(closest.x).toBeCloseTo(37.8);
        expect(closest.y).toBeCloseTo(37.8);
      });

      it('should find the exact point if on a grid intersection', () => {
        const checkingPixelCoords = new Coordinates({ x: 37.8, y: 37.8 * 2 });
        const closest = canvasLayerElement.getClosestGridPoint(checkingPixelCoords);
        expect(closest.x).toBeCloseTo(37.8);
        expect(closest.y).toBeCloseTo(37.8 * 2);
      });
    });

    describe('Vertical Lines Grid', () => {
      beforeEach(() => {
        const currentState = gridStore.getState();
        gridStore.getState.mockReturnValue({
          ...currentState,
          gridType: 'vertical-lines',
          gridSize: 1,
          isVisible: true,
        });
      });

      it('should find the closest point on a vertical line, aligning Y with input', () => {
        const checkingPixelCoords = new Coordinates({ x: 30, y: 100 });
        const closest = canvasLayerElement.getClosestGridPoint(checkingPixelCoords);
        expect(closest).toBeInstanceOf(Coordinates);
        expect(closest.x).toBeCloseTo(37.8);
        expect(closest.y).toBe(100);
      });

      it('should find the exact point if X is on a grid line, Y aligns with input', () => {
        const checkingPixelCoords = new Coordinates({ x: 37.8 * 2, y: 150 });
        const closest = canvasLayerElement.getClosestGridPoint(checkingPixelCoords);
        expect(closest.x).toBeCloseTo(37.8 * 2);
        expect(closest.y).toBe(150);
      });

      it('should handle points between two vertical lines', () => {
        const checkingCloserToSecond = new Coordinates({ x: 60, y: 200 });
        const closest2 = canvasLayerElement.getClosestGridPoint(checkingCloserToSecond);
        expect(closest2.x).toBeCloseTo(37.8 * 2);
        expect(closest2.y).toBe(200);

        const checkingCloserToFirst = new Coordinates({ x: 50, y: 200 });
        const closest1 = canvasLayerElement.getClosestGridPoint(checkingCloserToFirst);
        expect(closest1.x).toBeCloseTo(37.8);
        expect(closest1.y).toBe(200);
      });

      it('should handle points outside canvas width but within calculatedSize margin', () => {
        const checkingPixelCoords = new Coordinates({ x: 810, y: 50 });
        const closest = canvasLayerElement.getClosestGridPoint(checkingPixelCoords);
        expect(closest.x).toBeCloseTo(21 * 37.8);
        expect(closest.y).toBe(50);
      });
    });

    describe('Horizontal Lines Grid', () => {
      beforeEach(() => {
        const currentState = gridStore.getState();
        gridStore.getState.mockReturnValue({
          ...currentState,
          gridType: 'horizontal-lines',
          gridSize: 1,
          isVisible: true,
        });
      });

      it('should find the closest point on a horizontal line, aligning X with input', () => {
        const checkingPixelCoords = new Coordinates({ x: 100, y: 30 });
        const closest = canvasLayerElement.getClosestGridPoint(checkingPixelCoords);
        expect(closest).toBeInstanceOf(Coordinates);
        expect(closest.x).toBe(100);
        expect(closest.y).toBeCloseTo(37.8);
      });

      it('should find the exact point if Y is on a grid line, X aligns with input', () => {
        const checkingPixelCoords = new Coordinates({ x: 150, y: 37.8 * 2 });
        const closest = canvasLayerElement.getClosestGridPoint(checkingPixelCoords);
        expect(closest.x).toBe(150);
        expect(closest.y).toBeCloseTo(37.8 * 2);
      });

      it('should handle points between two horizontal lines', () => {
        const checkingCloserToSecond = new Coordinates({ x: 200, y: 60 });
        const closest2 = canvasLayerElement.getClosestGridPoint(checkingCloserToSecond);
        expect(closest2.x).toBe(200);
        expect(closest2.y).toBeCloseTo(37.8 * 2);

        const checkingCloserToFirst = new Coordinates({ x: 200, y: 50 });
        const closest1 = canvasLayerElement.getClosestGridPoint(checkingCloserToFirst);
        expect(closest1.x).toBe(200);
        expect(closest1.y).toBeCloseTo(37.8);
      });

      it('should handle points outside canvas height but within calculatedSize margin', () => {
        const checkingPixelCoords = new Coordinates({ x: 50, y: 610 });
        const closest = canvasLayerElement.getClosestGridPoint(checkingPixelCoords);
        expect(closest.x).toBe(50);
        expect(closest.y).toBeCloseTo(16 * 37.8);
      });
    });

    describe('Vertical Triangle Grid', () => {
      beforeEach(() => {
        const currentState = gridStore.getState();
        gridStore.getState.mockReturnValue({
          ...currentState,
          gridType: 'vertical-triangle',
          gridSize: 1,
          isVisible: true,
        });
      });

      it('should find the closest vertex in a vertical triangle grid', () => {
        const side = 37.8;
        const triangleHeight = side * Math.sqrt(3) / 2;

        let checkingPixelCoords = new Coordinates({ x: 5, y: 5 });
        let closest = canvasLayerElement.getClosestGridPoint(checkingPixelCoords);
        expect(closest.x).toBeCloseTo(0);
        expect(closest.y).toBeCloseTo(0);

        checkingPixelCoords = new Coordinates({ x: side - 5, y: 5 });
        closest = canvasLayerElement.getClosestGridPoint(checkingPixelCoords);
        expect(closest.x).toBeCloseTo(side);
        expect(closest.y).toBeCloseTo(0);

        checkingPixelCoords = new Coordinates({ x: side / 2 + 3, y: triangleHeight - 3 });
        closest = canvasLayerElement.getClosestGridPoint(checkingPixelCoords);
        expect(closest.x).toBeCloseTo(side / 2);
        expect(closest.y).toBeCloseTo(triangleHeight);

        checkingPixelCoords = new Coordinates({ x: side * 1.5 - 3, y: triangleHeight + 3 });
        closest = canvasLayerElement.getClosestGridPoint(checkingPixelCoords);
        expect(closest.x).toBeCloseTo(side * 1.5);
        expect(closest.y).toBeCloseTo(triangleHeight);
      });

      it('should correctly snap to vertices when between multiple choices', () => {
        const side = 37.8;
        const triangleHeight = side * Math.sqrt(3) / 2;

        let checkingPixelCoords = new Coordinates({ x: side / 2 - 1, y: triangleHeight / 3 });
        let closest = canvasLayerElement.getClosestGridPoint(checkingPixelCoords);
        expect(closest.x).toBeCloseTo(0);
        expect(closest.y).toBeCloseTo(0);

        checkingPixelCoords = new Coordinates({ x: side / 2 + 1, y: triangleHeight / 3 });
        closest = canvasLayerElement.getClosestGridPoint(checkingPixelCoords);
        expect(closest.x).toBeCloseTo(side);
        expect(closest.y).toBeCloseTo(0);

        checkingPixelCoords = new Coordinates({ x: side / 2, y: triangleHeight / 3 + 10 });
        closest = canvasLayerElement.getClosestGridPoint(checkingPixelCoords);
        expect(closest.x).toBeCloseTo(side / 2);
        expect(closest.y).toBeCloseTo(triangleHeight);
      });
    });

    describe('Horizontal Triangle Grid', () => {
      beforeEach(() => {
        const currentState = gridStore.getState();
        gridStore.getState.mockReturnValue({
          ...currentState,
          gridType: 'horizontal-triangle',
          gridSize: 1,
          isVisible: true,
        });
      });

      it('should find the closest vertex in a horizontal triangle grid', () => {
        const side = 37.8;
        const horizontalStep = side * Math.sqrt(3) / 2;

        let checkingPixelCoords = new Coordinates({ x: 5, y: 5 });
        let closest = canvasLayerElement.getClosestGridPoint(checkingPixelCoords);
        expect(closest.x).toBeCloseTo(0);
        expect(closest.y).toBeCloseTo(0);

        checkingPixelCoords = new Coordinates({ x: 5, y: side - 5 });
        closest = canvasLayerElement.getClosestGridPoint(checkingPixelCoords);
        expect(closest.x).toBeCloseTo(0);
        expect(closest.y).toBeCloseTo(side);

        checkingPixelCoords = new Coordinates({ x: horizontalStep - 3, y: side / 2 + 3 });
        closest = canvasLayerElement.getClosestGridPoint(checkingPixelCoords);
        expect(closest.x).toBeCloseTo(horizontalStep);
        expect(closest.y).toBeCloseTo(side / 2);

        checkingPixelCoords = new Coordinates({ x: horizontalStep + 3, y: side * 1.5 - 3 });
        closest = canvasLayerElement.getClosestGridPoint(checkingPixelCoords);
        expect(closest.x).toBeCloseTo(horizontalStep);
        expect(closest.y).toBeCloseTo(side * 1.5);
      });

      it('should correctly snap to vertices when between multiple choices', () => {
        const side = 37.8;
        const horizontalStep = side * Math.sqrt(3) / 2;

        let checkingPixelCoords = new Coordinates({ x: horizontalStep / 4, y: side / 4 });
        let closest = canvasLayerElement.getClosestGridPoint(checkingPixelCoords);
        expect(closest.x).toBeCloseTo(0);
        expect(closest.y).toBeCloseTo(0);

        checkingPixelCoords = new Coordinates({ x: horizontalStep / 4, y: (3 * side) / 4 });
        closest = canvasLayerElement.getClosestGridPoint(checkingPixelCoords);
        expect(closest.x).toBeCloseTo(0);
        expect(closest.y).toBeCloseTo(side);

        checkingPixelCoords = new Coordinates({ x: horizontalStep * 0.6, y: side / 2 });
        closest = canvasLayerElement.getClosestGridPoint(checkingPixelCoords);
        expect(closest.x).toBeCloseTo(horizontalStep);
        expect(closest.y).toBeCloseTo(side / 2);
      });
    });
  });
});
