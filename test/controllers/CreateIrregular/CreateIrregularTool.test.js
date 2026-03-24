import { app } from '@controllers/Core/App';
import { SelectManager } from '@controllers/Core/Managers/SelectManager';
import { CreateIrregularTool } from '@controllers/CreateIrregular/CreateIrregularTool';
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
    tool: { name: 'createIrregularPolygon', currentStep: 'start' },
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
  activeTool: { get: vi.fn(() => 'createIrregularPolygon') },
  currentStep: { get: vi.fn(() => 'start') },
  selectedTemplate: { get: vi.fn(() => null) },
  toolState: { get: vi.fn(() => ({})) },
  createWatcher: vi.fn(() => vi.fn()),
  appActions: {
    setActiveTool: vi.fn(),
    setToolState: vi.fn(),
    setCurrentStep: vi.fn(),
    addNotification: vi.fn(),
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
    }
  }
}));

vi.mock('@controllers/Core/Objects/Shapes/RegularShape', () => ({
  RegularShape: class {
    constructor() {
      this.vertexes = [];
    }
  }
}));

vi.mock('@controllers/Core/Managers/SelectManager', () => ({
  SelectManager: {
    areCoordinatesInMagnetismDistance: vi.fn(() => false),
    getEmptySelectionConstraints: vi.fn(() => ({ points: {}, segments: {} })),
  },
}));

vi.mock('@controllers/GeometryTools/general', () => ({
  linkNewlyCreatedPoint: vi.fn(),
}));

describe('CreateIrregularTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    helpConfigRegistry.clear();
    tool = new CreateIrregularTool();
  });

  it('registers help config in start()', () => {
    vi.useFakeTimers();
    tool.start();
    vi.advanceTimersByTime(100);
    expect(helpConfigRegistry.has('createIrregularPolygon')).toBe(true);
    expect(appActions.setActiveTool).toHaveBeenCalledWith('createIrregularPolygon');
    expect(appActions.setToolState).toHaveBeenCalledWith({ numberOfPointsDrawn: 0 });
    vi.useRealTimers();
  });

  it('adds points on mouse down', () => {
    tool.start(); // Correctly initialize tool state (points, segments)
    tool.canvasMouseDown();
    expect(tool.points.length).toBe(1);
    expect(tool.numberOfPointsDrawn).toBe(1);
    expect(appActions.setToolState).toHaveBeenCalledWith({ numberOfPointsDrawn: 1 });
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('animatePoint');

    // Add second point
    tool.canvasMouseDown();
    expect(tool.points.length).toBe(2);
    expect(tool.segments.length).toBe(1);
  });

  it('completes shape when clicking near first point', () => {
    tool.start();
    tool.points = [
      { id: 'p1', coordinates: { x: 0, y: 0 } },
      { id: 'p2', coordinates: { x: 100, y: 0 } },
      { id: 'p3', coordinates: { x: 0, y: 100 } },
    ];

    vi.mocked(SelectManager.areCoordinatesInMagnetismDistance).mockReturnValue(true);

    tool.canvasMouseUp();

    expect(app.upperCanvasLayer.removeAllObjects).toHaveBeenCalled();
    expect(appActions.setToolState).toHaveBeenCalledWith({ numberOfPointsDrawn: 0 });
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('start');
  });
});
