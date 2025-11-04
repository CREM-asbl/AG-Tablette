import { beforeEach, describe, expect, it, vi } from 'vitest';

// Hoist the mock functions that will be used in vi.mock factories
const { mockGridStoreGetState } = vi.hoisted(() => {
  return { mockGridStoreGetState: vi.fn() };
});

const { mockGetEmptySelectionConstraints, mockSelectPoint } = vi.hoisted(() => {
  return {
    mockGetEmptySelectionConstraints: vi.fn(),
    mockSelectPoint: vi.fn(),
  };
});

const { mockAppGetClosestGridPoint, mockAppSettingsGet } = vi.hoisted(() => {
  return {
    mockAppGetClosestGridPoint: vi.fn(),
    mockAppSettingsGet: vi.fn(),
  };
});

// Hoist CoordinatesMock and its properties needed by other mocks
const { CoordinatesMock, mockCoordInstance, mockToCanvasCoordinates, mockFromCanvasCoordinates, mockDist, mockSubstract } = vi.hoisted(() => {
  const mockToCanvasCoordinates = vi.fn();
  const mockFromCanvasCoordinates = vi.fn();
  const mockDist = vi.fn();
  const mockSubstract = vi.fn();

  const mockCoordInstance = {
    toCanvasCoordinates: mockToCanvasCoordinates,
    fromCanvasCoordinates: mockFromCanvasCoordinates,
    dist: mockDist,
    substract: mockSubstract,
  };

  const CoordinatesMock = vi.fn().mockImplementation((x, y) => ({
    ...mockCoordInstance,
    x: x !== undefined ? x : 0,
    y: y !== undefined ? y : 0,
  }));
  CoordinatesMock.nullCoordinates = { ...mockCoordInstance, x: 0, y: 0, type: 'world-null' };

  return { CoordinatesMock, mockCoordInstance, mockToCanvasCoordinates, mockFromCanvasCoordinates, mockDist, mockSubstract };
});


vi.mock('../../../../src/controllers/Core/Objects/Coordinates.js', () => ({
  Coordinates: CoordinatesMock,
}));

// Mock gridStore using the hoisted function
vi.mock('../../../../src/store/gridStore.js', () => ({
  gridStore: {
    getState: mockGridStoreGetState,
  }
}));

// Mock SelectManager using hoisted functions
vi.mock('../../../../src/controllers/Core/Managers/SelectManager', () => ({
  SelectManager: {
    getEmptySelectionConstraints: mockGetEmptySelectionConstraints,
    selectPoint: mockSelectPoint,
  },
  initSelectManager: vi.fn(),
}));

// Mock app service using hoisted functions
vi.mock('../../../../src/controllers/Core/App', () => {
  const actualApp = vi.importActual('../../../../src/controllers/Core/App');
  const app = {
    ...actualApp.app,
    environment: {}, // Mock environment
    settings: {
      automaticAdjustment: true, // Default value
      get: mockAppSettingsGet, // Mock for app.settings.get
    },
    workspace: {
      geometryTransformationChildShapeIds: [], // Mock
    },
    gridCanvasLayer: { // Assurez-vous que c'est bien gridCanvasLayer
      getClosestGridPoint: mockAppGetClosestGridPoint, // Correction: utiliser le spy ici
    },
    // getClosestGridPoint: mockAppGetClosestGridPoint, // Peut être conservé ou supprimé car non utilisé directement par le SUT
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatch: vi.fn(),
    setState: vi.fn(),
    getState: vi.fn(() => ({
      settings: {
        gridShown: true,
        gridType: 'square',
        gridSize: 20,
      },
      tools: {
        selectedTool: 'select',
      }
    })),
  };
  return { app };
});

// Import the module to test AFTER all mocks are set up

