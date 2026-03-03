import { CreateRegularTool } from '@controllers/CreateRegular/CreateRegularTool';
import { helpConfigRegistry } from '@services/HelpConfigRegistry';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
}));

vi.mock('@controllers/Core/App', () => {
  const setState = vi.fn();
  const app = {
    tool: {},
    settings: {
      numberOfRegularPoints: 3,
      temporaryDrawColor: '#ff0000',
    },
    upperCanvasLayer: {
      removeAllObjects: vi.fn(),
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
  activeTool: { get: vi.fn(() => 'createRegularPolygon') },
  currentStep: { get: vi.fn(() => 'start') },
  createWatcher: vi.fn(() => vi.fn()),
}));

vi.mock('@controllers/Core/Tools/general', () => ({
  createElem: vi.fn(),
  findObjectById: vi.fn(),
  removeObjectById: vi.fn(),
}));

import { createElem } from '@controllers/Core/Tools/general';

describe('CreateRegularTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    helpConfigRegistry.clear();
    tool = new CreateRegularTool();
  });

  it('registers help config and opens one popup', () => {
    document.querySelectorAll = vi.fn(() => []);

    tool.start();

    expect(helpConfigRegistry.has('createRegularPolygon')).toBe(true);
    expect(createElem).toHaveBeenCalledTimes(1);
    expect(createElem).toHaveBeenCalledWith('regular-popup');
  });

  it('removes existing regular-popup instances before creating a new one', () => {
    const removeA = vi.fn();
    const removeB = vi.fn();
    document.querySelectorAll = vi.fn(() => [{ remove: removeA }, { remove: removeB }]);

    tool.start();

    expect(document.querySelectorAll).toHaveBeenCalledWith('regular-popup');
    expect(removeA).toHaveBeenCalledTimes(1);
    expect(removeB).toHaveBeenCalledTimes(1);
    expect(createElem).toHaveBeenCalledTimes(1);
  });
});
