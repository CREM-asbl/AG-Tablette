import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock de l'application AVANT l'import de ShapeGroup
const createMockApp = () => ({
  nextGroupColorIdx: 0,
});

const mockApp = createMockApp();

// Mock du module setState
const mockSetState = vi.fn();

// Mock du module App pour intercepter l'import
vi.mock('@controllers/Core/App', () => ({
  app: mockApp,
  setState: mockSetState,
}));

// Mock de uniqId pour avoir des IDs prévisibles
let idCounter = 0;
vi.mock('@controllers/Core/Tools/general.js', () => ({
  uniqId: vi.fn(() => `group-${++idCounter}`),
}));

// Maintenant importer ShapeGroup (après les mocks)
const { ShapeGroup } = await import('@controllers/Core/Objects/ShapeGroup.js');

describe('ShapeGroup - Tests TDD', () => {
  beforeEach(() => {
    // Réinitialiser le compteur d'ID et les mocks
    idCounter = 0;
    mockApp.nextGroupColorIdx = 0;
    vi.clearAllMocks();
  });

  describe('constructor', () => {
    it('devrait créer un groupe avec deux figures', () => {
      const group = new ShapeGroup('shape1', 'shape2');

      expect(group.shapesIds).toEqual(['shape1', 'shape2']);
      expect(group.id).toBe('group-1');
    });

    it('devrait assigner une couleur au groupe', () => {
      const group = new ShapeGroup('shape1', 'shape2');

      expect(group.color).toBe('#77b5fe'); // Première couleur
    });

    it('devrait incrémenter le compteur de couleur', () => {
      new ShapeGroup('shape1', 'shape2');

      expect(mockSetState).toHaveBeenCalledWith({ nextGroupColorIdx: 1 });
    });

    it('devrait faire tourner les couleurs (8 couleurs)', () => {
      mockApp.nextGroupColorIdx = 7; // Dernière couleur

      new ShapeGroup('shape1', 'shape2');

      expect(mockSetState).toHaveBeenCalledWith({ nextGroupColorIdx: 0 }); // Retour à 0
    });

    it('devrait lever une erreur si les deux figures sont identiques', () => {
      expect(() => new ShapeGroup('shape1', 'shape1')).toThrow(
        'Une même figure ne peut pas être ajoutée 2 fois à un groupe',
      );
    });

    it('devrait gérer des IDs numériques', () => {
      const group = new ShapeGroup(1, 2);

      expect(group.shapesIds).toEqual([1, 2]);
    });
  });

  describe('addShape', () => {
    it('devrait ajouter une figure au groupe', () => {
      const group = new ShapeGroup('shape1', 'shape2');

      group.addShape('shape3');

      expect(group.shapesIds).toHaveLength(3);
      expect(group.shapesIds).toContain('shape3');
    });

    it('devrait ajouter plusieurs figures successivement', () => {
      const group = new ShapeGroup('shape1', 'shape2');

      group.addShape('shape3');
      group.addShape('shape4');
      group.addShape('shape5');

      expect(group.shapesIds).toHaveLength(5);
      expect(group.shapesIds).toEqual(['shape1', 'shape2', 'shape3', 'shape4', 'shape5']);
    });

    it('ne devrait pas ajouter une figure déjà présente', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      const group = new ShapeGroup('shape1', 'shape2');

      group.addShape('shape1');

      expect(group.shapesIds).toHaveLength(2);
      expect(consoleSpy).toHaveBeenCalledWith('This shape is already part of this user group.');

      consoleSpy.mockRestore();
    });

    it('devrait permettre d\'ajouter une figure après en avoir retiré une', () => {
      const group = new ShapeGroup('shape1', 'shape2');
      group.deleteShape('shape2');

      group.addShape('shape3');

      expect(group.shapesIds).toContain('shape3');
      expect(group.shapesIds).toHaveLength(2);
    });
  });

  describe('deleteShape', () => {
    it('devrait retirer une figure du groupe', () => {
      const group = new ShapeGroup('shape1', 'shape2');

      group.deleteShape('shape2');

      expect(group.shapesIds).toHaveLength(1);
      expect(group.shapesIds).toEqual(['shape1']);
    });

    it('devrait retirer la bonne figure parmi plusieurs', () => {
      const group = new ShapeGroup('shape1', 'shape2');
      group.addShape('shape3');

      group.deleteShape('shape2');

      expect(group.shapesIds).toHaveLength(2);
      expect(group.shapesIds).toEqual(['shape1', 'shape3']);
    });

    it('devrait afficher une erreur si la figure n\'existe pas', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      const group = new ShapeGroup('shape1', 'shape2');

      group.deleteShape('inexistant');

      expect(group.shapesIds).toHaveLength(2);
      expect(consoleSpy).toHaveBeenCalledWith("Couldn't delete shape from user group.");

      consoleSpy.mockRestore();
    });

    it('devrait permettre de vider complètement le groupe', () => {
      const group = new ShapeGroup('shape1', 'shape2');

      group.deleteShape('shape1');
      group.deleteShape('shape2');

      expect(group.shapesIds).toHaveLength(0);
    });

    it('devrait gérer la suppression d\'IDs numériques', () => {
      const group = new ShapeGroup(1, 2);

      group.deleteShape(1);

      expect(group.shapesIds).toEqual([2]);
    });
  });

  describe('contains', () => {
    it('devrait retourner true si la figure fait partie du groupe', () => {
      const group = new ShapeGroup('shape1', 'shape2');

      expect(group.contains('shape1')).toBe(true);
      expect(group.contains('shape2')).toBe(true);
    });

    it('devrait retourner false si la figure ne fait pas partie du groupe', () => {
      const group = new ShapeGroup('shape1', 'shape2');

      expect(group.contains('shape3')).toBe(false);
    });

    it('devrait retourner false après suppression d\'une figure', () => {
      const group = new ShapeGroup('shape1', 'shape2');
      group.deleteShape('shape2');

      expect(group.contains('shape2')).toBe(false);
    });

    it('devrait retourner true après ajout d\'une figure', () => {
      const group = new ShapeGroup('shape1', 'shape2');
      group.addShape('shape3');

      expect(group.contains('shape3')).toBe(true);
    });

    it('devrait gérer des IDs numériques', () => {
      const group = new ShapeGroup(1, 2);

      expect(group.contains(1)).toBe(true);
      expect(group.contains(3)).toBe(false);
    });
  });

  describe('copy', () => {
    it('devrait créer une copie du groupe', () => {
      const group = new ShapeGroup('shape1', 'shape2');
      group.addShape('shape3');

      const copy = group.copy();

      expect(copy.shapesIds).toEqual(group.shapesIds);
      expect(copy).not.toBe(group);
    });

    it('devrait créer une copie avec un nouvel ID par défaut', () => {
      const group = new ShapeGroup('shape1', 'shape2');

      const copy = group.copy();

      expect(copy.id).not.toBe(group.id);
      expect(copy.id).toBe('group-2'); // Nouvel ID généré
    });

    it('devrait copier l\'ID si full = true', () => {
      const group = new ShapeGroup('shape1', 'shape2');
      const originalId = group.id;

      const copy = group.copy(true);

      expect(copy.id).toBe(originalId);
    });

    it('devrait créer une copie indépendante', () => {
      const group = new ShapeGroup('shape1', 'shape2');
      const copy = group.copy();

      copy.addShape('shape3');

      expect(group.shapesIds).toHaveLength(2);
      expect(copy.shapesIds).toHaveLength(3);
    });

    it('devrait copier un groupe vide', () => {
      const group = new ShapeGroup('shape1', 'shape2');
      group.deleteShape('shape1');
      group.deleteShape('shape2');

      const copy = group.copy();

      expect(copy.shapesIds).toHaveLength(0);
    });
  });

  describe('saveToObject', () => {
    it('devrait sauvegarder le groupe en objet', () => {
      const group = new ShapeGroup('shape1', 'shape2');

      const save = group.saveToObject();

      expect(save).toEqual({
        id: 'group-1',
        shapesIds: ['shape1', 'shape2'],
      });
    });

    it('devrait créer une copie indépendante du tableau shapesIds', () => {
      const group = new ShapeGroup('shape1', 'shape2');
      const save = group.saveToObject();

      save.shapesIds.push('shape3');

      expect(group.shapesIds).toHaveLength(2);
    });

    it('devrait sauvegarder un groupe avec plusieurs figures', () => {
      const group = new ShapeGroup('shape1', 'shape2');
      group.addShape('shape3');
      group.addShape('shape4');

      const save = group.saveToObject();

      expect(save.shapesIds).toEqual(['shape1', 'shape2', 'shape3', 'shape4']);
    });
  });

  describe('initFromObject', () => {
    it('devrait initialiser un groupe depuis un objet sauvegardé', () => {
      const group = new ShapeGroup('temp1', 'temp2');
      const savedData = {
        id: 'saved-group-id',
        shapesIds: ['shape1', 'shape2', 'shape3'],
      };

      group.initFromObject(savedData);

      expect(group.id).toBe('saved-group-id');
      expect(group.shapesIds).toEqual(['shape1', 'shape2', 'shape3']);
    });

    it('devrait créer une copie indépendante du tableau shapesIds', () => {
      const group = new ShapeGroup('temp1', 'temp2');
      const savedData = {
        id: 'saved-group-id',
        shapesIds: ['shape1', 'shape2'],
      };

      group.initFromObject(savedData);
      savedData.shapesIds.push('shape3');

      expect(group.shapesIds).toHaveLength(2);
    });

    it('devrait écraser les données existantes', () => {
      const group = new ShapeGroup('shape1', 'shape2');
      group.addShape('shape3');
      const originalId = group.id;

      const savedData = {
        id: 'new-id',
        shapesIds: ['shapeA', 'shapeB'],
      };

      group.initFromObject(savedData);

      expect(group.id).not.toBe(originalId);
      expect(group.shapesIds).toEqual(['shapeA', 'shapeB']);
    });
  });

  describe('Round-trip save/load', () => {
    it('devrait conserver les données après save et load', () => {
      const group1 = new ShapeGroup('shape1', 'shape2');
      group1.addShape('shape3');

      const savedData = group1.saveToObject();
      const group2 = new ShapeGroup('temp1', 'temp2');
      group2.initFromObject(savedData);

      expect(group2.id).toBe(group1.id);
      expect(group2.shapesIds).toEqual(group1.shapesIds);
    });
  });

  describe('Edge cases et robustesse', () => {
    it('devrait gérer des IDs de type mixte (string et number)', () => {
      const group = new ShapeGroup('shape1', 2);

      expect(group.shapesIds).toEqual(['shape1', 2]);
      expect(group.contains('shape1')).toBe(true);
      expect(group.contains(2)).toBe(true);
    });

    it('devrait gérer un groupe avec de nombreuses figures', () => {
      const group = new ShapeGroup('shape1', 'shape2');

      for (let i = 3; i <= 100; i++) {
        group.addShape(`shape${i}`);
      }

      expect(group.shapesIds).toHaveLength(100);
      expect(group.contains('shape50')).toBe(true);
      expect(group.contains('shape100')).toBe(true);
    });

    it('devrait permettre d\'ajouter et retirer rapidement', () => {
      const group = new ShapeGroup('shape1', 'shape2');

      group.addShape('shape3');
      group.deleteShape('shape2');
      group.addShape('shape4');
      group.deleteShape('shape3');

      expect(group.shapesIds).toEqual(['shape1', 'shape4']);
    });
  });

  describe('Cycle de couleurs', () => {
    it('devrait utiliser les 8 couleurs disponibles', () => {
      const colors = [];

      for (let i = 0; i < 8; i++) {
        const group = new ShapeGroup(`shape${i * 2}`, `shape${i * 2 + 1}`);
        colors.push(group.color);
        mockApp.nextGroupColorIdx = (mockApp.nextGroupColorIdx + 1) % 8;
      }

      expect(colors).toHaveLength(8);
      expect(new Set(colors).size).toBe(8); // Toutes différentes
    });

    it('devrait recommencer le cycle après 8 groupes', () => {
      mockApp.nextGroupColorIdx = 7;

      const group1 = new ShapeGroup('shape1', 'shape2');
      const color1 = group1.color;

      mockApp.nextGroupColorIdx = 0;
      const group2 = new ShapeGroup('shape3', 'shape4');
      const color2 = group2.color;

      expect(color2).toBe('#77b5fe'); // Première couleur à nouveau
    });
  });
});
