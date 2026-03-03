import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock des composants dépendants
vi.doMock('@components/color-button', () => ({
  default: { tagName: 'color-button' }
}));

describe('InteractiveTutorial component', () => {
  let component;

  beforeAll(async () => {
    // Importer le composant après que les mocks soient en place
    await import('@components/popups/interactive-tutorial');

    // Stub pour HTMLDialogElement
    if (typeof HTMLDialogElement === 'function') {
      HTMLDialogElement.prototype.showModal = vi.fn();
      HTMLDialogElement.prototype.close = vi.fn();
    } else {
      window.HTMLDialogElement = class HTMLDialogElement extends HTMLElement {
        showModal = vi.fn();
        close = vi.fn();
      };
    }
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Initialisation', () => {
    it('crée le composant personnalisé', () => {
      component = document.createElement('interactive-tutorial');
      expect(customElements.get('interactive-tutorial')).not.toBeUndefined();
    });

    it('initialise avec les propriétés par défaut', () => {
      component = document.createElement('interactive-tutorial');
      expect(component.toolName).toBe('');
      expect(component.tutorial).toBeNull();
      expect(component.currentLanguage).toBe('fr');
      expect(component.currentStepIndex).toBe(0);
    });
  });

  describe('Gestion du tutoriel', () => {
    beforeEach(() => {
      component = document.createElement('interactive-tutorial');
      component.tutorial = {
        toolName: 'testTool',
        metadata: {
          title: { fr: 'Test Tool', nl: 'Test Gereedschap', en: 'Test Tool' },
          estimatedTime: 120
        },
        steps: [
          {
            id: 1,
            title: { fr: 'Étape 1', nl: 'Stap 1', en: 'Step 1' },
            description: { fr: 'Description 1', nl: 'Beschrijving 1', en: 'Description 1' },
            tips: {
              fr: ['Conseil 1', 'Conseil 2'],
              nl: ['Tip 1', 'Tip 2'],
              en: ['Tip 1', 'Tip 2']
            }
          },
          {
            id: 2,
            title: { fr: 'Étape 2', nl: 'Stap 2', en: 'Step 2' },
            description: { fr: 'Description 2', nl: 'Beschrijving 2', en: 'Description 2' }
          },
          {
            id: 3,
            title: { fr: 'Étape 3', nl: 'Stap 3', en: 'Step 3' },
            description: { fr: 'Description 3', nl: 'Beschrijving 3', en: 'Description 3' }
          }
        ]
      };
    });

    it('accepte un tutoriel avec métadonnées et étapes', () => {
      expect(component.tutorial).not.toBeNull();
      expect(component.tutorial.steps.length).toBe(3);
      expect(component.tutorial.metadata.title.fr).toBe('Test Tool');
    });

    it('initialise avec la première étape', () => {
      expect(component.currentStepIndex).toBe(0);
    });

    it('accepte null comme tutoriel', () => {
      component.tutorial = null;
      expect(component.tutorial).toBeNull();
    });
  });

  describe('Navigation entre étapes', () => {
    beforeEach(() => {
      component = document.createElement('interactive-tutorial');
      component.tutorial = {
        toolName: 'test',
        metadata: { title: { fr: 'Test' }, category: 'creation' },
        steps: [
          { id: 1, title: { fr: 'Étape 1' } },
          { id: 2, title: { fr: 'Étape 2' } },
          { id: 3, title: { fr: 'Étape 3' } }
        ]
      };
    });

    it('avance à l\'étape suivante', () => {
      expect(component.currentStepIndex).toBe(0);
      component.nextStep();
      expect(component.currentStepIndex).toBe(1);
    });

    it('recule à l\'étape précédente', () => {
      component.currentStepIndex = 2;
      component.previousStep();
      expect(component.currentStepIndex).toBe(1);
    });

    it('ne dépasse pas la dernière étape', () => {
      component.currentStepIndex = 2;
      component.nextStep();
      expect(component.currentStepIndex).toBe(2);
    });

    it('ne va pas avant la première étape', () => {
      component.currentStepIndex = 0;
      component.previousStep();
      expect(component.currentStepIndex).toBe(0);
    });

    it('va à une étape spécifique avec goToStep', () => {
      component.goToStep(2);
      expect(component.currentStepIndex).toBe(2);
    });

    it('rejette les indices invalides avec goToStep', () => {
      component.goToStep(10);
      expect(component.currentStepIndex).toBe(0);

      component.goToStep(-1);
      expect(component.currentStepIndex).toBe(0);
    });
  });

  describe('Gestion des langues', () => {
    beforeEach(() => {
      component = document.createElement('interactive-tutorial');
      component.tutorial = {
        toolName: 'test',
        metadata: {
          title: {
            fr: 'Créer un point',
            nl: 'Een punt creëren',
            en: 'Create a point'
          },
          category: 'creation'
        },
        steps: [
          {
            id: 1,
            title: {
              fr: 'Étape 1',
              nl: 'Stap 1',
              en: 'Step 1'
            }
          }
        ]
      };
    });

    it('initialise en français par défaut', () => {
      expect(component.currentLanguage).toBe('fr');
    });

    it('change vers une langue supportée', () => {
      component.setLanguage('nl');
      expect(component.currentLanguage).toBe('nl');
    });

    it('change vers l\'anglais', () => {
      component.setLanguage('en');
      expect(component.currentLanguage).toBe('en');
    });

    it('rejette les langues non supportées', () => {
      component.currentLanguage = 'fr';
      component.setLanguage('ja');
      expect(component.currentLanguage).toBe('fr');
    });
  });

  describe('Localisation du texte', () => {
    beforeEach(() => {
      component = document.createElement('interactive-tutorial');
      component.tutorial = {
        toolName: 'test',
        metadata: { title: { fr: 'Test' }, category: 'creation' },
        steps: [{ id: 1, title: { fr: 'Step' } }]
      };
    });

    it('gère les textes simples (non objets)', () => {
      const text = component.getLocalizedText('Simple text');
      expect(text).toBe('Simple text');
    });

    it('obtient la langue demandée si disponible', () => {
      component.currentLanguage = 'nl';
      const textObj = { fr: 'Français', nl: 'Nederlands', en: 'English' };
      const text = component.getLocalizedText(textObj);
      expect(text).toBe('Nederlands');
    });

    it('retourne au français en fallback si langue manquante', () => {
      component.currentLanguage = 'de';
      const textObj = { fr: 'Français', nl: 'Nederlands' };
      const text = component.getLocalizedText(textObj);
      expect(text).toBe('Français');
    });

    it('retourne la première clé disponible si pas de clé fr', () => {
      const textObj = { nl: 'Nederlands', en: 'English' };
      const text = component.getLocalizedText(textObj);
      expect(['Nederlands', 'English']).toContain(text);
    });

    it('retourne une chaîne vide si objet vide', () => {
      const textObj = {};
      const text = component.getLocalizedText(textObj);
      expect(text).toBe('');
    });
  });

  describe('Fermeture du composant', () => {
    it('crée une méthode close', () => {
      component = document.createElement('interactive-tutorial');
      expect(typeof component.close).toBe('function');
    });

    it('la méthode close supprime le composant du DOM', () => {
      component = document.createElement('interactive-tutorial');
      const container = document.createElement('div');
      document.body.appendChild(container);
      container.appendChild(component);

      expect(container.contains(component)).toBe(true);
      component.close();
      expect(container.contains(component)).toBe(false);

      document.body.removeChild(container);
    });

    it('écoute l\'événement close-popup', async () => {
      component = document.createElement('interactive-tutorial');
      const container = document.createElement('div');
      document.body.appendChild(container);
      container.appendChild(component);
      await component.updateComplete;

      const closeSpy = vi.spyOn(component, 'close');
      window.dispatchEvent(new CustomEvent('close-popup'));

      expect(closeSpy).toHaveBeenCalled();

      document.body.removeChild(container);
    });
  });

  describe('Validation des propriétés', () => {
    it('accepte les tutoriels sans temps estimé', () => {
      component = document.createElement('interactive-tutorial');
      component.tutorial = {
        toolName: 'test',
        metadata: {
          title: { fr: 'Test' },
          category: 'creation'
        },
        steps: [{ id: 1, title: { fr: 'Étape 1' } }]
      };

      expect(component.tutorial.metadata.estimatedTime).toBeUndefined();
    });

    it('accepte les étapes sans média', () => {
      component = document.createElement('interactive-tutorial');
      component.tutorial = {
        toolName: 'test',
        metadata: { title: { fr: 'Test' }, category: 'creation' },
        steps: [
          { id: 1, title: { fr: 'Étape 1' }, description: { fr: 'Desc 1' } }
        ]
      };

      expect(component.tutorial.steps[0].media).toBeUndefined();
    });

    it('accepte les étapes sans conseils', () => {
      component = document.createElement('interactive-tutorial');
      component.tutorial = {
        toolName: 'test',
        metadata: { title: { fr: 'Test' }, category: 'creation' },
        steps: [
          { id: 1, title: { fr: 'Étape 1' } }
        ]
      };

      expect(component.tutorial.steps[0].tips).toBeUndefined();
    });
  });
});
