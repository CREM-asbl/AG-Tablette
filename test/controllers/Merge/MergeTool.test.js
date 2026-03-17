import { app, setState } from '@controllers/Core/App';
import { MergeTool } from '@controllers/Merge/MergeTool';
import { helpConfigRegistry } from '@services/HelpConfigRegistry';
import { appActions } from '@store/appState';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
  signal: vi.fn((val) => ({ get: () => val, set: vi.fn() })),
}));

vi.mock('@controllers/Core/App', () => {
  const app = {
    tool: { name: 'merge', currentStep: 'start' },
    mainCanvasLayer: {
      editingShapeIds: [],
    },
    upperCanvasLayer: {
      removeAllObjects: vi.fn(),
    },
    workspace: {
      selectionConstraints: {},
    },
    fastSelectionConstraints: {
      click_all_shape: {},
    },
    addListener: vi.fn(() => 'listener-id'),
    removeListener: vi.fn(),
  };

  return { app, setState: vi.fn() };
});

vi.mock('@store/appState', () => ({
  activeTool: { get: vi.fn(() => 'merge'), set: vi.fn() },
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
    getAllBindedShapes: vi.fn((shape) => [shape]),
  },
}));

vi.mock('@controllers/Core/Objects/Segment', () => ({
  Segment: class { },
}));

vi.mock('@controllers/Core/Tools/general', () => ({
  findObjectById: vi.fn((id) => ({
    id,
    getCommonsCoordinates: vi.fn(() => [{ x: 0, y: 0 }, { x: 1, y: 1 }]),
    overlapsWith: vi.fn(() => false),
  })),
  getAverageColor: vi.fn(() => '#000000'),
}));

describe('MergeTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    helpConfigRegistry.clear();
    app.tool.currentStep = 'start';
    tool = new MergeTool();
  });

  it('registers help config and sets signal state in start()', () => {
    vi.useFakeTimers();

    tool.start();
    vi.advanceTimersByTime(100);

    expect(helpConfigRegistry.has('merge')).toBe(true);
    expect(appActions.setActiveTool).toHaveBeenCalledWith('merge');
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
    expect(setState).toHaveBeenCalledWith({
      tool: { ...app.tool, name: 'merge', currentStep: 'listen' },
    });

    vi.useRealTimers();
  });

  it('switches to selectSecondShape after first selection', () => {
    app.tool.currentStep = 'listen';
    const shape = {
      id: 'shape-1',
      constructor: function MockShape(props) {
        Object.assign(this, props);
      },
      getSVGPath: vi.fn(() => 'M 0 0'),
    };

    tool.objectSelected(shape);

    expect(appActions.setCurrentStep).toHaveBeenCalledWith('selectSecondShape');
    expect(setState).toHaveBeenCalledWith({
      tool: { ...app.tool, currentStep: 'selectSecondShape' },
    });
  });

  it('returns to listen when selecting same shape a second time', () => {
    app.tool.currentStep = 'selectSecondShape';
    tool.firstShapeId = 'shape-1';

    tool.objectSelected({ id: 'shape-1' });

    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
    expect(setState).toHaveBeenCalledWith({
      tool: { ...app.tool, currentStep: 'listen' },
    });
  });

  it('returns to listen after successful executeAction path', () => {
    app.tool.currentStep = 'selectSecondShape';
    tool.firstShapeId = 'shape-1';
    tool.executeAction = vi.fn();

    tool.objectSelected({ id: 'shape-2' });

    expect(tool.executeAction).toHaveBeenCalled();
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
    expect(setState).toHaveBeenCalledWith({
      tool: { ...app.tool, name: 'merge', currentStep: 'listen' },
    });
  });
});
