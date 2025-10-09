/**
 * Configuration de la base de données IndexedDB
 */
const DB_CONFIG = {
  name: 'agTabletteDB',
  version: 1,
  stores: {
    activities: 'activities'
  }
} as const;

/**
 * Types d'erreurs spécifiques pour le cache
 */
export class CacheError extends Error {
  public readonly type: string;

  constructor(message: string, type: string = 'CACHE_ERROR') {
    super(message);
    this.name = 'CacheError';
    this.type = type;
  }
}

export class CacheUnavailableError extends CacheError {
  constructor(message: string = 'Cache IndexedDB non disponible') {
    super(message, 'CACHE_UNAVAILABLE');
  }
}

export class CacheClearError extends CacheError {
  constructor(message: string = 'Erreur lors du vidage du cache') {
    super(message, 'CACHE_CLEAR_ERROR');
  }
}

/**
 * Interface pour les statistiques de cache
 */
interface CacheStats {
  disponible: boolean;
  nombreElements?: number;
  nomDB?: string;
  version?: number;
  derniereVerification?: Date;
  raison?: string;
}

/**
 * Interface pour la disponibilité du cache
 */
interface CacheAvailability {
  available: boolean;
  storeCount?: number;
  dbName?: string;
  reason?: string;
}

/**
 * Service pour les opérations IndexedDB
 * Gère le cache local des activités de manière centralisée
 */
export class CacheService {
  /**
   * Ouvre une connexion à la base de données IndexedDB
   * @returns {Promise<IDBDatabase>}
   * @private
   */
  private static async _ouvrirDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_CONFIG.name, DB_CONFIG.version);

      request.onerror = () => {
        if ((window as any).dev_mode) console.log('[CACHE] Erreur ouverture DB:', request.error);
        reject(new CacheUnavailableError(`Impossible d'ouvrir la base de données: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        if ((window as any).dev_mode) console.log('[CACHE] DB ouverte avec succès');
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(DB_CONFIG.stores.activities)) {
          db.createObjectStore(DB_CONFIG.stores.activities);
        }
      };
    });
  }

  /**
   * Vide complètement le cache IndexedDB
   * @returns {Promise<void>}
   * @throws {CacheClearError} Si le vidage échoue
   */
  static async viderCache(): Promise<void> {
    try {
      const db = await this._ouvrirDB();

      const transaction = db.transaction([DB_CONFIG.stores.activities], 'readwrite');
      const store = transaction.objectStore(DB_CONFIG.stores.activities);

      await new Promise<void>((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      db.close();

      console.log('[CACHE] Cache local vidé avec succès');

      // Dispatch événement pour notifier les autres composants
      window.dispatchEvent(new CustomEvent('cache-cleared', {
        detail: { timestamp: new Date() }
      }));

    } catch (error) {
      console.error('[CACHE] Erreur lors du vidage du cache:', error);

      if (error instanceof CacheError) {
        throw error;
      }

      throw new CacheClearError(`Impossible de vider le cache: ${(error as Error).message}`);
    }
  }

  /**
   * Vérifie la disponibilité et l'état du cache IndexedDB
   * @returns {Promise<CacheAvailability>}
   */
  static async verifierDisponibilite(): Promise<CacheAvailability> {
    try {
      // Vérifier le support d'IndexedDB
      if (!window.indexedDB) {
        return { available: false, reason: 'IndexedDB non supporté' };
      }

      const db = await this._ouvrirDB();

      // Compter les éléments dans le store
      const transaction = db.transaction([DB_CONFIG.stores.activities], 'readonly');
      const store = transaction.objectStore(DB_CONFIG.stores.activities);

      const count = await new Promise<number>((resolve, reject) => {
        const request = store.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      db.close();

      if ((window as any).dev_mode) console.log('[CACHE] Cache disponible, éléments:', count);

      return {
        available: true,
        storeCount: count,
        dbName: DB_CONFIG.name
      };

    } catch (error) {
      console.warn('[CACHE] Cache non disponible:', (error as Error).message);
      return {
        available: false,
        reason: (error as Error).message
      };
    }
  }

  /**
   * Obtient des statistiques détaillées sur le cache
   * @returns {Promise<CacheStats>}
   */
  static async obtenirStatistiques(): Promise<CacheStats> {
    try {
      const disponibilite = await this.verifierDisponibilite();

      if (!disponibilite.available) {
        return {
          disponible: false,
          raison: disponibilite.reason
        };
      }

      return {
        disponible: true,
        nombreElements: disponibilite.storeCount,
        nomDB: disponibilite.dbName,
        version: DB_CONFIG.version,
        derniereVerification: new Date()
      };

    } catch (error) {
      console.error('[CACHE] Erreur lors de l\'obtention des statistiques:', error);
      return {
        disponible: false,
        raison: `Erreur technique: ${(error as Error).message}`
      };
    }
  }
}