import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TranslationTool } from '../../../src/controllers/Translation/TranslationTool';
import { helpConfigRegistry } from '../../../src/services/HelpConfigRegistry';
import { app } from '../../../src/controllers/Core/App';
import { appActions } from '../../../src/store/appState';
import { SelectManager } from '../../../src/controllers/Core/Managers/SelectManager';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
  signal: vi.fn((val) => ({ get: () => val, set: vi.fn() })),
}));

vi.mock('../../../src/controllers/Core/App', () => {
  const createMockCoords = (x, y) => ({
    x,
    y,
    substract: vi.fn(() => createMockCoords(0, 0)),
    add: vi.fn(() => createMockCoords(0, 0)),
    multiply: vi.fn(() => createMockCoords(0, 0)),
  });

  const app = {
    tool: { name: 'translation', currentStep: 'start', referenceShapeId: 'ref-shape' },
    settings: {
      geometryTransformationAnimation: false,
      referenceDrawColor: '#00ff00',
    },
    workspace: {
      lastKnownMouseCoordinates: createMockCoords(10, 10),
      selectionConstraints: { points: {}, shapes: {}, segments: {} },
      translationLastCharacteristicElements: [],
    },
    upperCanvasLayer: {
      removeAllObjects: vi.fn(),
      shapes: [],
      points: [],
    },
    mainCanvasLayer: {
      shapes: [],
    },
    fastSelectionConstraints: {
      mousedown_all_shape: { shapes: {} },
    },
    addListener: vi.fn(() => 'listener-id'),
    removeListener: vi.fn(),
  };

  return { app, setState: vi.fn() };
});

vi.mock('../../../src/store/appState', () => ({
  activeTool: { get: vi.fn(() => 'translation') },
  currentStep: { get: vi.fn(() => 'start') },
  toolState: { get: vi.fn(() => ({})) },
  createWatcher: vi.fn(() => vi.fn()),
  appActions: {
    setActiveTool: vi.fn(),
    setCurrentStep: vi.fn(),
    setToolState: vi.fn(),
  },
}));

vi.mock('../../../src/controllers/Core/Managers/SelectManager', () => ({
  SelectManager: {
    selectObject: vi.fn(),
  },
}));

vi.mock('../../../src/controllers/Core/Managers/ShapeManager', () => ({
  ShapeManager: {
    getAllBindedShapes: vi.fn((s) => [s]),
  },
}));

vi.mock('../../../src/controllers/Core/Objects/Point', () => ({
  Point: class {
    constructor(props) {
      this.id = 'p-' + Math.random();
      this.coordinates = props.coordinates;
      this.layer = props.layer;
    }
  },
}));

vi.mock('../../../src/controllers/Core/Objects/Segment', () => ({
  Segment: class {
    constructor(props) {
      this.id = 'seg-' + Math.random();
      this.vertexIds = props.vertexIds;
    }
  },
}));

vi.mock('../../../src/controllers/Core/Objects/Shapes/ArrowLineShape', () => ({
  ArrowLineShape: class {
    constructor() {
      this.id = 'arrow-' + Math.random();
      this.points = [{ coordinates: { x: 0, y: 0 } }, { coordinates: { x: 10, y: 0 } }];
      this.segments = [{ points: this.points }];
    }
  },
}));

vi.mock('../../../src/controllers/Core/Objects/CharacteristicElements', () => ({
  CharacteristicElements: class {
    constructor(props) {
      this.type = props.type;
      this.elementIds = props.elementIds;
    }
    equal() {
      return false;
    }
  },
}));

vi.mock('../../../src/controllers/Core/Objects/Shapes/SinglePointShape', () => ({
  SinglePointShape: class {
    constructor() {
      this.points = [{ id: 'sp-1' }];
    }
  },
}));

vi.mock('../../../src/controllers/Core/Objects/Shapes/GeometryObject', () => ({
  GeometryObject: class {
    constructor(props) {
      Object.assign(this, props);
    }
  },
}));

vi.mock('../../../src/controllers/Core/Tools/general', () => ({
  findObjectById: vi.fn(() => null),
  removeObjectById: vi.fn(),
}));

vi.mock('../../../src/controllers/Core/Managers/GroupManager', () => ({
  GroupManager: {
    addGroup: vi.fn(),
  },
}));

describe('TranslationTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    helpConfigRegistry.clear();
    app.tool.currentStep = 'start';
    tool = new TranslationTool();
  });

  it('registers help config and activates tool in start()', () => {
    vi.useFakeTimers();

    tool.start();
    vi.advanceTimersByTime(100);

    expect(helpConfigRegistry.has('translation')).toBe(true);
    expect(appActions.setActiveTool).toHaveBeenCalledWith('translation');
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('selectFirstReference');
    vi.useRealTimers();
  });

  it('creates first reference point and switches to animateFirstRefPoint', () => {
    SelectManager.selectObject.mockReturnValue(null);
    tool.pointsDrawn = [];

    tool.canvasMouseDown();

    expect(tool.pointsDrawn.length).toBe(1);
    expect(appActions.setToolState).toHaveBeenCalledWith({ numberOfPointsDrawn: 1 });
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('animateFirstRefPoint');
  });

  it('switches to trans when selecting an object to translate', () => {
    const mockShape = {
      id: 'shape-1',
      constructor: function (props) {
        Object.assign(this, props);
      },
      getSVGPath: () => 'M 0 0',
      segments: [],
      vertexes: [],
    };

    tool.pointsDrawn = [{ id: 'p1' }, { id: 'p2' }];
    tool.objectSelected(mockShape);

    expect(tool.involvedShapes).toContain(mockShape);
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('trans');
  });
});
