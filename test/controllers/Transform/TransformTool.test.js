import { app, setState } from '@controllers/Core/App';
import { TransformTool } from '@controllers/Transform/TransformTool';
import { helpConfigRegistry } from '@services/HelpConfigRegistry';
import { appActions } from '@store/appState';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
  signal: vi.fn((val) => ({ get: () => val, set: vi.fn() })),
}));

vi.mock('@controllers/Core/App', () => {
  const app = {
    tool: { name: 'transform', currentStep: 'start' },
    mainCanvasLayer: {
      editingShapeIds: [],
    },
    upperCanvasLayer: {
      removeAllObjects: vi.fn(),
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
  activeTool: { get: vi.fn(() => 'transform'), set: vi.fn() },
  currentStep: { get: vi.fn(() => 'start'), set: vi.fn() },
  toolState: { get: vi.fn(() => ({})), set: vi.fn() },
  appActions: {
    setActiveTool: vi.fn(),
    setCurrentStep: vi.fn(),
    setToolState: vi.fn(),
  },
}));

describe('TransformTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    helpConfigRegistry.clear();
    app.tool.currentStep = 'start';
    tool = new TransformTool();
  });

  it('registers help config and sets signal state in start()', () => {
    vi.useFakeTimers();

    tool.start();
    vi.advanceTimersByTime(100);

    expect(helpConfigRegistry.has('transform')).toBe(true);
    expect(appActions.setActiveTool).toHaveBeenCalledWith('transform');
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('selectPoint');
    expect(setState).toHaveBeenCalledWith({
      tool: { ...app.tool, name: 'transform', currentStep: 'selectPoint' },
    });

    vi.useRealTimers();
  });

  it('returns to selectPoint on canvasMouseUp', () => {
    tool.stopAnimation = vi.fn();
    tool.executeAction = vi.fn();

    tool.canvasMouseUp();

    expect(tool.stopAnimation).toHaveBeenCalled();
    expect(tool.executeAction).toHaveBeenCalled();
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('selectPoint');
    expect(setState).toHaveBeenCalledWith({
      tool: { ...app.tool, name: 'transform', currentStep: 'selectPoint' },
    });
  });
});
