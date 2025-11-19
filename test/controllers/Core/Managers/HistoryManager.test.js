import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock de gridStore et FullHistoryManager
vi.mock('@/store/gridStore', () => ({
  gridStore: {
    setGridType: vi.fn(),
    setGridSize: vi.fn(),
    setIsVisible: vi.fn(),
    getState: vi.fn(() => ({
      gridType: 'none',
      gridSize: 1,
      isVisible: false,
      gridOpacity: 0.3,
    })),
  },
}));

vi.mock('@controllers/Core/Managers/FullHistoryManager', () => ({
  FullHistoryManager: {
    addStep: vi.fn(),
  },
}));

// Mock du module App
vi.mock('@controllers/Core/App', () => {
  // Créer les objets mocks qui seront partagés
  const mockHistory = {
    index: -1,
    steps: [],
    startSituation: null,
  };
  const mockWorkspace = {
    initFromObject: vi.fn(),
    data: { shapes: [], segments: [], points: [] }, // Ajout de data
  };
  const mockSettings = {};
  const mockDefaultState = { tangram: {} };
  const mockEnvironment = { name: 'Default' };
  const mockTangram = { isSilhouetteShown: false };

  // Exposer les mocks globalement pour les tests
  global.mockHistory = mockHistory;
  global.mockWorkspace = mockWorkspace;
  global.mockSettings = mockSettings;
  global.mockDefaultState = mockDefaultState;
  global.mockEnvironment = mockEnvironment;
  global.mockTangram = mockTangram;

  return {
    app: {
      history: mockHistory,
      workspace: mockWorkspace,
      settings: mockSettings,
      defaultState: mockDefaultState,
      environment: mockEnvironment,
      tangram: mockTangram,
    },
    setState: vi.fn(),
  };
});

// Import de HistoryManager (après les mocks)
import { setState } from '@controllers/Core/App';
import { HistoryManager } from '@controllers/Core/Managers/HistoryManager.js';

