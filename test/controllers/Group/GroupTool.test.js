import { app, setState } from '@controllers/Core/App';
import { GroupTool } from '@controllers/Group/GroupTool';
import { appActions } from '@store/appState';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
  signal: vi.fn((val) => ({ get: () => val, set: vi.fn() })),
}));

vi.mock('@controllers/Core/App', () => {
  const setState = vi.fn();
  const app = {
    tool: { name: 'group', currentStep: 'listen' },
    mainCanvasLayer: { shapes: [] },
    upperCanvasLayer: { removeAllObjects: vi.fn() },
    addListener: vi.fn(() => 'listener-id'),
    removeListener: vi.fn(),
    nextGroupColorIdx: 0,
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

vi.mock('@controllers/Group/group.helpConfig', () => ({
  groupHelpConfig: {},
}));

vi.mock('@controllers/Core/Managers/GroupManager', () => ({
  GroupManager: {
    getShapeGroup: vi.fn(),
    getGroupIndex: vi.fn(() => 0),
    addGroup: vi.fn(),
    deleteGroup: vi.fn(),
  },
}));

vi.mock('@controllers/Core/Objects/ShapeGroup', () => ({
  ShapeGroup: class {
    constructor(id1, id2) {
      this.shapesIds = [id1, id2];
    }
    addShape = vi.fn();
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

describe('GroupTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    tool = new GroupTool();
  });

  it('start() déclenche updateToolStep("listen") et listen()', () => {
    tool.listen = vi.fn();
    tool.start();

    expect(appActions.setActiveTool).toHaveBeenCalledWith('group');
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
    expect(tool.listen).toHaveBeenCalled();
  });

  it('objectSelected() en step listen avec groupe existant → fillGroup', async () => {
    const { GroupManager } = await import('@controllers/Core/Managers/GroupManager');
    const fakeGroup = { shapesIds: ['id1'] };
    GroupManager.getShapeGroup.mockReturnValue(fakeGroup);
    app.tool.currentStep = 'listen';

    tool.objectSelected({ id: 'id1' });

    expect(appActions.setCurrentStep).toHaveBeenCalledWith('fillGroup');
  });

  it('objectSelected() en step listen sans groupe → selectSecondShape', async () => {
    const { GroupManager } = await import('@controllers/Core/Managers/GroupManager');
    GroupManager.getShapeGroup.mockReturnValue(null);
    app.tool.currentStep = 'listen';

    const mockShape = {
      id: 'shape1',
      constructor: vi.fn(),
      getSVGPath: vi.fn(() => 'M 0 0'),
      divisionPoints: [],
      points: [],
    };

    tool.objectSelected(mockShape);

    expect(appActions.setCurrentStep).toHaveBeenCalledWith('selectSecondShape');
  });

  it('objectSelected() en step fillGroup appelle updateToolStep("fillGroup")', async () => {
    const { GroupManager } = await import('@controllers/Core/Managers/GroupManager');
    GroupManager.getShapeGroup.mockReturnValue(null); // pas dans autre groupe
    app.tool.currentStep = 'fillGroup';
    tool.group = { shapesIds: [], addShape: vi.fn() };

    tool.objectSelected({ id: 'id2' });

    expect(appActions.setCurrentStep).toHaveBeenCalledWith('fillGroup');
  });
});
