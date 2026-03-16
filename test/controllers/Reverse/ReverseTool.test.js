import { app, setState } from '@controllers/Core/App';
import { ReverseTool } from '@controllers/Reverse/ReverseTool';
import { helpConfigRegistry } from '@services/HelpConfigRegistry';
import { appActions } from '@store/appState';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
  signal: vi.fn((val) => ({ get: () => val, set: vi.fn() })),
}));

vi.mock('@controllers/Core/App', () => {
  const setState = vi.fn();
  const createMockCoords = (x, y) => ({
    x, y,
    substract: vi.fn(() => createMockCoords(0, 0)),
    add: vi.fn(() => createMockCoords(0, 0)),
    multiply: vi.fn(() => createMockCoords(0, 0)),
    angleWith: vi.fn(() => 0),
  });
  const app = {
    tool: { name: 'reverse', currentStep: 'start' },
    environment: { name: 'Geometrie' },
    workspace: {
      lastKnownMouseCoordinates: createMockCoords(10, 10),
      selectionConstraints: {
        shapes: {},
        points: {},
        segments: {}
      },
      zoomLevel: 1
    },
    mainCanvasLayer: {
      shapes: [],
      editingShapeIds: [],
    },
    upperCanvasLayer: {
      removeAllObjects: vi.fn(),
      shapes: [],
    },
    fastSelectionConstraints: {
      click_all_shape: { shapes: {} }
    },
    addListener: vi.fn(() => 'listener-id'),
    removeListener: vi.fn(),
  };
  return { app, setState };
});

vi.mock('@store/appState', () => ({
  activeTool: { get: vi.fn(() => 'reverse') },
  currentStep: { get: vi.fn(() => 'start') },
  toolState: { get: vi.fn(() => ({})) },
  createWatcher: vi.fn(() => vi.fn()),
  appActions: {
    setActiveTool: vi.fn(),
    setCurrentStep: vi.fn(),
    setToolState: vi.fn(),
  },
}));

vi.mock('@controllers/Core/Managers/ShapeManager', () => ({
  ShapeManager: {
    getShapeById: vi.fn(),
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
  findObjectById: vi.fn(),
  removeObjectById: vi.fn(),
}));

vi.mock('@controllers/GeometryTools/general', () => ({
  getAllLinkedShapesInGeometry: vi.fn(),
}));

vi.mock('@controllers/GeometryTools/recomputeShape', () => ({
  computeAllShapeTransform: vi.fn(),
  computeConstructionSpec: vi.fn(),
}));

vi.mock('@controllers/Core/Objects/Shapes/LineShape', () => ({
  LineShape: class {
    constructor(props) {
      this.id = 'ls-' + Math.random();
      this.segments = [{ getAngleWithHorizontal: () => 0, projectionOnSegment: vi.fn(() => ({ x: 0, y: 0 })) }];
    }
  }
}));

vi.mock('@controllers/Core/Objects/Shapes/Shape', () => ({
  Shape: class { }
}));

vi.mock('@controllers/Core/Objects/Segment', () => ({
  Segment: class { }
}));

import { Segment } from '@controllers/Core/Objects/Segment';
import { Shape } from '@controllers/Core/Objects/Shapes/Shape';

describe('ReverseTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    helpConfigRegistry.clear();
    tool = new ReverseTool();
  });

  const createMockCoords = (x, y) => ({
    x, y,
    substract: vi.fn(() => createMockCoords(0, 0)),
    add: vi.fn(() => createMockCoords(0, 0)),
    multiply: vi.fn(() => createMockCoords(0, 0)),
    angleWith: vi.fn(() => 0),
  });

  it('registers help config in start()', () => {
    vi.useFakeTimers();
    tool.start();
    vi.advanceTimersByTime(100);
    expect(helpConfigRegistry.has('reverse')).toBe(true);
    expect(appActions.setActiveTool).toHaveBeenCalledWith('reverse');
    expect(appActions.setToolState).toHaveBeenCalledWith({});
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
    vi.useRealTimers();
  });

  it('handles shape selection and switches to selectAxis', () => {
    const mockShape = new Shape();
    mockShape.id = 's1';
    mockShape.geometryObject = {
      geometryMultipliedChildShapeIds: []
    };
    app.tool.currentStep = 'listen';

    tool.objectSelected(mockShape);

    expect(tool.involvedShapes).toContain(mockShape);
    expect(appActions.setToolState).toHaveBeenCalledWith({
      selectedShapeId: 's1',
    });
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('selectAxis');
    expect(setState).toHaveBeenCalledWith(expect.objectContaining({
      tool: expect.objectContaining({ currentStep: 'selectAxis' })
    }));
  });

  it('handles axis selection and switches to reverse', () => {
    const mockSegment = new Segment();
    mockSegment.getAngleWithHorizontal = vi.fn(() => 0);
    mockSegment.projectionOnSegment = vi.fn(() => ({ x: 0, y: 0 }));

    const mockShapeToMove = {
      segments: [],
      points: [{ coordinates: createMockCoords(0, 0) }],
      reverse: vi.fn()
    };
    tool.shapesToMove = [mockShapeToMove];
    app.tool.currentStep = 'selectAxis';

    tool.objectSelected(mockSegment);

    expect(tool.axisAngle).toBe(0);
    expect(appActions.setToolState).toHaveBeenCalledWith({
      axisAngle: 0,
    });
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('reverse');
    expect(setState).toHaveBeenCalledWith(expect.objectContaining({
      tool: expect.objectContaining({ currentStep: 'reverse' })
    }));
  });
});
