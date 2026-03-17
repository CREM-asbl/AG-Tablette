import { BuildCenterTool } from '@controllers/BuildCenter/BuildCenterTool';
import { setState } from '@controllers/Core/App';
import { appActions } from '@store/appState';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
  signal: vi.fn((val) => ({ get: () => val, set: vi.fn() })),
}));

vi.mock('@controllers/Core/App', () => {
  const setState = vi.fn();
  const app = {
    tool: { name: 'buildCenter', currentStep: 'listen' },
    mainCanvasLayer: { shapes: [] },
    upperCanvasLayer: { removeAllObjects: vi.fn() },
    addListener: vi.fn(() => 'listener-id'),
    removeListener: vi.fn(),
    workspace: { selectionConstraints: null },
    fastSelectionConstraints: { click_all_shape: {} },
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

vi.mock('@controllers/BuildCenter/buildCenter.helpConfig', () => ({
  buildCenterHelpConfig: {},
}));

vi.mock('@controllers/Core/Managers/ShapeManager', () => ({
  ShapeManager: { getAllBindedShapes: vi.fn(() => [{ name: 'Square', isCenterShown: false }]) },
}));

vi.mock('@controllers/Core/States/Tool', () => ({
  Tool: class {
    constructor(name, label, type) {
      this.name = name;
      this.label = label;
      this.type = type;
    }
    removeListeners = vi.fn();
    executeAction = vi.fn();
  },
}));

describe('BuildCenterTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    tool = new BuildCenterTool();
  });

  it('start() déclenche updateToolStep("listen") via setTimeout', () => {
    vi.useFakeTimers();
    tool.start();
    vi.runAllTimers();
    vi.useRealTimers();

    expect(appActions.setActiveTool).toHaveBeenCalledWith('buildCenter');
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
    expect(setState).toHaveBeenCalledWith(
      expect.objectContaining({ tool: expect.objectContaining({ currentStep: 'listen' }) }),
    );
  });

  it('objectSelected() valide appelle updateToolStep("listen")', () => {
    const shape = { name: 'Square' };
    tool.objectSelected(shape);

    expect(appActions.setActiveTool).toHaveBeenCalledWith('buildCenter');
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
    expect(setState).toHaveBeenCalledWith(
      expect.objectContaining({ tool: expect.objectContaining({ currentStep: 'listen' }) }),
    );
  });
});
