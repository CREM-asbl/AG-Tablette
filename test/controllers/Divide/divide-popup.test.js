import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const setStateMock = vi.fn();
const appMock = {
  settings: {
    numberOfDivisionParts: 3,
  },
  tool: {
    name: 'divide',
    currentStep: 'start',
  },
};
const appActionsMock = {
  setActiveTool: vi.fn(),
  setToolState: vi.fn(),
  setCurrentStep: vi.fn(),
};

vi.mock('../../../src/controllers/Core/App', () => ({
  app: appMock,
  setState: setStateMock,
}));

vi.mock('../../../src/store/appState', () => ({
  appActions: appActionsMock,
}));

vi.mock('../../../src/controllers/Core/Tools/general', () => ({
  range: (start, end) => Array.from({ length: end - start + 1 }, (_, index) => start + index),
}));

vi.mock('@components/color-button', () => ({}));
vi.mock('@components/popups/template-popup', () => ({}));
vi.mock('@styles/popup-variables.css', () => ({}));

beforeEach(async () => {
  vi.resetModules();
  setStateMock.mockClear();
  appActionsMock.setActiveTool.mockClear();
  appActionsMock.setToolState.mockClear();
  appActionsMock.setCurrentStep.mockClear();
  appMock.settings.numberOfDivisionParts = 3;

  if (!customElements.get('divide-popup')) {
    await import('../../../src/controllers/Divide/divide-popup.js');
  }
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('divide-popup', () => {
  it('initializes selected parts from numeric app settings', async () => {
    const popup = document.createElement('divide-popup');
    document.body.appendChild(popup);
    await popup.updateComplete;

    const select = popup.shadowRoot.querySelector('select');
    expect(select.value).toBe('3');
  });

  it('stores a numeric value when parts change', async () => {
    const popup = document.createElement('divide-popup');
    document.body.appendChild(popup);
    await popup.updateComplete;

    const select = popup.shadowRoot.querySelector('select');
    select.value = '2';
    select.dispatchEvent(new Event('change'));

    expect(setStateMock).toHaveBeenCalledWith({
      settings: expect.objectContaining({
        numberOfDivisionParts: 2,
      }),
    });
  });
});
