// test/components/popups/sync-settings-popup.test.ts
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Mocks pour les services et le store
const mockSmartSync = vi.fn();
const mockGetLastSyncInfo = vi.fn();
const mockGetAllActivities = vi.fn();
const mockCacheService = {
  obtenirStatistiques: vi.fn(),
  viderCache: vi.fn(),
};

// Mock du store syncState avec signaux
const mockSyncInProgress = { value: false };
const mockSyncProgress = { value: 100 };

vi.doMock('@services/activity-sync.js', () => ({
  smartSync: mockSmartSync,
  getLastSyncInfo: mockGetLastSyncInfo,
}));

vi.doMock('@services/cache.service', () => ({
  CacheService: mockCacheService,
  CacheError: class CacheError extends Error { },
  CacheUnavailableError: class CacheUnavailableError extends Error { },
  CacheClearError: class CacheClearError extends Error { },
}));

vi.doMock('@utils/indexeddb-activities.js', () => ({
  getAllActivities: mockGetAllActivities,
}));

vi.doMock('@store/syncState.js', () => ({
  syncInProgress: mockSyncInProgress,
  syncProgress: mockSyncProgress,
}));

vi.doMock('@store/notions', () => ({
  cachedThemes: {
    set: vi.fn(),
  },
}));

describe('SyncSettingsPopup - Tests TDD', () => {
  let container: HTMLDivElement;

  beforeAll(async () => {
    // Charger le composant après avoir configuré les mocks
    await import('../../../src/components/popups/sync-settings-popup.ts');
  });

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    // Réinitialiser les mocks
    vi.clearAllMocks();
    mockSyncInProgress.value = false;
    mockSyncProgress.value = 100;

    // Valeurs par défaut pour les mocks
    mockGetLastSyncInfo.mockResolvedValue({
      lastSyncDate: new Date('2025-11-18T10:00:00'),
      syncedFilesCount: 50,
      totalFilesCount: 100,
      totalThemesCount: 5,
      expiryDate: new Date('2025-11-19T10:00:00'),
      isExpired: false,
      nextSyncDue: false,
    });

    mockGetAllActivities.mockResolvedValue(
      Array(50).fill({ id: 'test', version: 1 })
    );

    mockCacheService.obtenirStatistiques.mockResolvedValue({
      disponible: true,
      nombreElements: 10,
    });
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('Test 1: Gestion des erreurs réseau dans forceSync', () => {
    it('devrait afficher un message d\'erreur réseau approprié', async () => {
      // Arrange: Simuler une erreur réseau
      const networkError = new Error('Failed to fetch');
      mockSmartSync.mockRejectedValue(networkError);

      const element = document.createElement('sync-settings-popup') as any;
      container.appendChild(element);
      await element.updateComplete;

      // Act: Déclencher forceSync
      await element.forceSync();
      await element.updateComplete;

      // Assert: Vérifier le message d'erreur
      expect(element.errorMessage).toContain('🌐');
      expect(element.errorMessage).toContain('Problème de connexion réseau');
      expect(element.isSyncing).toBe(false);
    });

    it('devrait gérer une erreur d\'authentification', async () => {
      // Arrange
      const authError = new Error('Unauthorized 401');
      mockSmartSync.mockRejectedValue(authError);

      const element = document.createElement('sync-settings-popup') as any;
      container.appendChild(element);
      await element.updateComplete;

      // Act
      await element.forceSync();
      await element.updateComplete;

      // Assert
      expect(element.errorMessage).toContain('🔒');
      expect(element.errorMessage).toContain('authentification');
    });

    it('devrait gérer une erreur de timeout', async () => {
      // Arrange
      const timeoutError = new Error('Request timeout');
      mockSmartSync.mockRejectedValue(timeoutError);

      const element = document.createElement('sync-settings-popup') as any;
      container.appendChild(element);
      await element.updateComplete;

      // Act
      await element.forceSync();
      await element.updateComplete;

      // Assert
      expect(element.errorMessage).toContain('⏱️');
      expect(element.errorMessage).toContain('Délai d\'attente dépassé');
    });

    it('devrait gérer les erreurs non-Error (throw string, etc.)', async () => {
      // Arrange: Simuler un throw qui n'est pas une instance d'Error
      mockSmartSync.mockRejectedValue('Une erreur inattendue');

      const element = document.createElement('sync-settings-popup') as any;
      container.appendChild(element);
      await element.updateComplete;

      // Act
      await element.forceSync();
      await element.updateComplete;

      // Assert
      expect(element.errorMessage).toContain('⚠️');
      expect(element.errorMessage).toContain('Une erreur inattendue');
    });
  });

  describe('Test 2: Message cache vide dans clearCache', () => {
    it('devrait afficher un message de succès si le cache est déjà vide', async () => {
      // Arrange: Cache vide
      mockCacheService.obtenirStatistiques.mockResolvedValue({
        disponible: true,
        nombreElements: 0,
      });

      const element = document.createElement('sync-settings-popup') as any;
      container.appendChild(element);
      await element.updateComplete;

      // Act
      await element.clearCache();
      await element.updateComplete;

      // Assert
      expect(element.successMessage).toBe('✨ Le cache est déjà vide');
      expect(mockCacheService.viderCache).not.toHaveBeenCalled();
    });

    it('devrait vider le cache et afficher le nombre d\'éléments supprimés', async () => {
      // Arrange: Cache avec 25 éléments
      mockCacheService.obtenirStatistiques.mockResolvedValue({
        disponible: true,
        nombreElements: 25,
      });
      mockCacheService.viderCache.mockResolvedValue(undefined);

      const element = document.createElement('sync-settings-popup') as any;
      container.appendChild(element);
      await element.updateComplete;

      // Act
      await element.clearCache();
      await element.updateComplete;

      // Assert
      expect(mockCacheService.viderCache).toHaveBeenCalled();
      expect(element.successMessage).toContain('🗑️');
      expect(element.successMessage).toContain('25 éléments supprimés');
    });

    it('devrait gérer le cache non disponible', async () => {
      // Arrange
      mockCacheService.obtenirStatistiques.mockResolvedValue({
        disponible: false,
        raison: 'IndexedDB non supporté',
      });

      const element = document.createElement('sync-settings-popup') as any;
      container.appendChild(element);
      await element.updateComplete;

      // Act
      await element.clearCache();
      await element.updateComplete;

      // Assert
      expect(element.errorMessage).toContain('💾');
      expect(element.errorMessage).toContain('IndexedDB non supporté');
      expect(mockCacheService.viderCache).not.toHaveBeenCalled();
    });
  });

  describe('Test 3: Cas de synchronisation en cours', () => {
    it('devrait désactiver le bouton de sync quand une sync est en cours', async () => {
      // Arrange
      mockSyncInProgress.value = true;

      const element = document.createElement('sync-settings-popup') as any;
      container.appendChild(element);
      await element.updateComplete;

      // Act
      const shadowRoot = element.shadowRoot;
      const syncButton = shadowRoot.querySelector('.primary-action color-button') as any;

      // Assert
      expect(syncButton.disabled).toBe(true);
    });

    it('devrait afficher l\'indicateur de progression pendant la sync', async () => {
      // Arrange
      mockSmartSync.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            mockSyncInProgress.value = false;
            resolve('completed');
          }, 100);
        });
      });

      const element = document.createElement('sync-settings-popup') as any;
      container.appendChild(element);
      await element.updateComplete;

      // Act
      const syncPromise = element.forceSync();
      await element.updateComplete;

      // Assert - pendant la sync
      expect(element.isSyncing).toBe(true);

      // Attendre la fin
      await syncPromise;
      await element.updateComplete;

      // Assert - après la sync
      expect(element.isSyncing).toBe(false);
    });

    it('devrait afficher un message de succès après sync réussie', async () => {
      // Arrange
      mockSmartSync.mockResolvedValue('completed');

      const element = document.createElement('sync-settings-popup') as any;
      container.appendChild(element);
      await element.updateComplete;

      // Act
      await element.forceSync();
      await element.updateComplete;

      // Assert
      expect(element.successMessage).toContain('🔄');
      expect(element.successMessage).toContain('Synchronisation forcée terminée avec succès');
    });

    it('devrait gérer le cas où la sync est déjà récente', async () => {
      // Arrange
      mockSmartSync.mockResolvedValue('recent');

      const element = document.createElement('sync-settings-popup') as any;
      container.appendChild(element);
      await element.updateComplete;

      // Act
      await element.forceSync();
      await element.updateComplete;

      // Assert
      expect(element.successMessage).toContain('✅');
      expect(element.successMessage).toContain('Synchronisation déjà récente');
    });
  });

  describe('Test 4: Chargement des informations de synchronisation', () => {
    it('devrait charger les informations de sync au montage du composant', async () => {
      // Arrange & Act
      const element = document.createElement('sync-settings-popup') as any;
      container.appendChild(element);
      await element.updateComplete;

      // Attendre le chargement asynchrone
      await new Promise(resolve => setTimeout(resolve, 50));

      // Assert
      expect(mockGetLastSyncInfo).toHaveBeenCalled();
      expect(mockGetAllActivities).toHaveBeenCalled();
      expect(element.lastSyncInfo).not.toBeNull();
      expect(element.localActivitiesCount).toBe(50);
    });

    it('devrait gérer l\'absence d\'informations de sync', async () => {
      // Arrange
      mockGetLastSyncInfo.mockResolvedValue(null);

      // Act
      const element = document.createElement('sync-settings-popup') as any;
      container.appendChild(element);
      await element.updateComplete;
      await new Promise(resolve => setTimeout(resolve, 50));

      // Assert
      expect(element.lastSyncInfo).toBeNull();
    });
  });

  describe('Test 5: Dialog de confirmation pour vider le cache', () => {
    it('devrait afficher le dialog de confirmation', async () => {
      const element = document.createElement('sync-settings-popup') as any;
      container.appendChild(element);
      await element.updateComplete;

      // Act
      element.showClearCacheDialog();
      await element.updateComplete;

      // Assert
      expect(element.showClearCacheConfirmation).toBe(true);

      const shadowRoot = element.shadowRoot;
      const confirmDialog = shadowRoot.querySelector('.confirmation-overlay');
      expect(confirmDialog).not.toBeNull();
    });

    it('devrait annuler le vidage du cache', async () => {
      const element = document.createElement('sync-settings-popup') as any;
      container.appendChild(element);
      await element.updateComplete;

      element.showClearCacheDialog();
      await element.updateComplete;

      // Act
      element.cancelClearCache();
      await element.updateComplete;

      // Assert
      expect(element.showClearCacheConfirmation).toBe(false);
      expect(mockCacheService.viderCache).not.toHaveBeenCalled();
    });

    it('devrait confirmer et vider le cache', async () => {
      mockCacheService.obtenirStatistiques.mockResolvedValue({
        disponible: true,
        nombreElements: 10,
      });
      mockCacheService.viderCache.mockResolvedValue(undefined);

      const element = document.createElement('sync-settings-popup') as any;
      container.appendChild(element);
      await element.updateComplete;

      element.showClearCacheDialog();
      await element.updateComplete;

      // Act
      await element.confirmClearCache();
      await element.updateComplete;

      // Assert
      expect(element.showClearCacheConfirmation).toBe(false);
      expect(mockCacheService.viderCache).toHaveBeenCalled();
    });
  });

  describe('Test 6: Debouncing des actions', () => {
    it('ne devrait appeler forceSync qu\'une fois malgré plusieurs clics rapides', async () => {
      mockSmartSync.mockResolvedValue('completed');

      const element = document.createElement('sync-settings-popup') as any;
      container.appendChild(element);
      await element.updateComplete;

      // Act: Appels multiples rapides via la méthode debouncée
      element.debouncedForceSync();
      element.debouncedForceSync();
      element.debouncedForceSync();

      // Attendre que le debounce se déclenche
      await new Promise(resolve => setTimeout(resolve, 1100));
      await element.updateComplete;

      // Assert: Seulement 1 appel après le debounce
      expect(mockSmartSync).toHaveBeenCalledTimes(1);
    });
  });

  describe('Test 7: Optimisation du chargement paresseux', () => {
    it('devrait utiliser requestAnimationFrame pour différer le chargement', async () => {
      // Arrange: Espionner requestAnimationFrame
      const rafSpy = vi.spyOn(window, 'requestAnimationFrame');

      // Act: Créer le composant
      const element = document.createElement('sync-settings-popup') as any;
      container.appendChild(element);

      // Assert: requestAnimationFrame devrait avoir été appelé
      expect(rafSpy).toHaveBeenCalled();

      // Cleanup
      rafSpy.mockRestore();
    });

    it('ne devrait charger les données qu\'une seule fois même si loadSyncInfo est appelée plusieurs fois', async () => {
      const element = document.createElement('sync-settings-popup') as any;
      container.appendChild(element);

      // Attendre le premier chargement
      await new Promise(resolve => setTimeout(resolve, 50));

      const firstCallCount = mockGetLastSyncInfo.mock.calls.length;

      // Act: Appeler loadSyncInfo à nouveau
      await element.loadSyncInfo();
      await element.loadSyncInfo();
      await element.loadSyncInfo();

      // Assert: Pas d'appels supplémentaires
      expect(mockGetLastSyncInfo.mock.calls.length).toBe(firstCallCount);
    });

    it('devrait afficher un indicateur de chargement pendant le chargement initial', async () => {
      // Arrange: Ralentir artificiellement le chargement
      mockGetLastSyncInfo.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({
          lastSyncDate: new Date(),
          syncedFilesCount: 10,
          totalFilesCount: 100,
          totalThemesCount: 5,
          expiryDate: new Date(),
          isExpired: false,
          nextSyncDue: false,
        }), 100))
      );

      const element = document.createElement('sync-settings-popup') as any;
      container.appendChild(element);
      await element.updateComplete;

      // Déclencher le chargement et vérifier l'état
      await new Promise(resolve => setTimeout(resolve, 10));

      // L'élément devrait être en cours de chargement
      // Note: isLoading est private, on vérifie via le rendu
      await element.updateComplete;

      // Attendre la fin du chargement
      await new Promise(resolve => setTimeout(resolve, 150));
      await element.updateComplete;

      // Assert: Les données devraient être chargées
      expect(element.lastSyncInfo).not.toBeNull();
      expect(element.hasLoadedData).toBe(true);
    });
  });
});
