import {
  getFamily,
  kit,
  loadKit,
  resetKit,
  resetKitVisibility,
  setFamiliesVisibility,
  toggleAllFamiliesVisibility,
  toggleFamilyVisibility,
} from '@store/kit.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('Store Kit - Tests TDD', () => {
  beforeEach(() => {
    // Réinitialiser le kit avant chaque test
    resetKit();
    // Nettoyer les event listeners
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Nettoyer les mocks après chaque test
    vi.restoreAllMocks();
  });

  describe('État initial', () => {
    it('devrait initialiser avec un kit null', () => {
      resetKit();
      expect(kit.get()).toBeNull();
    });

    it('devrait être un signal réactif', () => {
      expect(kit).toBeDefined();
      expect(typeof kit.get).toBe('function');
      expect(typeof kit.set).toBe('function');
    });
  });

  describe('getFamily', () => {
    it('devrait retourner undefined si le kit est null', () => {
      resetKit();
      const result = getFamily('test');
      expect(result).toBeUndefined();
    });

    it('devrait retourner la famille correspondante', () => {
      kit.set({
        families: [
          { name: 'famille1', isVisible: true },
          { name: 'famille2', isVisible: false },
        ],
      });

      const result = getFamily('famille1');
      expect(result).toBeDefined();
      expect(result.name).toBe('famille1');
      expect(result.isVisible).toBe(true);
    });

    it('devrait retourner undefined si la famille n\'existe pas', () => {
      kit.set({
        families: [{ name: 'famille1', isVisible: true }],
      });

      const result = getFamily('inexistante');
      expect(result).toBeUndefined();
    });
  });

  describe('loadKit', () => {
    beforeEach(() => {
      // Mock de window.dispatchEvent pour les notifications
      vi.spyOn(window, 'dispatchEvent').mockImplementation(() => true);
    });

    it('devrait rejeter si le nom est invalide (null)', async () => {
      await expect(loadKit(null)).rejects.toThrow('Nom de kit invalide');
    });

    it('devrait rejeter si le nom est invalide (non-string)', async () => {
      await expect(loadKit(123)).rejects.toThrow('Nom de kit invalide');
    });

    it('devrait rejeter si le nom est vide', async () => {
      await expect(loadKit('')).rejects.toThrow('Nom de kit invalide');
    });

    it('devrait afficher une notification en cas d\'erreur', async () => {
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      try {
        await loadKit(null);
      } catch (error) {
        // Erreur attendue
      }

      expect(dispatchSpy).toHaveBeenCalled();
      const event = dispatchSpy.mock.calls[0][0];
      expect(event.type).toBe('show-notif');
      expect(event.detail.message).toContain('Erreur lors du chargement du kit');
    });

    it('devrait gérer un kit inexistant gracieusement', async () => {
      const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

      await expect(loadKit('kit-inexistant-xyz')).rejects.toThrow();

      expect(dispatchSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'show-notif',
        }),
      );
    });
  });

  describe('resetKit', () => {
    it('devrait réinitialiser le kit à null', () => {
      kit.set({
        families: [{ name: 'test', isVisible: true }],
      });

      resetKit();

      expect(kit.get()).toBeNull();
    });

    it('devrait être idempotent', () => {
      resetKit();
      const firstCall = kit.get();

      resetKit();
      const secondCall = kit.get();

      expect(firstCall).toBe(secondCall);
      expect(firstCall).toBeNull();
    });
  });

  describe('resetKitVisibility', () => {
    it('ne devrait rien faire si le kit est null', () => {
      resetKit();
      expect(() => resetKitVisibility()).not.toThrow();
      expect(kit.get()).toBeNull();
    });

    it('ne devrait rien faire si families est undefined', () => {
      kit.set({});
      expect(() => resetKitVisibility()).not.toThrow();
    });

    it('devrait rendre toutes les familles visibles', () => {
      kit.set({
        families: [
          { name: 'famille1', isVisible: false },
          { name: 'famille2', isVisible: false },
          { name: 'famille3', isVisible: true },
        ],
      });

      resetKitVisibility();

      const current = kit.get();
      expect(current.families[0].isVisible).toBe(true);
      expect(current.families[1].isVisible).toBe(true);
      expect(current.families[2].isVisible).toBe(true);
    });

    it('devrait émettre un nouveau signal (immutabilité)', () => {
      const original = {
        families: [{ name: 'famille1', isVisible: false }],
      };
      kit.set(original);

      resetKitVisibility();

      const updated = kit.get();
      expect(updated).not.toBe(original);
      expect(updated.families[0].isVisible).toBe(true);
    });
  });

  describe('setFamiliesVisibility', () => {
    it('devrait mettre à jour la visibilité des familles', () => {
      kit.set({
        families: [
          { name: 'famille1', isVisible: true },
          { name: 'famille2', isVisible: true },
          { name: 'famille3', isVisible: true },
        ],
      });

      setFamiliesVisibility([
        { name: 'famille1', isVisible: false },
        { name: 'famille2', isVisible: true },
        { name: 'famille3', isVisible: false },
      ]);

      const current = kit.get();
      expect(current.families[0].isVisible).toBe(false);
      expect(current.families[1].isVisible).toBe(true);
      expect(current.families[2].isVisible).toBe(false);
    });

    it('devrait gérer les familles manquantes dans le paramètre', () => {
      kit.set({
        families: [
          { name: 'famille1', isVisible: true },
          { name: 'famille2', isVisible: true },
        ],
      });

      // Seulement famille1 fournie
      expect(() =>
        setFamiliesVisibility([{ name: 'famille1', isVisible: false }]),
      ).toThrow(); // Le code actuel va planter avec find(undefined)
    });

    it('devrait émettre un nouveau signal', () => {
      const original = {
        families: [{ name: 'famille1', isVisible: true }],
      };
      kit.set(original);

      setFamiliesVisibility([{ name: 'famille1', isVisible: false }]);

      const updated = kit.get();
      expect(updated).not.toBe(original);
    });
  });

  describe('toggleAllFamiliesVisibility', () => {
    it('ne devrait rien faire si families est undefined', () => {
      kit.set({});
      expect(() => toggleAllFamiliesVisibility(false)).not.toThrow();
    });

    it('devrait masquer toutes les familles', () => {
      kit.set({
        families: [
          { name: 'famille1', isVisible: true },
          { name: 'famille2', isVisible: true },
        ],
      });

      toggleAllFamiliesVisibility(false);

      const current = kit.get();
      expect(current.families[0].isVisible).toBe(false);
      expect(current.families[1].isVisible).toBe(false);
    });

    it('devrait afficher toutes les familles', () => {
      kit.set({
        families: [
          { name: 'famille1', isVisible: false },
          { name: 'famille2', isVisible: false },
        ],
      });

      toggleAllFamiliesVisibility(true);

      const current = kit.get();
      expect(current.families[0].isVisible).toBe(true);
      expect(current.families[1].isVisible).toBe(true);
    });

    it('devrait émettre un nouveau signal', () => {
      const original = {
        families: [{ name: 'famille1', isVisible: true }],
      };
      kit.set(original);

      toggleAllFamiliesVisibility(false);

      const updated = kit.get();
      expect(updated).not.toBe(original);
    });
  });

  describe('toggleFamilyVisibility', () => {
    it('devrait inverser la visibilité d\'une famille', () => {
      kit.set({
        families: [
          { name: 'famille1', isVisible: true },
          { name: 'famille2', isVisible: false },
        ],
      });

      toggleFamilyVisibility('famille1');

      const current = kit.get();
      expect(current.families[0].isVisible).toBe(false);
      expect(current.families[1].isVisible).toBe(false); // Inchangé
    });

    it('devrait inverser plusieurs fois correctement', () => {
      kit.set({
        families: [{ name: 'famille1', isVisible: true }],
      });

      toggleFamilyVisibility('famille1');
      expect(kit.get().families[0].isVisible).toBe(false);

      toggleFamilyVisibility('famille1');
      expect(kit.get().families[0].isVisible).toBe(true);

      toggleFamilyVisibility('famille1');
      expect(kit.get().families[0].isVisible).toBe(false);
    });

    it('devrait émettre un nouveau signal', () => {
      const original = {
        families: [{ name: 'famille1', isVisible: true }],
      };
      kit.set(original);

      toggleFamilyVisibility('famille1');

      const updated = kit.get();
      expect(updated).not.toBe(original);
    });

    it('devrait planter si la famille n\'existe pas', () => {
      kit.set({
        families: [{ name: 'famille1', isVisible: true }],
      });

      // Le code actuel va planter avec "Cannot read property 'isVisible' of undefined"
      expect(() => toggleFamilyVisibility('inexistante')).toThrow();
    });
  });

  describe('Scénarios d\'intégration', () => {
    it('devrait gérer un cycle complet de manipulation', () => {
      // Setup
      kit.set({
        families: [
          { name: 'famille1', isVisible: true },
          { name: 'famille2', isVisible: true },
        ],
      });

      // Masquer tout
      toggleAllFamiliesVisibility(false);
      expect(kit.get().families.every((f) => !f.isVisible)).toBe(true);

      // Afficher famille1
      toggleFamilyVisibility('famille1');
      expect(kit.get().families[0].isVisible).toBe(true);
      expect(kit.get().families[1].isVisible).toBe(false);

      // Reset
      resetKitVisibility();
      expect(kit.get().families.every((f) => f.isVisible)).toBe(true);
    });

    it('devrait maintenir l\'immutabilité à travers plusieurs opérations', () => {
      const original = {
        families: [{ name: 'famille1', isVisible: true }],
      };
      kit.set(original);

      toggleFamilyVisibility('famille1');
      const afterToggle = kit.get();

      resetKitVisibility();
      const afterReset = kit.get();

      expect(original).not.toBe(afterToggle);
      expect(afterToggle).not.toBe(afterReset);
    });
  });

  describe('Edge cases', () => {
    it('devrait gérer un kit avec un tableau families vide', () => {
      kit.set({ families: [] });

      expect(() => resetKitVisibility()).not.toThrow();
      expect(() => toggleAllFamiliesVisibility(true)).not.toThrow();
      expect(kit.get().families).toEqual([]);
    });

    it('devrait gérer des valeurs de visibilité non-booléennes', () => {
      kit.set({
        families: [{ name: 'famille1', isVisible: 'true' }], // String au lieu de boolean
      });

      toggleFamilyVisibility('famille1');

      // Inversion logique devrait fonctionner avec truthy/falsy
      const current = kit.get();
      expect(current.families[0].isVisible).toBe(false);
    });
  });

  describe('Performance et stabilité', () => {
    it('devrait supporter de nombreuses opérations successives', () => {
      kit.set({
        families: Array.from({ length: 100 }, (_, i) => ({
          name: `famille${i}`,
          isVisible: true,
        })),
      });

      // 100 toggles
      for (let i = 0; i < 100; i++) {
        toggleFamilyVisibility(`famille${i}`);
      }

      const current = kit.get();
      expect(current.families).toHaveLength(100);
      expect(current.families.every((f) => !f.isVisible)).toBe(true);
    });

    it('devrait maintenir les références internes correctement', () => {
      kit.set({
        families: [
          {
            name: 'famille1',
            isVisible: true,
            customProp: { nested: 'value' },
          },
        ],
      });

      toggleFamilyVisibility('famille1');

      const current = kit.get();
      expect(current.families[0].customProp).toEqual({ nested: 'value' });
    });
  });
});
