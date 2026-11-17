import { app } from '@controllers/Core/App';
import { appActions } from '@store/appState';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@controllers/Core/App', () => {
  const setState = vi.fn();
  const app = {
    settings: {
      numberOfRegularPoints: 4,
    },
    tool: {
      name: 'createRegularPolygon',
      currentStep: 'start',
    },
  };
  return { app, setState };
});

vi.mock('@store/appState', () => ({
  appActions: {
    updateSettings: vi.fn(),
    setActiveTool: vi.fn(),
    setCurrentStep: vi.fn(),
  },
}));

describe('regular-popup', () => {
  let popup;

  beforeEach(async () => {
    vi.clearAllMocks();
    await import('@controllers/CreateRegular/regular-popup');
    const RegularPopup = customElements.get('regular-popup');
    popup = new RegularPopup();
  });

  it('met a jour settings via appActions dans changeNumberOfPoints', () => {
    popup.changeNumberOfPoints({ target: { value: '7' } });

    expect(appActions.updateSettings).toHaveBeenCalledWith({ numberOfRegularPoints: 7 });
  });

  it('soumet en pilotant les signaux', () => {
    popup.submit();

    expect(appActions.setActiveTool).toHaveBeenCalledWith('createRegularPolygon');
    expect(appActions.setCurrentStep).toHaveBeenCalledWith('drawFirstPoint');
  });
});
