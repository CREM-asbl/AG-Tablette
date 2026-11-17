import { app } from '@controllers/Core/App';
import { CreateLineTool } from '@controllers/CreateLine/CreateLineTool';
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
    tool: { name: 'createLine', currentStep: 'start', selectedTemplate: { name: 'Segment' } },
    upperCanvasLayer: {
      removeAllObjects: vi.fn(),
    },
    workspace: {
      lastKnownMouseCoordinates: { x: 10, y: 10 },
      selectionConstraints: {},
    },
    fastSelectionConstraints: {
      click_all_segments: {},
    },
    settings: {
      temporaryDrawColor: '#ff0000',
      referenceDrawColor: '#00ff00',
    },
    addListener: vi.fn(() => 'listener-id'),
    removeListener: vi.fn(),
  };
  return { app, setState };
});

vi.mock('@store/appState', () => ({
  activeTool: { get: vi.fn(() => 'createLine') },
  currentStep: { get: vi.fn(() => 'start') },
  selectedTemplate: { get: vi.fn(() => ({ name: 'Segment' })) },
  toolState: { get: vi.fn(() => ({})) },
  createWatcher: vi.fn(() => vi.fn()),
  appActions: {
    setToolUiState: vi.fn(),
    setActiveTool: vi.fn(),
    setToolState: vi.fn(),
    setCurrentStep: vi.fn(),
    addNotification: vi.fn(),
  },
}));

vi.mock('@controllers/Core/Objects/Point', () => ({
  Point: class {
    constructor(props) {
      this.id = 'p-' + Math.random();
      this.coordinates = props.coordinates;
      this.adjustedOn = null;
    }
  }
}));

vi.mock('@controllers/Core/Objects/Coordinates', () => ({
  Coordinates: class {
    constructor(c) {
      this.x = c.x;
      this.y = c.y;
    }
    toCanvasCoordinates() {
      return { x: this.x, y: this.y, fromCanvasCoordinates: () => this };
    }
  }
}));

vi.mock('@controllers/Core/Objects/Segment', () => ({
  Segment: class {
    constructor(props) {
      this.id = 'seg-' + Math.random();
      this.vertexes = [{ coordinates: { x: 0, y: 0 } }, { coordinates: { x: 10, y: 0 } }];
      this.shape = { geometryObject: { geometryChildShapeIds: [] } };
      this.vertexIds = props.vertexIds;
      this.isArc = () => false;
    }
  }
}));

vi.mock('@controllers/Core/Objects/Shapes/LineShape', () => ({
  LineShape: class {
    constructor() {
      this.id = 'line-' + Math.random();
      this.segments = [{}];
      this.vertexes = [{}, {}];
    }
  }
}));

vi.mock('@controllers/Core/Objects/Shapes/ArrowLineShape', () => ({
  ArrowLineShape: class {
    constructor() {
      this.id = 'arrow-' + Math.random();
      this.segments = [{}];
      this.vertexes = [{}, {}];
    }
  }
}));

vi.mock('@controllers/Core/Objects/Shapes/StripLineShape', () => ({
  StripLineShape: class {
    constructor() {
      this.id = 'strip-' + Math.random();
      this.segments = [{}, {}];
      this.vertexes = [{}, {}, {}, {}];
      this.points = [{}, {}, {}, {}];
    }
  }
}));

vi.mock('@controllers/Core/Objects/Shapes/GeometryObject', () => ({
  GeometryObject: class {
    constructor() {
      this.geometryChildShapeIds = [];
    }
  }
}));

vi.mock('@controllers/Core/Objects/GeometryConstraint', () => ({
  GeometryConstraint: class {
    constructor(type) {
      this.type = type;
      this.isFree = type === 'isFree';
      this.segments = [{ isParalleleWith: () => false }];
    }
    projectionOnConstraints(c) {
      return c;
    }
  }
}));

vi.mock('@controllers/Core/Managers/SelectManager', () => ({
  SelectManager: {
    areCoordinatesInMagnetismDistance: vi.fn(() => false),
    getEmptySelectionConstraints: vi.fn(() => ({ points: {}, segments: {} })),
    selectPoint: vi.fn(() => null),
    selectSegment: vi.fn(() => null),
  },
}));

vi.mock('@controllers/Core/Tools/general', () => ({
  findObjectById: vi.fn(() => ({
    vertexes: [{ coordinates: { x: 0, y: 0 } }, { coordinates: { x: 10, y: 0 } }],
    shape: { geometryObject: { geometryChildShapeIds: [] } },
    getAngleWithHorizontal: () => 0,
  })),
}));

vi.mock('@controllers/GeometryTools/general', () => ({
  linkNewlyCreatedPoint: vi.fn(),
}));

vi.mock('@controllers/GeometryTools/recomputeShape', () => ({
  computeConstructionSpec: vi.fn(),
}));

describe('CreateLineTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    helpConfigRegistry.clear();
    app.tool.selectedTemplate = { name: 'Segment' };
    app.tool.currentStep = 'start';
    tool = new CreateLineTool();
  });

  it('registers help config and updates UI state in start()', async () => {
    await tool.start();
    expect(helpConfigRegistry.has('createLine')).toBe(true);
    expect(appActions.setActiveTool).toHaveBeenCalledWith('createLine');
    expect(appActions.setToolUiState).toHaveBeenCalled();
  });

  it('transitions to drawPoint for standard line templates', () => {
    vi.useFakeTimers();
    app.tool.selectedTemplate = { name: 'Segment' };

    tool.drawFirstPoint();
    vi.advanceTimersByTime(100);

    expect(appActions.setToolState).toHaveBeenCalledWith({ numberOfPointsDrawn: 0 });
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('drawPoint');
    vi.useRealTimers();
  });

  it('transitions to selectReference for constrained templates', () => {
    vi.useFakeTimers();
    app.tool.selectedTemplate = { name: 'ParalleleSegment' };

    tool.drawFirstPoint();
    vi.advanceTimersByTime(100);

    expect(appActions.setCurrentStep).toHaveBeenCalledWith('selectReference');
    vi.useRealTimers();
  });

  it('switches to animatePoint after first click in drawPoint', () => {
    app.tool.currentStep = 'drawPoint';
    app.tool.selectedTemplate = { name: 'Segment' };
    tool.getConstraints(0);

    tool.canvasMouseDown();

    expect(appActions.setToolState).toHaveBeenCalledWith({ numberOfPointsDrawn: 1 });
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('animatePoint');
  });
});
