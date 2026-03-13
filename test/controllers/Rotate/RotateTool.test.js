import { appActions } from '@store/appState';
import { RotateTool } from '@controllers/Rotate/RotateTool';
import { helpConfigRegistry } from '@services/HelpConfigRegistry';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { app, setState } from '@controllers/Core/App';
import { ShapeManager } from '@controllers/Core/Managers/ShapeManager';
import * as shapesTools from '@controllers/Core/Tools/shapesTools';
import * as generalTools from '@controllers/Core/Tools/general';
import { Coordinates } from '@controllers/Core/Objects/Coordinates';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
  signal: vi.fn((val) => ({ get: () => val, set: vi.fn() })),
}));

vi.mock('@controllers/Core/App', () => {
  const setState = vi.fn();
  const app = {
    tool: { name: 'rotate', currentStep: 'start' },
    environment: { name: 'Geometrie' },
    mainCanvasLayer: {
      shapes: [],
      editingShapeIds: [],
    },
    upperCanvasLayer: {
      shapes: [],
      removeAllObjects: vi.fn(),
    },
    workspace: {
      lastKnownMouseCoordinates: { x: 10, y: 10 },
      selectionConstraints: {
        shapes: { blacklist: [] },
      }
    },
    fastSelectionConstraints: {
      mousedown_all_shape: { shapes: {} }
    },
    addListener: vi.fn(() => 'listener-id'),
    removeListener: vi.fn(),
  };
  return { app, setState };
});

vi.mock('@store/appState', () => ({
  activeTool: { get: vi.fn(() => 'rotate'), set: vi.fn() },
  currentStep: { get: vi.fn(() => 'start'), set: vi.fn() },
  toolState: { get: vi.fn(() => ({})), set: vi.fn() },
  appActions: {
    setActiveTool: vi.fn(),
    setCurrentStep: vi.fn(),
    setToolState: vi.fn(),
  },
}));

vi.mock('@controllers/Core/Managers/ShapeManager', () => ({
  ShapeManager: {
    getAllBindedShapes: vi.fn((s) => [s]),
    getAllBindedShapesInGeometry: vi.fn((s) => [s]),
    getShapeIndex: vi.fn(() => 0),
  },
}));

vi.mock('@controllers/Core/Tools/shapesTools', () => ({
  duplicateShape: vi.fn((s) => ({ ...s, id: s.id + '_upper' })),
  compareIdBetweenLayers: vi.fn((id1, id2) => id2 === id1 + '_upper'),
}));

vi.mock('@controllers/Core/Tools/general', () => ({
  addInfoToId: vi.fn((id, info) => id + '_' + info),
  findObjectById: vi.fn(),
}));

vi.mock('@controllers/GeometryTools/general', () => ({
  getAllLinkedShapesInGeometry: vi.fn(),
}));

vi.mock('@controllers/GeometryTools/recomputeShape', () => ({
  computeAllShapeTransform: vi.fn(),
  computeConstructionSpec: vi.fn(),
}));

vi.mock('@controllers/Core/Tools/automatic_adjustment', () => ({
  getShapeAdjustment: vi.fn(() => ({ rotationAngle: 0, translation: { x: 0, y: 0 } })),
}));

// Mock Point
vi.mock('@controllers/Core/Objects/Point', () => ({
  Point: class {
    constructor() {}
  }
}));

describe('RotateTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    helpConfigRegistry.clear();
    tool = new RotateTool();
  });

  it('registers help config in start()', () => {
    tool.start();
    expect(helpConfigRegistry.has('rotate')).toBe(true);
  });

  it('updates signals in start()', async () => {
    vi.useFakeTimers();
    tool.start();
    vi.advanceTimersByTime(100);
    
    expect(appActions.setActiveTool).toHaveBeenCalledWith('rotate');
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
    vi.useRealTimers();
  });

  it('handles object selection', () => {
    const mockShape = { 
      id: 's1', 
      centerCoordinates: { angleWith: vi.fn(() => 0) },
      geometryObject: { 
        geometryTransformationName: null,
        geometryMultipliedChildShapeIds: [] 
      },
    };
    app.tool.currentStep = 'listen';
    
    tool.objectSelected(mockShape);
    
    expect(tool.selectedShape).toBe(mockShape);
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('rotate');
  });

  it('executes rotate on mouse up', () => {
    const mockShape = { 
      id: 's1', 
      centerCoordinates: { x: 0, y: 0 },
      points: [{ coordinates: { x: 0, y: 0 } }],
      rotate: vi.fn(),
      translate: vi.fn(),
    };
    const mockUpperShape = { id: 's1_upper', points: [{ coordinates: { x: 5, y: 5 } }] };
    
    tool.selectedShape = mockShape;
    tool.shapesToMove = [mockUpperShape];
    app.mainCanvasLayer.editingShapeIds = ['s1'];
    app.tool.currentStep = 'rotate';
    
    generalTools.findObjectById.mockImplementation((id) => {
      if (id === 's1') return mockShape;
      return null;
    });
    
    tool.canvasMouseUp();
    
    expect(mockShape.rotate).toHaveBeenCalled();
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
  });
});
