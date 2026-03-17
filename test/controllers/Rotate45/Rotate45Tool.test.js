import { app, setState } from '@controllers/Core/App';
import { Rotate45Tool } from '@controllers/Rotate45/Rotate45Tool';
import { helpConfigRegistry } from '@services/HelpConfigRegistry';
import { appActions } from '@store/appState';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
  signal: vi.fn((val) => ({ get: () => val, set: vi.fn() })),
}));

vi.mock('@controllers/Core/App', () => {
  const app = {
    tool: { name: 'rotate45', currentStep: 'start' },
    workspace: {
      selectionConstraints: {},
    },
    fastSelectionConstraints: {
      mousedown_all_shape: {},
    },
    addListener: vi.fn(() => 'listener-id'),
    removeListener: vi.fn(),
  };
  return { app, setState: vi.fn() };
});

vi.mock('@store/appState', () => ({
  activeTool: { get: vi.fn(() => 'rotate45'), set: vi.fn() },
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

describe('Rotate45Tool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    helpConfigRegistry.clear();
    tool = new Rotate45Tool();
  });

  it('registers help config and sets signal state in start()', () => {
    vi.useFakeTimers();

    tool.start();
    vi.advanceTimersByTime(100);

    expect(helpConfigRegistry.has('rotate45')).toBe(true);
    expect(appActions.setActiveTool).toHaveBeenCalledWith('rotate45');
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
    expect(setState).toHaveBeenCalledWith({
      tool: { ...app.tool, name: 'rotate45', currentStep: 'listen' },
    });

    vi.useRealTimers();
  });

  it('returns to listen after selecting an object', () => {
    vi.useFakeTimers();

    tool.executeAction = vi.fn();
    const shape = {
      id: 'shape-1',
      centerCoordinates: { x: 0, y: 0 },
      rotate: vi.fn(),
    };

    tool.objectSelected(shape);
    vi.advanceTimersByTime(100);

    expect(tool.executeAction).toHaveBeenCalled();
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
    expect(setState).toHaveBeenCalledWith({
      tool: { ...app.tool, name: 'rotate45', currentStep: 'listen' },
    });

    vi.useRealTimers();
  });
});