describe('HistoryManager - Tests TDD', () => {
  beforeEach(() => {
    // Réinitialiser l'état avant chaque test
    global.mockHistory.index = -1;
    global.mockHistory.steps = [];
    global.mockHistory.startSituation = null;
    global.mockWorkspace.initFromObject = vi.fn();
    Object.keys(global.mockSettings).forEach((key) => delete global.mockSettings[key]);
    global.mockEnvironment.name = 'Default';
    vi.clearAllMocks();
  });

  describe('canUndo', () => {
    it('devrait retourner false quand index = -1', () => {
      mockHistory.index = -1;

      expect(HistoryManager.canUndo()).toBe(false);
    });

    it('devrait retourner true quand index >= 0', () => {
      mockHistory.index = 0;

      expect(HistoryManager.canUndo()).toBe(true);
    });

    it('devrait retourner true pour des index positifs', () => {
      mockHistory.index = 5;

      expect(HistoryManager.canUndo()).toBe(true);
    });
  });

  describe('canRedo', () => {
    it('devrait retourner false quand index = steps.length - 1', () => {
      mockHistory.index = 2;
      mockHistory.steps = [{ id: 1 }, { id: 2 }, { id: 3 }];

      expect(HistoryManager.canRedo()).toBe(false);
    });

    it('devrait retourner true quand index < steps.length - 1', () => {
      mockHistory.index = 1;
      mockHistory.steps = [{ id: 1 }, { id: 2 }, { id: 3 }];

      expect(HistoryManager.canRedo()).toBe(true);
    });

    it('devrait retourner false quand il n\'y a pas de steps', () => {
      mockHistory.index = -1;
      mockHistory.steps = [];

      expect(HistoryManager.canRedo()).toBe(false);
    });

    it('devrait retourner true quand index = -1 et qu\'il y a des steps', () => {
      mockHistory.index = -1;
      mockHistory.steps = [{ id: 1 }];

      expect(HistoryManager.canRedo()).toBe(true);
    });
  });

  describe('undo', () => {
    it('ne devrait rien faire si canUndo() = false', () => {
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => { });
      mockHistory.index = -1;

      HistoryManager.undo();

      expect(consoleInfoSpy).toHaveBeenCalledWith('Nothing to undo');
      expect(mockWorkspace.initFromObject).not.toHaveBeenCalled();

      consoleInfoSpy.mockRestore();
    });

    it('devrait revenir à startSituation quand index devient -1', () => {
      mockHistory.index = 0;
      mockHistory.startSituation = { shapes: [], settings: {} };
      mockHistory.steps = [{ shapes: [{ id: 's1' }], settings: {} }];

      HistoryManager.undo();

      expect(global.mockWorkspace.initFromObject).toHaveBeenCalledWith(
        expect.objectContaining({ shapes: [] }),
      );
      expect(setState).toHaveBeenCalledWith(
        expect.objectContaining({
          history: expect.objectContaining({ index: -1 }),
        }),
      );
    });

    it('devrait revenir à l\'étape précédente quand index > 0', () => {
      global.mockHistory.index = 2;
      global.mockHistory.steps = [
        { shapes: [], settings: {} },
        { shapes: [{ id: 's1' }], settings: {} },
        { shapes: [{ id: 's1' }, { id: 's2' }], settings: {} },
      ];

      HistoryManager.undo();

      expect(global.mockWorkspace.initFromObject).toHaveBeenCalledWith(
        expect.objectContaining({ shapes: [{ id: 's1' }] }),
      );
      expect(setState).toHaveBeenCalledWith(
        expect.objectContaining({
          history: expect.objectContaining({ index: 1 }),
        }),
      );
    });

    it('devrait appeler FullHistoryManager.addStep après undo', async () => {
      const { FullHistoryManager } = await import(
        '@controllers/Core/Managers/FullHistoryManager.js'
      );
      mockHistory.index = 0;
      mockHistory.startSituation = { shapes: [], settings: {} };
      mockHistory.steps = [{ shapes: [{ id: 's1' }], settings: {} }];

      HistoryManager.undo();

      expect(FullHistoryManager.addStep).toHaveBeenCalledWith('add-fullstep', {
        detail: { name: 'Annuler' },
      });
    });
  });

  describe('redo', () => {
    it('ne devrait rien faire si canRedo() = false', () => {
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => { });
      global.mockHistory.index = 2;
      global.mockHistory.steps = [{ id: 1 }, { id: 2 }, { id: 3 }];

      HistoryManager.redo();

      expect(consoleInfoSpy).toHaveBeenCalledWith('Nothing to redo');
      expect(global.mockWorkspace.initFromObject).not.toHaveBeenCalled();

      consoleInfoSpy.mockRestore();
    });

    it('devrait avancer à l\'étape suivante', () => {
      global.mockHistory.index = 0;
      global.mockHistory.steps = [
        { shapes: [], settings: {} },
        { shapes: [{ id: 's1' }], settings: {} },
        { shapes: [{ id: 's1' }, { id: 's2' }], settings: {} },
      ];

      HistoryManager.redo();

      expect(global.mockWorkspace.initFromObject).toHaveBeenCalledWith(
        expect.objectContaining({ shapes: [{ id: 's1' }] }),
      );
      expect(setState).toHaveBeenCalledWith(
        expect.objectContaining({
          history: expect.objectContaining({ index: 1 }),
        }),
      );
    });

    it('devrait avancer depuis index = -1', () => {
      global.mockHistory.index = -1;
      global.mockHistory.steps = [{ shapes: [{ id: 's1' }], settings: {} }];

      HistoryManager.redo();

      expect(global.mockWorkspace.initFromObject).toHaveBeenCalledWith(
        expect.objectContaining({ shapes: [{ id: 's1' }] }),
      );
      expect(setState).toHaveBeenCalledWith(
        expect.objectContaining({
          history: expect.objectContaining({ index: 0 }),
        }),
      );
    });

    it('devrait appeler FullHistoryManager.addStep après redo', async () => {
      const { FullHistoryManager } = await import(
        '@controllers/Core/Managers/FullHistoryManager.js'
      );
      mockHistory.index = 0;
      mockHistory.steps = [
        { shapes: [], settings: {} },
        { shapes: [{ id: 's1' }], settings: {} },
      ];

      HistoryManager.redo();

      expect(FullHistoryManager.addStep).toHaveBeenCalledWith('add-fullstep', {
        detail: { name: 'Refaire' },
      });
    });
  });

  describe('Intégration undo/redo', () => {
    it('devrait permettre une séquence undo puis redo', () => {
      global.mockHistory.index = 1;
      global.mockHistory.startSituation = { shapes: [], settings: {} };
      global.mockHistory.steps = [
        { shapes: [{ id: 's1' }], settings: {} },
        { shapes: [{ id: 's1' }, { id: 's2' }], settings: {} },
      ];

      // Undo
      HistoryManager.undo();
      expect(setState).toHaveBeenLastCalledWith(
        expect.objectContaining({
          history: expect.objectContaining({ index: 0 }),
        }),
      );

      // Simuler que l'état a été mis à jour
      global.mockHistory.index = 0;

      // Redo
      HistoryManager.redo();
      expect(setState).toHaveBeenLastCalledWith(
        expect.objectContaining({
          history: expect.objectContaining({ index: 1 }),
        }),
      );
    });

    it('devrait empêcher undo au-delà du début', () => {
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => { });
      global.mockHistory.index = -1;
      global.mockHistory.startSituation = { shapes: [], settings: {} };

      HistoryManager.undo();

      expect(consoleInfoSpy).toHaveBeenCalledWith('Nothing to undo');
      expect(setState).not.toHaveBeenCalled();

      consoleInfoSpy.mockRestore();
    });

    it('devrait empêcher redo au-delà de la fin', () => {
      const consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => { });
      global.mockHistory.index = 1;
      global.mockHistory.steps = [{ shapes: [], settings: {} }, { shapes: [{ id: 's1' }], settings: {} }];

      HistoryManager.redo();

      expect(consoleInfoSpy).toHaveBeenCalledWith('Nothing to redo');
      expect(setState).not.toHaveBeenCalled();

      consoleInfoSpy.mockRestore();
    });
  });

  describe('Edge cases', () => {
    it('devrait gérer un historique vide', () => {
      global.mockHistory.index = -1;
      global.mockHistory.steps = [];
      global.mockHistory.startSituation = null;

      expect(HistoryManager.canUndo()).toBe(false);
      expect(HistoryManager.canRedo()).toBe(false);
    });

    it('devrait gérer un seul step', () => {
      global.mockHistory.index = 0;
      global.mockHistory.steps = [{ shapes: [], settings: {} }];

      expect(HistoryManager.canUndo()).toBe(true);
      expect(HistoryManager.canRedo()).toBe(false);
    });

    it('devrait gérer de nombreux steps', () => {
      global.mockHistory.index = 50;
      global.mockHistory.steps = Array.from({ length: 100 }, (_, i) => ({
        shapes: [],
        settings: {},
        id: i,
      }));

      expect(HistoryManager.canUndo()).toBe(true);
      expect(HistoryManager.canRedo()).toBe(true);
    });
  });

  describe('addStep', () => {
    it('devrait appeler saveData et setState', () => {
      global.mockHistory.steps = [];
      global.mockHistory.index = -1;

      const saveDataSpy = vi.spyOn(HistoryManager, 'saveData').mockReturnValue({ shapes: [], settings: {} });

      HistoryManager.addStep();

      expect(saveDataSpy).toHaveBeenCalled();
      expect(setState).toHaveBeenCalled();

      // Vérifier que setState a été appelé avec un historique mis à jour
      const setStateCall = setState.mock.calls[setState.mock.calls.length - 1][0];
      expect(setStateCall.history).toBeDefined();
      expect(setStateCall.history.steps).toBeDefined();
      expect(setStateCall.history.index).toBeGreaterThanOrEqual(0);

      saveDataSpy.mockRestore();
    });

    it('devrait supprimer les steps futurs lors de l\'ajout d\'un nouveau step', () => {
      global.mockHistory.steps = [{ id: 1 }, { id: 2 }, { id: 3 }];
      global.mockHistory.index = 1; // On est au step 2, il y a un step 3 après

      const saveDataSpy = vi.spyOn(HistoryManager, 'saveData').mockReturnValue({ shapes: [], settings: {} });

      HistoryManager.addStep();

      // Vérifier que setState a été appelé avec les steps correctement tronqués
      const setStateCall = setState.mock.calls[setState.mock.calls.length - 1][0];
      expect(setStateCall.history.steps.length).toBe(3); // index était 1, +1 nouveau step = 3 steps
      expect(setStateCall.history.index).toBe(2);

      saveDataSpy.mockRestore();
    });

    it('devrait appeler reduceSize après l\'ajout', () => {
      global.mockHistory.steps = [];
      global.mockHistory.index = -1;

      const saveDataSpy = vi.spyOn(HistoryManager, 'saveData').mockReturnValue({ shapes: [], settings: {} });
      const reduceSizeSpy = vi.spyOn(HistoryManager, 'reduceSize').mockImplementation(() => { });

      HistoryManager.addStep();

      expect(reduceSizeSpy).toHaveBeenCalled();

      saveDataSpy.mockRestore();
      reduceSizeSpy.mockRestore();
    });
  });

  describe('saveData', () => {
    it('devrait sauvegarder les données du workspace', () => {
      const mockWorkspaceData = {
        shapes: [{ id: 'shape1' }],
        points: [{ id: 'point1' }],
        settings: {}
      };

      global.mockWorkspace.data = { ...mockWorkspaceData };

      const result = HistoryManager.saveData();

      expect(result).toBeDefined();
      expect(result.settings).toBeDefined();
      expect(result.settings.gridType).toBeDefined(); // gridStore data should be added
    });

    it('devrait inclure les données tangram si environnement est Tangram', () => {
      global.mockEnvironment.name = 'Tangram';
      global.mockWorkspace.data = { shapes: [] };
      global.mockTangram.isSilhouetteShown = true;

      const result = HistoryManager.saveData();

      expect(result.tangram).toBeDefined();
      expect(result.tangram.isSilhouetteShown).toBe(true);

      // Restore
      global.mockEnvironment.name = 'Default';
      global.mockTangram.isSilhouetteShown = false;
    });
  });

  describe('isObjectEqual', () => {
    it('devrait retourner true pour deux objets identiques', () => {
      const obj1 = { a: 1, b: 2, c: { d: 3 } };
      const obj2 = { a: 1, b: 2, c: { d: 3 } };

      expect(HistoryManager.isObjectEqual(obj1, obj2)).toBe(true);
    });

    it('devrait retourner false pour deux objets différents', () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1, b: 3 };

      expect(HistoryManager.isObjectEqual(obj1, obj2)).toBe(false);
    });

    it('devrait retourner true pour deux objets vides', () => {
      expect(HistoryManager.isObjectEqual({}, {})).toBe(true);
    });

    it('devrait gérer les tableaux', () => {
      const obj1 = { arr: [1, 2, 3] };
      const obj2 = { arr: [1, 2, 3] };

      expect(HistoryManager.isObjectEqual(obj1, obj2)).toBe(true);
    });

    it('devrait retourner false pour des tableaux différents', () => {
      const obj1 = { arr: [1, 2, 3] };
      const obj2 = { arr: [1, 2, 4] };

      expect(HistoryManager.isObjectEqual(obj1, obj2)).toBe(false);
    });
  });

  describe('reduceSizeOfSingleObjectType', () => {
    it('devrait modifier les steps en place (pas de retour)', () => {
      const steps = [
        { objects: { shapesData: [{ id: 'shape1', color: 'red' }] } },
        { objects: { shapesData: [{ id: 'shape1', color: 'red' }] } }
      ];

      // reduceSizeOfSingleObjectType modifie steps en place, ne retourne rien
      const result = HistoryManager.reduceSizeOfSingleObjectType('shapes', steps, 1);

      // La fonction ne retourne rien
      expect(result).toBeUndefined();

      // Mais elle devrait avoir modifié steps[1]
      // Si les objets sont identiques, le second devrait avoir une référence
      expect(steps[1].objects.shapesData[0].indexOfReference).toBeDefined();
    });

    it('ne devrait rien faire si index est 0', () => {
      const steps = [
        { objects: { shapesData: [{ id: 'shape1' }] } },
        { objects: { shapesData: [{ id: 'shape1' }] } }
      ];

      const originalSteps = JSON.parse(JSON.stringify(steps));

      HistoryManager.reduceSizeOfSingleObjectType('shapes', steps, 0);

      // Les steps ne devraient pas être modifiés si index est 0
      expect(steps).toEqual(originalSteps);
    });

    it('devrait retourner early si les données sont manquantes', () => {
      const steps = [
        { objects: {} }, // Pas de shapesData
        { objects: {} }
      ];

      // Ne devrait pas crasher
      expect(() => HistoryManager.reduceSizeOfSingleObjectType('shapes', steps, 1)).not.toThrow();
    });
  });

  describe('reduceSize', () => {
    it('devrait appeler reduceSizeOfSingleObjectType pour chaque type', () => {
      const steps = [
        { objects: { shapesData: [], segmentsData: [], pointsData: [] } },
        { objects: { shapesData: [], segmentsData: [], pointsData: [] } }
      ];

      const reduceSpy = vi.spyOn(HistoryManager, 'reduceSizeOfSingleObjectType').mockImplementation(() => { });

      HistoryManager.reduceSize(steps, 1);

      // Devrait être appelé pour shapes, segments, points
      expect(reduceSpy).toHaveBeenCalledWith('shapes', expect.any(Array), 1);
      expect(reduceSpy).toHaveBeenCalledWith('segments', expect.any(Array), 1);
      expect(reduceSpy).toHaveBeenCalledWith('points', expect.any(Array), 1);

      reduceSpy.mockRestore();
    });

    it('ne devrait rien retourner (void function)', () => {
      const steps = [
        { objects: { shapesData: [{ id: 'shape1' }], segmentsData: [], pointsData: [] } },
        { objects: { shapesData: [{ id: 'shape1' }], segmentsData: [], pointsData: [] } }
      ];

      const result = HistoryManager.reduceSize(steps, 1);

      expect(result).toBeUndefined();
    });

    it('ne devrait rien faire si index est 0', () => {
      const steps = [{ objects: { shapesData: [] } }];

      const reduceSpy = vi.spyOn(HistoryManager, 'reduceSizeOfSingleObjectType');

      HistoryManager.reduceSize(steps, 0);

      // Ne devrait pas appeler reduceSizeOfSingleObjectType si index est 0
      expect(reduceSpy).not.toHaveBeenCalled();

      reduceSpy.mockRestore();
    });
  });
});

