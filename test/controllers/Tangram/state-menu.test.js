import { beforeEach, describe, expect, it, vi } from 'vitest';

const setStateMock = vi.fn();
const appMock = {
  fullHistory: { isRunning: false },
  tangram: { currentStep: 'start', isSilhouetteShown: false },
};

const appActionsMock = {
  setTangramState: vi.fn(),
};

vi.mock('../../../src/controllers/Core/App', () => ({
  app: appMock,
  setState: setStateMock,
}));

vi.mock('../../../src/store/appState', () => ({
  appActions: appActionsMock,
}));

vi.mock('@components/popups/template-popup', () => ({}));

beforeEach(async () => {
  vi.resetModules();
  setStateMock.mockClear();
  appActionsMock.setTangramState.mockClear();
  appMock.fullHistory.isRunning = false;

  if (!customElements.get('state-menu')) {
    await import('../../../src/controllers/Tangram/state-menu.js');
  }
});

describe('state-menu', () => {
  it('envoie currentStep=check via signaux et fallback legacy quand check=false', () => {
    const menu = document.createElement('state-menu');
    menu.check = false;

    menu.clickHandler();

    expect(appActionsMock.setTangramState).toHaveBeenCalledWith({ currentStep: 'check' });
    expect(setStateMock).toHaveBeenCalledWith({
      tangram: expect.objectContaining({
        currentStep: 'check',
      }),
    });
  });

  it('envoie currentStep=uncheck via signaux et fallback legacy quand check=true', () => {
    const menu = document.createElement('state-menu');
    menu.check = true;

    menu.clickHandler();

    expect(appActionsMock.setTangramState).toHaveBeenCalledWith({ currentStep: 'uncheck' });
    expect(setStateMock).toHaveBeenCalledWith({
      tangram: expect.objectContaining({
        currentStep: 'uncheck',
      }),
    });
  });

  it('n envoie rien pendant la relecture fullHistory', () => {
    const menu = document.createElement('state-menu');
    menu.check = false;
    appMock.fullHistory.isRunning = true;

    menu.clickHandler();

    expect(appActionsMock.setTangramState).not.toHaveBeenCalled();
    expect(setStateMock).not.toHaveBeenCalled();
  });
});
