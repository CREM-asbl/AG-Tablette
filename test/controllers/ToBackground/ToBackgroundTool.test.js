import { app, setState } from '@controllers/Core/App';
import { ToBackgroundTool } from '@controllers/ToBackground/ToBackgroundTool';
import { helpConfigRegistry } from '@services/HelpConfigRegistry';
import { appActions } from '@store/appState';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
  signal: vi.fn((val) => ({ get: () => val, set: vi.fn() })),
}));

vi.mock('@controllers/Core/App', () => {
  const app = {
    tool: { name: 'toBackground', currentStep: 'start' },
    workspace: {
      selectionConstraints: {},
    },
    fastSelectionConstraints: {
      click_all_shape: {},
    },
    mainCanvasLayer: {
      shapes: [],
    },
    addListener: vi.fn(() => 'listener-id'),
    removeListener: vi.fn(),
  };

  return { app, setState: vi.fn() };
});

vi.mock('@store/appState', () => ({
  activeTool: { get: vi.fn(() => 'toBackground'), set: vi.fn() },
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
    getShapeIndex: vi.fn(() => 0),
  },
}));

vi.mock('@controllers/Core/Tools/general', () => ({
  findIndexById: vi.fn(() => 0),
}));

describe('ToBackgroundTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    helpConfigRegistry.clear();
    app.tool.currentStep = 'start';
    tool = new ToBackgroundTool();
  });

  it('registers help config and sets signal state in start()', () => {
    vi.useFakeTimers();

    tool.start();
    vi.advanceTimersByTime(100);

    expect(helpConfigRegistry.has('toBackground')).toBe(true);
    expect(appActions.setActiveTool).toHaveBeenCalledWith('toBackground');
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
    expect(setState).toHaveBeenCalledWith({
      tool: { ...app.tool, name: 'toBackground', currentStep: 'listen' },
    });

    vi.useRealTimers();
  });

  it('keeps listen step after object selection', () => {
    tool.executeAction = vi.fn();

    tool.objectSelected({ id: 'shape-1' });

    expect(tool.executeAction).toHaveBeenCalled();
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
  });
});
