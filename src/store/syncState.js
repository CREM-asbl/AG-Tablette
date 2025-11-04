import { signal } from '@lit-labs/signals';

// Configuration du module
const CONFIG = {
  MIN_PROGRESS: 0,
  MAX_PROGRESS: 100,
  DEBUG_LOGS:
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.search.includes('debug=true')),
  STORE_KEY: '__AG_SYNC_STORE__',
};

/**
 * Utilitaires de validation et logging
 */
const utils = {
  /**
   * Valide un pourcentage de progression
   * @param {number} percent - Valeur à valider
   * @returns {boolean} Vrai si valide
   */
  isValidPercent: (percent) => {
    return (
      typeof percent === 'number' &&
      !isNaN(percent) &&
      percent >= CONFIG.MIN_PROGRESS &&
      percent <= CONFIG.MAX_PROGRESS
    );
  },

  /**
   * Normalise un pourcentage
   * @param {number} percent - Valeur à normaliser
   * @returns {number} Valeur normalisée
   */
  normalizePercent: (percent) => {
    if (typeof percent !== 'number' || isNaN(percent))
      return CONFIG.MAX_PROGRESS;
    // Ne pas arrondir pour préserver les valeurs décimales précises
    return Math.max(CONFIG.MIN_PROGRESS, Math.min(CONFIG.MAX_PROGRESS, percent));
  },

  /**
   * Log conditionnel selon l'environnement
   * @param {string} level - Niveau de log (log, warn, error)
   * @param {string} message - Message à logger
   * @param {...any} args - Arguments supplémentaires
   */
  log: (level, message, ...args) => {
    if (CONFIG.DEBUG_LOGS) {
      console[level](`[SYNCSTATE] ${message}`, ...args);
    }
  },
};

// Garantir un store global unique (évite des doubles instances en dev/hot reload et en SSR/hydratation)
const g = /** @type {any} */ (globalThis);
g[CONFIG.STORE_KEY] ||= {
  syncProgress: signal(100), // 100 = terminé/aucune sync en cours
  syncVisible: signal(false),
  syncInProgress: signal(false),
};

export const syncProgress = g[CONFIG.STORE_KEY].syncProgress;
export const syncVisible = g[CONFIG.STORE_KEY].syncVisible;
export const syncInProgress = g[CONFIG.STORE_KEY].syncInProgress;

// Store initialisé

// Fonctions utilitaires pour contrôler l'état de sync

/**
 * Définit le pourcentage de progression de la synchronisation
 * @param {number} percent - Pourcentage de progression (0-100)
 * @throws {Error} Si le paramètre est invalide
 */
export function setSyncProgress(percent) {
  // Validation stricte en mode développement
  if (!utils.isValidPercent(percent)) {
    const normalizedPercent = utils.normalizePercent(percent);
    utils.log(
      'warn',
      `Valeur de progression invalide: ${percent}, normalisée à: ${normalizedPercent}`,
    );
    percent = normalizedPercent;
  }

  const oldValue = syncProgress.value;

  try {
    utils.log(
      'log',
      'setSyncProgress:',
      percent,
      '→ syncProgress.value avant:',
      oldValue,
    );

    // Mise à jour atomique des signaux
    syncProgress.value = percent;
    syncInProgress.value = percent < CONFIG.MAX_PROGRESS;

    // Afficher l'indicateur si synchronisation en cours
    if (percent < CONFIG.MAX_PROGRESS) {
      syncVisible.value = true;
    }

    utils.log(
      'log',
      'setSyncProgress:',
      percent,
      '→ syncProgress.value après:',
      syncProgress.value,
      'visible:',
      syncVisible.value,
      'inProgress:',
      syncInProgress.value,
    );

    // Émettre un événement personnalisé pour les composants qui ne peuvent pas utiliser les signaux
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sync-progress-changed', {
          detail: { percent, oldValue, inProgress: syncInProgress.value },
        }),
      );
    }
  } catch (error) {
    utils.log(
      'error',
      'Erreur lors de la mise à jour de la progression:',
      error,
    );
    // Restaurer l'ancienne valeur en cas d'erreur
    syncProgress.value = oldValue;
    throw new Error(
      `Erreur lors de la mise à jour de la progression: ${error.message}`,
    );
  }
}

/**
 * Marque la synchronisation comme terminée
 * @param {boolean} [hideIndicator=false] - Masquer immédiatement l'indicateur
 */
export function setSyncCompleted(hideIndicator = false) {
  try {
    utils.log('log', 'setSyncCompleted appelée, hideIndicator:', hideIndicator);

    syncProgress.value = CONFIG.MAX_PROGRESS;
    syncInProgress.value = false;

    if (hideIndicator) {
      syncVisible.value = false;
    }
    // Sinon, la visibilité sera gérée par le composant avec un délai

    // Émettre un événement de fin de synchronisation
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sync-completed', {
          detail: { hideIndicator },
        }),
      );
    }

    utils.log('log', 'Synchronisation marquée comme terminée');
  } catch (error) {
    utils.log(
      'error',
      'Erreur lors de la finalisation de la synchronisation:',
      error,
    );
    throw new Error(`Erreur lors de la finalisation: ${error.message}`);
  }
}

/**
 * Masque l'indicateur de synchronisation
 * @param {boolean} [force=false] - Forcer le masquage même si sync en cours
 */
export function hideSyncIndicator(force = false) {
  try {
    if (!force && syncInProgress.value) {
      utils.log(
        'warn',
        "Tentative de masquage de l'indicateur alors qu'une sync est en cours",
      );
      return;
    }

    utils.log('log', 'hideSyncIndicator appelée, force:', force);
    syncVisible.value = false;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('sync-indicator-hidden', { detail: { force } }),
      );
    }
  } catch (error) {
    utils.log('error', "Erreur lors du masquage de l'indicateur:", error);
  }
}

/**
 * Affiche l'indicateur de synchronisation
 */
export function showSyncIndicator() {
  try {
    utils.log('log', 'showSyncIndicator appelée');
    syncVisible.value = true;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sync-indicator-shown'));
    }
  } catch (error) {
    utils.log('error', "Erreur lors de l'affichage de l'indicateur:", error);
  }
}

/**
 * Réinitialise complètement l'état de synchronisation
 * Utile pour les tests ou le debugging
 */
export function resetSyncState() {
  try {
    utils.log('log', "Réinitialisation de l'état de synchronisation");

    syncProgress.value = CONFIG.MAX_PROGRESS;
    syncInProgress.value = false;
    syncVisible.value = false;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sync-state-reset'));
    }
  } catch (error) {
    utils.log('error', 'Erreur lors de la réinitialisation:', error);
    throw new Error(`Erreur lors de la réinitialisation: ${error.message}`);
  }
}

/**
 * Obtient l'état actuel de synchronisation
 * @returns {object} État actuel avec toutes les propriétés
 */
export function getSyncState() {
  return {
    progress: syncProgress.value,
    inProgress: syncInProgress.value,
    visible: syncVisible.value,
    timestamp: Date.now(),
  };
}
