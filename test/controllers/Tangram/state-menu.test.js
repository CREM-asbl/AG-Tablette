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
  it('envoie currentStep=check via signaux quand check=false', () => {
    const menu = document.createElement('state-menu');
    menu.check = false;

    menu.clickHandler();

    expect(appActionsMock.setTangramState).toHaveBeenCalledWith({ currentStep: 'check' });
  });

  it('envoie currentStep=uncheck via signaux quand check=true', () => {
    const menu = document.createElement('state-menu');
    menu.check = true;

    menu.clickHandler();

    expect(appActionsMock.setTangramState).toHaveBeenCalledWith({ currentStep: 'uncheck' });
  });

  it('n envoie rien pendant la relecture fullHistory', () => {
    const menu = document.createElement('state-menu');
    menu.check = false;
    appMock.fullHistory.isRunning = true;

    menu.clickHandler();

    expect(appActionsMock.setTangramState).not.toHaveBeenCalled();
  });

  it('affiche le niveau courant et le bouton recommencer', async () => {
    const menu = document.createElement('state-menu');
    menu.level = 4;
    document.body.appendChild(menu);
    await menu.updateComplete;

    const labels = [...menu.shadowRoot.querySelectorAll('button')].map((b) =>
      b.textContent.trim(),
    );

    expect(labels).toContain('Niveau : 4');
    expect(labels).toContain('Recommencer');
    menu.remove();
  });

  it('utilise les tokens du theme plutot que des couleurs en dur', async () => {
    const menu = document.createElement('state-menu');
    document.body.appendChild(menu);
    await menu.updateComplete;

    const cssText = [...menu.shadowRoot.querySelectorAll('style')]
      .map((s) => s.textContent)
      .join('\n');

    expect(cssText).toContain('var(--theme-color)');
    expect(cssText).toContain('var(--text-color)');
    expect(cssText).not.toContain('#bbb');
    menu.remove();
  });

  it('dispatche tangram:level-menu-clicked au clic sur le niveau', () => {
    const menu = document.createElement('state-menu');
    const listener = vi.fn();
    window.addEventListener('tangram:level-menu-clicked', listener);

    menu.levelHandler();

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener('tangram:level-menu-clicked', listener);
  });

  it('dispatche tangram:restart-menu-clicked au clic sur recommencer', () => {
    const menu = document.createElement('state-menu');
    const listener = vi.fn();
    window.addEventListener('tangram:restart-menu-clicked', listener);

    menu.restartHandler();

    expect(listener).toHaveBeenCalledTimes(1);
    window.removeEventListener('tangram:restart-menu-clicked', listener);
  });

  it('ne dispatche rien pendant la relecture fullHistory (niveau/recommencer)', () => {
    const menu = document.createElement('state-menu');
    const levelListener = vi.fn();
    const restartListener = vi.fn();
    window.addEventListener('tangram:level-menu-clicked', levelListener);
    window.addEventListener('tangram:restart-menu-clicked', restartListener);
    appMock.fullHistory.isRunning = true;

    menu.levelHandler();
    menu.restartHandler();

    expect(levelListener).not.toHaveBeenCalled();
    expect(restartListener).not.toHaveBeenCalled();
    window.removeEventListener('tangram:level-menu-clicked', levelListener);
    window.removeEventListener('tangram:restart-menu-clicked', restartListener);
  });
});
