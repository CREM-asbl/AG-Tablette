import { html } from 'lit';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock des composants dépendants
vi.doMock('@components/color-button', () => ({
  default: html`<button></button>`
}));

describe('InteractiveTutorial component', () => {
  let container;
  let component;

  beforeAll(async () => {
    // Importer le composant après que les mocks soient en place
    await import('../src/components/popups/interactive-tutorial.js');

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

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    if (container && document.body.contains(container)) {
      document.body.removeChild(container);
    }
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

  describe('Rendu', () => {
    it('affiche un message si tutoriel n\'est pas disponible', async () => {
      component = document.createElement('interactive-tutorial');
      component.tutorial = null;
      container.appendChild(component);

      await component.updateComplete;

      const text = container.textContent;
      expect(text).toContain('n\'est pas disponible');
    });

    it('affiche le tutoriel correctement', async () => {
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
            media: {
              image: '/test.webp',
              alt: { fr: 'Alt text' }
            },
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
          }
        ]
      };
      component.currentLanguage = 'fr';
      container.appendChild(component);

      await component.updateComplete;

      const text = container.textContent;
      expect(text).toContain('Test Tool');
      expect(text).toContain('Étape 1 / 2');
      expect(text).toContain('Étape 1');
      expect(text).toContain('Description 1');
    });

    it('affiche les conseils utiles si présents', async () => {
      component = document.createElement('interactive-tutorial');
      component.tutorial = {
        toolName: 'testTool',
        metadata: { title: { fr: 'Test' }, category: 'creation' },
        steps: [
          {
            id: 1,
            title: { fr: 'Étape 1' },
            tips: {
              fr: ['Conseil 1', 'Conseil 2']
            }
          }
        ]
      };
      component.currentLanguage = 'fr';
      container.appendChild(component);

      await component.updateComplete;

      const text = container.textContent;
      expect(text).toContain('Conseils utiles');
      expect(text).toContain('Conseil 1');
    });

    it('affiche les images si présentes', async () => {
      component = document.createElement('interactive-tutorial');
      component.tutorial = {
        toolName: 'testTool',
        metadata: { title: { fr: 'Test' }, category: 'creation' },
        steps: [
          {
            id: 1,
            title: { fr: 'Étape 1' },
            media: {
              image: '/test.webp',
              alt: { fr: 'Image de test' }
            }
          }
        ]
      };
      container.appendChild(component);

      await component.updateComplete;

      const img = container.querySelector('img');
      expect(img).not.toBeNull();
      expect(img.src).toContain('/test.webp');
      expect(img.alt).toBe('Image de test');
    });

    it('affiche les vidéos si présentes', async () => {
      component = document.createElement('interactive-tutorial');
      component.tutorial = {
        toolName: 'testTool',
        metadata: { title: { fr: 'Test' }, category: 'creation' },
        steps: [
          {
            id: 1,
            title: { fr: 'Étape 1' },
            media: {
              video: '/test.webm'
            }
          }
        ]
      };
      container.appendChild(component);

      await component.updateComplete;

      const video = container.querySelector('video');
      expect(video).not.toBeNull();
    });
  });

  describe('Navigation entre étapes', () => {
    beforeEach(async () => {
      component = document.createElement('interactive-tutorial');
      component.tutorial = {
        toolName: 'testTool',
        metadata: { title: { fr: 'Test' }, category: 'creation' },
        steps: [
          { id: 1, title: { fr: 'Étape 1' }, description: { fr: 'Desc 1' } },
          { id: 2, title: { fr: 'Étape 2' }, description: { fr: 'Desc 2' } },
          { id: 3, title: { fr: 'Étape 3' }, description: { fr: 'Desc 3' } }
        ]
      };
      container.appendChild(component);
      await component.updateComplete;
    });

    it('navigue à l\'étape suivante', async () => {
      expect(component.currentStepIndex).toBe(0);
      component.nextStep();
      await component.updateComplete;
      expect(component.currentStepIndex).toBe(1);
    });

    it('navigue à l\'étape précédente', async () => {
      component.currentStepIndex = 2;
      component.previousStep();
      await component.updateComplete;
      expect(component.currentStepIndex).toBe(1);
    });

    it('ne dépasse pas la dernière étape', async () => {
      component.currentStepIndex = 2;
      component.nextStep();
      await component.updateComplete;
      expect(component.currentStepIndex).toBe(2);
    });

    it('ne va pas avant la première étape', async () => {
      component.currentStepIndex = 0;
      component.previousStep();
      await component.updateComplete;
      expect(component.currentStepIndex).toBe(0);
    });

    it('va à une étape spécifique', async () => {
      component.goToStep(2);
      await component.updateComplete;
      expect(component.currentStepIndex).toBe(2);
    });

    it('rejette les indices invalides', async () => {
      component.goToStep(10);
      await component.updateComplete;
      expect(component.currentStepIndex).toBe(0);

      component.goToStep(-1);
      await component.updateComplete;
      expect(component.currentStepIndex).toBe(0);
    });
  });

  describe('Gestion des langues', () => {
    beforeEach(async () => {
      component = document.createElement('interactive-tutorial');
      component.tutorial = {
        toolName: 'testTool',
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
      container.appendChild(component);
      await component.updateComplete;
    });

    it('affiche le contenu en français par défaut', () => {
      const text = container.textContent;
      expect(text).toContain('Créer un point');
      expect(text).toContain('Étape 1');
    });

    it('change la langue correctement', async () => {
      component.setLanguage('nl');
      await component.updateComplete;

      const text = container.textContent;
      expect(text).toContain('Een punt creëren');
      expect(text).toContain('Stap 1');
    });

    it('retourne au français en fallback si langue manquante', async () => {
      component.setLanguage('en');
      await component.updateComplete;

      const text = container.textContent;
      expect(text).toContain('Create a point');
    });

    it('rejette les langues non supportées', async () => {
      component.setLanguage('ja');
      const lang = component.getLanguage ? component.currentLanguage : component.currentLanguage;
      expect(lang).not.toBe('ja');
    });
  });

  describe('Localisation du texte', () => {
    beforeEach(async () => {
      component = document.createElement('interactive-tutorial');
      component.tutorial = {
        toolName: 'test',
        metadata: { title: { fr: 'Test' }, category: 'creation' },
        steps: [{ id: 1, title: { fr: 'Step' } }]
      };
      container.appendChild(component);
      await component.updateComplete;
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

    it('retourne au français en fallback', () => {
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

  describe('Indicateurs de progression', () => {
    it('affiche les points de progression', async () => {
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
      container.appendChild(component);
      await component.updateComplete;

      const dots = container.querySelectorAll('.step-dot');
      expect(dots.length).toBe(3);
      expect(dots[0].classList.contains('active')).toBe(true);
    });

    it('met à jour le point actif lors de la navigation', async () => {
      component = document.createElement('interactive-tutorial');
      component.tutorial = {
        toolName: 'test',
        metadata: { title: { fr: 'Test' }, category: 'creation' },
        steps: [
          { id: 1, title: { fr: 'Étape 1' } },
          { id: 2, title: { fr: 'Étape 2' } }
        ]
      };
      container.appendChild(component);
      await component.updateComplete;

      let dots = container.querySelectorAll('.step-dot');
      expect(dots[0].classList.contains('active')).toBe(true);
      expect(dots[1].classList.contains('active')).toBe(false);

      component.nextStep();
      await component.updateComplete;

      dots = container.querySelectorAll('.step-dot');
      expect(dots[0].classList.contains('active')).toBe(false);
      expect(dots[1].classList.contains('active')).toBe(true);
    });
  });

  describe('Fermeture du composant', () => {
    it('crée une méthode close', async () => {
      component = document.createElement('interactive-tutorial');
      component.tutorial = {
        toolName: 'test',
        metadata: { title: { fr: 'Test' }, category: 'creation' },
        steps: [{ id: 1, title: { fr: 'Étape 1' } }]
      };
      container.appendChild(component);

      expect(typeof component.close).toBe('function');
    });

    it('écoute l\'événement close-popup', async () => {
      component = document.createElement('interactive-tutorial');
      component.tutorial = {
        toolName: 'test',
        metadata: { title: { fr: 'Test' }, category: 'creation' },
        steps: [{ id: 1, title: { fr: 'Étape 1' } }]
      };
      container.appendChild(component);

      const closeSpy = vi.spyOn(component, 'close');
      window.dispatchEvent(new CustomEvent('close-popup'));

      expect(closeSpy).toHaveBeenCalled();
    });
  });

  describe('Accessibilité', () => {
    it('fournit des alt texts pour les images', async () => {
      component = document.createElement('interactive-tutorial');
      component.tutorial = {
        toolName: 'test',
        metadata: { title: { fr: 'Test' }, category: 'creation' },
        steps: [
          {
            id: 1,
            title: { fr: 'Test' },
            media: {
              image: '/test.webp',
              alt: { fr: 'Description pour accessibilité' }
            }
          }
        ]
      };
      container.appendChild(component);
      await component.updateComplete;

      const img = container.querySelector('img');
      expect(img.alt).toBe('Description pour accessibilité');
    });

    it('fournit des lazy loading pour les images', async () => {
      component = document.createElement('interactive-tutorial');
      component.tutorial = {
        toolName: 'test',
        metadata: { title: { fr: 'Test' }, category: 'creation' },
        steps: [
          {
            id: 1,
            title: { fr: 'Test' },
            media: {
              image: '/test.webp'
            }
          }
        ]
      };
      container.appendChild(component);
      await component.updateComplete;

      const img = container.querySelector('img');
      expect(img.loading).toBe('lazy');
    });
  });

  describe('Temps estimé', () => {
    it('affiche le temps estimé si disponible', async () => {
      component = document.createElement('interactive-tutorial');
      component.tutorial = {
        toolName: 'test',
        metadata: {
          title: { fr: 'Test' },
          category: 'creation',
          estimatedTime: 120
        },
        steps: [{ id: 1, title: { fr: 'Étape 1' } }]
      };
      container.appendChild(component);
      await component.updateComplete;

      const text = container.textContent;
      expect(text).toContain('2s');
    });

    it('n\'affiche pas le temps estimé si absent', async () => {
      component = document.createElement('interactive-tutorial');
      component.tutorial = {
        toolName: 'test',
        metadata: {
          title: { fr: 'Test' },
          category: 'creation'
        },
        steps: [{ id: 1, title: { fr: 'Étape 1' } }]
      };
      container.appendChild(component);
      await component.updateComplete;

      const badge = container.querySelector('.info-badge');
      expect(badge).toBeNull();
    });
  });
});
