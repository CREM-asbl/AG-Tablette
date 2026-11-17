import { setState } from '@controllers/Core/App';
import { ZoomTool } from '@controllers/Zoom/ZoomTool';
import { appActions } from '@store/appState';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lit-labs/signals', () => ({
  computed: vi.fn((cb) => ({ get: cb })),
  signal: vi.fn((val) => ({ get: () => val, set: vi.fn() })),
}));

vi.mock('@controllers/Core/App', () => {
  const setState = vi.fn();
  const app = {
    tool: { name: 'zoom', currentStep: 'start', mode: 'wheel' },
    workspace: {
      zoomLevel: 1,
      translateOffset: {
        multiply: vi.fn(() => ({
          add: vi.fn(() => ({
            multiply: vi.fn(() => ({ x: 0, y: 0 })),
          })),
        })),
      },
      setZoomLevel: vi.fn(),
      setTranslateOffset: vi.fn(),
    },
    settings: {
      minZoomLevel: 0.5,
      maxZoomLevel: 4,
    },
    upperCanvasLayer: {
      removeAllObjects: vi.fn(),
    },
    addListener: vi.fn(() => 'listener-id'),
    removeListener: vi.fn(),
    canvasWidth: 1000,
    canvasHeight: 800,
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

describe('ZoomTool', () => {
  let tool;

  beforeEach(() => {
    vi.clearAllMocks();
    tool = new ZoomTool();
  });

  it('met a jour les signaux en touch start', () => {
    const touches = [{ dist: vi.fn(() => 120) }, { dist: vi.fn(() => 120) }];

    tool.canvasTouchStart(touches);

    expect(appActions.setActiveTool).toHaveBeenCalledWith('zoom');
    expect(appActions.setToolState).toHaveBeenCalledWith({ mode: 'touch' });
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('start');
  });

  it('met a jour les signaux au premier mouse wheel', () => {
    tool.applyZoom = vi.fn();

    tool.canvasMouseWheel(20);

    expect(appActions.setActiveTool).toHaveBeenCalledWith('zoom');
    expect(appActions.setToolState).toHaveBeenCalledWith({ mode: 'wheel' });
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('start');
    expect(tool.applyZoom).toHaveBeenCalled();
  });
});
