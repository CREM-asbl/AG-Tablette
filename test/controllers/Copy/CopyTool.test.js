import { CopyTool } from '@controllers/Copy/CopyTool';
import { app, setState } from '@controllers/Core/App';
import { appActions } from '@store/appState';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
  signal: vi.fn((val) => ({ get: () => val, set: vi.fn() })),
}));

vi.mock('@controllers/Core/App', () => {
  const setState = vi.fn();
  const app = {
    tool: { name: 'copy', currentStep: 'listen' },
    mainCanvasLayer: { shapes: [] },
    upperCanvasLayer: { removeAllObjects: vi.fn() },
    addListener: vi.fn(() => 'listener-id'),
    removeListener: vi.fn(),
    workspace: {
      selectionConstraints: null,
      lastKnownMouseCoordinates: { substract: vi.fn(() => ({ add: vi.fn(() => ({ x: 5, y: 5 })) })) },
    },
  };
  return { app, setState };
});

vi.mock('@store/appState', () => ({
  appActions: {
    setActiveTool: vi.fn(),
    setToolState: vi.fn(),
    setCurrentStep: vi.fn(),
  },
}));

vi.mock('@services/HelpConfigRegistry', () => ({
  helpConfigRegistry: { register: vi.fn() },
}));

vi.mock('@controllers/Copy/copy.helpConfig', () => ({
  copyHelpConfig: {},
}));

vi.mock('@controllers/Core/Managers/GroupManager', () => ({
  GroupManager: { getShapeGroup: vi.fn() },
}));

vi.mock('@controllers/Core/Managers/SelectManager', () => ({
  SelectManager: {
    getEmptySelectionConstraints: vi.fn(() => ({
      eventType: null,
      shapes: { canSelect: false, blacklist: [] },
      segments: { canSelect: false, blacklist: [] },
      priority: [],
    })),
  },
}));

vi.mock('@controllers/Core/Managers/ShapeManager', () => ({
  ShapeManager: {
    getAllBindedShapes: vi.fn(() => []),
    getShapeIndex: vi.fn(() => 0),
  },
}));

vi.mock('@controllers/Core/Objects/Coordinates', () => ({
  Coordinates: class {
    constructor(coords) {
      Object.assign(this, coords);
    }
  },
}));

vi.mock('@controllers/Core/Objects/Segment', () => ({
  Segment: class Segment { },
}));

vi.mock('@controllers/Core/Objects/ShapeGroup', () => ({
  ShapeGroup: class { },
}));

vi.mock('@controllers/Core/Objects/Shapes/GeometryObject', () => ({
  GeometryObject: class { },
}));

vi.mock('@controllers/Core/Objects/Shapes/LineShape', () => ({
  LineShape: class { },
}));

vi.mock('@controllers/Core/Objects/Shapes/SinglePointShape', () => ({
  SinglePointShape: class { },
}));

vi.mock('@controllers/Core/Tools/automatic_adjustment', () => ({
  getShapeAdjustment: vi.fn(),
}));

vi.mock('@controllers/Core/Tools/general', () => ({
  addInfoToId: vi.fn(),
  findObjectById: vi.fn(),
}));

vi.mock('@controllers/GeometryTools/recomputeShape', () => ({
  computeAllShapeTransform: vi.fn(),
}));

vi.mock('@controllers/Core/States/Tool', () => ({
  Tool: class {
    constructor(name, label, type) {
      this.name = name;
      this.label = label;
      this.type = type;
    }
    removeListeners = vi.fn();
    stopAnimation = vi.fn();
    executeAction = vi.fn();
    animate = vi.fn();
  },
}));

describe('CopyTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    tool = new CopyTool();
  });

  it('start() déclenche updateToolStep("listen") via setTimeout', () => {
    vi.useFakeTimers();
    tool.start();
    vi.runAllTimers();
    vi.useRealTimers();

    expect(appActions.setActiveTool).toHaveBeenCalledWith('copy');
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
    expect(setState).toHaveBeenCalledWith(
      expect.objectContaining({ tool: expect.objectContaining({ currentStep: 'listen' }) }),
    );
  });

  it('canvasMouseUp() appelle updateToolStep("listen") en step move', () => {
    app.tool.currentStep = 'move';
    tool.startClickCoordinates = { x: 0, y: 0 };

    tool.canvasMouseUp();

    expect(appActions.setActiveTool).toHaveBeenCalledWith('copy');
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
    expect(setState).toHaveBeenCalledWith(
      expect.objectContaining({ tool: expect.objectContaining({ currentStep: 'listen' }) }),
    );
  });

  it('canvasMouseUp() ne fait rien si currentStep !== "move"', () => {
    app.tool.currentStep = 'listen';

    tool.canvasMouseUp();

    expect(appActions.setActiveTool).not.toHaveBeenCalled();
    expect(setState).not.toHaveBeenCalled();
  });
});
