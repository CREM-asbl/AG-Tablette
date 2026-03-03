import { MoveTool } from '@controllers/Move/MoveTool';
import { helpConfigRegistry } from '@services/HelpConfigRegistry';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
}));

vi.mock('@controllers/Core/App', () => {
  const setState = vi.fn();
  const app = {
    tool: { name: 'move', currentStep: 'start' },
    upperCanvasLayer: {
      removeAllObjects: vi.fn(),
    },
    mainCanvasLayer: {
      editingShapeIds: [],
    },
    workspace: {
      lastKnownMouseCoordinates: { x: 0, y: 0 },
    },
    addListener: vi.fn(),
    removeListener: vi.fn(),
  };
  return { app, setState };
});

vi.mock('@store/appState', () => ({
  activeTool: { get: vi.fn(() => 'move') },
  currentStep: { get: vi.fn(() => 'start') },
  createWatcher: vi.fn(() => vi.fn()),
}));

describe('MoveTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    helpConfigRegistry.clear();
    tool = new MoveTool();
  });

  it('registers help config in start()', () => {
    tool.start();
    expect(helpConfigRegistry.has('move')).toBe(true);
  });

  it('help config provides step guidance', () => {
    tool.start();
    const config = helpConfigRegistry.get('move');

    expect(config).toBeDefined();
    expect(typeof config.getStepConfig).toBe('function');

    const listenStep = config.getStepConfig({ currentStep: 'listen' });
    expect(listenStep).toHaveProperty('target');
    expect(listenStep).toHaveProperty('text');
  });
});
