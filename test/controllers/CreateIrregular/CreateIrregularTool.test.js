import { CreateIrregularTool } from '@controllers/CreateIrregular/CreateIrregularTool';
import { helpConfigRegistry } from '@services/HelpConfigRegistry';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
}));

vi.mock('@controllers/Core/App', () => {
  const setState = vi.fn();
  const app = {
    tool: { name: 'createIrregularPolygon', currentStep: 'start' },
    upperCanvasLayer: {
      removeAllObjects: vi.fn(),
    },
    workspace: {
      lastKnownMouseCoordinates: { x: 0, y: 0 },
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
  activeTool: { get: vi.fn(() => 'createIrregularPolygon') },
  currentStep: { get: vi.fn(() => 'start') },
  createWatcher: vi.fn(() => vi.fn()),
}));

import { app, setState } from '@controllers/Core/App';

describe('CreateIrregularTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    helpConfigRegistry.clear();
    tool = new CreateIrregularTool();
  });

  it('registers help config in start()', () => {
    tool.start();
    expect(helpConfigRegistry.has('createIrregularPolygon')).toBe(true);
  });

  it('switches to drawPoint after start timeout', () => {
    vi.useFakeTimers();

    tool.start();

    expect(app.upperCanvasLayer.removeAllObjects).toHaveBeenCalledTimes(1);

    vi.runAllTimers();

    expect(setState).toHaveBeenCalledWith(
      expect.objectContaining({
        tool: expect.objectContaining({
          name: 'createIrregularPolygon',
          currentStep: 'drawPoint',
        }),
      }),
    );

    vi.useRealTimers();
  });
});
