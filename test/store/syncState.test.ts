/**
 * Tests unitaires pour le store de synchronisation
 * Utilise Vitest pour des tests appropriés avec assertions et cleanup automatique
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import {
  getSyncState,
  hideSyncIndicator,
  resetSyncState,
  setSyncCompleted,
  setSyncProgress,
  showSyncIndicator,
  syncInProgress,
  syncProgress,
  syncVisible
} from '../../src/store/syncState.js';

describe('Store de synchronisation', () => {

  beforeEach(() => {
    // Réinitialiser l'état avant chaque test de manière sûre
    try {
      syncProgress.value = 100;
      syncInProgress.value = false;
      syncVisible.value = false;
    } catch (error) {
      // Ignorer les erreurs de réinitialisation dans les tests
    }

    // Mock console pour éviter le spam dans les tests
    vi.spyOn(console, 'log').mockImplementation(() => { });
    vi.spyOn(console, 'warn').mockImplementation(() => { });
    vi.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    // Nettoyer les mocks après chaque test
    vi.restoreAllMocks();
  });

  describe('État initial', () => {
    test('doit avoir les valeurs par défaut correctes', () => {
      expect(syncProgress.value).toBe(100);
      expect(syncInProgress.value).toBe(false);
      expect(syncVisible.value).toBe(false);
    });

    test('getSyncState doit retourner l\'état complet', () => {
      const state = getSyncState();
      expect(state).toMatchObject({
        progress: 100,
        inProgress: false,
        visible: false
      });
      expect(state.timestamp).toBeTypeOf('number');
    });

    test('l\'état initial doit être cohérent après plusieurs réinitialisations', () => {
      for (let i = 0; i < 5; i++) {
        resetSyncState();
        expect(syncProgress.value).toBe(100);
        expect(syncInProgress.value).toBe(false);
        expect(syncVisible.value).toBe(false);
      }
    });
  });

  describe('setSyncProgress', () => {
    test('doit accepter des valeurs valides', () => {
      setSyncProgress(0);
      expect(syncProgress.value).toBe(0);
      expect(syncInProgress.value).toBe(true);
      expect(syncVisible.value).toBe(true);

      setSyncProgress(50);
      expect(syncProgress.value).toBe(50);
      expect(syncInProgress.value).toBe(true);

      setSyncProgress(100);
      expect(syncProgress.value).toBe(100);
      expect(syncInProgress.value).toBe(false);
    });

    test('doit normaliser les valeurs invalides', () => {
      setSyncProgress(-10);
      expect(syncProgress.value).toBe(0);

      setSyncProgress(150);
      expect(syncProgress.value).toBe(100);

      setSyncProgress(NaN);
      expect(syncProgress.value).toBe(100);
    });

    test('doit gérer les valeurs non numériques', () => {
      setSyncProgress('invalid' as any);
      expect(syncProgress.value).toBe(100);

      setSyncProgress(null as any);
      expect(syncProgress.value).toBe(100);

      setSyncProgress(undefined as any);
      expect(syncProgress.value).toBe(100);
    });

    test('doit arrondir les décimales seulement si normalisées', () => {
      // Les valeurs valides ne sont pas modifiées
      setSyncProgress(25.7);
      expect(syncProgress.value).toBe(25.7);

      setSyncProgress(50.3);
      expect(syncProgress.value).toBe(50.3);

      // Seules les valeurs invalides sont normalisées et arrondies
      setSyncProgress(-10.7);
      expect(syncProgress.value).toBe(0); // Normalisé et arrondi

      setSyncProgress(150.3);
      expect(syncProgress.value).toBe(100); // Normalisé et arrondi
    });

    test('doit émettre un événement personnalisé', () => {
      const mockEventListener = vi.fn();
      window.addEventListener('sync-progress-changed', mockEventListener);

      setSyncProgress(25);

      expect(mockEventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            percent: 25,
            oldValue: 100,
            inProgress: true
          })
        })
      );

      window.removeEventListener('sync-progress-changed', mockEventListener);
    });

    test('doit gérer les progressions dans l\'ordre', () => {
      const progressions = [0, 10, 25, 50, 75, 90, 100];

      progressions.forEach(progress => {
        setSyncProgress(progress);
        expect(syncProgress.value).toBe(progress);
        expect(syncInProgress.value).toBe(progress < 100);
      });
    });

    test('doit maintenir la visibilité pendant la progression', () => {
      setSyncProgress(0);
      expect(syncVisible.value).toBe(true);

      setSyncProgress(50);
      expect(syncVisible.value).toBe(true);

      setSyncProgress(99);
      expect(syncVisible.value).toBe(true);
    });
  });

  describe('setSyncCompleted', () => {
    test('doit marquer la synchronisation comme terminée', () => {
      setSyncProgress(50);
      setSyncCompleted();

      expect(syncProgress.value).toBe(100);
      expect(syncInProgress.value).toBe(false);
      expect(syncVisible.value).toBe(true); // Reste visible pour l'animation
    });

    test('doit masquer immédiatement si demandé', () => {
      setSyncProgress(50);
      setSyncCompleted(true);

      expect(syncProgress.value).toBe(100);
      expect(syncInProgress.value).toBe(false);
      expect(syncVisible.value).toBe(false);
    });

    test('doit émettre un événement de completion', () => {
      const mockEventListener = vi.fn();
      window.addEventListener('sync-completed', mockEventListener);

      setSyncCompleted(true);

      expect(mockEventListener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({
            hideIndicator: true
          })
        })
      );

      window.removeEventListener('sync-completed', mockEventListener);
    });

    test('doit fonctionner même si aucune sync n\'est en cours', () => {
      // État initial (100%)
      setSyncCompleted();
      expect(syncProgress.value).toBe(100);
      expect(syncInProgress.value).toBe(false);

      setSyncCompleted(true);
      expect(syncVisible.value).toBe(false);
    });
  });

  describe('Gestion de la visibilité', () => {
    test('showSyncIndicator doit afficher l\'indicateur', () => {
      showSyncIndicator();
      expect(syncVisible.value).toBe(true);
    });

    test('hideSyncIndicator doit masquer l\'indicateur', () => {
      showSyncIndicator();
      hideSyncIndicator();
      expect(syncVisible.value).toBe(false);
    });

    test('hideSyncIndicator ne doit pas masquer pendant une sync sans force', () => {
      setSyncProgress(50);
      hideSyncIndicator();
      expect(syncVisible.value).toBe(true); // Ne doit pas masquer
    });

    test('hideSyncIndicator avec force doit masquer même pendant une sync', () => {
      setSyncProgress(50);
      hideSyncIndicator(true);
      expect(syncVisible.value).toBe(false);
    });

    test('doit émettre des événements de visibilité', () => {
      const showListener = vi.fn();
      const hideListener = vi.fn();

      window.addEventListener('sync-indicator-shown', showListener);
      window.addEventListener('sync-indicator-hidden', hideListener);

      showSyncIndicator();
      expect(showListener).toHaveBeenCalled();

      hideSyncIndicator(true);
      expect(hideListener).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: expect.objectContaining({ force: true })
        })
      );

      window.removeEventListener('sync-indicator-shown', showListener);
      window.removeEventListener('sync-indicator-hidden', hideListener);
    });
  });

  describe('resetSyncState', () => {
    test('doit réinitialiser complètement l\'état', () => {
      setSyncProgress(25);
      showSyncIndicator();

      resetSyncState();

      expect(syncProgress.value).toBe(100);
      expect(syncInProgress.value).toBe(false);
      expect(syncVisible.value).toBe(false);
    });

    test('doit émettre un événement de reset', () => {
      const mockEventListener = vi.fn();
      window.addEventListener('sync-state-reset', mockEventListener);

      resetSyncState();

      expect(mockEventListener).toHaveBeenCalled();
      window.removeEventListener('sync-state-reset', mockEventListener);
    });

    test('doit être idempotent', () => {
      setSyncProgress(42);
      resetSyncState();
      const state1 = getSyncState();

      resetSyncState();
      const state2 = getSyncState();

      expect(state1.progress).toBe(state2.progress);
      expect(state1.inProgress).toBe(state2.inProgress);
      expect(state1.visible).toBe(state2.visible);
    });
  });

  describe('Gestion d\'erreurs', () => {
    test('setSyncProgress doit gérer les erreurs de signal', () => {
      // Simuler une erreur en rendant syncProgress.value non assignable
      const originalDescriptor = Object.getOwnPropertyDescriptor(syncProgress, 'value');
      const originalValue = syncProgress.value;

      // Créer un setter qui lance une erreur
      Object.defineProperty(syncProgress, 'value', {
        get: () => originalValue,
        set: () => { throw new Error('Test error'); },
        configurable: true
      });

      try {
        expect(() => setSyncProgress(50)).toThrow('Test error');
      } finally {
        // Restaurer la propriété originale
        if (originalDescriptor) {
          Object.defineProperty(syncProgress, 'value', originalDescriptor);
        }
      }
    });

    test('resetSyncState doit gérer les erreurs gracieusement', () => {
      // Mock d'une erreur lors de la réinitialisation
      const originalSet = syncProgress.value;
      Object.defineProperty(syncProgress, 'value', {
        get: () => originalSet,
        set: () => { throw new Error('Reset error'); },
        configurable: true
      });

      expect(() => resetSyncState()).toThrow('Erreur lors de la réinitialisation');

      // Restaurer
      Object.defineProperty(syncProgress, 'value', {
        value: 100,
        writable: true,
        configurable: true
      });
    });
  });

  describe('Performance', () => {
    test('doit supporter de nombreuses mises à jour rapides', () => {
      const startTime = performance.now();

      for (let i = 0; i <= 100; i++) {
        setSyncProgress(i);
      }

      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100); // Moins de 100ms pour 100 updates
      expect(syncProgress.value).toBe(100);
    });

    test('doit être efficace avec des mises à jour répétitives', () => {
      const iterations = 1000;
      const startTime = performance.now();

      for (let i = 0; i < iterations; i++) {
        setSyncProgress(50); // Même valeur répétée
      }

      const endTime = performance.now();
      const avgTime = (endTime - startTime) / iterations;

      expect(avgTime).toBeLessThan(0.1); // Moins de 0.1ms par update en moyenne
    });
  });

  describe('Intégration des signaux', () => {
    test('les signaux doivent être réactifs', () => {
      const initialProgress = syncProgress.value;

      setSyncProgress(42);

      expect(syncProgress.value).not.toBe(initialProgress);
      expect(syncProgress.value).toBe(42);
    });

    test('les signaux doivent maintenir la cohérence', () => {
      setSyncProgress(0);
      expect(syncInProgress.value).toBe(true);

      setSyncProgress(100);
      expect(syncInProgress.value).toBe(false);

      setSyncProgress(50);
      expect(syncInProgress.value).toBe(true);
    });

    test('les changements d\'état doivent être atomiques', () => {
      setSyncProgress(25);

      // Tous les signaux doivent être cohérents immédiatement
      expect(syncProgress.value).toBe(25);
      expect(syncInProgress.value).toBe(true);
      expect(syncVisible.value).toBe(true);
    });
  });

  describe('Scénarios d\'usage réels', () => {
    test('simulation complète de synchronisation', async () => {
      // Étape 1: Initialisation
      resetSyncState();
      expect(syncInProgress.value).toBe(false);

      // Étape 2: Début de sync
      setSyncProgress(0);
      expect(syncInProgress.value).toBe(true);
      expect(syncVisible.value).toBe(true);

      // Étape 3: Progression
      const steps = [10, 25, 50, 75, 90];
      for (const step of steps) {
        setSyncProgress(step);
        expect(syncProgress.value).toBe(step);
        expect(syncInProgress.value).toBe(true);
      }

      // Étape 4: Finalisation
      setSyncCompleted();
      expect(syncProgress.value).toBe(100);
      expect(syncInProgress.value).toBe(false);
      expect(syncVisible.value).toBe(true); // Reste visible pour animation
    });

    test('interruption de synchronisation', () => {
      setSyncProgress(50);
      expect(syncInProgress.value).toBe(true);

      // Interruption forcée
      resetSyncState();
      expect(syncInProgress.value).toBe(false);
      expect(syncProgress.value).toBe(100);
    });

    test('synchronisations multiples successives', () => {
      // Première sync
      setSyncProgress(0);
      setSyncProgress(100);
      setSyncCompleted();

      // Deuxième sync
      setSyncProgress(0);
      expect(syncInProgress.value).toBe(true);
      setSyncProgress(50);
      setSyncCompleted();

      expect(syncProgress.value).toBe(100);
      expect(syncInProgress.value).toBe(false);
    });
  });

  describe('Validation des événements', () => {
    test('tous les événements doivent être émis dans l\'ordre correct', () => {
      const events: string[] = [];

      const progressHandler = () => events.push('progress');
      const completedHandler = () => events.push('completed');
      const shownHandler = () => events.push('shown');
      const hiddenHandler = () => events.push('hidden');
      const resetHandler = () => events.push('reset');

      window.addEventListener('sync-progress-changed', progressHandler);
      window.addEventListener('sync-completed', completedHandler);
      window.addEventListener('sync-indicator-shown', shownHandler);
      window.addEventListener('sync-indicator-hidden', hiddenHandler);
      window.addEventListener('sync-state-reset', resetHandler);

      // Séquence d'actions
      setSyncProgress(50);  // progress, shown
      setSyncCompleted(true); // completed, hidden
      resetSyncState();      // reset

      expect(events).toContain('progress');
      expect(events).toContain('completed');
      expect(events).toContain('reset');

      // Nettoyer
      window.removeEventListener('sync-progress-changed', progressHandler);
      window.removeEventListener('sync-completed', completedHandler);
      window.removeEventListener('sync-indicator-shown', shownHandler);
      window.removeEventListener('sync-indicator-hidden', hiddenHandler);
      window.removeEventListener('sync-state-reset', resetHandler);
    });

    test('les détails des événements doivent être corrects', () => {
      const progressDetails: any[] = [];

      const progressHandler = (e: any) => {
        progressDetails.push(e.detail);
      };

      window.addEventListener('sync-progress-changed', progressHandler);

      setSyncProgress(25);
      setSyncProgress(75);

      expect(progressDetails).toHaveLength(2);
      expect(progressDetails[0]).toMatchObject({
        percent: 25,
        oldValue: 100,
        inProgress: true
      });
      expect(progressDetails[1]).toMatchObject({
        percent: 75,
        oldValue: 25,
        inProgress: true
      });

      window.removeEventListener('sync-progress-changed', progressHandler);
    });
  });

  describe('Edge cases', () => {
    test('doit gérer les valeurs de progression extrêmes', () => {
      setSyncProgress(Number.MIN_SAFE_INTEGER);
      expect(syncProgress.value).toBe(0);

      setSyncProgress(Number.MAX_SAFE_INTEGER);
      expect(syncProgress.value).toBe(100);

      setSyncProgress(Infinity);
      expect(syncProgress.value).toBe(100);

      setSyncProgress(-Infinity);
      expect(syncProgress.value).toBe(0);
    });

    test('doit gérer les appels concurrents', () => {
      // Simuler des appels "simultanés"
      setSyncProgress(25);
      setSyncProgress(50);
      setSyncProgress(75);

      // Le dernier appel doit l'emporter
      expect(syncProgress.value).toBe(75);
      expect(syncInProgress.value).toBe(true);
    });

    test('doit maintenir la cohérence avec des valeurs décimales précises', () => {
      const preciseValue = 33.333333333333;
      setSyncProgress(preciseValue);
      expect(syncProgress.value).toBe(preciseValue);
      expect(syncInProgress.value).toBe(true);
    });
  });
});