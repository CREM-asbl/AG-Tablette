import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock de gridStore et FullHistoryManager
vi.mock('@/store/gridStore', () => ({
  gridStore: {
    setGridType: vi.fn(),
    setGridSize: vi.fn(),
    setIsVisible: vi.fn(),
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
  };
  const mockSettings = {};
  const mockDefaultState = { tangram: {} };
  const mockEnvironment = { name: 'Default' };

  // Exposer les mocks globalement pour les tests
  global.mockHistory = mockHistory;
  global.mockWorkspace = mockWorkspace;
  global.mockSettings = mockSettings;
  global.mockDefaultState = mockDefaultState;
  global.mockEnvironment = mockEnvironment;

  return {
    app: {
      history: mockHistory,
      workspace: mockWorkspace,
      settings: mockSettings,
      defaultState: mockDefaultState,
      environment: mockEnvironment,
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
});

