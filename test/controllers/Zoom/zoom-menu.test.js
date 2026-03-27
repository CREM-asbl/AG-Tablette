import { appActions } from '@store/appState';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@lit-labs/signals', () => ({
  SignalWatcher: (Base) => Base,
}));

vi.mock('@controllers/Core/App', () => {
  const setState = vi.fn();
  const app = {
    tool: { name: 'zoom', currentStep: 'start' },
    workspace: { zoomLevel: 1 },
    settings: {
      mainMenuWidth: 220,
      minZoomLevel: 0.5,
      maxZoomLevel: 4,
    },
  };
  const changes = { get: vi.fn() };
  return { app, changes, setState };
});

vi.mock('@store/appState', () => ({
  appActions: {
    setActiveTool: vi.fn(),
    setToolState: vi.fn(),
    setCurrentStep: vi.fn(),
  },
}));

describe('zoom-menu', () => {
  let menu;

  beforeEach(async () => {
    vi.clearAllMocks();
    await import('@controllers/Zoom/zoom-menu');
    const ZoomMenu = customElements.get('zoom-menu');
    menu = new ZoomMenu();
  });

  it('met a jour les signaux et passe en execute quand applyZoom=true', () => {
    menu.showResult(60, true);

    expect(appActions.setActiveTool).toHaveBeenCalledWith('zoom');
    expect(appActions.setToolState).toHaveBeenCalledWith({ zoomLevel: expect.any(Number) });
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('execute');
  });

  it('met a jour les signaux et passe en zoom quand applyZoom=false', () => {
    menu.showResult('40', false);

    expect(menu.position).toBe(40);
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('zoom');
  });
});
