import { app, setState } from '@controllers/Core/App';
import { HideTool } from '@controllers/Hide/HideTool';
import { helpConfigRegistry } from '@services/HelpConfigRegistry';
import { appActions } from '@store/appState';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
  signal: vi.fn((val) => ({ get: () => val, set: vi.fn() })),
}));

vi.mock('@controllers/Core/App', () => {
  const app = {
    tool: { name: 'hide', currentStep: 'start' },
    workspace: {
      selectionConstraints: {
        shapes: {},
        points: {},
      },
    },
    mainCanvasLayer: {
      shapes: [],
      editingShapeIds: [],
    },
    upperCanvasLayer: {
      removeAllObjects: vi.fn(),
    },
    addListener: vi.fn(() => 'listener-id'),
    removeListener: vi.fn(),
  };

  return { app, setState: vi.fn() };
});

vi.mock('@store/appState', () => ({
  activeTool: { get: vi.fn(() => 'hide'), set: vi.fn() },
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
    getAllBindedShapes: vi.fn(() => []),
  },
}));

vi.mock('@controllers/Core/Objects/Shapes/Shape', () => ({
  Shape: class { },
}));

vi.mock('@controllers/Core/Objects/Shapes/SinglePointShape', () => ({
  SinglePointShape: class { },
}));

vi.mock('@controllers/Core/Tools/general', () => ({
  addInfoToId: vi.fn((id, info) => id + '_' + info),
  findObjectById: vi.fn(() => null),
}));

describe('HideTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    helpConfigRegistry.clear();
    app.tool.currentStep = 'start';
    tool = new HideTool();
  });

  it('registers help config and sets signal state in start()', () => {
    tool.start();

    expect(helpConfigRegistry.has('hide')).toBe(true);
    expect(appActions.setActiveTool).toHaveBeenCalledWith('hide');
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
  });

  it('returns to listen step after object selection', () => {
    tool.executeAction = vi.fn();

    tool.objectSelected({ id: 'obj-1' });

    expect(tool.executeAction).toHaveBeenCalled();
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
  });
});
