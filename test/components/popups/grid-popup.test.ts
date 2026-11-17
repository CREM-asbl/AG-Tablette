// test/components/popups/grid-popup.test.ts
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock pour gridStore
const mockGridStore = {
  getState: vi.fn().mockReturnValue({
    gridType: 'square', // État initial par défaut pour les tests
    gridSize: 1,
    isVisible: true,
    gridOpacity: 0.7,
  }),
  setGridType: vi.fn(),
  setGridSize: vi.fn(),
  setGridOpacity: vi.fn(),
  setIsVisible: vi.fn(),
  subscribe: vi.fn(listener => {
    // Simuler l'appel initial du listener avec l'état actuel
    // Cet appel à getState() utilisera la configuration la plus récente du mock (celle du test si elle a été définie)
    listener(mockGridStore.getState());
    return vi.fn(); // retourne une fonction de désabonnement factice
  }),
  _resetState: vi.fn(() => {
    // Réinitialiser l'état mocké que getState retournera par défaut
    mockGridStore.getState.mockReturnValue({
      gridType: 'square', // État par défaut après un reset
      gridSize: 1,
      isVisible: true,
      gridOpacity: 0.7,
    });
    // Ne pas notifier les auditeurs ici. L'abonnement initial s'en chargera
    // ou une action explicite si nécessaire pour simuler des mises à jour post-reset.
  }),
};

vi.doMock('@store/gridStore', () => ({
  gridStore: mockGridStore,
}));

// Simplification du mock pour App.js
vi.doMock('@controllers/Core/App.js', () => {
  return {
    app: {
      // Seules les propriétés de 'app' réellement utilisées par grid-popup.js sont nécessaires ici.
      // grid-popup.js utilise app.fullHistory.isRunning.
      fullHistory: { isRunning: false },
      // setState n'est plus utilisé par grid-popup.js, donc pas besoin de le mocker ici
      // pour vérifier son non-appel depuis ce module.
    },
    // setState (export direct) n'est pas non plus utilisé par grid-popup.js.
  };
});

describe('GridPopup component with Vitest and jsdom', () => {
  let container: HTMLDivElement;

  beforeAll(async () => {
    await import('../../../src/components/popups/grid-popup.js');
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    // Appeler _resetState pour s'assurer que getState est configuré avec les valeurs par défaut du mock.
    // Le test individuel pourra ensuite le surcharger avec mockReturnValue si besoin.
    mockGridStore._resetState();

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
    vi.resetAllMocks(); // Cela réinitialisera tous les mocks, y compris gridStore et app mocks
    // Assurer que l'état du mockGridStore est propre pour le prochain test si resetAllMocks ne suffit pas
    // mockGridStore.getState.mockClear();
    // mockGridStore.setGridType.mockClear();
    // mockGridStore.setGridSize.mockClear();
    // mockGridStore.subscribe.mockClear();
    // mockGridStore._resetState.mockClear();
  });

  it('should load and register the custom element', () => {
    const element = document.createElement('grid-popup');
    container.appendChild(element);
    expect(element).toBeInstanceOf(HTMLElement);
    expect(customElements.get('grid-popup')).not.toBeUndefined();
  });

  it('should display default grid type and size from mocked gridStore', async () => {
    const specificStateForTest = {
      gridType: 'horizontal-triangle', // Valeur qui existe dans les options du select
      gridSize: 2,
      isVisible: true,
      gridOpacity: 0.5,
    };
    mockGridStore.getState.mockReturnValue(specificStateForTest);

    const element = document.createElement('grid-popup') as any;
    container.appendChild(element);
    await element.updateComplete;

    // Vérifier la propriété du composant directement
    expect(element.gridType).toBe('horizontal-triangle');

    const shadowRoot = element.shadowRoot;
    expect(shadowRoot).not.toBeNull();

    const gridTypeSelect = shadowRoot.querySelector('select[name="grid_popup_grid_type"]') as HTMLSelectElement;
    const gridSizeSelect = shadowRoot.querySelector('select[name="grid_popup_grid_size"]') as HTMLSelectElement;

    expect(gridTypeSelect).not.toBeNull();
    expect(gridSizeSelect).not.toBeNull();

    expect(gridTypeSelect.value).toBe('horizontal-triangle');
    expect(gridSizeSelect.value).toBe('2');

    // Le mock sera réinitialisé par vi.resetAllMocks() dans afterEach
  });

  it('should call gridStore.setGridType when grid type changes', async () => {
    const element = document.createElement('grid-popup') as any;
    container.appendChild(element);
    await element.updateComplete;

    const shadowRoot = element.shadowRoot;
    const gridTypeSelect = shadowRoot.querySelector('select[name="grid_popup_grid_type"]') as HTMLSelectElement;
    expect(gridTypeSelect).not.toBeNull();

    gridTypeSelect.value = 'horizontal-triangle';
    gridTypeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    await element.updateComplete;

    expect(mockGridStore.setGridType).toHaveBeenCalled();
    expect(mockGridStore.setGridType).toHaveBeenCalledWith('horizontal-triangle');
  });

  it('should call gridStore.setGridSize when grid size changes', async () => {
    const element = document.createElement('grid-popup') as any;
    container.appendChild(element);
    await element.updateComplete;

    const shadowRoot = element.shadowRoot;
    const gridSizeSelect = shadowRoot.querySelector('select[name="grid_popup_grid_size"]') as HTMLSelectElement;
    expect(gridSizeSelect).not.toBeNull();

    gridSizeSelect.value = '0.5'; // String value from select
    gridSizeSelect.dispatchEvent(new Event('change', { bubbles: true }));
    await element.updateComplete;

    expect(mockGridStore.setGridSize).toHaveBeenCalled();
    expect(mockGridStore.setGridSize).toHaveBeenCalledWith(0.5);
  });
});
