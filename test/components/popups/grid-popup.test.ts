// test/components/popups/grid-popup.test.ts
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Variable pour capturer la fonction mockée setState
let capturedMockSetState: ReturnType<typeof vi.fn>;

vi.doMock('@controllers/Core/App.js', () => {
  const localMockSetState = vi.fn();
  capturedMockSetState = localMockSetState; // Capturer la référence pour les tests
  return {
    app: {
      settings: {
        gridType: 'square',
        gridSize: '1',
        gridShown: true,
      },
      setState: localMockSetState, // Utiliser le mock local
      fullHistory: { isRunning: false },
    },
    setState: localMockSetState, // Utiliser le mock local
  };
});

describe('GridPopup component with Vitest and jsdom', () => {
  let container: HTMLDivElement;

  beforeAll(async () => {
    // Importer le composant APRÈS que le mock soit en place via vi.doMock.
    await import('../../../src/components/popups/grid-popup.js');
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    if (typeof HTMLDialogElement === 'function') {
      HTMLDialogElement.prototype.showModal = vi.fn();
      HTMLDialogElement.prototype.close = vi.fn();
    } else {
      // @ts-ignore
      window.HTMLDialogElement = class HTMLDialogElement extends HTMLElement {
        showModal = vi.fn();
        close = vi.fn();
      };
    }
    // S'assurer que capturedMockSetState est réinitialisé avant chaque test si nécessaire,
    // mais vi.resetAllMocks() devrait s'en charger.
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.resetAllMocks(); // Cela devrait aussi réinitialiser capturedMockSetState
  });

  it('should load and register the custom element', () => {
    const element = document.createElement('grid-popup');
    container.appendChild(element);
    expect(element).toBeInstanceOf(HTMLElement);
    expect(customElements.get('grid-popup')).not.toBeUndefined();
  });

  it('should display default grid type and size from mocked settings', async () => {
    const element = document.createElement('grid-popup') as any;
    container.appendChild(element);
    await element.updateComplete;

    const shadowRoot = element.shadowRoot;
    expect(shadowRoot).not.toBeNull();

    const gridTypeSelect = shadowRoot.querySelector('select[name="grid_popup_grid_type"]') as HTMLSelectElement;
    const gridSizeSelect = shadowRoot.querySelector('select[name="grid_popup_grid_size"]') as HTMLSelectElement;

    expect(gridTypeSelect).not.toBeNull();
    expect(gridSizeSelect).not.toBeNull();

    expect(gridTypeSelect.value).toBe('square');
    expect(gridSizeSelect.value).toBe('1');
  });

  it('should call setState when grid type changes', async () => {
    const element = document.createElement('grid-popup') as any;
    container.appendChild(element);
    await element.updateComplete;

    const shadowRoot = element.shadowRoot;
    const gridTypeSelect = shadowRoot.querySelector('select[name="grid_popup_grid_type"]') as HTMLSelectElement;
    expect(gridTypeSelect).not.toBeNull();

    gridTypeSelect.value = 'horizontal-triangle';
    gridTypeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    await element.updateComplete;

    expect(capturedMockSetState).toHaveBeenCalled();
    expect(capturedMockSetState).toHaveBeenCalledWith(expect.objectContaining({
      settings: expect.objectContaining({
        gridType: 'horizontal-triangle',
        gridShown: true,
      }),
    }));
  });

  it('should call setState when grid size changes', async () => {
    const element = document.createElement('grid-popup') as any;
    container.appendChild(element);
    await element.updateComplete;

    const shadowRoot = element.shadowRoot;
    const gridSizeSelect = shadowRoot.querySelector('select[name="grid_popup_grid_size"]') as HTMLSelectElement;
    expect(gridSizeSelect).not.toBeNull();

    gridSizeSelect.value = '2';
    gridSizeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    await element.updateComplete;

    expect(capturedMockSetState).toHaveBeenCalled();
    expect(capturedMockSetState).toHaveBeenCalledWith(expect.objectContaining({
      settings: expect.objectContaining({
        gridSize: '2',
      }),
    }));
  });
});
