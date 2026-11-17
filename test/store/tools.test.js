import {
  resetToolsVisibility,
  setToolsVisibility,
  toggleAllToolsVisibility,
  toggleToolVisibility,
  tools,
} from '@store/tools.js';
import { beforeEach, describe, expect, it } from 'vitest';

describe('Store Tools - Tests TDD', () => {
  beforeEach(() => {
    // Réinitialiser le signal tools avant chaque test
    tools.set([]);
  });

  describe('État initial', () => {
    it('devrait initialiser avec un tableau vide', () => {
      expect(tools.get()).toEqual([]);
    });

    it('devrait être un signal réactif', () => {
      expect(tools).toBeDefined();
      expect(typeof tools.get).toBe('function');
      expect(typeof tools.set).toBe('function');
    });
  });

  describe('resetToolsVisibility', () => {
    it('ne devrait rien faire si le tableau est vide', () => {
      tools.set([]);
      expect(() => resetToolsVisibility()).not.toThrow();
      expect(tools.get()).toEqual([]);
    });

    it('devrait rendre tous les outils visibles', () => {
      tools.set([
        { name: 'tool1', isVisible: false },
        { name: 'tool2', isVisible: false },
        { name: 'tool3', isVisible: true },
      ]);

      resetToolsVisibility();

      const current = tools.get();
      expect(current[0].isVisible).toBe(true);
      expect(current[1].isVisible).toBe(true);
      expect(current[2].isVisible).toBe(true);
    });

    it('devrait émettre un nouveau signal (immutabilité)', () => {
      const original = [{ name: 'tool1', isVisible: false }];
      tools.set(original);

      resetToolsVisibility();

      const updated = tools.get();
      expect(updated).not.toBe(original);
      expect(updated[0].isVisible).toBe(true);
    });

    it('devrait être idempotent', () => {
      tools.set([
        { name: 'tool1', isVisible: false },
        { name: 'tool2', isVisible: true },
      ]);

      resetToolsVisibility();
      const firstResult = tools.get();

      resetToolsVisibility();
      const secondResult = tools.get();

      // Les deux résultats devraient avoir la même structure
      expect(firstResult[0].isVisible).toBe(secondResult[0].isVisible);
      expect(firstResult[1].isVisible).toBe(secondResult[1].isVisible);
    });
  });

  describe('setToolsVisibility', () => {
    it('devrait mettre à jour la visibilité des outils', () => {
      tools.set([
        { name: 'tool1', isVisible: true },
        { name: 'tool2', isVisible: true },
        { name: 'tool3', isVisible: true },
      ]);

      setToolsVisibility([
        { name: 'tool1', isVisible: false },
        { name: 'tool2', isVisible: true },
        { name: 'tool3', isVisible: false },
      ]);

      const current = tools.get();
      expect(current[0].isVisible).toBe(false);
      expect(current[1].isVisible).toBe(true);
      expect(current[2].isVisible).toBe(false);
    });

    it('devrait ignorer les outils non trouvés dans le paramètre', () => {
      tools.set([
        { name: 'tool1', isVisible: true },
        { name: 'tool2', isVisible: true },
      ]);

      // Seulement tool1 fourni
      setToolsVisibility([{ name: 'tool1', isVisible: false }]);

      const current = tools.get();
      expect(current[0].isVisible).toBe(false);
      expect(current[1].isVisible).toBe(true); // Inchangé
    });

    it('devrait gérer des outils inexistants dans le paramètre', () => {
      tools.set([{ name: 'tool1', isVisible: true }]);

      setToolsVisibility([
        { name: 'tool1', isVisible: false },
        { name: 'inexistant', isVisible: false },
      ]);

      const current = tools.get();
      expect(current[0].isVisible).toBe(false);
      expect(current).toHaveLength(1); // Pas d'ajout
    });

    it('devrait émettre un nouveau signal', () => {
      const original = [{ name: 'tool1', isVisible: true }];
      tools.set(original);

      setToolsVisibility([{ name: 'tool1', isVisible: false }]);

      const updated = tools.get();
      expect(updated).not.toBe(original);
    });

    it('ne devrait rien faire si le tableau de visibilité est vide', () => {
      tools.set([{ name: 'tool1', isVisible: true }]);

      setToolsVisibility([]);

      const current = tools.get();
      expect(current[0].isVisible).toBe(true); // Inchangé
    });
  });

  describe('toggleAllToolsVisibility', () => {
    it('devrait masquer tous les outils', () => {
      tools.set([
        { name: 'tool1', isVisible: true },
        { name: 'tool2', isVisible: true },
      ]);

      toggleAllToolsVisibility(false);

      const current = tools.get();
      expect(current[0].isVisible).toBe(false);
      expect(current[1].isVisible).toBe(false);
    });

    it('devrait afficher tous les outils', () => {
      tools.set([
        { name: 'tool1', isVisible: false },
        { name: 'tool2', isVisible: false },
      ]);

      toggleAllToolsVisibility(true);

      const current = tools.get();
      expect(current[0].isVisible).toBe(true);
      expect(current[1].isVisible).toBe(true);
    });

    it('devrait gérer un tableau vide', () => {
      tools.set([]);

      expect(() => toggleAllToolsVisibility(false)).not.toThrow();
      expect(tools.get()).toEqual([]);
    });

    it('devrait émettre un nouveau signal', () => {
      const original = [{ name: 'tool1', isVisible: true }];
      tools.set(original);

      toggleAllToolsVisibility(false);

      const updated = tools.get();
      expect(updated).not.toBe(original);
    });

    it('devrait gérer des valeurs mixtes', () => {
      tools.set([
        { name: 'tool1', isVisible: true },
        { name: 'tool2', isVisible: false },
        { name: 'tool3', isVisible: true },
      ]);

      toggleAllToolsVisibility(false);

      const current = tools.get();
      expect(current.every((t) => !t.isVisible)).toBe(true);
    });
  });

  describe('toggleToolVisibility', () => {
    it('devrait inverser la visibilité d\'un outil', () => {
      tools.set([
        { name: 'tool1', isVisible: true },
        { name: 'tool2', isVisible: false },
      ]);

      toggleToolVisibility('tool1');

      const current = tools.get();
      expect(current[0].isVisible).toBe(false);
      expect(current[1].isVisible).toBe(false); // Inchangé
    });

    it('devrait inverser plusieurs fois correctement', () => {
      tools.set([{ name: 'tool1', isVisible: true }]);

      toggleToolVisibility('tool1');
      expect(tools.get()[0].isVisible).toBe(false);

      toggleToolVisibility('tool1');
      expect(tools.get()[0].isVisible).toBe(true);

      toggleToolVisibility('tool1');
      expect(tools.get()[0].isVisible).toBe(false);
    });

    it('devrait émettre un nouveau signal', () => {
      const original = [{ name: 'tool1', isVisible: true }];
      tools.set(original);

      toggleToolVisibility('tool1');

      const updated = tools.get();
      expect(updated).not.toBe(original);
    });

    it('devrait planter si l\'outil n\'existe pas', () => {
      tools.set([{ name: 'tool1', isVisible: true }]);

      // Le code actuel va planter avec "Cannot read property 'isVisible' of undefined"
      expect(() => toggleToolVisibility('inexistant')).toThrow();
    });

    it('devrait gérer des noms d\'outils avec caractères spéciaux', () => {
      tools.set([{ name: 'tool-1_test', isVisible: true }]);

      toggleToolVisibility('tool-1_test');

      expect(tools.get()[0].isVisible).toBe(false);
    });
  });

  describe('Scénarios d\'intégration', () => {
    it('devrait gérer un cycle complet de manipulation', () => {
      // Setup
      tools.set([
        { name: 'tool1', isVisible: true },
        { name: 'tool2', isVisible: true },
        { name: 'tool3', isVisible: true },
      ]);

      // Masquer tout
      toggleAllToolsVisibility(false);
      expect(tools.get().every((t) => !t.isVisible)).toBe(true);

      // Afficher tool1
      toggleToolVisibility('tool1');
      expect(tools.get()[0].isVisible).toBe(true);
      expect(tools.get()[1].isVisible).toBe(false);

      // Reset
      resetToolsVisibility();
      expect(tools.get().every((t) => t.isVisible)).toBe(true);
    });

    it('devrait maintenir l\'immutabilité à travers plusieurs opérations', () => {
      const original = [{ name: 'tool1', isVisible: true }];
      tools.set(original);

      toggleToolVisibility('tool1');
      const afterToggle = tools.get();

      resetToolsVisibility();
      const afterReset = tools.get();

      expect(original).not.toBe(afterToggle);
      expect(afterToggle).not.toBe(afterReset);
    });

    it('devrait gérer des mises à jour partielles suivies de reset', () => {
      tools.set([
        { name: 'tool1', isVisible: true },
        { name: 'tool2', isVisible: true },
      ]);

      setToolsVisibility([{ name: 'tool1', isVisible: false }]);
      expect(tools.get()[0].isVisible).toBe(false);
      expect(tools.get()[1].isVisible).toBe(true);

      resetToolsVisibility();
      expect(tools.get()[0].isVisible).toBe(true);
      expect(tools.get()[1].isVisible).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('devrait gérer un tableau vide sans erreur', () => {
      tools.set([]);

      expect(() => resetToolsVisibility()).not.toThrow();
      expect(() => toggleAllToolsVisibility(true)).not.toThrow();
      expect(() => setToolsVisibility([])).not.toThrow();
    });

    it('devrait gérer des valeurs de visibilité non-booléennes', () => {
      tools.set([{ name: 'tool1', isVisible: 'true' }]); // String au lieu de boolean

      toggleToolVisibility('tool1');

      // Inversion logique devrait fonctionner avec truthy/falsy
      const current = tools.get();
      expect(current[0].isVisible).toBe(false);
    });

    it('devrait préserver les propriétés supplémentaires des outils', () => {
      tools.set([
        {
          name: 'tool1',
          isVisible: true,
          icon: 'icon.svg',
          customProp: { nested: 'value' },
        },
      ]);

      toggleToolVisibility('tool1');

      const current = tools.get();
      expect(current[0].icon).toBe('icon.svg');
      expect(current[0].customProp).toEqual({ nested: 'value' });
    });

    it('devrait gérer des noms d\'outils null ou undefined', () => {
      tools.set([
        { name: null, isVisible: true },
        { name: undefined, isVisible: false },
      ]);

      expect(() => resetToolsVisibility()).not.toThrow();

      const current = tools.get();
      expect(current[0].isVisible).toBe(true);
      expect(current[1].isVisible).toBe(true);
    });
  });

  describe('Performance et stabilité', () => {
    it('devrait supporter de nombreux outils', () => {
      const manyTools = Array.from({ length: 1000 }, (_, i) => ({
        name: `tool${i}`,
        isVisible: true,
      }));
      tools.set(manyTools);

      toggleAllToolsVisibility(false);

      const current = tools.get();
      expect(current).toHaveLength(1000);
      expect(current.every((t) => !t.isVisible)).toBe(true);
    });

    it('devrait supporter de nombreuses opérations successives', () => {
      tools.set(
        Array.from({ length: 100 }, (_, i) => ({
          name: `tool${i}`,
          isVisible: true,
        })),
      );

      // 100 toggles
      for (let i = 0; i < 100; i++) {
        toggleToolVisibility(`tool${i}`);
      }

      const current = tools.get();
      expect(current).toHaveLength(100);
      expect(current.every((t) => !t.isVisible)).toBe(true);
    });

    it('devrait être performant avec des mises à jour partielles répétées', () => {
      tools.set(
        Array.from({ length: 50 }, (_, i) => ({
          name: `tool${i}`,
          isVisible: true,
        })),
      );

      // 100 mises à jour partielles
      for (let i = 0; i < 100; i++) {
        setToolsVisibility([
          { name: `tool${i % 50}`, isVisible: i % 2 === 0 },
        ]);
      }

      const current = tools.get();
      expect(current).toHaveLength(50);
    });
  });

  describe('Validation des données', () => {
    it('devrait gérer des outils avec des structures minimales', () => {
      tools.set([{ name: 'tool1' }]); // Pas de isVisible

      toggleToolVisibility('tool1');

      const current = tools.get();
      expect(current[0].isVisible).toBe(true); // undefined devient true (not undefined = true)
    });

    it('devrait gérer setToolsVisibility avec des objets incomplets', () => {
      tools.set([
        { name: 'tool1', isVisible: true },
        { name: 'tool2', isVisible: true },
      ]);

      setToolsVisibility([
        { name: 'tool1' }, // Pas de isVisible
      ]);

      const current = tools.get();
      // tool1 ne devrait pas être modifié car toolVisibility.isVisible est undefined
      expect(current[0].isVisible).toBe(true);
      expect(current[1].isVisible).toBe(true);
    });
  });
});
