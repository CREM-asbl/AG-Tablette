/**
 * Exemples d'utilisation des optimisations de synchronisation
 * AG-Tablette - Optimisations de Performance
 */

// ========================================
// 1. UTILISATION DE LA SYNCHRONISATION INTELLIGENTE
// ========================================

import { getLastSyncInfo, smartSync } from '../src/services/activity-sync.js';

// Synchronisation automatique (respecte le cache de 24h)
async function autoSync() {
  const result = await smartSync();

  switch (result) {
    case 'recent':
      console.log('✅ Synchronisation récente, pas de mise à jour nécessaire');
      break;
    case 'completed':
      console.log('🔄 Synchronisation terminée avec succès');
      break;
    case 'offline':
      console.log('📶 Hors ligne, synchronisation reportée');
      break;
    case 'in_progress':
      console.log('⏳ Synchronisation déjà en cours');
      break;
    case 'error':
      console.log('❌ Erreur lors de la synchronisation');
      break;
  }
}

// Synchronisation forcée (ignore le cache)
async function forceSync() {
  const result = await smartSync({ force: true });
  console.log('Synchronisation forcée:', result);
}

// Vérifier les informations de la dernière synchronisation
async function checkSyncStatus() {
  const info = await getLastSyncInfo();

  if (info) {
    console.log('Dernière synchronisation:', info.lastSyncDate);
    console.log('Activités synchronisées:', `${info.syncedFilesCount}/${info.totalFilesCount}`);
    console.log('Synchronisation requise:', info.nextSyncDue ? 'Oui' : 'Non');
  } else {
    console.log('Aucune synchronisation précédente détectée');
  }
}

// ========================================
// 2. GESTION DU CACHE DE MÉTADONNÉES
// ========================================

import {
  clearExpiredSyncMetadata,
  getSyncMetadata,
  isRecentSyncAvailable
} from '../src/utils/indexeddb-activities.js';

// Vérifier si une synchronisation récente est disponible
async function checkRecentSync() {
  const isRecent = await isRecentSyncAvailable(24); // 24 heures

  if (isRecent) {
    console.log('✅ Synchronisation récente disponible, pas besoin de resync');
    return false; // Pas besoin de synchroniser
  } else {
    console.log('⚠️ Synchronisation périmée, mise à jour recommandée');
    return true; // Synchronisation recommandée
  }
}

// Obtenir les métadonnées détaillées du cache
async function getCacheDetails() {
  const metadata = await getSyncMetadata();

  if (metadata) {
    console.log('Cache valide:', {
      lastSync: new Date(metadata.lastSyncDate).toLocaleString(),
      expiry: new Date(metadata.expiryDate).toLocaleString(),
      files: metadata.serverFiles?.length || 0,
      themes: metadata.serverThemes?.length || 0
    });
  } else {
    console.log('Aucun cache valide trouvé');
  }
}

// Nettoyer le cache expiré
async function cleanExpiredCache() {
  const wasExpired = await clearExpiredSyncMetadata();
  console.log('Cache expiré nettoyé:', wasExpired ? 'Oui' : 'Non');
}

// ========================================
// 3. NAVIGATION OPTIMISÉE
// ========================================

import { goToHomePage } from '../src/controllers/Core/Tools/general.js';

// Navigation optimisée vers la page d'accueil
function navigateToHome() {
  console.log('🏠 Navigation vers la page d\'accueil (optimisée)');
  goToHomePage(); // Plus de rechargement complet !
}

// Surveillance des changements d'état
function setupStateWatcher() {
  window.addEventListener('state-changed', () => {
    console.log('État de l\'application mis à jour');
  });
}

// ========================================
// 4. WORKFLOW COMPLET OPTIMISÉ
// ========================================

/**
 * Workflow optimisé de synchronisation
 * Cette fonction implémente la logique complète d'optimisation
 */
