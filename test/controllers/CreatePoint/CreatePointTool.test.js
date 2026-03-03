import { CreatePointTool } from '@controllers/CreatePoint/CreatePointTool';
import { helpConfigRegistry } from '@services/HelpConfigRegistry';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
}));

vi.mock('@controllers/Core/App', () => {
  const setState = vi.fn();
  const app = {
    tool: { name: 'createPoint', currentStep: 'start' },
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
  activeTool: { get: vi.fn(() => 'createPoint') },
  currentStep: { get: vi.fn(() => 'start') },
  createWatcher: vi.fn(() => vi.fn()),
  appActions: {
    setToolUiState: vi.fn(),
  },
}));

describe('CreatePointTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    helpConfigRegistry.clear();
    tool = new CreatePointTool();
  });

  it('registers help config in start()', () => {
    tool.start();
    expect(helpConfigRegistry.has('createPoint')).toBe(true);
  });

  it('help config provides step guidance', () => {
    tool.start();
    const config = helpConfigRegistry.get('createPoint');

    expect(config).toBeDefined();
    expect(typeof config.getStepConfig).toBe('function');

    const startStep = config.getStepConfig({ currentStep: 'start' });
    expect(startStep).toHaveProperty('target');
    expect(startStep).toHaveProperty('text');
  });
});
