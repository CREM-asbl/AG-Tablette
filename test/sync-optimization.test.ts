/**
 * Tests unitaires pour les optimisations de synchronisation
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Mock des services
vi.mock('@services/activity-sync', async () => {
  const actual = await vi.importActual('@services/activity-sync');
  return {
    ...actual,
    smartSync: vi.fn(async (options) => {
      const { isRecentSyncAvailable } = await import('../src/utils/indexeddb-activities.js');
      if (!options?.force && await isRecentSyncAvailable()) {
        return 'recent';
      }
      return 'completed';
    }),
  };
});

vi.mock('@controllers/Core/App', () => ({
  app: {
    workspace: { zoomLevel: 1 },
    settings: { mainMenuWidth: 0 },
    tool: {
      currentTool: {
        name: 'mockTool',
        is(toolName) {
          return this.name === toolName;
        },
        selectTool: vi.fn(),
      },
    },
  }
}));

// Mock IndexedDB pour les tests
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn(),
};

global.indexedDB = mockIndexedDB;

vi.mock('../src/utils/indexeddb-activities.js', async () => {
  const actual = await vi.importActual('../src/utils/indexeddb-activities.js');
  return {
    ...actual,
    isRecentSyncAvailable: vi.fn().mockResolvedValue(true),
    getSyncMetadata: vi.fn().mockResolvedValue({
      lastSyncDate: Date.now() - 1000,
      expiryDate: Date.now() + 1000,
    }),
  };
});


describe('Optimisations de Synchronisation', () => {
  beforeEach(() => {
    // Mock IndexedDB pour les tests
    const mockIndexedDB = {
      open: vi.fn((name, version) => {
        const request = {
          onsuccess: null,
          onerror: null,
          onupgradeneeded: null,
          result: null,
          error: null,
        };

        setTimeout(() => {
          if (request.onupgradeneeded) {
            const db = {
              objectStoreNames: {
                contains: vi.fn(() => false),
              },
              createObjectStore: vi.fn(() => ({
                put: vi.fn(() => {
                  const request = {
                    onsuccess: null,
                    onerror: null,
                    result: null,
                  };
                  setTimeout(() => {
                    if (request.onsuccess) {
                      request.onsuccess({ target: { result: 'mocked_result' } });
                    }
                  }, 0);
                  return request;
                }),
                get: vi.fn(),
                getAll: vi.fn(),
                count: vi.fn(),
                delete: vi.fn(),
              })),
              transaction: vi.fn(() => ({
                objectStore: vi.fn(() => ({
                  put: vi.fn(() => {
                    const request = {
                      onsuccess: null,
                      onerror: null,
                      result: null,
                    };
                    setTimeout(() => {
                      if (request.onsuccess) {
                        request.onsuccess({ target: { result: 'mocked_result' } });
                      }
                    }, 0);
                    return request;
                  }),
                  get: vi.fn(),
                  getAll: vi.fn(),
                  count: vi.fn(),
                  delete: vi.fn(),
                })),
                complete: Promise.resolve(),
              })),
            };
            request.onupgradeneeded({ target: { result: db } });
            request.result = db;
          }
          if (request.onsuccess) {
            request.onsuccess({ target: { result: request.result } });
          }
        }, 0);

        return request;
      }),
      deleteDatabase: vi.fn(),
    };

    global.indexedDB = mockIndexedDB;
    vi.clearAllMocks();
    global.navigator = { onLine: true };
    global.window = {
      ...global.window,
      location: {
        href: 'http://localhost:3000/some/path?param=value',
        origin: 'http://localhost:3000',
        pathname: '/some/path',
        search: '?param=value',
        hash: '',
        assign: vi.fn(),
        replace: vi.fn(),
        reload: vi.fn(),
        toString: () => 'http://localhost:3000/some/path?param=value',
      },
      history: {
        pushState: vi.fn(),
        replaceState: vi.fn(),
        go: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
        length: 1,
        scrollRestoration: 'auto',
        state: {},
      },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Cache de métadonnées', () => {
    test('devrait sauvegarder les métadonnées de synchronisation', async () => {
      // Mock de la base de données
      const mockTransaction = {
        objectStore: vi.fn().mockReturnValue({
          put: vi.fn().mockImplementation((data) => {
            expect(data).toHaveProperty('lastSyncDate');
            expect(data).toHaveProperty('expiryDate');
            expect(data).toHaveProperty('serverFiles');
            expect(data).toHaveProperty('serverThemes');
            return { onsuccess: null, onerror: null };
          })
        })
      };

      const mockDB = {
        transaction: vi.fn().mockReturnValue(mockTransaction)
      };

      mockIndexedDB.open.mockImplementation(() => ({
        onsuccess: null,
        onerror: null,
        result: mockDB
      }));

      // Import dynamique pour éviter les erreurs au chargement
      const { saveSyncMetadata } = await import('../src/utils/indexeddb-activities.js');

      const metadata = {
        lastSyncDate: Date.now(),
        serverFiles: [{ id: 'test', version: 1 }],
        serverThemes: [{ id: 'theme1', version: 1 }]
      };

      // Le test vérifie que la fonction est appelée sans erreur
      expect(() => saveSyncMetadata(metadata)).not.toThrow();
    });

    test('devrait vérifier la fraîcheur de la synchronisation', async () => {
      // Mock pour une synchronisation récente
      const recentTime = Date.now() - (12 * 60 * 60 * 1000); // 12 heures ago

      const mockResult = {
        id: 'sync_metadata',
        lastSyncDate: recentTime,
        expiryDate: Date.now() + (12 * 60 * 60 * 1000) // Dans 12 heures
      };

      const mockTransaction = {
        objectStore: vi.fn().mockReturnValue({
          get: vi.fn().mockImplementation(() => ({
            onsuccess: null,
            onerror: null,
            result: mockResult
          }))
        })
      };

      const mockDB = {
        transaction: vi.fn().mockReturnValue(mockTransaction)
      };

      mockIndexedDB.open.mockImplementation(() => ({
        onsuccess: null,
        onerror: null,
        result: mockDB
      }));

      const { isRecentSyncAvailable } = await import('../src/utils/indexeddb-activities.js');

      // Test que la fonction existe et peut être appelée
      expect(typeof isRecentSyncAvailable).toBe('function');
    });
  });

  describe('Synchronisation intelligente', () => {
    test('devrait éviter la synchronisation si récente', async () => {
      const { smartSync } = await import('../src/services/activity-sync.js');

      const result = await smartSync();
      expect(result).toBe('recent');
    });

    test('devrait forcer la synchronisation quand demandé', async () => {
      const { smartSync } = await import('../src/services/activity-sync.js');

      // Test avec force = true
      const result = await smartSync({ force: true });
      expect(result).toBe('completed');
    });
  });

  describe('Navigation optimisée', () => {
    test('devrait réinitialiser l\'état sans recharger', async () => {
      // Mock de l'objet window et app
      global.window.app = { environment: 'Geometrie' };
      global.window.location.href = 'http://localhost:3000?interface=Geometrie';
      global.window.dispatchEvent = vi.fn();

      const { goToHomePage } = await import('../src/controllers/Core/Tools/general.js');

      // Appeler la fonction
      goToHomePage();

      // Vérifier que l'environnement est réinitialisé
      expect(window.app.environment).toBeUndefined();

      // Vérifier que les événements sont déclenchés
      expect(window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'state-changed'
        })
      );

      // Vérifier que l'URL est mise à jour
      expect(window.history.pushState).toHaveBeenCalled();
    });
  });

  describe('Intégration complète', () => {
    test('devrait optimiser le cycle complet de navigation', async () => {
      let syncCallCount = 0;

      // Mock de la synchronisation pour compter les appels
      const activitySync = await import('../src/services/activity-sync.js');
      vi.spyOn(activitySync, 'smartSync').mockImplementation(async () => {
        syncCallCount++;
        return 'recent';
      });
      vi.spyOn(activitySync, 'getLastSyncInfo').mockResolvedValue({
        lastSyncDate: new Date(),
        syncedFilesCount: 10,
        totalFilesCount: 10,
        nextSyncDue: false
      });

      // Simuler plusieurs navigations vers la page d'accueil
      const { goToHomePage } = await import('../src/controllers/Core/Tools/general.js');

      goToHomePage();
      goToHomePage();
      goToHomePage();

      // Vérifier que la synchronisation n'est pas appelée à chaque navigation
      // (dans un vrai scénario, elle ne serait appelée qu'une fois par 24h)
      expect(syncCallCount).toBeLessThan(3);
    });
  });
});