async function optimizedSyncWorkflow() {
  console.log('🚀 Démarrage du workflow de synchronisation optimisé');

  try {
    // 1. Vérifier d'abord le cache local
    const needsSync = await checkRecentSync();

    if (!needsSync) {
      console.log('✅ Cache valide, pas de synchronisation nécessaire');
      return 'cache_hit';
    }

    // 2. Vérifier la connectivité
    if (!navigator.onLine) {
      console.log('📶 Hors ligne, utilisation du cache existant');
      return 'offline';
    }

    // 3. Lancer la synchronisation intelligente
    console.log('🔄 Lancement de la synchronisation...');
    const syncResult = await smartSync();

    // 4. Traiter le résultat
    switch (syncResult) {
      case 'completed':
        console.log('✅ Synchronisation terminée avec succès');
        break;
      case 'recent':
        console.log('ℹ️ Synchronisation déjà récente');
        break;
      default:
        console.log('⚠️ Résultat de synchronisation:', syncResult);
    }

    return syncResult;

  } catch (error) {
    console.error('❌ Erreur dans le workflow de synchronisation:', error);
    return 'error';
  }
}

// ========================================
// 5. CONFIGURATION ET MONITORING
// ========================================

/**
 * Configuration de debug pour les optimisations
 */
function enableSyncDebug() {
  // Activer les logs détaillés
  localStorage.setItem('debug', 'true');
  console.log('🔍 Mode debug activé pour la synchronisation');
}

/**
 * Statistiques de performance de la synchronisation
 */
async function getSyncPerformanceStats() {
  const metadata = await getSyncMetadata();

  if (!metadata) {
    return null;
  }

  const timeSinceLastSync = Date.now() - metadata.lastSyncDate;
  const timeUntilExpiry = metadata.expiryDate - Date.now();

  return {
    lastSync: {
      timestamp: metadata.lastSyncDate,
      timeAgo: Math.floor(timeSinceLastSync / (1000 * 60 * 60)) + ' heures',
      filesCount: metadata.syncedFilesCount || 0,
      themesCount: metadata.totalThemesCount || 0
    },
    cache: {
      isValid: timeUntilExpiry > 0,
      expiresIn: Math.floor(timeUntilExpiry / (1000 * 60 * 60)) + ' heures',
      sizeEstimate: (metadata.serverFiles?.length || 0) + (metadata.serverThemes?.length || 0)
    },
    recommendations: {
      shouldSync: timeUntilExpiry <= 0,
      shouldCleanCache: timeSinceLastSync > 7 * 24 * 60 * 60 * 1000, // 7 jours
      cacheHealth: timeUntilExpiry > 0 ? 'good' : 'expired'
    }
  };
}

// ========================================
// 6. EXEMPLES D'UTILISATION PRATIQUE
// ========================================

// Au démarrage de l'application
async function onAppStart() {
  console.log('📱 Démarrage de l\'application');

  // Workflow de synchronisation optimisé
  const syncResult = await optimizedSyncWorkflow();

  // Afficher les statistiques
  const stats = await getSyncPerformanceStats();
  if (stats) {
    console.log('📊 Statistiques de synchronisation:', stats);
  }
}

// Lors du retour à la page d'accueil
function onHomePageNavigation() {
  console.log('🏠 Navigation vers la page d\'accueil');

  // Navigation optimisée (pas de rechargement)
  navigateToHome();

  // Pas de synchronisation automatique car gérée intelligemment
  console.log('✅ Navigation terminée sans rechargement');
}

// Synchronisation manuelle (bouton utilisateur)
async function onManualSync() {
  console.log('👤 Synchronisation manuelle demandée');

  const result = await smartSync({ force: true });

  if (result === 'completed') {
    // Afficher notification de succès
    window.dispatchEvent(new CustomEvent('show-notif', {
      detail: {
        message: 'Synchronisation terminée avec succès',
        type: 'success'
      }
    }));
  }
}

// ========================================
// 7. EXPORT DES FONCTIONS D'EXEMPLE
// ========================================

export {
  autoSync, checkRecentSync, checkSyncStatus, cleanExpiredCache, enableSyncDebug, forceSync, getCacheDetails, getSyncPerformanceStats, navigateToHome, onAppStart,
  onHomePageNavigation,
  onManualSync, optimizedSyncWorkflow
};
