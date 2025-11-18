import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock de ShapeManager
vi.mock('@controllers/Core/Managers/ShapeManager.js', () => ({
  ShapeManager: {
    getShapeIndex: vi.fn(() => 0),
    shapesThatContainsCoordinates: vi.fn(() => []),
  },
}));

// Mock du module App
vi.mock('@controllers/Core/App', () => {
  // Créer les objets mocks qui seront partagés
  const mockSettings = {
    selectionDistance: 10,
    magnetismDistance: 5,
  };
  const mockWorkspace = {
    zoomLevel: 1,
  };
  const mockEnvironment = {
    name: 'Default',
  };
  const mockMainCanvasLayer = {
    points: [],
    segments: [],
    shapes: [],
  };
  const mockUpperCanvasLayer = {
    points: [],
    segments: [],
    shapes: [],
  };

  // Exposer les mocks globalement pour les tests
  global.mockSettings = mockSettings;
  global.mockWorkspace = mockWorkspace;
  global.mockEnvironment = mockEnvironment;
  global.mockMainCanvasLayer = mockMainCanvasLayer;
  global.mockUpperCanvasLayer = mockUpperCanvasLayer;

  return {
    app: {
      settings: mockSettings,
      workspace: mockWorkspace,
      environment: mockEnvironment,
      mainCanvasLayer: mockMainCanvasLayer,
      upperCanvasLayer: mockUpperCanvasLayer,
    },
  };
});

// Aliases locaux pour accéder facilement aux mocks exposés globalement
const mockSettings = global.mockSettings;
const mockWorkspace = global.mockWorkspace;
const mockEnvironment = global.mockEnvironment;
const mockMainCanvasLayer = global.mockMainCanvasLayer;
const mockUpperCanvasLayer = global.mockUpperCanvasLayer;

// Import de SelectManager (après les mocks)
import { SelectManager } from '@controllers/Core/Managers/SelectManager.js';

