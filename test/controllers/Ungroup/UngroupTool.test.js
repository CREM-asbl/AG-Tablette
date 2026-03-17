import { setState } from '@controllers/Core/App';
import { UngroupTool } from '@controllers/Ungroup/UngroupTool';
import { appActions } from '@store/appState';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
  signal: vi.fn((val) => ({ get: () => val, set: vi.fn() })),
}));

vi.mock('@controllers/Core/App', () => {
  const setState = vi.fn();
  const app = {
    tool: { name: 'ungroup', currentStep: 'listen' },
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

vi.mock('@controllers/Ungroup/ungroup.helpConfig', () => ({
  ungroupHelpConfig: {},
}));

vi.mock('@controllers/Core/Managers/GroupManager', () => ({
  GroupManager: {
    getShapeGroup: vi.fn(),
    deleteGroup: vi.fn(),
  },
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

describe('UngroupTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    tool = new UngroupTool();
  });

  it('start() déclenche updateToolStep("listen") via setTimeout', () => {
    vi.useFakeTimers();
    tool.start();
    vi.runAllTimers();
    vi.useRealTimers();

    expect(appActions.setActiveTool).toHaveBeenCalledWith('ungroup');
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
    expect(setState).toHaveBeenCalledWith(
      expect.objectContaining({ tool: expect.objectContaining({ currentStep: 'listen' }) }),
    );
  });

  it('objectSelected() avec groupe appelle updateToolStep("listen")', async () => {
    const { GroupManager } = await import('@controllers/Core/Managers/GroupManager');
    const fakeGroup = { shapesIds: ['id1', 'id2'] };
    GroupManager.getShapeGroup.mockReturnValue(fakeGroup);

    const shape = {};
    tool.objectSelected(shape);

    expect(appActions.setActiveTool).not.toHaveBeenCalled();
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
    expect(setState).toHaveBeenCalledWith(
      expect.objectContaining({ tool: expect.objectContaining({ currentStep: 'listen' }) }),
    );
  });

  it('objectSelected() sans groupe ne met pas à jour le state', async () => {
    const { GroupManager } = await import('@controllers/Core/Managers/GroupManager');
    GroupManager.getShapeGroup.mockReturnValue(null);

    tool.objectSelected({});

    expect(appActions.setActiveTool).not.toHaveBeenCalled();
    expect(setState).not.toHaveBeenCalled();
  });
});
