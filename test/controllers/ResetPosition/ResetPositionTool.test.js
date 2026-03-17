import { app, setState } from '@controllers/Core/App';
import { ResetPositionTool } from '@controllers/ResetPosition/ResetPositionTool';
import { helpConfigRegistry } from '@services/HelpConfigRegistry';
import { appActions } from '@store/appState';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
  signal: vi.fn((val) => ({ get: () => val, set: vi.fn() })),
}));

vi.mock('@controllers/Core/App', () => {
  const app = {
    tool: { name: 'resetPosition', currentStep: 'start' },
    workspace: {
      selectionConstraints: {
        shapes: {},
      },
    },
    addListener: vi.fn(() => 'listener-id'),
    removeListener: vi.fn(),
  };
  return { app, setState: vi.fn() };
});

vi.mock('@store/appState', () => ({
  activeTool: { get: vi.fn(() => 'resetPosition'), set: vi.fn() },
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

vi.mock('@controllers/Core/Objects/Coordinates', () => ({
  Coordinates: class {
    constructor(coords) {
      Object.assign(this, coords);
    }
  },
}));

describe('ResetPositionTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    helpConfigRegistry.clear();
    tool = new ResetPositionTool();
  });

  it('registers help config and sets signal state in start()', () => {
    tool.start();

    expect(helpConfigRegistry.has('resetPosition')).toBe(true);
    expect(appActions.setActiveTool).toHaveBeenCalledWith('resetPosition');
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
    expect(setState).toHaveBeenCalledWith({
      tool: { ...app.tool, name: 'resetPosition', currentStep: 'listen' },
    });
  });

  it('returns to listen after selecting an object', () => {
    tool.executeAction = vi.fn();

    tool.objectSelected({ id: 'shape-1' });

    expect(tool.executeAction).toHaveBeenCalled();
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
    expect(setState).toHaveBeenCalledWith({
      tool: { ...app.tool, name: 'resetPosition', currentStep: 'listen' },
    });
  });
});
