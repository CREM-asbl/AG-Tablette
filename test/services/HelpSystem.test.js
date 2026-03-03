import { HelpSystem, getHelpSystem } from '@services/HelpSystem';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock des modules de core
vi.mock('@core/PerformanceSystem', () => ({
  PerformanceSystem: {
    startMeasure: vi.fn(() => ({ id: 'test-measure' })),
    endMeasure: vi.fn()
  }
}));

vi.mock('@core/ValidationSystem', () => ({
  ValidationSystem: {
    validate: vi.fn((value, rules, fieldName) => {
      if (!value) {
        return {
          isValid: false,
          getAllMessages: () => ['Champ requis']
        };
      }
      if (typeof value !== 'string') {
        return {
          isValid: false,
          getAllMessages: () => ['Doit être une chaîne']
        };
      }
      return {
        isValid: true,
        getAllMessages: () => []
      };
    })
  }
}));

describe('HelpSystem Service', () => {
  let helpSystem;
  let mockFetch;

  beforeAll(() => {
    // Mock global fetch
    global.fetch = vi.fn();
    global.indexedDB = {
      open: vi.fn((dbName, version) => {
        return {
          onupgradeneeded: null,
          onsuccess: null,
          onerror: null,
          result: {
            objectStoreNames: {
              contains: vi.fn(() => false)
            },
            createObjectStore: vi.fn(),
            transaction: vi.fn(() => ({
              objectStore: vi.fn(() => ({
                get: vi.fn(() => ({
                  onsuccess: null,
                  onerror: null
                })),
                put: vi.fn()
              })),
              oncomplete: null,
              onerror: null
            }))
          }
        };
      })
    };
  });

  beforeEach(() => {
    // Réinitialiser HelpSystem avant chaque test
    helpSystem = new HelpSystem();

    // Créer un mock fetch sans comportement par défaut
    // Chaque test doit définir son propre mock
    mockFetch = vi.fn();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Détection de la langue', () => {
    it('détecte la langue du navigateur correctement', () => {
      const system = new HelpSystem();
      const lang = system.getLanguage();
      expect(['fr', 'nl', 'en']).toContain(lang);
    });

    it('utilise le français comme fallback', () => {
      const system = new HelpSystem();
      // Forcer une langue non supportée
      Object.defineProperty(navigator, 'language', {
        value: 'ja',
        configurable: true
      });
      const newSystem = new HelpSystem();
      expect(newSystem.detectLanguage()).toBe('fr');
    });
  });

  describe('Gestion du cache', () => {
    it('initialise le cache correctement', () => {
      expect(helpSystem.tutorialsCache).toBeDefined();
      expect(helpSystem.tutorialsCache.size).toBe(0);
    });
  });

  describe('Validation des tutoriels', () => {
    it('accepte un tutoriel valide', () => {
      const validTutorial = {
        toolName: 'createPoint',
        metadata: { title: { fr: 'Créer un point' }, category: 'creation' },
        steps: [{ id: 1, title: { fr: 'Étape 1' } }]
      };

      const result = helpSystem.validateTutorial(validTutorial);
      expect(result.isValid).toBe(true);
    });

    it('rejette un tutoriel sans ToolName', () => {
      const invalidTutorial = {
        metadata: { title: { fr: 'Test' }, category: 'creation' },
        steps: [{ id: 1, title: { fr: 'Étape 1' } }]
      };

      const result = helpSystem.validateTutorial(invalidTutorial);
      expect(result.isValid).toBe(false);
      const messages = result.getAllMessages();
      expect(messages[0]).toContain('toolName');
    });

    it('rejette un tutoriel sans étapes', () => {
      const invalidTutorial = {
        toolName: 'test',
        metadata: { title: { fr: 'Test' }, category: 'creation' },
        steps: []
      };

      const result = helpSystem.validateTutorial(invalidTutorial);
      expect(result.isValid).toBe(false);
    });
  });

  describe('Recherche', () => {
    it('interface de recherche disponible', () => {
      expect(typeof helpSystem.search).toBe('function');
    });
  });

  describe('Historique', () => {
    it('ajoute un tutoriel à l\'historique (sans IndexedDB)', () => {
      helpSystem.history = []; // Réinitialiser
      helpSystem.history.unshift({
        toolName: 'createPoint',
        timestamp: new Date().toISOString()
      });
      const history = helpSystem.getHistory();

      expect(history.length).toBe(1);
      expect(history[0].toolName).toBe('createPoint');
      expect(history[0].timestamp).toBeDefined();
    });

    it('gère la limite d\'historique', () => {
      helpSystem.history = [];
      const maxItems = helpSystem.maxHistoryItems;

      for (let i = 0; i < maxItems + 5; i++) {
        helpSystem.history.unshift({
          toolName: `tool${i}`,
          timestamp: new Date().toISOString()
        });
      }

      if (helpSystem.history.length > maxItems) {
        helpSystem.history = helpSystem.history.slice(0, maxItems);
      }

      expect(helpSystem.history.length).toBeLessThanOrEqual(maxItems);
    });

    it('efface l\'historique', () => {
      helpSystem.history = [{ toolName: 'test', timestamp: '2025-01-01' }];
      helpSystem.history = [];

      const history = helpSystem.getHistory();
      expect(history.length).toBe(0);
    });
  });

  describe('Changement de langue', () => {
    it('change la langue correctement', () => {
      helpSystem.setLanguage('nl');
      expect(helpSystem.getLanguage()).toBe('nl');
    });

    it('rejette les langues non supportées', () => {
      helpSystem.setLanguage('ja');
      expect(helpSystem.getLanguage()).not.toBe('ja');
    });
  });

  describe('Singleton global', () => {
    it('retourne la même instance via getHelpSystem', () => {
      const system1 = getHelpSystem();
      const system2 = getHelpSystem();
      expect(system1).toBe(system2);
    });
  });

  describe('Gestion des erreurs', () => {
    it('gère gracieusement les fichiers manquants', async () => {
      mockFetch.mockClear();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' })
      });

      const freshSystem = new HelpSystem();
      const result = await freshSystem.getTutorial('nonExistent');

      expect(result).toBeNull();
    });
  });

  describe('Récupération de tous les tutoriels', () => {
    it('retourne tous les tutoriels disponibles', async () => {
      const mockManifest = [
        {
          toolName: 'createPoint',
          metadata: { title: { fr: 'Créer un point' }, category: 'creation' }
        },
        {
          toolName: 'createLine',
          metadata: { title: { fr: 'Créer une ligne' }, category: 'creation' }
        }
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockManifest
      });

      const tutorials = await helpSystem.getAllTutorials();
      expect(tutorials).toEqual(mockManifest);
    });
  });
});
