import { app, setState } from '@controllers/Core/App';
import { RotationTool } from '@controllers/Rotation/RotationTool';
import { helpConfigRegistry } from '@services/HelpConfigRegistry';
import { appActions } from '@store/appState';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
  signal: vi.fn((val) => ({ get: () => val, set: vi.fn() })),
}));

vi.mock('@controllers/Core/App', () => {
  const setState = vi.fn();
  const app = {
    tool: { name: 'rotation', currentStep: 'start' },
    settings: {
      geometryTransformationAnimation: false,
      geometryTransformationAnimationDuration: 0.2,
      referenceDrawColor: '#00ff00',
      referenceDrawColor2: '#0000ff',
    },
    workspace: {
      lastKnownMouseCoordinates: { x: 10, y: 10 },
      selectionConstraints: {},
      rotationLastCharacteristicElements: [],
      ensureCharacteristicElementsFromShapes: vi.fn(),
    },
    fastSelectionConstraints: {
      mousedown_all_shape: { shapes: { blacklist: [] } },
    },
    mainCanvasLayer: {
      shapes: [],
      editingShapeIds: [],
    },
    upperCanvasLayer: {
      shapes: [],
      points: [],
      removeAllObjects: vi.fn(),
    },
    addListener: vi.fn(() => 'listener-id'),
    removeListener: vi.fn(),
  };

  return { app, setState };
});

vi.mock('@store/appState', () => ({
  activeTool: { get: vi.fn(() => 'rotation'), set: vi.fn() },
  currentStep: { get: vi.fn(() => 'start'), set: vi.fn() },
  selectedTemplate: { get: vi.fn(() => null), set: vi.fn() },
  toolState: { get: vi.fn(() => ({})), set: vi.fn() },
  createWatcher: vi.fn(() => vi.fn()),
  appActions: {
    setActiveTool: vi.fn(),
    setCurrentStep: vi.fn(),
    setToolState: vi.fn(),
  },
}));

vi.mock('@controllers/Core/Objects/CharacteristicElements', () => ({
  CharacteristicElements: class MockCharacteristicElements {
    constructor({ type, elementIds = [] } = {}) {
      this.type = type;
      this.elementIds = [...elementIds];
    }

    get firstElement() {
      return null;
    }
  },
}));

vi.mock('@controllers/Core/Objects/Point', () => ({
  Point: class MockPoint {
    static nextId = 0;

    constructor({ coordinates, layer, color, size }) {
      this.id = `point-${MockPoint.nextId++}`;
      this.coordinates = coordinates;
      this.layer = layer;
      this.color = color;
      this.size = size;
    }
  },
}));

vi.mock('@controllers/Core/Objects/Segment', () => ({
  Segment: class MockSegment { },
}));

vi.mock('@controllers/Core/Objects/Shapes/ArrowLineShape', () => ({
  ArrowLineShape: class MockArrowLineShape {
    constructor() {
      this.id = 'arrow-shape';
      this.segments = [{ arcCenter: { coordinates: { angleWith: () => 0 } } }];
      this.vertexes = [{ coordinates: { x: 0, y: 0 } }, { coordinates: { x: 0, y: 0 } }];
    }
  },
}));

vi.mock('@controllers/Core/Objects/Shapes/GeometryObject', () => ({
  GeometryObject: class MockGeometryObject {
    constructor(data = {}) {
      Object.assign(this, data);
    }
  },
}));

vi.mock('@controllers/Core/Objects/Shapes/SinglePointShape', () => ({
  SinglePointShape: class MockSinglePointShape { },
}));

vi.mock('@controllers/Core/Managers/GroupManager', () => ({
  GroupManager: {
    addGroup: vi.fn(),
  },
}));

vi.mock('@controllers/Core/Managers/SelectManager', () => ({
  SelectManager: {
    selectObject: vi.fn(() => null),
  },
}));

vi.mock('@controllers/Core/Managers/ShapeManager', () => ({
  ShapeManager: {
    getAllBindedShapes: vi.fn(() => []),
  },
}));

vi.mock('@controllers/Core/Tools/general', () => ({
  findObjectById: vi.fn(() => null),
  removeObjectById: vi.fn(),
}));

vi.mock('@controllers/Core/Tools/geometry', () => ({
  isAngleBetweenTwoAngles: vi.fn(() => true),
}));

describe('RotationTool controller migration', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    helpConfigRegistry.clear();
    app.tool = { name: 'rotation', currentStep: 'start' };
    tool = new RotationTool();
  });

  it('registre l’aide et active le store signal dans start()', () => {
    vi.useFakeTimers();

    tool.start();
    vi.advanceTimersByTime(100);

    expect(helpConfigRegistry.has('rotation')).toBe(true);
    expect(appActions.setActiveTool).toHaveBeenCalledWith('rotation');
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('selectFirstReference');
    expect(appActions.setToolState).toHaveBeenCalledWith({
      clockwise: undefined,
      numberOfPointsDrawn: 0,
      referenceShapeId: undefined,
    });

    vi.useRealTimers();
  });

  it('propage la transition vers selectReference via les signaux', () => {
    vi.useFakeTimers();

    tool.selectFirstReference();
    vi.advanceTimersByTime(100);

    expect(app.upperCanvasLayer.removeAllObjects).toHaveBeenCalled();
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('selectReference');
    expect(appActions.setToolState).toHaveBeenCalledWith({
      clockwise: undefined,
      numberOfPointsDrawn: 0,
      referenceShapeId: undefined,
    });

    vi.useRealTimers();
  });

  it('met à jour le store signal quand un premier point de référence est posé', () => {
    tool.pointsDrawn = [];

    tool.canvasMouseDown();

    expect(tool.pointsDrawn).toHaveLength(1);
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('animateRefPoint');
    expect(appActions.setToolState).toHaveBeenCalledWith({
      numberOfPointsDrawn: 1,
    });
    expect(setState).toHaveBeenCalledWith({
      tool: expect.objectContaining({
        name: 'rotation',
        currentStep: 'animateRefPoint',
        numberOfPointsDrawn: 1,
      }),
    });
  });
});