import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Utiliser vi.doMock pour s'assurer que les mocks sont actifs avant l'import du composant.
vi.doMock('@controllers/Core/App', () => ({
  app: {
    environment: { name: 'TestEnv' }, // Fournir une valeur mockée pour l'environnement
  },
}));

// Correction du chemin pour le mock de store/tools
// Le chemin doit être relatif au fichier de test (help-popup.test.ts) vers le module à mocker (src/store/tools.js)
vi.doMock('../src/store/tools.js', () => ({
  tools: {
    get: vi.fn(() => [
      // Mock de la fonction get de tools
      { name: 'testTool', title: 'Test Tool', type: 'test' },
      { name: 'anotherTool', title: 'Another Tool' }, // type est undefined ici
      { name: 'create', title: 'Create', type: 'test' },
    ]),
  },
}));

describe('HelpPopup component with Vitest and jsdom', () => {
  let container: HTMLDivElement;

  beforeAll(async () => {
    // Importer le composant APRÈS que les mocks soient en place.
    await import('../src/components/popups/help-popup.js');
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    // Stub pour HTMLDialogElement.showModal et close, utilisé par template-popup
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
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.resetAllMocks(); // Réinitialiser tous les mocks
  });

  it('should load and register the custom element', async () => {
    const element = document.createElement('help-popup') as any;
    container.appendChild(element);
    await element.updateComplete; // Attendre la mise à jour de LitElement
    expect(element).toBeInstanceOf(HTMLElement);
    expect(customElements.get('help-popup')).not.toBeUndefined();
  });

  it('renders a h2 with a title', async () => {
    const element = document.createElement('help-popup') as any;
    element.toolname = 'testTool'; // Définir une propriété pour le test
    container.appendChild(element);
    await element.updateComplete;

    const shadowRoot = element.shadowRoot;
    expect(shadowRoot).not.toBeNull();
    const h2 = shadowRoot.querySelector('h2');
    expect(h2).not.toBeNull();
    expect(h2?.textContent).toContain('Aide - Test Tool');
  });

  it('renders a h2 with default title if toolname is not provided', async () => {
    const element = document.createElement('help-popup') as any;
    container.appendChild(element);
    await element.updateComplete;

    const shadowRoot = element.shadowRoot;
    const h2 = shadowRoot.querySelector('h2');
    expect(h2).not.toBeNull();
    expect(h2?.textContent).toBe('Aide'); // Correction: pas d'espace après Aide
  });

  it('renders an image if url is constructed', async () => {
    const element = document.createElement('help-popup') as any;
    element.toolname = 'anotherTool'; // Ce tool n'a pas de 'type', et app.environment.name = 'TestEnv'
    container.appendChild(element);
    await element.updateComplete;

    const shadowRoot = element.shadowRoot;
    const img = shadowRoot.querySelector('img');
    expect(img).not.toBeNull();
    // tool.type est undefined, tool.name ('anotherTool') != 'create' -> images/help/OutilsGeneraux/anotherTool.webp
    expect(img?.getAttribute('src')).toBe('images/help/OutilsGeneraux/anotherTool.webp');
  });

  it('renders a fallback message if url is not constructed', async () => {
    const element = document.createElement('help-popup') as any;
    // Pour que l'URL soit vide et que le fallback s'affiche:
    // 1. toolname n'est pas dans la liste (tool est undefined) OU
    // 2. tool.type est défini ET app.environment.name est "Geometrie"
    // Testons le cas 1: toolname non existant.
    element.toolname = 'nonExistentTool';
    container.appendChild(element);
    await element.updateComplete;

    const shadowRoot = element.shadowRoot;
    const fallbackDiv = shadowRoot.querySelector('div#helpPopupBody div');
    expect(fallbackDiv).not.toBeNull();
    expect(fallbackDiv?.textContent?.trim()).toBe("L'aide n'est pas encore disponible pour cette fonction.");
    const img = shadowRoot.querySelector('img');
    expect(img).toBeNull(); // S'assurer qu'aucune image n'est rendue
  });
});
