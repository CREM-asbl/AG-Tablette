import { app, setState } from '@controllers/Core/App';
import { CutTool } from '@controllers/Cut/CutTool';
import { helpConfigRegistry } from '@services/HelpConfigRegistry';
import { appActions } from '@store/appState';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
  signal: vi.fn((val) => ({ get: () => val, set: vi.fn() })),
}));

vi.mock('@controllers/Core/App', () => {
  const app = {
    tool: { name: 'cut', currentStep: 'start' },
    environment: { name: 'Classique' },
    upperCanvasLayer: {
      removeAllObjects: vi.fn(),
    },
    mainCanvasLayer: {
      shapes: [],
    },
    workspace: {
      selectionConstraints: {
        points: {},
      },
    },
    addListener: vi.fn(() => 'listener-id'),
    removeListener: vi.fn(),
  };

  return { app, setState: vi.fn() };
});

vi.mock('@store/appState', () => ({
  activeTool: { get: vi.fn(() => 'cut'), set: vi.fn() },
  currentStep: { get: vi.fn(() => 'start'), set: vi.fn() },
  toolState: { get: vi.fn(() => ({})), set: vi.fn() },
  appActions: {
    setActiveTool: vi.fn(),
    setCurrentStep: vi.fn(),
    setToolState: vi.fn(),
  },
}));

vi.mock('@controllers/Core/Objects/Point', () => ({
  Point: class {
    constructor() { }
  },
}));

vi.mock('@controllers/Core/Objects/Segment', () => ({
  Segment: class {
    constructor() { }
  },
}));

vi.mock('@controllers/Core/Objects/Coordinates', () => ({
  Coordinates: class {
    constructor(coords) {
      Object.assign(this, coords);
    }
  },
}));

vi.mock('@controllers/Core/Objects/Shapes/GeometryObject', () => ({
  GeometryObject: class {
    constructor(props) {
      Object.assign(this, props);
    }
  },
}));

vi.mock('@controllers/Core/Tools/general', () => ({
  findObjectById: vi.fn(() => null),
}));

describe('CutTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    helpConfigRegistry.clear();
    app.tool.currentStep = 'start';
    tool = new CutTool();
  });

  it('registers help config and sets signal state in start()', () => {
    vi.useFakeTimers();

    tool.start();
    vi.advanceTimersByTime(100);

    expect(helpConfigRegistry.has('cut')).toBe(true);
    expect(appActions.setActiveTool).toHaveBeenCalledWith('cut');
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
    expect(setState).toHaveBeenCalledWith({
      tool: { ...app.tool, name: 'cut', currentStep: 'listen' },
    });

    vi.useRealTimers();
  });

  it('returns to listen step after executeAnimation()', () => {
    vi.useFakeTimers();
    tool.executeAction = vi.fn();

    tool.executeAnimation();
    vi.advanceTimersByTime(250);

    expect(tool.executeAction).toHaveBeenCalled();
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
    expect(setState).toHaveBeenCalledWith({
      tool: {
        ...app.tool,
        name: 'cut',
        currentStep: 'listen',
        firstPointId: undefined,
        secondPointId: undefined,
        centerPointId: undefined,
      },
    });

    vi.useRealTimers();
  });
});
