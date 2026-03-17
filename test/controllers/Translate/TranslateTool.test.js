import { app, setState } from '@controllers/Core/App';
import { TranslateTool } from '@controllers/Translate/TranslateTool';
import { helpConfigRegistry } from '@services/HelpConfigRegistry';
import { appActions } from '@store/appState';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
  signal: vi.fn((val) => ({ get: () => val, set: vi.fn() })),
}));

vi.mock('@controllers/Core/App', () => {
  const createCoords = (x, y) => ({
    x,
    y,
    add: vi.fn((other) => createCoords(x + other.x, y + other.y)),
    substract: vi.fn((other) => createCoords(x - other.x, y - other.y)),
    multiply: vi.fn((factor) => createCoords(x * factor, y * factor)),
  });

  const app = {
    tool: { name: 'translate', currentStep: 'start' },
    workspace: {
      lastKnownMouseCoordinates: createCoords(10, 20),
      translateOffset: createCoords(2, 3),
      zoomLevel: 2,
      setTranslateOffset: vi.fn(),
    },
    addListener: vi.fn(() => 'listener-id'),
    removeListener: vi.fn(),
  };

  return { app, setState: vi.fn() };
});

vi.mock('@store/appState', () => ({
  activeTool: { get: vi.fn(() => 'translate'), set: vi.fn() },
  currentStep: { get: vi.fn(() => 'start'), set: vi.fn() },
  toolState: { get: vi.fn(() => ({})), set: vi.fn() },
  appActions: {
    setActiveTool: vi.fn(),
    setCurrentStep: vi.fn(),
    setToolState: vi.fn(),
  },
}));

describe('TranslateTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    helpConfigRegistry.clear();
    app.tool.currentStep = 'start';
    tool = new TranslateTool();
  });

  it('registers help config and sets signal state in start()', () => {
    vi.useFakeTimers();

    tool.start();
    vi.advanceTimersByTime(100);

    expect(helpConfigRegistry.has('translate')).toBe(true);
    expect(appActions.setActiveTool).toHaveBeenCalledWith('translate');
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
    expect(setState).toHaveBeenCalledWith({
      tool: { ...app.tool, name: 'translate', currentStep: 'listen' },
    });

    vi.useRealTimers();
  });

  it('switches to translate step on mouse down', () => {
    app.tool.currentStep = 'listen';

    tool.canvasMouseDown();

    expect(tool.startClickCoordinates).toBeTruthy();
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('translate');
    expect(setState).toHaveBeenCalledWith({
      tool: { ...app.tool, currentStep: 'translate' },
    });
  });

  it('returns to listen step on mouse up', () => {
    app.tool.currentStep = 'translate';
    tool.executeAction = vi.fn();

    tool.canvasMouseUp();

    expect(tool.executeAction).toHaveBeenCalled();
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
    expect(setState).toHaveBeenCalledWith({
      tool: { ...app.tool, name: 'translate', currentStep: 'listen' },
    });
  });
});