describe('Automatic Adjustment Logic', () => {
  let app; // To access the mocked app features easily

  beforeEach(async () => {
    vi.clearAllMocks();

    // It's crucial to re-import the mocked module to get the fresh mock instance for each test
    const appModule = await import('../../../../src/controllers/Core/App');
    app = appModule.app;

    // Configure the fresh mock instance for app.settings and app.environment for each test
    // For app.settings.get
    mockAppSettingsGet.mockImplementation(key => {
      if (key === 'automaticAdjustmentSensitivity') {
        return 5; // Default mock sensitivity
      }
      // Ensure direct assignments in tests are reflected if app.settings.get is called for them
      if (key === 'automaticAdjustment' && app.settings.hasOwnProperty('automaticAdjustment')) {
        return app.settings.automaticAdjustment;
      }
      return undefined;
    });

    // Initialize properties that are directly set in the tests on the fresh mock
    app.settings.automaticAdjustment = true; // Default for tests, can be overridden
    app.environment.name = 'Geometrie'; // Now app.environment is defined

    // Default gridStore configuration
    mockGridStoreGetState.mockReturnValue({ isVisible: true });

    // Default SelectManager configuration
    mockGetEmptySelectionConstraints.mockReturnValue({
      points: { canSelect: true, types: [], blacklist: [], numberOfObjects: 'allInDistance' }
    });
    mockSelectPoint.mockReturnValue([]); // No points selected by default
  });

  it('should call getClosestGridPoint with canvas coords and convert result back to world coords', async () => {
    const { getShapeAdjustment } = await import('../../../../src/controllers/Core/Tools/automatic_adjustment');

    const canvasPointFromShape = { x: 200, y: 200, type: 'canvas-shape-point' };
    const worldGridPoint = {
      x: 101, y: 101, type: 'world-grid-point',
      dist: vi.fn().mockReturnValue(5),
      substract: vi.fn().mockReturnValue({ x: 1, y: 1, type: 'world-translation' })
    };
    const canvasGridPointReturned = {
      x: 202, y: 202, type: 'canvas-grid-returned',
      fromCanvasCoordinates: vi.fn().mockReturnValue(worldGridPoint)
    };

    mockToCanvasCoordinates.mockReturnValue(canvasPointFromShape);
    mockAppGetClosestGridPoint.mockReturnValue(canvasGridPointReturned);

    const shapePointWorldCoordinates = {
      x: 100, y: 100, type: 'world-shape-point',
      toCanvasCoordinates: mockToCanvasCoordinates,
      dist: vi.fn(),
      substract: vi.fn()
    };

    app.settings.automaticAdjustment = false; // This will now correctly set it on the fresh mock
    mockGridStoreGetState.mockReturnValue({ isVisible: true });

    const mockMainShape = {
      id: 'mainShape1',
      centerCoordinates: { x: 50, y: 50 },
      vertexes: [{ coordinates: shapePointWorldCoordinates }],
      divisionPoints: [],
      isCenterShown: false,
      geometryObject: {
        geometryTransformationChildShapeIds: [],
        geometryChildShapeIds: [] // Ajout de geometryChildShapeIds
      }
    };
    const shapes = [mockMainShape];

    const transformation = getShapeAdjustment(shapes, mockMainShape, []);

    expect(mockToCanvasCoordinates).toHaveBeenCalledTimes(1);
    expect(mockAppGetClosestGridPoint).toHaveBeenCalledTimes(1);
    expect(mockAppGetClosestGridPoint).toHaveBeenCalledWith(canvasPointFromShape);
    expect(canvasGridPointReturned.fromCanvasCoordinates).toHaveBeenCalledTimes(1);
    expect(worldGridPoint.substract).toHaveBeenCalledWith(shapePointWorldCoordinates);
    expect(transformation.translation).toEqual({ x: 1, y: 1, type: 'world-translation' });
    expect(transformation.rotationAngle).toBe(0);
  });

  it('should consider automaticAdjustmentSensitivity via getClosestGridPoint behavior', async () => {
    const { getShapeAdjustment } = await import('../../../../src/controllers/Core/Tools/automatic_adjustment');
    const { Coordinates } = await import('../../../../src/controllers/Core/Objects/Coordinates.js'); // Corrected import path

    const shapePointCanvasCoords = { x: 20, y: 20, type: 'canvas-shape' };
    const shapePointWorldCoords = {
      x: 10, y: 10, type: 'world-shape',
      toCanvasCoordinates: vi.fn().mockReturnValue(shapePointCanvasCoords),
      dist: vi.fn(),
      substract: vi.fn()
    };

    const mockShapes = [{
      vertexes: [{ coordinates: shapePointWorldCoords }],
      divisionPoints: [],
      isCenterShown: false,
      id: 's1',
      geometryObject: {
        geometryTransformationChildShapeIds: [],
        geometryChildShapeIds: [] // Ajout de geometryChildShapeIds
      }
    }];
    const mockMainShape = mockShapes[0];

    mockGridStoreGetState.mockReturnValue({ isVisible: true });
    app.settings.automaticAdjustment = false;

    const actualDistanceToGrid = 10;
    const translationVector = { x: 2, y: 2, type: 'translation_if_snapped' };

    mockAppGetClosestGridPoint.mockImplementation(canvasCoordsInput => {
      const sensitivity = app.settings.get('automaticAdjustmentSensitivity');
      if (actualDistanceToGrid <= sensitivity) {
        return {
          x: canvasCoordsInput.x + 5, y: canvasCoordsInput.y + 5, type: 'canvas-grid-sensitive',
          fromCanvasCoordinates: vi.fn().mockReturnValue({
            x: shapePointWorldCoords.x + translationVector.x,
            y: shapePointWorldCoords.y + translationVector.y,
            type: 'world-grid-sensitive',
            dist: vi.fn().mockReturnValue(actualDistanceToGrid),
            substract: vi.fn().mockReturnValue(translationVector)
          })
        };
      }
      return null;
    });

    // Case 1: Sensitivity is too low (5), point is not snapped (distance 10)
    mockAppSettingsGet.mockImplementation(key => key === 'automaticAdjustmentSensitivity' ? 5 : undefined);
    let transformation = getShapeAdjustment(mockShapes, mockMainShape, []);
    expect(mockAppGetClosestGridPoint).toHaveBeenCalledWith(shapePointCanvasCoords);
    expect(transformation.translation).toEqual(CoordinatesMock.nullCoordinates); // Use the mocked Coordinates.nullCoordinates
    expect(transformation.rotationAngle).toBe(0);

    // Clear mock history and implementations for the next part of the test
    vi.clearAllMocks();

    // Re-apply necessary mocks for Case 2 as vi.clearAllMocks() resets them to bare vi.fn()
    // or clears their specific mockImplementation.

    // Re-configure app settings and other global mocks that were cleared
    // const appModule = await import('../../../../src/controllers/Core/App'); // No longer needed here, app is fresh from beforeEach
    // app = appModule.app;
    app.settings.automaticAdjustment = false; // Ensure this is set on the correct mock instance
    app.environment.name = 'Geometrie'; // Ensure this is set on the correct mock instance
    mockGridStoreGetState.mockReturnValue({ isVisible: true });
    mockGetEmptySelectionConstraints.mockReturnValue({
      points: { canSelect: true, types: [], blacklist: [], numberOfObjects: 'allInDistance' }
    });
    mockSelectPoint.mockReturnValue([]);

    // Re-mock shapePointWorldCoords methods as they are instance specific vi.fn()
    shapePointWorldCoords.toCanvasCoordinates.mockReturnValue(shapePointCanvasCoords);

    // Case 2: Sensitivity is high enough (15), point is snapped (distance 10)
    mockAppSettingsGet.mockImplementation(key => key === 'automaticAdjustmentSensitivity' ? 15 : undefined);
    mockAppGetClosestGridPoint.mockImplementation(canvasCoordsInput => {
      const sensitivity = app.settings.get('automaticAdjustmentSensitivity');
      if (actualDistanceToGrid <= sensitivity) {
        const worldGridPt = {
          x: shapePointWorldCoords.x + translationVector.x,
          y: shapePointWorldCoords.y + translationVector.y,
          type: 'world-grid-sensitive',
          dist: vi.fn().mockReturnValue(actualDistanceToGrid),
          substract: vi.fn().mockReturnValue(translationVector)
        };
        return {
          x: canvasCoordsInput.x + 5, y: canvasCoordsInput.y + 5, type: 'canvas-grid-sensitive',
          fromCanvasCoordinates: vi.fn().mockReturnValue(worldGridPt)
        };
      }
      return null;
    });

    transformation = getShapeAdjustment(mockShapes, mockMainShape, []);
    expect(mockAppGetClosestGridPoint).toHaveBeenCalledWith(shapePointCanvasCoords);
    expect(transformation.translation).toEqual(translationVector);
    expect(transformation.rotationAngle).toBe(0);
  });
});
