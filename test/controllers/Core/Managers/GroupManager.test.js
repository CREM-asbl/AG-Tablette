import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock de l'application AVANT l'import de GroupManager
const createMockApp = () => ({
  workspace: {
    shapeGroups: [],
  },
});

const mockApp = createMockApp();

// Mock du module App pour intercepter l'import
vi.mock('@controllers/Core/App', () => ({
  app: mockApp,
}));

// Maintenant importer GroupManager (après le mock)
const { GroupManager } = await import('@controllers/Core/Managers/GroupManager.js');

describe('GroupManager - Tests TDD', () => {
  beforeEach(() => {
    // Réinitialiser les arrays avant chaque test
    mockApp.workspace.shapeGroups = [];
    vi.clearAllMocks();
  });

  describe('addGroup', () => {
    it('devrait ajouter un groupe à la fin par défaut', () => {
      const group1 = { id: 'g1', contains: vi.fn() };
      const group2 = { id: 'g2', contains: vi.fn() };

      GroupManager.addGroup(group1);
      GroupManager.addGroup(group2);

      expect(mockApp.workspace.shapeGroups).toHaveLength(2);
      expect(mockApp.workspace.shapeGroups[0]).toBe(group1);
      expect(mockApp.workspace.shapeGroups[1]).toBe(group2);
    });

    it('devrait ajouter un groupe à un index spécifique', () => {
      const group1 = { id: 'g1', contains: vi.fn() };
      const group2 = { id: 'g2', contains: vi.fn() };
      const group3 = { id: 'g3', contains: vi.fn() };

      GroupManager.addGroup(group1);
      GroupManager.addGroup(group3);
      GroupManager.addGroup(group2, 1); // Insérer entre group1 et group3

      expect(mockApp.workspace.shapeGroups).toHaveLength(3);
      expect(mockApp.workspace.shapeGroups[0]).toBe(group1);
      expect(mockApp.workspace.shapeGroups[1]).toBe(group2);
      expect(mockApp.workspace.shapeGroups[2]).toBe(group3);
    });

    it('devrait ajouter un groupe à l\'index 0', () => {
      const group1 = { id: 'g1', contains: vi.fn() };
      const group2 = { id: 'g2', contains: vi.fn() };

      GroupManager.addGroup(group1);
      GroupManager.addGroup(group2, 0);

      expect(mockApp.workspace.shapeGroups).toHaveLength(2);
      expect(mockApp.workspace.shapeGroups[0]).toBe(group2);
      expect(mockApp.workspace.shapeGroups[1]).toBe(group1);
    });

    it('devrait gérer plusieurs groupes avec le même ordre', () => {
      const groups = Array.from({ length: 5 }, (_, i) => ({
        id: `g${i}`,
        contains: vi.fn(),
      }));

      groups.forEach((g) => GroupManager.addGroup(g));

      expect(mockApp.workspace.shapeGroups).toHaveLength(5);
      groups.forEach((g, idx) => {
        expect(mockApp.workspace.shapeGroups[idx]).toBe(g);
      });
    });
  });

  describe('getGroupIndex', () => {
    it('devrait retourner l\'index correct d\'un groupe', () => {
      const group1 = { id: 'g1', contains: vi.fn() };
      const group2 = { id: 'g2', contains: vi.fn() };
      const group3 = { id: 'g3', contains: vi.fn() };

      mockApp.workspace.shapeGroups = [group1, group2, group3];

      expect(GroupManager.getGroupIndex(group1)).toBe(0);
      expect(GroupManager.getGroupIndex(group2)).toBe(1);
      expect(GroupManager.getGroupIndex(group3)).toBe(2);
    });

    it('devrait retourner -1 si le groupe n\'existe pas', () => {
      const group1 = { id: 'g1', contains: vi.fn() };
      const group2 = { id: 'g2', contains: vi.fn() };

      mockApp.workspace.shapeGroups = [group1];

      expect(GroupManager.getGroupIndex(group2)).toBe(-1);
    });

    it('devrait retourner -1 si le tableau est vide', () => {
      const group = { id: 'g1', contains: vi.fn() };

      mockApp.workspace.shapeGroups = [];

      expect(GroupManager.getGroupIndex(group)).toBe(-1);
    });

    it('devrait trouver le groupe même avec d\'autres propriétés différentes', () => {
      const group1 = { id: 'g1', contains: vi.fn(), extra: 'data' };
      const group1Copy = { id: 'g1', contains: vi.fn(), extra: 'different' };

      mockApp.workspace.shapeGroups = [group1];

      expect(GroupManager.getGroupIndex(group1Copy)).toBe(0);
    });
  });

  describe('getShapeGroup', () => {
    it('devrait retourner le groupe contenant la forme', () => {
      const shape = { id: 's1' };
      const group1 = {
        id: 'g1',
        contains: vi.fn((id) => id === 's1'),
      };
      const group2 = {
        id: 'g2',
        contains: vi.fn(() => false),
      };

      mockApp.workspace.shapeGroups = [group1, group2];

      const result = GroupManager.getShapeGroup(shape);

      expect(result).toBe(group1);
      expect(group1.contains).toHaveBeenCalledWith('s1');
    });

    it('devrait retourner null si aucun groupe ne contient la forme', () => {
      const shape = { id: 's1' };
      const group1 = {
        id: 'g1',
        contains: vi.fn(() => false),
      };
      const group2 = {
        id: 'g2',
        contains: vi.fn(() => false),
      };

      mockApp.workspace.shapeGroups = [group1, group2];

      const result = GroupManager.getShapeGroup(shape);

      expect(result).toBeNull();
    });

    it('devrait retourner null si le tableau est vide', () => {
      const shape = { id: 's1' };

      mockApp.workspace.shapeGroups = [];

      const result = GroupManager.getShapeGroup(shape);

      expect(result).toBeNull();
    });

    it('devrait retourner le premier groupe si plusieurs contiennent la forme', () => {
      const shape = { id: 's1' };
      const group1 = {
        id: 'g1',
        contains: vi.fn(() => true),
      };
      const group2 = {
        id: 'g2',
        contains: vi.fn(() => true),
      };

      mockApp.workspace.shapeGroups = [group1, group2];

      const result = GroupManager.getShapeGroup(shape);

      expect(result).toBe(group1);
      // group2.contains ne devrait pas être appelé car on trouve déjà group1
      expect(group2.contains).not.toHaveBeenCalled();
    });
  });

  describe('getGroup', () => {
    it('devrait retourner le groupe avec l\'id correspondant', () => {
      const group1 = { id: 'g1', contains: vi.fn() };
      const group2 = { id: 'g2', contains: vi.fn() };
      const group3 = { id: 'g3', contains: vi.fn() };

      mockApp.workspace.shapeGroups = [group1, group2, group3];

      expect(GroupManager.getGroup('g1')).toBe(group1);
      expect(GroupManager.getGroup('g2')).toBe(group2);
      expect(GroupManager.getGroup('g3')).toBe(group3);
    });

    it('devrait retourner null si le groupe n\'existe pas', () => {
      const group1 = { id: 'g1', contains: vi.fn() };

      mockApp.workspace.shapeGroups = [group1];

      expect(GroupManager.getGroup('g999')).toBeNull();
    });

    it('devrait retourner null si le tableau est vide', () => {
      mockApp.workspace.shapeGroups = [];

      expect(GroupManager.getGroup('g1')).toBeNull();
    });

    it('devrait gérer les ids numériques', () => {
      const group1 = { id: 1, contains: vi.fn() };
      const group2 = { id: 2, contains: vi.fn() };

      mockApp.workspace.shapeGroups = [group1, group2];

      expect(GroupManager.getGroup(1)).toBe(group1);
      expect(GroupManager.getGroup(2)).toBe(group2);
    });
  });

  describe('deleteGroup', () => {
    it('devrait supprimer un groupe existant', () => {
      const group1 = { id: 'g1', contains: vi.fn() };
      const group2 = { id: 'g2', contains: vi.fn() };
      const group3 = { id: 'g3', contains: vi.fn() };

      mockApp.workspace.shapeGroups = [group1, group2, group3];

      GroupManager.deleteGroup(group2);

      expect(mockApp.workspace.shapeGroups).toHaveLength(2);
      expect(mockApp.workspace.shapeGroups).toEqual([group1, group3]);
    });

    it('devrait afficher une erreur si le groupe n\'existe pas', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      const group1 = { id: 'g1', contains: vi.fn() };
      const group2 = { id: 'g2', contains: vi.fn() };

      mockApp.workspace.shapeGroups = [group1];

      GroupManager.deleteGroup(group2);

      expect(mockApp.workspace.shapeGroups).toHaveLength(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith("Couldn't delete group: ", group2);

      consoleErrorSpy.mockRestore();
    });

    it('devrait gérer la suppression du premier groupe', () => {
      const group1 = { id: 'g1', contains: vi.fn() };
      const group2 = { id: 'g2', contains: vi.fn() };
      const group3 = { id: 'g3', contains: vi.fn() };

      mockApp.workspace.shapeGroups = [group1, group2, group3];

      GroupManager.deleteGroup(group1);

      expect(mockApp.workspace.shapeGroups).toHaveLength(2);
      expect(mockApp.workspace.shapeGroups).toEqual([group2, group3]);
    });

    it('devrait gérer la suppression du dernier groupe', () => {
      const group1 = { id: 'g1', contains: vi.fn() };
      const group2 = { id: 'g2', contains: vi.fn() };
      const group3 = { id: 'g3', contains: vi.fn() };

      mockApp.workspace.shapeGroups = [group1, group2, group3];

      GroupManager.deleteGroup(group3);

      expect(mockApp.workspace.shapeGroups).toHaveLength(2);
      expect(mockApp.workspace.shapeGroups).toEqual([group1, group2]);
    });
  });

  describe('Edge cases et robustesse', () => {
    it('devrait gérer des groupes avec des ids identiques', () => {
      const group1 = { id: 'g1', contains: vi.fn() };
      const group2 = { id: 'g1', contains: vi.fn() }; // Même id (ne devrait pas arriver en prod)

      mockApp.workspace.shapeGroups = [group1, group2];

      // getGroup devrait retourner le premier trouvé
      expect(GroupManager.getGroup('g1')).toBe(group1);

      // getGroupIndex devrait retourner le premier trouvé
      expect(GroupManager.getGroupIndex({ id: 'g1', contains: vi.fn() })).toBe(0);
    });

    it('devrait gérer l\'ajout à un index négatif', () => {
      const group1 = { id: 'g1', contains: vi.fn() };
      const group2 = { id: 'g2', contains: vi.fn() };

      mockApp.workspace.shapeGroups = [group1];

      GroupManager.addGroup(group2, -1);

      // splice avec index négatif compte à partir de la fin
      expect(mockApp.workspace.shapeGroups).toHaveLength(2);
    });

    it('devrait gérer l\'ajout à un index > length', () => {
      const group1 = { id: 'g1', contains: vi.fn() };
      const group2 = { id: 'g2', contains: vi.fn() };

      mockApp.workspace.shapeGroups = [group1];

      GroupManager.addGroup(group2, 10);

      // splice avec index > length ajoute à la fin
      expect(mockApp.workspace.shapeGroups).toHaveLength(2);
      expect(mockApp.workspace.shapeGroups[1]).toBe(group2);
    });
  });

  describe('Performance', () => {
    it('devrait gérer de nombreux groupes efficacement', () => {
      const groups = Array.from({ length: 1000 }, (_, i) => ({
        id: `g${i}`,
        contains: vi.fn(),
      }));

      groups.forEach((g) => GroupManager.addGroup(g));

      const startTime = performance.now();
      const result = GroupManager.getGroup('g500');
      const endTime = performance.now();

      expect(result).toBe(groups[500]);
      expect(endTime - startTime).toBeLessThan(10); // Devrait être très rapide (<10ms)
    });

    it('devrait gérer la suppression multiple efficacement', () => {
      const groups = Array.from({ length: 100 }, (_, i) => ({
        id: `g${i}`,
        contains: vi.fn(),
      }));

      mockApp.workspace.shapeGroups = [...groups];

      const startTime = performance.now();
      for (let i = 0; i < 50; i++) {
        GroupManager.deleteGroup(groups[i]);
      }
      const endTime = performance.now();

      expect(mockApp.workspace.shapeGroups).toHaveLength(50);
      expect(endTime - startTime).toBeLessThan(50); // Devrait être rapide (<50ms)
    });
  });
});