describe('SelectManager - Tests TDD', () => {
  beforeEach(() => {
    // Réinitialiser l'état avant chaque test
    global.mockWorkspace.zoomLevel = 1;
    global.mockEnvironment.name = 'Default';
    global.mockMainCanvasLayer.points = [];
    global.mockMainCanvasLayer.segments = [];
    global.mockMainCanvasLayer.shapes = [];
    global.mockUpperCanvasLayer.points = [];
    global.mockUpperCanvasLayer.segments = [];
    global.mockUpperCanvasLayer.shapes = [];
    vi.clearAllMocks();
  });

  describe('areCoordinatesInSelectionDistance', () => {
    it('devrait retourner true si les coordonnées sont à distance de sélection', () => {
      const c1 = { equal: vi.fn(() => true) };
      const c2 = {};

      const result = SelectManager.areCoordinatesInSelectionDistance(c1, c2);

      expect(result).toBe(true);
      expect(c1.equal).toHaveBeenCalledWith(c2, 10); // selectionDistance / zoomLevel
    });

    it('devrait retourner false si les coordonnées sont trop éloignées', () => {
      const c1 = { equal: vi.fn(() => false) };
      const c2 = {};

      const result = SelectManager.areCoordinatesInSelectionDistance(c1, c2);

      expect(result).toBe(false);
    });

    it('devrait ajuster la distance selon le zoomLevel', () => {
      global.mockWorkspace.zoomLevel = 2;
      const c1 = { equal: vi.fn(() => true) };
      const c2 = {};

      SelectManager.areCoordinatesInSelectionDistance(c1, c2);

      expect(c1.equal).toHaveBeenCalledWith(c2, 5); // 10 / 2
    });

    it('devrait gérer un zoomLevel très petit', () => {
      global.mockWorkspace.zoomLevel = 0.1;
      const c1 = { equal: vi.fn(() => true) };
      const c2 = {};

      SelectManager.areCoordinatesInSelectionDistance(c1, c2);

      expect(c1.equal).toHaveBeenCalledWith(c2, 100); // 10 / 0.1
    });
  });

  describe('areCoordinatesInMagnetismDistance', () => {
    it('devrait retourner true si les coordonnées sont à distance de magnétisme', () => {
      const c1 = { equal: vi.fn(() => true) };
      const c2 = {};

      const result = SelectManager.areCoordinatesInMagnetismDistance(c1, c2);

      expect(result).toBe(true);
      expect(c1.equal).toHaveBeenCalledWith(c2, 5); // magnetismDistance / zoomLevel
    });

    it('devrait retourner false si les coordonnées sont trop éloignées', () => {
      const c1 = { equal: vi.fn(() => false) };
      const c2 = {};

      const result = SelectManager.areCoordinatesInMagnetismDistance(c1, c2);

      expect(result).toBe(false);
    });

    it('devrait ajuster la distance selon le zoomLevel', () => {
      global.mockWorkspace.zoomLevel = 2.5;
      const c1 = { equal: vi.fn(() => true) };
      const c2 = {};

      SelectManager.areCoordinatesInMagnetismDistance(c1, c2);

      expect(c1.equal).toHaveBeenCalledWith(c2, 2); // 5 / 2.5
    });

    it('devrait gérer un zoomLevel très grand', () => {
      mockWorkspace.zoomLevel = 10;
      const c1 = { equal: vi.fn(() => true) };
      const c2 = {};

      SelectManager.areCoordinatesInMagnetismDistance(c1, c2);

      expect(c1.equal).toHaveBeenCalledWith(c2, 0.5); // 5 / 10
    });
  });

  describe('getEmptySelectionConstraints', () => {
    it('devrait retourner un objet avec la structure attendue', () => {
      const constraints = SelectManager.getEmptySelectionConstraints();

      expect(constraints).toBeDefined();
      expect(constraints).toHaveProperty('eventType');
      expect(constraints).toHaveProperty('priority');
      expect(constraints).toHaveProperty('blockHidden');
      expect(constraints).toHaveProperty('shapes');
      expect(constraints).toHaveProperty('segments');
      expect(constraints).toHaveProperty('points');
    });

    it('devrait avoir eventType à "click" par défaut', () => {
      const constraints = SelectManager.getEmptySelectionConstraints();

      expect(constraints.eventType).toBe('click');
    });

    it('devrait avoir la priorité correcte', () => {
      const constraints = SelectManager.getEmptySelectionConstraints();

      expect(constraints.priority).toEqual(['points', 'segments', 'shapes']);
      expect(constraints.priority).toHaveLength(3);
    });

    it('devrait avoir blockHidden à false par défaut', () => {
      const constraints = SelectManager.getEmptySelectionConstraints();

      expect(constraints.blockHidden).toBe(false);
    });

    it('devrait avoir shapes.canSelect à false par défaut', () => {
      const constraints = SelectManager.getEmptySelectionConstraints();

      expect(constraints.shapes.canSelect).toBe(false);
      expect(constraints.shapes.canSelectFromUpper).toBe(false);
      expect(constraints.shapes.whitelist).toBeNull();
      expect(constraints.shapes.blacklist).toBeNull();
    });

    it('devrait avoir segments.canSelect à false par défaut', () => {
      const constraints = SelectManager.getEmptySelectionConstraints();

      expect(constraints.segments.canSelect).toBe(false);
      expect(constraints.segments.canSelectFromUpper).toBe(false);
      expect(constraints.segments.whitelist).toBeNull();
      expect(constraints.segments.blacklist).toBeNull();
      expect(constraints.segments.numberOfObjects).toBe('one');
    });

    it('devrait avoir points.canSelect à false par défaut', () => {
      const constraints = SelectManager.getEmptySelectionConstraints();

      expect(constraints.points.canSelect).toBe(false);
      expect(constraints.points.canSelectFromUpper).toBe(false);
      expect(constraints.points.whitelist).toBeNull();
      expect(constraints.points.blacklist).toBeNull();
      expect(constraints.points.numberOfObjects).toBe('one');
    });

    it('devrait avoir les types de points par défaut', () => {
      const constraints = SelectManager.getEmptySelectionConstraints();

      expect(constraints.points.types).toEqual([
        'shapeCenter',
        'vertex',
        'divisionPoint',
        'modifiablePoint',
        'arcCenter',
      ]);
      expect(constraints.points.types).toHaveLength(5);
    });

    it('devrait retourner un nouvel objet à chaque appel (pas de référence partagée)', () => {
      const constraints1 = SelectManager.getEmptySelectionConstraints();
      const constraints2 = SelectManager.getEmptySelectionConstraints();

      expect(constraints1).not.toBe(constraints2);
      expect(constraints1.shapes).not.toBe(constraints2.shapes);
      expect(constraints1.segments).not.toBe(constraints2.segments);
      expect(constraints1.points).not.toBe(constraints2.points);
    });

    it('devrait permettre la modification sans affecter les autres instances', () => {
      const constraints1 = SelectManager.getEmptySelectionConstraints();
      const constraints2 = SelectManager.getEmptySelectionConstraints();

      constraints1.shapes.canSelect = true;
      constraints1.points.types.push('custom');

      expect(constraints2.shapes.canSelect).toBe(false);
      expect(constraints2.points.types).toHaveLength(5);
    });
  });

  describe('selectPoint - Tests de base', () => {
    it('devrait retourner null si canSelect est false', () => {
      const constraints = {
        canSelect: false,
      };
      const mouseCoordinates = {};

      const result = SelectManager.selectPoint(mouseCoordinates, constraints);

      expect(result).toBeNull();
    });

    it('devrait retourner null si aucun point n\'est disponible', () => {
      global.mockMainCanvasLayer.points = [];
      const constraints = {
        canSelect: true,
        canSelectFromUpper: false,
        types: ['vertex'],
        whitelist: null,
        blacklist: null,
        numberOfObjects: 'one',
        blockHidden: false,
      };
      const mouseCoordinates = { x: 10, y: 10 };

      const result = SelectManager.selectPoint(mouseCoordinates, constraints);

      expect(result).toBeNull();
    });

    it('devrait filtrer les points invisibles', () => {
      const visiblePoint = {
        visible: true,
        geometryIsVisible: true,
        geometryIsHidden: false,
        type: 'vertex',
        coordinates: { equal: vi.fn(() => true) },
        shape: { layer: 'main' },
        isBehindShape: false,
      };

      const invisiblePoint = {
        visible: false,
        geometryIsVisible: true,
        geometryIsHidden: false,
        type: 'vertex',
        coordinates: { equal: vi.fn(() => true) },
        shape: { layer: 'main' },
        isBehindShape: false,
      };

      mockMainCanvasLayer.points = [visiblePoint, invisiblePoint];

      const constraints = {
        canSelect: true,
        canSelectFromUpper: false,
        types: ['vertex'],
        whitelist: null,
        blacklist: null,
        numberOfObjects: 'one',
        blockHidden: false,
      };
      const mouseCoordinates = { x: 10, y: 10 };

      const result = SelectManager.selectPoint(mouseCoordinates, constraints);

      expect(result).toBe(visiblePoint);
      expect(invisiblePoint.coordinates.equal).not.toHaveBeenCalled();
    });

    it('devrait filtrer par type de point', () => {
      const vertexPoint = {
        visible: true,
        geometryIsVisible: true,
        geometryIsHidden: false,
        type: 'vertex',
        coordinates: { equal: vi.fn(() => true) },
        shape: { layer: 'main' },
        isBehindShape: false,
      };

      const centerPoint = {
        visible: true,
        geometryIsVisible: true,
        geometryIsHidden: false,
        type: 'shapeCenter',
        coordinates: { equal: vi.fn(() => true) },
        shape: { layer: 'main' },
        isBehindShape: false,
      };

      mockMainCanvasLayer.points = [vertexPoint, centerPoint];

      const constraints = {
        canSelect: true,
        canSelectFromUpper: false,
        types: ['vertex'],
        whitelist: null,
        blacklist: null,
        numberOfObjects: 'one',
        blockHidden: false,
      };
      const mouseCoordinates = { x: 10, y: 10 };

      const result = SelectManager.selectPoint(mouseCoordinates, constraints);

      expect(result).toBe(vertexPoint);
    });

    it('devrait utiliser selectionDistance en mode easySelection', () => {
      const point = {
        visible: true,
        geometryIsVisible: true,
        geometryIsHidden: false,
        type: 'vertex',
        coordinates: { equal: vi.fn(() => true) },
        shape: { layer: 'main' },
        isBehindShape: false,
      };

      mockMainCanvasLayer.points = [point];

      const constraints = {
        canSelect: true,
        canSelectFromUpper: false,
        types: ['vertex'],
        whitelist: null,
        blacklist: null,
        numberOfObjects: 'one',
        blockHidden: false,
      };
      const mouseCoordinates = { x: 10, y: 10 };

      SelectManager.selectPoint(mouseCoordinates, constraints, true);

      // Vérifie que equal est appelé (distance de sélection)
      expect(point.coordinates.equal).toHaveBeenCalled();
    });

    it('devrait utiliser magnetismDistance en mode non-easySelection', () => {
      const point = {
        visible: true,
        geometryIsVisible: true,
        geometryIsHidden: false,
        type: 'vertex',
        coordinates: { equal: vi.fn(() => true) },
        shape: { layer: 'main' },
        isBehindShape: false,
      };

      mockMainCanvasLayer.points = [point];

      const constraints = {
        canSelect: true,
        canSelectFromUpper: false,
        types: ['vertex'],
        whitelist: null,
        blacklist: null,
        numberOfObjects: 'one',
        blockHidden: false,
      };
      const mouseCoordinates = { x: 10, y: 10 };

      SelectManager.selectPoint(mouseCoordinates, constraints, false);

      // Vérifie que equal est appelé
      expect(point.coordinates.equal).toHaveBeenCalled();
    });
  });

  describe('selectPoint - Whitelist/Blacklist', () => {
    it('devrait respecter la whitelist par shapeId', () => {
      const point1 = {
        visible: true,
        geometryIsVisible: true,
        geometryIsHidden: false,
        type: 'vertex',
        shapeId: 'shape1',
        coordinates: { equal: vi.fn(() => true) },
        shape: { layer: 'main' },
        isBehindShape: false,
      };

      const point2 = {
        visible: true,
        geometryIsVisible: true,
        geometryIsHidden: false,
        type: 'vertex',
        shapeId: 'shape2',
        coordinates: { equal: vi.fn(() => true) },
        shape: { layer: 'main' },
        isBehindShape: false,
      };

      mockMainCanvasLayer.points = [point1, point2];

      const constraints = {
        canSelect: true,
        canSelectFromUpper: false,
        types: ['vertex'],
        whitelist: [{ shapeId: 'shape1' }],
        blacklist: null,
        numberOfObjects: 'one',
        blockHidden: false,
      };
      const mouseCoordinates = { x: 10, y: 10 };

      const result = SelectManager.selectPoint(mouseCoordinates, constraints);

      expect(result).toBe(point1);
    });

    it('devrait respecter la blacklist par shapeId', () => {
      const point1 = {
        visible: true,
        geometryIsVisible: true,
        geometryIsHidden: false,
        type: 'vertex',
        shapeId: 'shape1',
        coordinates: { equal: vi.fn(() => true) },
        shape: { layer: 'main' },
        isBehindShape: false,
      };

      const point2 = {
        visible: true,
        geometryIsVisible: true,
        geometryIsHidden: false,
        type: 'vertex',
        shapeId: 'shape2',
        coordinates: { equal: vi.fn(() => true) },
        shape: { layer: 'main' },
        isBehindShape: false,
      };

      mockMainCanvasLayer.points = [point1, point2];

      const constraints = {
        canSelect: true,
        canSelectFromUpper: false,
        types: ['vertex'],
        whitelist: null,
        blacklist: [{ shapeId: 'shape1' }],
        numberOfObjects: 'one',
        blockHidden: false,
      };
      const mouseCoordinates = { x: 10, y: 10 };

      const result = SelectManager.selectPoint(mouseCoordinates, constraints);

      expect(result).toBe(point2);
    });
  });

  describe('selectSegment - Tests de base', () => {
    it('devrait retourner null si canSelect est false', () => {
      const constraints = {
        canSelect: false,
      };
      const mouseCoordinates = {};

      const result = SelectManager.selectSegment(mouseCoordinates, constraints);

      expect(result).toBeNull();
    });

    it('devrait retourner null si aucun segment n\'est disponible', () => {
      mockMainCanvasLayer.segments = [];
      const constraints = {
        canSelect: true,
        canSelectFromUpper: false,
        whitelist: null,
        blacklist: null,
        numberOfObjects: 'one',
      };
      const mouseCoordinates = { x: 10, y: 10 };

      const result = SelectManager.selectSegment(mouseCoordinates, constraints);

      expect(result).toBeNull();
    });
  });

  describe('Edge cases et robustesse', () => {
    it('devrait gérer un zoomLevel à 0 sans crasher', () => {
      mockWorkspace.zoomLevel = 0;
      const c1 = { equal: vi.fn(() => true) };
      const c2 = {};

      // Ne devrait pas crasher malgré la division par 0
      expect(() =>
        SelectManager.areCoordinatesInSelectionDistance(c1, c2),
      ).not.toThrow();
    });

    it('devrait gérer des settings manquants', () => {
      // Temporarily modify settings
      const originalSettings = { ...mockSettings };
      Object.keys(mockSettings).forEach(key => delete mockSettings[key]);

      const c1 = { equal: vi.fn(() => true) };
      const c2 = {};

      expect(() =>
        SelectManager.areCoordinatesInSelectionDistance(c1, c2),
      ).not.toThrow();

      // Restore settings
      Object.assign(mockSettings, originalSettings);
    });

    it('devrait gérer un environnement "Geometrie"', () => {
      mockEnvironment.name = 'Geometrie';
      mockMainCanvasLayer.points = [];

      const constraints = {
        canSelect: true,
        canSelectFromUpper: false,
        types: ['vertex'],
        whitelist: null,
        blacklist: null,
        numberOfObjects: 'one',
        blockHidden: false,
      };
      const mouseCoordinates = { x: 10, y: 10 };

      expect(() =>
        SelectManager.selectPoint(mouseCoordinates, constraints),
      ).not.toThrow();
    });
  });

  describe('Performance', () => {
    it('devrait gérer de nombreux points efficacement', () => {
      const points = Array.from({ length: 1000 }, (_, i) => ({
        visible: true,
        geometryIsVisible: true,
        geometryIsHidden: false,
        type: 'vertex',
        shapeId: `shape${i}`,
        coordinates: { equal: vi.fn(() => false) },
        shape: { layer: 'main' },
        isBehindShape: false,
      }));

      mockMainCanvasLayer.points = points;

      const constraints = {
        canSelect: true,
        canSelectFromUpper: false,
        types: ['vertex'],
        whitelist: null,
        blacklist: null,
        numberOfObjects: 'one',
        blockHidden: false,
      };
      const mouseCoordinates = { x: 10, y: 10 };

      const start = performance.now();
      SelectManager.selectPoint(mouseCoordinates, constraints);
      const end = performance.now();

      // Devrait s'exécuter en moins de 100ms même avec 1000 points
      expect(end - start).toBeLessThan(100);
    });
  });
});
