import { BifaceTool } from '@controllers/Biface/BifaceTool';
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
    tool: { name: 'biface', currentStep: 'listen' },
    mainCanvasLayer: { shapes: [] },
    upperCanvasLayer: { removeAllObjects: vi.fn() },
    addListener: vi.fn(() => 'listener-id'),
    removeListener: vi.fn(),
    workspace: { selectionConstraints: null, lastKnownMouseCoordinates: { x: 0, y: 0 } },
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

vi.mock('@controllers/Biface/biface.helpConfig', () => ({
  bifaceHelpConfig: {},
}));

vi.mock('@controllers/Core/Managers/ShapeManager', () => ({
  ShapeManager: { getAllBindedShapes: vi.fn(() => []) },
}));

vi.mock('@controllers/Core/Objects/Text', () => ({
  Text: class { },
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
  },
}));

describe('BifaceTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    tool = new BifaceTool();
  });

  it('start() déclenche updateToolStep("listen") via setTimeout', () => {
    vi.useFakeTimers();
    tool.start();
    vi.runAllTimers();
    vi.useRealTimers();

    expect(appActions.setActiveTool).toHaveBeenCalledWith('biface');
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
    expect(setState).toHaveBeenCalledWith(
      expect.objectContaining({ tool: expect.objectContaining({ currentStep: 'listen' }) }),
    );
  });

  it('objectSelected() après action appelle updateToolStep("listen")', () => {
    const shape = {};
    tool.objectSelected(shape);

    expect(appActions.setActiveTool).not.toHaveBeenCalled();
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
    expect(setState).toHaveBeenCalledWith(
      expect.objectContaining({ tool: expect.objectContaining({ currentStep: 'listen' }) }),
    );
  });
});
