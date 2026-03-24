import { app, setState } from '@controllers/Core/App';
import { OpacityTool } from '@controllers/Opacity/OpacityTool';
import { helpConfigRegistry } from '@services/HelpConfigRegistry';
import { appActions } from '@store/appState';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
  signal: vi.fn((val) => ({ get: () => val, set: vi.fn() })),
}));

vi.mock('@controllers/Core/App', () => {
  const app = {
    tool: { name: 'opacity', currentStep: 'start' },
    settings: { shapeOpacity: 0.7 },
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
  activeTool: { get: vi.fn(() => 'opacity'), set: vi.fn() },
  currentStep: { get: vi.fn(() => 'start'), set: vi.fn() },
  toolState: { get: vi.fn(() => ({})), set: vi.fn() },
  appActions: {
    setActiveTool: vi.fn(),
    setCurrentStep: vi.fn(),
    setToolState: vi.fn(),
    updateSettings: vi.fn(),
  },
}));

vi.mock('@controllers/Core/Managers/ShapeManager', () => ({
  ShapeManager: {
    getAllBindedShapes: vi.fn((shape) => [shape]),
  },
}));

vi.mock('@controllers/Core/Tools/general', () => ({
  createElem: vi.fn(),
}));

describe('OpacityTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    helpConfigRegistry.clear();
    app.tool.currentStep = 'start';
    tool = new OpacityTool();
  });

  it('registers help config and activates tool in start()', () => {
    tool.start();

    expect(helpConfigRegistry.has('opacity')).toBe(true);
    expect(appActions.setActiveTool).toHaveBeenCalledWith('opacity');
  });

  it('returns to selectObject after object selection', () => {
    app.tool.currentStep = 'selectObject';
    tool.executeAction = vi.fn();

    tool.objectSelected({ id: 'shape-1' });

    expect(tool.executeAction).toHaveBeenCalled();
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('selectObject');
    expect(setState).toHaveBeenCalledWith({
      tool: { ...app.tool, name: 'opacity', currentStep: 'selectObject' },
    });
  });
});
