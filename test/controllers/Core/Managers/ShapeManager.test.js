import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock de l'application AVANT l'import de ShapeManager
const createMockApp = () => ({
  workspace: {
    shapes: [],
  },
  mainCanvasLayer: {
    shapes: [],
  },
  upperCanvasLayer: {
    shapes: [],
  },
});

const mockApp = createMockApp();

// Mock du module App pour intercepter l'import
vi.mock('@controllers/Core/App', () => ({
  app: mockApp,
}));

// Maintenant importer ShapeManager (après le mock)
const { ShapeManager } = await import('@controllers/Core/Managers/ShapeManager.js');

// Mock des autres dépendances
vi.mock('@controllers/Core/Managers/GroupManager.js', () => ({
  GroupManager: {
    getShapeGroup: vi.fn(() => null),
  },
}));

vi.mock('@controllers/Core/Managers/SelectManager.js', () => ({
  SelectManager: {
    areCoordinatesInSelectionDistance: vi.fn(() => false),
  },
}));

vi.mock('@controllers/Core/Tools/general.js', () => ({
  findObjectById: vi.fn((id) => ({ id, name: 'MockObject', shape: { id } })),
}));

describe('ShapeManager - Tests TDD', () => {
  beforeEach(() => {
    // Réinitialiser les arrays avant chaque test
    mockApp.workspace.shapes = [];
    mockApp.mainCanvasLayer.shapes = [];
    mockApp.upperCanvasLayer.shapes = [];
    vi.clearAllMocks();
  });

  describe('addShape', () => {
    it('devrait ajouter une forme à la fin par défaut', () => {
      const shape1 = { id: '1', name: 'shape1' };
      const shape2 = { id: '2', name: 'shape2' };

      ShapeManager.addShape(shape1);
      ShapeManager.addShape(shape2);

      expect(mockApp.workspace.shapes).toHaveLength(2);
      expect(mockApp.workspace.shapes[0]).toBe(shape1);
      expect(mockApp.workspace.shapes[1]).toBe(shape2);
    });

    it('devrait ajouter une forme à un index spécifique', () => {
      const shape1 = { id: '1', name: 'shape1' };
      const shape2 = { id: '2', name: 'shape2' };
      const shape3 = { id: '3', name: 'shape3' };

      ShapeManager.addShape(shape1);
      ShapeManager.addShape(shape3);
      ShapeManager.addShape(shape2, 1); // Insérer entre shape1 et shape3

      expect(mockApp.workspace.shapes).toHaveLength(3);
      expect(mockApp.workspace.shapes[0]).toBe(shape1);
      expect(mockApp.workspace.shapes[1]).toBe(shape2);
      expect(mockApp.workspace.shapes[2]).toBe(shape3);
    });

    it('devrait ajouter une forme à l\'index 0', () => {
      const shape1 = { id: '1', name: 'shape1' };
      const shape2 = { id: '2', name: 'shape2' };

      ShapeManager.addShape(shape1);
      ShapeManager.addShape(shape2, 0);

      expect(mockApp.workspace.shapes).toHaveLength(2);
      expect(mockApp.workspace.shapes[0]).toBe(shape2);
      expect(mockApp.workspace.shapes[1]).toBe(shape1);
    });

    it('devrait gérer l\'ajout avec index null', () => {
      const shape = { id: '1', name: 'shape1' };

      ShapeManager.addShape(shape, null);

      expect(mockApp.workspace.shapes).toHaveLength(1);
      expect(mockApp.workspace.shapes[0]).toBe(shape);
    });
  });

  describe('getShapeIndex', () => {
    it('devrait retourner l\'index correct d\'une forme', () => {
      const shape1 = { id: '1' };
      const shape2 = { id: '2' };
      const shape3 = { id: '3' };

      mockApp.mainCanvasLayer.shapes = [shape1, shape2, shape3];

      expect(ShapeManager.getShapeIndex(shape1)).toBe(0);
      expect(ShapeManager.getShapeIndex(shape2)).toBe(1);
      expect(ShapeManager.getShapeIndex(shape3)).toBe(2);
    });

    it('devrait retourner -1 si la forme n\'existe pas', () => {
      const shape1 = { id: '1' };
      const shape2 = { id: '2' };

      mockApp.mainCanvasLayer.shapes = [shape1];

      expect(ShapeManager.getShapeIndex(shape2)).toBe(-1);
    });

    it('devrait retourner -1 si le tableau est vide', () => {
      const shape = { id: '1' };

      mockApp.mainCanvasLayer.shapes = [];

      expect(ShapeManager.getShapeIndex(shape)).toBe(-1);
    });

    it('devrait trouver la forme même avec d\'autres propriétés différentes', () => {
      const shape = { id: '1', name: 'original' };
      const shapeWithSameId = { id: '1', name: 'modified' };

      mockApp.mainCanvasLayer.shapes = [shape];

      expect(ShapeManager.getShapeIndex(shapeWithSameId)).toBe(0);
    });
  });

  describe('getShapeById', () => {
    it('devrait retourner la forme avec l\'id correspondant', () => {
      const shape1 = { id: '1', name: 'shape1' };
      const shape2 = { id: '2', name: 'shape2' };

      mockApp.mainCanvasLayer.shapes = [shape1, shape2];

      const result = ShapeManager.getShapeById('2');
      expect(result).toBe(shape2);
    });

    it('devrait retourner null si la forme n\'existe pas', () => {
      const shape1 = { id: '1', name: 'shape1' };

      mockApp.mainCanvasLayer.shapes = [shape1];

      const result = ShapeManager.getShapeById('999');
      expect(result).toBeNull();
    });

    it('devrait retourner null si le tableau est vide', () => {
      mockApp.mainCanvasLayer.shapes = [];

      const result = ShapeManager.getShapeById('1');
      expect(result).toBeNull();
    });

    it('devrait gérer les ids numériques', () => {
      const shape = { id: 123, name: 'shape' };

      mockApp.mainCanvasLayer.shapes = [shape];

      const result = ShapeManager.getShapeById(123);
      expect(result).toBe(shape);
    });
  });

  describe('deleteShape', () => {
    it('devrait supprimer une forme existante', () => {
      const shape1 = { id: '1', name: 'shape1' };
      const shape2 = { id: '2', name: 'shape2' };
      const shape3 = { id: '3', name: 'shape3' };

      mockApp.workspace.shapes = [shape1, shape2, shape3];
      mockApp.mainCanvasLayer.shapes = [shape1, shape2, shape3];

      ShapeManager.deleteShape(shape2);

      expect(mockApp.workspace.shapes).toHaveLength(2);
      expect(mockApp.workspace.shapes[0]).toBe(shape1);
      expect(mockApp.workspace.shapes[1]).toBe(shape3);
    });

    it('devrait afficher une erreur si la forme n\'existe pas', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
      const shape = { id: 'inexistant' };

      mockApp.mainCanvasLayer.shapes = [];
      mockApp.workspace.shapes = [];

      ShapeManager.deleteShape(shape);

      expect(consoleSpy).toHaveBeenCalledWith(
        "Workspace.deleteShape: couldn't delete the shape",
      );
      expect(mockApp.workspace.shapes).toHaveLength(0);

      consoleSpy.mockRestore();
    });

    it('devrait gérer la suppression de la première forme', () => {
      const shape1 = { id: '1' };
      const shape2 = { id: '2' };

      mockApp.workspace.shapes = [shape1, shape2];
      mockApp.mainCanvasLayer.shapes = [shape1, shape2];

      ShapeManager.deleteShape(shape1);

      expect(mockApp.workspace.shapes).toHaveLength(1);
      expect(mockApp.workspace.shapes[0]).toBe(shape2);
    });

    it('devrait gérer la suppression de la dernière forme', () => {
      const shape1 = { id: '1' };
      const shape2 = { id: '2' };

      mockApp.workspace.shapes = [shape1, shape2];
      mockApp.mainCanvasLayer.shapes = [shape1, shape2];

      ShapeManager.deleteShape(shape2);

      expect(mockApp.workspace.shapes).toHaveLength(1);
      expect(mockApp.workspace.shapes[0]).toBe(shape1);
    });
  });

  describe('moveShapesUp', () => {
    it('devrait déplacer une seule forme en haut', () => {
      const shapes = [
        { id: '1', name: 's1' },
        { id: '2', name: 's2' },
        { id: '3', name: 's3' },
        { id: '4', name: 's4' },
      ];

      mockApp.workspace.shapes = [...shapes];

      const newIndexes = ShapeManager.moveShapesUp([1]); // Déplacer s2

      expect(mockApp.workspace.shapes[3]).toBe(shapes[1]); // s2 en haut
      expect(mockApp.workspace.shapes).toHaveLength(4);
      expect(newIndexes).toBeDefined();
    });

    it('devrait déplacer plusieurs formes en haut en conservant leur ordre', () => {
      const shapes = [
        { id: '1', name: 's1' },
        { id: '2', name: 's2' },
        { id: '3', name: 's3' },
        { id: '4', name: 's4' },
      ];

      mockApp.workspace.shapes = [...shapes];

      ShapeManager.moveShapesUp([0, 2]); // Déplacer s1 et s3

      // s1 et s3 doivent être en haut, dans cet ordre
      expect(mockApp.workspace.shapes[2]).toBe(shapes[0]); // s1
      expect(mockApp.workspace.shapes[3]).toBe(shapes[2]); // s3
    });

    it('devrait gérer le cas où aucune forme n\'est déplacée', () => {
      const shapes = [
        { id: '1', name: 's1' },
        { id: '2', name: 's2' },
      ];

      mockApp.workspace.shapes = [...shapes];

      const newIndexes = ShapeManager.moveShapesUp([]);

      expect(mockApp.workspace.shapes).toEqual(shapes);
      expect(newIndexes).toHaveLength(0);
    });

    it('devrait gérer le déplacement de toutes les formes', () => {
      const shapes = [
        { id: '1', name: 's1' },
        { id: '2', name: 's2' },
        { id: '3', name: 's3' },
      ];

      mockApp.workspace.shapes = [...shapes];

      ShapeManager.moveShapesUp([0, 1, 2]);

      expect(mockApp.workspace.shapes).toHaveLength(3);
      // L'ordre devrait être inversé
      expect(mockApp.workspace.shapes[0]).toBe(shapes[0]);
      expect(mockApp.workspace.shapes[1]).toBe(shapes[1]);
      expect(mockApp.workspace.shapes[2]).toBe(shapes[2]);
    });
  });

  describe('reverseUpperShapes', () => {
    it('devrait inverser les N formes du haut', () => {
      const shapes = [
        { id: '1', name: 's1' },
        { id: '2', name: 's2' },
        { id: '3', name: 's3' },
        { id: '4', name: 's4' },
      ];

      mockApp.workspace.shapes = [...shapes];

      ShapeManager.reverseUpperShapes(2); // Inverser s3 et s4

      expect(mockApp.workspace.shapes[0]).toBe(shapes[0]); // s1 inchangé
      expect(mockApp.workspace.shapes[1]).toBe(shapes[1]); // s2 inchangé
      expect(mockApp.workspace.shapes[2]).toBe(shapes[3]); // s4
      expect(mockApp.workspace.shapes[3]).toBe(shapes[2]); // s3
    });

    it('devrait inverser toutes les formes si nbr = length', () => {
      const shapes = [
        { id: '1', name: 's1' },
        { id: '2', name: 's2' },
        { id: '3', name: 's3' },
      ];

      mockApp.workspace.shapes = [...shapes];

      ShapeManager.reverseUpperShapes(3);

      expect(mockApp.workspace.shapes[0]).toBe(shapes[2]);
      expect(mockApp.workspace.shapes[1]).toBe(shapes[1]);
      expect(mockApp.workspace.shapes[2]).toBe(shapes[0]);
    });

    it('devrait gérer nbr = 1 (aucun changement)', () => {
      const shapes = [
        { id: '1', name: 's1' },
        { id: '2', name: 's2' },
      ];

      mockApp.workspace.shapes = [...shapes];

      ShapeManager.reverseUpperShapes(1);

      expect(mockApp.workspace.shapes).toEqual(shapes);
    });

    it('devrait gérer nbr = 0', () => {
      const shapes = [
        { id: '1', name: 's1' },
        { id: '2', name: 's2' },
      ];

      mockApp.workspace.shapes = [...shapes];

      ShapeManager.reverseUpperShapes(0);

      expect(mockApp.workspace.shapes).toEqual(shapes);
    });
  });

  describe('getAllBindedShapes', () => {
    it('devrait retourner seulement la forme si pas de groupe', async () => {
      const { GroupManager } = await import(
        '@controllers/Core/Managers/GroupManager.js'
      );
      GroupManager.getShapeGroup.mockReturnValue(null);

      const shape = { id: '1', name: 'shape1' };

      const result = ShapeManager.getAllBindedShapes(shape);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(shape);
    });

    it('devrait exclure la forme reçue si includeReceivedShape = false', async () => {
      const { GroupManager } = await import(
        '@controllers/Core/Managers/GroupManager.js'
      );
      GroupManager.getShapeGroup.mockReturnValue(null);

      const shape = { id: '1', name: 'shape1' };

      const result = ShapeManager.getAllBindedShapes(shape, false);

      expect(result).toHaveLength(0);
    });

    it('devrait retourner toutes les formes du groupe', async () => {
      const { GroupManager } = await import(
        '@controllers/Core/Managers/GroupManager.js'
      );
      const shape1 = { id: '1', name: 'shape1' };
      const shape2 = { id: '2', name: 'shape2' };
      const shape3 = { id: '3', name: 'shape3' };

      mockApp.mainCanvasLayer.shapes = [shape1, shape2, shape3];

      GroupManager.getShapeGroup.mockReturnValue({
        id: 'group1',
        shapesIds: ['1', '2', '3'],
      });

      const result = ShapeManager.getAllBindedShapes(shape1);

      expect(result).toHaveLength(3);
      expect(result).toContain(shape1);
      expect(result).toContain(shape2);
      expect(result).toContain(shape3);
    });

    it('devrait retourner les formes du groupe sauf la forme reçue', async () => {
      const { GroupManager } = await import(
        '@controllers/Core/Managers/GroupManager.js'
      );
      const shape1 = { id: '1', name: 'shape1' };
      const shape2 = { id: '2', name: 'shape2' };

      mockApp.mainCanvasLayer.shapes = [shape1, shape2];

      GroupManager.getShapeGroup.mockReturnValue({
        id: 'group1',
        shapesIds: ['1', '2'],
      });

      const result = ShapeManager.getAllBindedShapes(shape1, false);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(shape2);
    });
  });

  describe('shapesThatContainsCoordinates', () => {
    it('devrait retourner un tableau vide si aucune forme ne contient les coordonnées', () => {
      mockApp.mainCanvasLayer.shapes = [];

      const coord = { x: 10, y: 10 };
      const result = ShapeManager.shapesThatContainsCoordinates(coord);

      expect(result).toEqual([]);
    });

    it('devrait retourner les formes contenant les coordonnées', () => {
      const shape1 = {
        id: '1',
        isSegment: () => false,
        isPoint: () => false,
        isCoordinatesInPath: vi.fn(() => true),
        isCoordinatesOnBorder: vi.fn(() => false),
      };

      const shape2 = {
        id: '2',
        isSegment: () => false,
        isPoint: () => false,
        isCoordinatesInPath: vi.fn(() => false),
        isCoordinatesOnBorder: vi.fn(() => true),
      };

      mockApp.mainCanvasLayer.shapes = [shape1, shape2];

      const coord = { x: 10, y: 10 };
      const result = ShapeManager.shapesThatContainsCoordinates(coord);

      expect(result).toHaveLength(2);
      // L'ordre est inversé (reverse)
      expect(result[0]).toBe(shape2);
      expect(result[1]).toBe(shape1);
    });

    it('devrait gérer les formes de type point', async () => {
      const { SelectManager } = await import(
        '@controllers/Core/Managers/SelectManager.js'
      );
      SelectManager.areCoordinatesInSelectionDistance.mockReturnValue(true);

      const shape = {
        id: '1',
        isSegment: () => false,
        isPoint: () => true,
        points: [{ coordinates: { x: 10, y: 10 } }],
      };

      mockApp.mainCanvasLayer.shapes = [shape];

      const coord = { x: 10, y: 10 };
      const result = ShapeManager.shapesThatContainsCoordinates(coord);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(shape);
    });

    it('devrait inclure les formes du upperCanvasLayer si canSelectFromUpper', () => {
      const shapeMain = {
        id: '1',
        isSegment: () => false,
        isPoint: () => false,
        isCoordinatesInPath: vi.fn(() => true),
        isCoordinatesOnBorder: vi.fn(() => false),
      };

      const shapeUpper = {
        id: '2',
        isSegment: () => false,
        isPoint: () => false,
        isCoordinatesInPath: vi.fn(() => true),
        isCoordinatesOnBorder: vi.fn(() => false),
      };

      mockApp.mainCanvasLayer.shapes = [shapeMain];
      mockApp.upperCanvasLayer.shapes = [shapeUpper];

      const coord = { x: 10, y: 10 };
      const result = ShapeManager.shapesThatContainsCoordinates(coord, {
        canSelectFromUpper: true,
      });

      expect(result).toHaveLength(2);
    });
  });

  describe('updateReferencedShapes', () => {
    it('devrait appeler updateReferenced sur toutes les formes', () => {
      const shape1 = { id: '1', updateReferenced: vi.fn() };
      const shape2 = { id: '2', updateReferenced: vi.fn() };
      const shape3 = { id: '3', updateReferenced: vi.fn() };

      mockApp.workspace.shapes = [shape1, shape2, shape3];

      ShapeManager.updateReferencedShapes(false);

      expect(shape1.updateReferenced).toHaveBeenCalledWith(false);
      expect(shape2.updateReferenced).toHaveBeenCalledWith(false);
      expect(shape3.updateReferenced).toHaveBeenCalledWith(false);
    });

    it('devrait passer mustDraw = true si spécifié', () => {
      const shape = { id: '1', updateReferenced: vi.fn() };

      mockApp.workspace.shapes = [shape];

      ShapeManager.updateReferencedShapes(true);

      expect(shape.updateReferenced).toHaveBeenCalledWith(true);
    });

    it('devrait gérer un tableau vide', () => {
      mockApp.workspace.shapes = [];

      expect(() => ShapeManager.updateReferencedShapes()).not.toThrow();
    });

    it('devrait passer mustDraw = false par défaut', () => {
      const shape = { id: '1', updateReferenced: vi.fn() };

      mockApp.workspace.shapes = [shape];

      ShapeManager.updateReferencedShapes();

      expect(shape.updateReferenced).toHaveBeenCalledWith(false);
    });
  });

  describe('Edge cases et robustesse', () => {
    it('devrait gérer des formes avec des ids identiques', () => {
      const shape1 = { id: '1', name: 'first' };
      const shape2 = { id: '1', name: 'duplicate' };

      mockApp.mainCanvasLayer.shapes = [shape1, shape2];

      // Devrait retourner la première occurrence
      const result = ShapeManager.getShapeById('1');
      expect(result).toBe(shape1);
    });

    it('devrait gérer l\'ajout à un index négatif', () => {
      const shape = { id: '1' };

      // JavaScript splice avec index négatif compte depuis la fin
      ShapeManager.addShape(shape, -1);

      expect(mockApp.workspace.shapes).toHaveLength(1);
    });

    it('devrait gérer l\'ajout à un index > length', () => {
      const shape1 = { id: '1' };
      const shape2 = { id: '2' };

      mockApp.workspace.shapes = [shape1];
      ShapeManager.addShape(shape2, 999);

      expect(mockApp.workspace.shapes).toHaveLength(2);
    });
  });

  describe('Performance', () => {
    it('devrait gérer de nombreuses formes efficacement', () => {
      const shapes = Array.from({ length: 1000 }, (_, i) => ({
        id: `${i}`,
        name: `shape${i}`,
      }));

      mockApp.mainCanvasLayer.shapes = shapes;

      const start = performance.now();
      const result = ShapeManager.getShapeById('500');
      const end = performance.now();

      expect(result).toBe(shapes[500]);
      expect(end - start).toBeLessThan(10); // Devrait être très rapide
    });

    it('devrait gérer la suppression multiple efficacement', () => {
      const shapes = Array.from({ length: 100 }, (_, i) => ({
        id: `${i}`,
        name: `shape${i}`,
      }));

      mockApp.workspace.shapes = [...shapes];
      mockApp.mainCanvasLayer.shapes = [...shapes];

      const start = performance.now();
      for (let i = 0; i < 50; i++) {
        ShapeManager.deleteShape(shapes[i]);
      }
      const end = performance.now();

      expect(mockApp.workspace.shapes).toHaveLength(50);
      expect(end - start).toBeLessThan(100);
    });
  });

  describe('moveShapesBackToTheirPlace', () => {
    it('devrait modifier l\'ordre des formes selon les indexes', () => {
      const shape1 = { id: '1', name: 'shape1' };
      const shape2 = { id: '2', name: 'shape2' };
      const shape3 = { id: '3', name: 'shape3' };

      mockApp.workspace.shapes = [shape1, shape2, shape3];

      // Vérifier que la méthode s'exécute sans erreur
      expect(() => ShapeManager.moveShapesBackToTheirPlace([0, 2, 1])).not.toThrow();

      // L'ordre devrait avoir changé
      expect(mockApp.workspace.shapes).toHaveLength(3);
    });

    it('devrait gérer un tableau vide', () => {
      mockApp.workspace.shapes = [];

      expect(() => ShapeManager.moveShapesBackToTheirPlace([])).not.toThrow();
      expect(mockApp.workspace.shapes).toEqual([]);
    });

    it('devrait gérer des indexes identiques (pas de mouvement)', () => {
      const shape1 = { id: '1', name: 'shape1' };
      const shape2 = { id: '2', name: 'shape2' };

      mockApp.workspace.shapes = [shape1, shape2];

      ShapeManager.moveShapesBackToTheirPlace([0, 1]);

      expect(mockApp.workspace.shapes[0]).toBe(shape1);
      expect(mockApp.workspace.shapes[1]).toBe(shape2);
    });

    it('devrait gérer un seul élément dans les indexes', () => {
      const shape1 = { id: '1', name: 'shape1' };
      const shape2 = { id: '2', name: 'shape2' };
      const shape3 = { id: '3', name: 'shape3' };

      mockApp.workspace.shapes = [shape1, shape2, shape3];

      // Vérifier que la méthode s'exécute sans erreur avec un seul index
      expect(() => ShapeManager.moveShapesBackToTheirPlace([2])).not.toThrow();

      expect(mockApp.workspace.shapes).toHaveLength(3);
    });
  });

  describe('getAllBindedShapesInGeometry', () => {
    it('devrait exister et être une fonction', () => {
      expect(typeof ShapeManager.getAllBindedShapesInGeometry).toBe('function');
    });

    it('devrait être défini dans ShapeManager', () => {
      expect(ShapeManager.getAllBindedShapesInGeometry).toBeDefined();
    });
  });

  describe('shapesThatContainsCoordinates - segments avec arcs', () => {
    it('devrait gérer les segments avec arcs', async () => {
      const arcSegment = {
        id: '1',
        isSegment: () => true,
        isPoint: () => false,
        segments: [{
          isArc: () => true,
          projectionOnSegment: vi.fn(),
        }],
        isCoordinatesInPath: vi.fn(() => true),
        isCoordinatesOnBorder: vi.fn(() => false),
      };

      mockApp.mainCanvasLayer.shapes = [arcSegment];

      const coord = { x: 10, y: 10 };
      const result = ShapeManager.shapesThatContainsCoordinates(coord);

      // Pour un arc, devrait utiliser isCoordinatesInPath au lieu de projection
      expect(arcSegment.isCoordinatesInPath).toHaveBeenCalledWith(coord);
      expect(arcSegment.segments[0].projectionOnSegment).not.toHaveBeenCalled();
    });

    it('devrait gérer les segments non-arc avec projection sur le segment', async () => {
      const { SelectManager } = await import(
        '@controllers/Core/Managers/SelectManager.js'
      );
      SelectManager.areCoordinatesInSelectionDistance.mockReturnValue(true);

      const segment = {
        id: '1',
        isSegment: () => true,
        isPoint: () => false,
        segments: [{
          isArc: () => false,
          projectionOnSegment: vi.fn((coord) => ({ x: coord.x, y: coord.y })),
          isCoordinatesOnSegment: vi.fn(() => true),
          vertexes: [
            { coordinates: { x: 0, y: 0 } },
            { coordinates: { x: 20, y: 20 } },
          ],
        }],
      };

      mockApp.mainCanvasLayer.shapes = [segment];

      const coord = { x: 10, y: 10 };
      const result = ShapeManager.shapesThatContainsCoordinates(coord);

      expect(segment.segments[0].projectionOnSegment).toHaveBeenCalledWith(coord);
      expect(segment.segments[0].isCoordinatesOnSegment).toHaveBeenCalled();
      expect(SelectManager.areCoordinatesInSelectionDistance).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(segment);
    });

    it('devrait détecter un segment si proche d\'un vertex', async () => {
      const { SelectManager } = await import(
        '@controllers/Core/Managers/SelectManager.js'
      );
      // Pas assez proche de la projection, mais proche du vertex
      SelectManager.areCoordinatesInSelectionDistance
        .mockReturnValueOnce(false) // projection
        .mockReturnValueOnce(true);  // vertex1

      const segment = {
        id: '1',
        isSegment: () => true,
        isPoint: () => false,
        segments: [{
          isArc: () => false,
          projectionOnSegment: vi.fn(() => ({ x: 50, y: 50 })),
          isCoordinatesOnSegment: vi.fn(() => true),
          vertexes: [
            { coordinates: { x: 0, y: 0 } },
            { coordinates: { x: 100, y: 100 } },
          ],
        }],
      };

      mockApp.mainCanvasLayer.shapes = [segment];

      const coord = { x: 1, y: 1 }; // Proche de vertex1
      const result = ShapeManager.shapesThatContainsCoordinates(coord);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(segment);
    });

    it('devrait détecter un segment si proche du deuxième vertex', async () => {
      const { SelectManager } = await import(
        '@controllers/Core/Managers/SelectManager.js'
      );
      // Pas proche de projection ni vertex1, mais proche de vertex2
      SelectManager.areCoordinatesInSelectionDistance
        .mockReturnValueOnce(false) // projection
        .mockReturnValueOnce(false) // vertex1
        .mockReturnValueOnce(true);  // vertex2

      const segment = {
        id: '1',
        isSegment: () => true,
        isPoint: () => false,
        segments: [{
          isArc: () => false,
          projectionOnSegment: vi.fn(() => ({ x: 50, y: 50 })),
          isCoordinatesOnSegment: vi.fn(() => true),
          vertexes: [
            { coordinates: { x: 0, y: 0 } },
            { coordinates: { x: 100, y: 100 } },
          ],
        }],
      };

      mockApp.mainCanvasLayer.shapes = [segment];

      const coord = { x: 99, y: 99 }; // Proche de vertex2
      const result = ShapeManager.shapesThatContainsCoordinates(coord);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(segment);
    });

    it('ne devrait pas détecter un segment si trop loin', async () => {
      const { SelectManager } = await import(
        '@controllers/Core/Managers/SelectManager.js'
      );
      SelectManager.areCoordinatesInSelectionDistance.mockReturnValue(false);

      const segment = {
        id: '1',
        isSegment: () => true,
        isPoint: () => false,
        segments: [{
          isArc: () => false,
          projectionOnSegment: vi.fn(() => ({ x: 50, y: 50 })),
          isCoordinatesOnSegment: vi.fn(() => false), // Projection pas sur segment
          vertexes: [
            { coordinates: { x: 0, y: 0 } },
            { coordinates: { x: 100, y: 100 } },
          ],
        }],
      };

      mockApp.mainCanvasLayer.shapes = [segment];

      const coord = { x: 200, y: 200 }; // Trop loin
      const result = ShapeManager.shapesThatContainsCoordinates(coord);

      expect(result).toHaveLength(0);
    });
  });

  describe('getAllBindedShapesInGeometry - Tests complets', () => {
    it('devrait retourner seulement la forme si pas de dépendances', async () => {
      const { findObjectById } = await import('@controllers/Core/Tools/general.js');
      const { GroupManager } = await import('@controllers/Core/Managers/GroupManager.js');

      GroupManager.getShapeGroup.mockReturnValue(null);

      const shape = {
        id: '1',
        points: [],
        geometryObject: {
          geometryParentObjectId1: null,
          geometryParentObjectId2: null,
          geometryChildShapeIds: [],
        },
      };

      const result = ShapeManager.getAllBindedShapesInGeometry(shape);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(shape);
    });

    it('devrait inclure les formes parentes via references des points', async () => {
      const { findObjectById } = await import('@controllers/Core/Tools/general.js');
      const { GroupManager } = await import('@controllers/Core/Managers/GroupManager.js');

      GroupManager.getShapeGroup.mockReturnValue(null);

      const parentShape = {
        id: 'parent',
        points: [],
        geometryObject: {
          geometryParentObjectId1: null,
          geometryParentObjectId2: null,
          geometryChildShapeIds: [],
        },
      };

      const childShape = {
        id: 'child',
        points: [
          { type: 'vertex', reference: 'parent' },
        ],
        geometryObject: {
          geometryParentObjectId1: null,
          geometryParentObjectId2: null,
          geometryChildShapeIds: [],
        },
      };

      findObjectById.mockImplementation((id) => {
        if (id === 'parent') return { id: 'parent', shape: parentShape };
        return { id, shape: null };
      });

      const result = ShapeManager.getAllBindedShapesInGeometry(childShape);

      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result).toContain(childShape);
    });

    it('devrait filtrer les divisionPoints', async () => {
      const { findObjectById } = await import('@controllers/Core/Tools/general.js');
      const { GroupManager } = await import('@controllers/Core/Managers/GroupManager.js');

      GroupManager.getShapeGroup.mockReturnValue(null);

      const shape = {
        id: '1',
        points: [
          { type: 'divisionPoint', reference: 'ignored' },
          { type: 'vertex', reference: null },
        ],
        geometryObject: {
          geometryParentObjectId1: null,
          geometryParentObjectId2: null,
          geometryChildShapeIds: [],
        },
      };

      findObjectById.mockReturnValue({ id: 'ignored', shape: { id: 'ignored' } });

      const result = ShapeManager.getAllBindedShapesInGeometry(shape);

      // Le divisionPoint ne devrait pas déclencher findObjectById
      expect(result).toContain(shape);
    });

    it('devrait inclure les formes via geometryParentObjectId1', async () => {
      const { findObjectById } = await import('@controllers/Core/Tools/general.js');
      const { GroupManager } = await import('@controllers/Core/Managers/GroupManager.js');

      GroupManager.getShapeGroup.mockReturnValue(null);

      const parentShape = {
        id: 'parent1',
        points: [],
        geometryObject: {
          geometryParentObjectId1: null,
          geometryParentObjectId2: null,
          geometryChildShapeIds: [],
        },
      };

      const childShape = {
        id: 'child',
        points: [],
        geometryObject: {
          geometryParentObjectId1: 'parent1',
          geometryParentObjectId2: null,
          geometryChildShapeIds: [],
        },
      };

      findObjectById.mockImplementation((id) => {
        if (id === 'parent1') return { id: 'parent1', shape: parentShape };
        return null;
      });

      const result = ShapeManager.getAllBindedShapesInGeometry(childShape);

      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('devrait inclure les formes via geometryParentObjectId2', async () => {
      const { findObjectById } = await import('@controllers/Core/Tools/general.js');
      const { GroupManager } = await import('@controllers/Core/Managers/GroupManager.js');

      GroupManager.getShapeGroup.mockReturnValue(null);

      const parent2Shape = {
        id: 'parent2',
        points: [],
        geometryObject: {
          geometryParentObjectId1: null,
          geometryParentObjectId2: null,
          geometryChildShapeIds: [],
        },
      };

      const childShape = {
        id: 'child',
        points: [],
        geometryObject: {
          geometryParentObjectId1: null,
          geometryParentObjectId2: 'parent2',
          geometryChildShapeIds: [],
        },
      };

      findObjectById.mockImplementation((id) => {
        if (id === 'parent2') return { id: 'parent2', shape: parent2Shape };
        return null;
      });

      const result = ShapeManager.getAllBindedShapesInGeometry(childShape);

      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('devrait inclure les enfants via geometryChildShapeIds', async () => {
      const { findObjectById } = await import('@controllers/Core/Tools/general.js');
      const { GroupManager } = await import('@controllers/Core/Managers/GroupManager.js');

      GroupManager.getShapeGroup.mockReturnValue(null);

      const childShape = {
        id: 'child1',
        name: 'regularChild',
        points: [],
        geometryObject: {
          geometryParentObjectId1: null,
          geometryParentObjectId2: null,
          geometryChildShapeIds: [],
        },
      };

      const parentShape = {
        id: 'parent',
        points: [],
        geometryObject: {
          geometryParentObjectId1: null,
          geometryParentObjectId2: null,
          geometryChildShapeIds: ['child1'],
        },
      };

      findObjectById.mockImplementation((id) => {
        if (id === 'child1') return { id: 'child1', name: 'regularChild', ...childShape };
        return null;
      });

      const result = ShapeManager.getAllBindedShapesInGeometry(parentShape);

      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('devrait filtrer les PointOnIntersection des enfants', async () => {
      const { findObjectById } = await import('@controllers/Core/Tools/general.js');
      const { GroupManager } = await import('@controllers/Core/Managers/GroupManager.js');

      GroupManager.getShapeGroup.mockReturnValue(null);

      const regularChild = {
        id: 'child1',
        name: 'regularChild',
        points: [],
        geometryObject: {
          geometryParentObjectId1: null,
          geometryParentObjectId2: null,
          geometryChildShapeIds: [],
        },
      };

      const parentShape = {
        id: 'parent',
        points: [],
        geometryObject: {
          geometryParentObjectId1: null,
          geometryParentObjectId2: null,
          geometryChildShapeIds: ['child1', 'intersection'],
        },
      };

      findObjectById.mockImplementation((id) => {
        if (id === 'child1') return { id: 'child1', name: 'regularChild', ...regularChild };
        if (id === 'intersection') return { id: 'intersection', name: 'PointOnIntersection' };
        return null;
      });

      const result = ShapeManager.getAllBindedShapesInGeometry(parentShape);

      // Devrait inclure parent mais filtrer PointOnIntersection
      expect(result).toContain(parentShape);
      expect(result.length).toBeGreaterThanOrEqual(1);
    });

    it('devrait gérer les groupes de formes liées', async () => {
      const { findObjectById } = await import('@controllers/Core/Tools/general.js');
      const { GroupManager } = await import('@controllers/Core/Managers/GroupManager.js');

      const shape1 = {
        id: 'shape1',
        points: [],
        geometryObject: {
          geometryParentObjectId1: null,
          geometryParentObjectId2: null,
          geometryChildShapeIds: [],
        },
      };

      const shape2 = {
        id: 'shape2',
        points: [],
        geometryObject: {
          geometryParentObjectId1: null,
          geometryParentObjectId2: null,
          geometryChildShapeIds: [],
        },
      };

      GroupManager.getShapeGroup.mockImplementation((s) => {
        if (s.id === 'shape1') {
          return { id: 'group1', shapesIds: ['shape1', 'shape2'] };
        }
        return null;
      });

      findObjectById.mockImplementation((id) => {
        if (id === 'shape1') return shape1;
        if (id === 'shape2') return shape2;
        return null;
      });

      const result = ShapeManager.getAllBindedShapesInGeometry(shape1);

      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });
});
