import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheClearError, CacheError, CacheService, CacheUnavailableError } from '../../src/services/cache.service';

// Mock d'IndexedDB pour les tests
const mockIndexedDB = {
  open: vi.fn(),
  deleteDatabase: vi.fn()
};

const mockDB = {
  close: vi.fn(),
  transaction: vi.fn(),
  objectStoreNames: {
    contains: vi.fn()
  },
  createObjectStore: vi.fn()
};

const mockTransaction = {
  objectStore: vi.fn()
};

const mockStore = {
  clear: vi.fn(),
  count: vi.fn()
};

const mockRequest = {
  result: mockDB,
  error: null,
  onsuccess: null,
  onerror: null,
  onupgradeneeded: null
};

describe('CacheService', () => {
  beforeEach(() => {
    // Configuration des mocks
    global.window = {
      indexedDB: mockIndexedDB,
      dispatchEvent: vi.fn(),
      dev_mode: true
    } as any;

    mockIndexedDB.open.mockReturnValue(mockRequest);
    mockDB.transaction.mockReturnValue(mockTransaction);
    mockTransaction.objectStore.mockReturnValue(mockStore);

    // Mock des promesses pour les opérations store
    const successPromise = Promise.resolve();
    mockStore.clear.mockReturnValue({ onsuccess: null, onerror: null });
    mockStore.count.mockReturnValue({ onsuccess: null, onerror: null });

    // Console mocks
    global.console = {
      log: vi.fn(),
      error: vi.fn(),
      warn: vi.fn()
    } as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('verifierDisponibilite', () => {
    it('devrait retourner disponible: false si IndexedDB n\'est pas supporté', async () => {
      global.window.indexedDB = undefined;

      const result = await CacheService.verifierDisponibilite();

      expect(result.available).toBe(false);
      expect(result.reason).toBe('IndexedDB non supporté');
    });

    it('devrait retourner disponible: true avec statistiques si IndexedDB fonctionne', async () => {
      // Simuler l'ouverture réussie de la DB
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess();
        }
      }, 0);

      // Simuler le count
      const countRequest = { onsuccess: null, onerror: null, result: 5 };
      mockStore.count.mockReturnValue(countRequest);
      setTimeout(() => {
        if (countRequest.onsuccess) {
          countRequest.onsuccess();
        }
      }, 0);

      const result = await CacheService.verifierDisponibilite();

      expect(result.available).toBe(true);
      expect(result.storeCount).toBe(5);
      expect(result.dbName).toBe('agTabletteDB');
    });

    it('devrait gérer les erreurs d\'ouverture de DB', async () => {
      setTimeout(() => {
        mockRequest.error = new Error('DB Error');
        if (mockRequest.onerror) {
          mockRequest.onerror();
        }
      }, 0);

      const result = await CacheService.verifierDisponibilite();

      expect(result.available).toBe(false);
      expect(result.reason).toContain('Impossible d\'ouvrir la base de données');
    });
  });

  describe('viderCache', () => {
    it('devrait vider le cache avec succès', async () => {
      // Simuler l'ouverture réussie
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess();
        }
      }, 0);

      // Simuler le clear
      const clearRequest = { onsuccess: null, onerror: null };
      mockStore.clear.mockReturnValue(clearRequest);
      setTimeout(() => {
        if (clearRequest.onsuccess) {
          clearRequest.onsuccess();
        }
      }, 10);

      await expect(CacheService.viderCache()).resolves.toBeUndefined();

      expect(mockDB.transaction).toHaveBeenCalledWith(['activities'], 'readwrite');
      expect(mockStore.clear).toHaveBeenCalled();
      expect(mockDB.close).toHaveBeenCalled();
      expect(global.window.dispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'cache-cleared'
        })
      );
    });

    it('devrait lancer CacheClearError en cas d\'erreur de vidage', async () => {
      // Simuler l'ouverture réussie
      setTimeout(() => {
        if (mockRequest.onsuccess) {
          mockRequest.onsuccess();
        }
      }, 0);

      // Simuler l'erreur de clear
      const clearRequest = { onsuccess: null, onerror: null, error: new Error('Clear failed') };
      mockStore.clear.mockReturnValue(clearRequest);
      setTimeout(() => {
        if (clearRequest.onerror) {
          clearRequest.onerror();
        }
      }, 10);

      await expect(CacheService.viderCache()).rejects.toThrow(CacheClearError);
    });

    it('devrait lancer CacheUnavailableError si la DB ne peut pas s\'ouvrir', async () => {
      setTimeout(() => {
        mockRequest.error = new Error('DB unavailable');
        if (mockRequest.onerror) {
          mockRequest.onerror();
        }
      }, 0);

      await expect(CacheService.viderCache()).rejects.toThrow(CacheError);
    });
  });

  describe('obtenirStatistiques', () => {
    it('devrait retourner des statistiques complètes', async () => {
      // Mock de verifierDisponibilite
      vi.spyOn(CacheService, 'verifierDisponibilite').mockResolvedValue({
        available: true,
        storeCount: 10,
        dbName: 'agTabletteDB'
      });

      const stats = await CacheService.obtenirStatistiques();

      expect(stats.disponible).toBe(true);
      expect(stats.nombreElements).toBe(10);
      expect(stats.nomDB).toBe('agTabletteDB');
      expect(stats.version).toBe(1);
      expect(stats.derniereVerification).toBeInstanceOf(Date);
    });

    it('devrait retourner disponible: false en cas d\'erreur', async () => {
      vi.spyOn(CacheService, 'verifierDisponibilite').mockRejectedValue(new Error('Test error'));

      const stats = await CacheService.obtenirStatistiques();

      expect(stats.disponible).toBe(false);
      expect(stats.raison).toContain('Erreur technique');
    });
  });

  describe('Types d\'erreurs', () => {
    it('CacheError devrait avoir les bonnes propriétés', () => {
      const error = new CacheError('Test message', 'TEST_TYPE');

      expect(error.name).toBe('CacheError');
      expect(error.message).toBe('Test message');
      expect(error.type).toBe('TEST_TYPE');
      expect(error).toBeInstanceOf(Error);
    });

    it('CacheUnavailableError devrait hériter de CacheError', () => {
      const error = new CacheUnavailableError();

      expect(error).toBeInstanceOf(CacheError);
      expect(error.type).toBe('CACHE_UNAVAILABLE');
      expect(error.message).toBe('Cache IndexedDB non disponible');
    });

    it('CacheClearError devrait hériter de CacheError', () => {
      const error = new CacheClearError();

      expect(error).toBeInstanceOf(CacheError);
      expect(error.type).toBe('CACHE_CLEAR_ERROR');
      expect(error.message).toBe('Erreur lors du vidage du cache');
    });
  });
});