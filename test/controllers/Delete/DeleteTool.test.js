import { appActions } from '@store/appState';
import { DeleteTool } from '@controllers/Delete/DeleteTool';
import { helpConfigRegistry } from '@services/HelpConfigRegistry';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
  signal: vi.fn((val) => ({ get: () => val, set: vi.fn() })),
}));

vi.mock('@controllers/Core/App', () => {
  const setState = vi.fn();
  const app = {
    tool: { name: 'delete', currentStep: 'start' },
    upperCanvasLayer: {
      removeAllObjects: vi.fn(),
    },
    workspace: {
      lastKnownMouseCoordinates: { x: 0, y: 0 },
      selectionConstraints: {
        shapes: {},
        points: {},
        segments: {}
      }
    },
    settings: {
      temporaryDrawColor: '#ff0000',
    },
    addListener: vi.fn(),
    removeListener: vi.fn(),
  };
  return { app, setState };
});

vi.mock('@store/appState', () => ({
  activeTool: { get: vi.fn(() => 'delete'), set: vi.fn() },
  currentStep: { get: vi.fn(() => 'start'), set: vi.fn() },
  toolState: { get: vi.fn(() => ({})), set: vi.fn() },
  appActions: {
    setActiveTool: vi.fn(),
    setCurrentStep: vi.fn(),
    setToolState: vi.fn(),
  },
}));

describe('DeleteTool - Signal Migration', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    helpConfigRegistry.clear();
    tool = new DeleteTool();
  });

  it('registers help config in start()', () => {
    tool.start();
    expect(helpConfigRegistry.has('delete')).toBe(true);
  });

  it('updates signals in start()', async () => {
    vi.useFakeTimers();
    tool.start();
    vi.advanceTimersByTime(100);
    
    expect(appActions.setActiveTool).toHaveBeenCalledWith('delete');
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
  });

  it('updates currentStep in listen()', () => {
    tool.listen();
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('listen');
  });
});
