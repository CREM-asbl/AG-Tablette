import { app } from '@controllers/Core/App';
import { CreateCircleTool } from '@controllers/CreateCircle/CreateCircleTool';
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
    tool: { name: 'createCircle', currentStep: 'start', selectedTemplate: { name: 'Circle' } },
    environment: { name: 'Geometrie' },
    upperCanvasLayer: {
      removeAllObjects: vi.fn(),
    },
    workspace: {
      lastKnownMouseCoordinates: { x: 10, y: 10 },
    },
    settings: {
      temporaryDrawColor: '#ff0000',
    },
    addListener: vi.fn(() => 'listener-id'),
    removeListener: vi.fn(),
  };
  return { app, setState };
});

vi.mock('@store/appState', () => ({
  activeTool: { get: vi.fn(() => 'createCircle') },
  currentStep: { get: vi.fn(() => 'start') },
  selectedTemplate: { get: vi.fn(() => ({ name: 'Circle' })) },
  toolState: { get: vi.fn(() => ({})) },
  createWatcher: vi.fn(() => vi.fn()),
  appActions: {
    setToolUiState: vi.fn(),
    setActiveTool: vi.fn(),
    setCurrentStep: vi.fn(),
    setToolState: vi.fn(),
    setSelectedTemplate: vi.fn(),
  },
}));

vi.mock('@controllers/Core/Objects/Point', () => ({
  Point: class {
    constructor(props) {
      this.id = 'p' + Math.random();
      this.coordinates = props.coordinates;
    }
  }
}));

vi.mock('@controllers/Core/Objects/Segment', () => ({
  Segment: class {
    constructor(props) {
      this.id = 'seg' + Math.random();
      this.vertexIds = props.vertexIds;
      this.arcCenter = { id: props.arcCenterId };
    }
  }
}));

vi.mock('@controllers/Core/Objects/Shapes/RegularShape', () => ({
  RegularShape: class {
    constructor() {
      this.id = 's' + Math.random();
      this.vertexes = [{}];
      this.segments = [{}];
      this.getSVGPath = () => 'M 0 0';
    }
  }
}));

vi.mock('@controllers/Core/Objects/Shapes/LineShape', () => ({
  LineShape: class {
    constructor() {
      this.id = 'ls' + Math.random();
      this.getSVGPath = () => 'M 0 0';
    }
  }
}));

vi.mock('@controllers/Core/Objects/Shapes/ArrowLineShape', () => ({
  ArrowLineShape: class {
    constructor() {
      this.id = 'as' + Math.random();
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
    }
  }
}));

vi.mock('@controllers/Core/Managers/SelectManager', () => ({
  SelectManager: {
    areCoordinatesInMagnetismDistance: vi.fn(() => false),
    getEmptySelectionConstraints: vi.fn(() => ({ points: {}, segments: {} })),
  },
}));

vi.mock('@controllers/Core/Tools/geometry', () => ({
  isAngleBetweenTwoAngles: vi.fn(() => true),
}));

vi.mock('@controllers/GeometryTools/general', () => ({
  linkNewlyCreatedPoint: vi.fn(),
}));

vi.mock('@controllers/GeometryTools/recomputeShape', () => ({
  computeConstructionSpec: vi.fn(),
}));

describe('CreateCircleTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    helpConfigRegistry.clear();
    app.tool.selectedTemplate = { name: 'Circle' };
    tool = new CreateCircleTool();
  });

  const createMockCoords = (x, y) => ({
    x, y,
    angleWith: vi.fn(() => 0),
    dist: vi.fn(() => 10),
    substract: vi.fn(() => createMockCoords(0, 0)),
    add: vi.fn(() => createMockCoords(0, 0)),
    multiply: vi.fn(() => createMockCoords(0, 0)),
  });

  it('registers help config in start()', () => {
    tool.start();
    expect(helpConfigRegistry.has('createCircle')).toBe(true);
    expect(appActions.setActiveTool).toHaveBeenCalledWith('createCircle');
  });

  it('handles circle creation step by step', async () => {
    await tool.drawFirstPoint(); // Initialize segments etc.
    app.tool.currentStep = 'drawPoint';
    tool.getConstraints(0);

    app.workspace.lastKnownMouseCoordinates = createMockCoords(0, 0);

    // First point
    tool.canvasMouseDown();
    expect(tool.numberOfPointsDrawn).toBe(1);
    expect(appActions.setToolState).toHaveBeenCalledWith({
      numberOfPointsDrawn: 1,
    });

    app.tool.currentStep = 'animatePoint';
    tool.canvasMouseUp();
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('drawPoint');

    // Second point
    app.tool.currentStep = 'drawPoint';
    app.workspace.lastKnownMouseCoordinates = createMockCoords(100, 0);
    tool.canvasMouseDown();
    expect(tool.numberOfPointsDrawn).toBe(2);
    expect(tool.segments.length).toBe(1);
    expect(appActions.setToolState).toHaveBeenCalledWith({
      numberOfPointsDrawn: 2,
    });

    app.tool.currentStep = 'animatePoint';
    tool.canvasMouseUp();
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('drawFirstPoint');
  });

  it('handles CirclePart with direction selection', async () => {
    await tool.drawFirstPoint();
    app.tool.selectedTemplate.name = 'CirclePart';
    tool.points = [
      { coordinates: createMockCoords(0, 0) },
      { coordinates: createMockCoords(100, 0) },
      { coordinates: createMockCoords(0, 100) }
    ];
    tool.numberOfPointsDrawn = 3;
    app.tool.currentStep = 'animatePoint';

    tool.canvasMouseUp();
    expect(appActions.setToolState).toHaveBeenCalledWith({
      numberOfPointsDrawn: 3,
    });
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('showArrow');

    // Select direction
    app.workspace.lastKnownMouseCoordinates = createMockCoords(50, 50);
    tool.canvasClick();
    expect(tool.clockwise).toBe(true);
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('drawFirstPoint');
  });
});
