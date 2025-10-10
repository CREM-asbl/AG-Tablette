/**
 * Architecture simplifiée AG-Tablette
 * Garde seulement les systèmes qui apportent une vraie valeur ajoutée
 */

// Systèmes réellement utiles (pas de doublon avec l'écosystème existant)
export {
  baseValidators,
  geometryValidators,
  predefinedSchemas, ValidationError,
  ValidationResult,
  ValidationTypes, validationUtils, validator,
  Validator
} from './ValidationSystem.js';

export {
  performanceMonitor,
  smartCache,
  SmartCache
} from './PerformanceSystem.js';

// Imports pour utilisation interne
import {
  performanceMonitor,
  smartCache
} from './PerformanceSystem.js';
import { validator } from './ValidationSystem.js';

// État global avec signaux Lit (remplace StateManager)
export * from '../store/appState.js';
export { kit } from '../store/kit.js';
export * from '../store/notions.js';
export { tools } from '../store/tools.js';

// Importer le store de synchronisation pour garantir son initialisation précoce
import '../store/syncState.js';

// Classes de base améliorées
export { BaseGeometryTool } from '../controllers/Core/States/BaseGeometryTool.js';
export { BaseShapeCreationTool } from '../controllers/Core/States/BaseShapeCreationTool.js';

/**
 * Utilitaires pour les events natifs (remplace EventBus)
 */
export const eventUtils = {
  /**
   * Émettre un événement global
   * @param {string} type - Type d'événement
   * @param {any} detail - Données de l'événement
   * @param {object} options - Options d'événement
   */
  emit: (type, detail = null, options = {}) => {
    const event = new CustomEvent(type, {
      detail,
      bubbles: options.bubbles ?? true,
      cancelable: options.cancelable ?? true,
      ...options
    });

    const target = options.target || window;
    target.dispatchEvent(event);

    return event;
  },

  /**
   * Écouter un événement
   * @param {string} type - Type d'événement
   * @param {Function} handler - Gestionnaire d'événement
   * @param {object} options - Options d'écoute
   * @returns {Function} Fonction de nettoyage
   */
  on: (type, handler, options = {}) => {
    const target = options.target || window;
    const wrappedHandler = options.once
      ? (event) => {
        handler(event);
        target.removeEventListener(type, wrappedHandler);
      }
      : handler;

    target.addEventListener(type, wrappedHandler, options);

    // Retourner fonction de nettoyage
    return () => target.removeEventListener(type, wrappedHandler);
  },

  /**
   * Écouter un événement une seule fois
   * @param {string} type - Type d'événement
   * @param {Function} handler - Gestionnaire d'événement
   * @param {object} options - Options d'écoute
   * @returns {Function} Fonction de nettoyage
   */
  once: (type, handler, options = {}) => {
    return eventUtils.on(type, handler, { ...options, once: true });
  },

  /**
   * Arrêter d'écouter un événement
   * @param {string} type - Type d'événement
   * @param {Function} handler - Gestionnaire d'événement
   * @param {object} options - Options
   */
  off: (type, handler, options = {}) => {
    const target = options.target || window;
    target.removeEventListener(type, handler, options);
  },

  /**
   * Créer un gestionnaire d'événements avec validation
   * @param {Function} handler - Gestionnaire original
   * @param {object} schema - Schéma de validation pour event.detail
   * @returns {Function} Gestionnaire validé
   */
  createValidatedHandler: (handler, schema = null) => {
    return (event) => {
      if (schema && event.detail) {
        const result = validator.validateSchema(event.detail, schema);
        if (!result.isValid) {
          console.warn('Données d\'événement invalides:', result.getAllMessages());
          return;
        }
      }
      handler(event);
    };
  },

  /**
   * Créer un throttled event handler
   * @param {Function} handler - Gestionnaire original
   * @param {number} delay - Délai en ms
   * @returns {Function} Gestionnaire throttlé
   */
  createThrottledHandler: (handler, delay = 100) => {
    let lastCall = 0;
    return (event) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        handler(event);
      }
    };
  }
};

/**
 * Utilitaires pour le chargement de modules (remplace ToolFactory)
 */
export const moduleUtils = {
  /**
   * Charger un module dynamiquement avec cache
   * @param {string} modulePath - Chemin du module
   * @returns {Promise<any>} Module chargé
   */
  loadModule: async (modulePath) => {
    try {
      console.log(modulePath)
      const module = await import(/* @vite-ignore */ modulePath);
      return module;
    } catch (error) {
      console.error(`Erreur lors du chargement du module ${modulePath}:`, error);
      throw error;
    }
  },

  /**
   * Charger plusieurs modules en parallèle
   * @param {array} modulePaths - Chemins des modules
   * @returns {Promise<array>} Modules chargés
   */
  loadModules: async (modulePaths) => {
    const results = await Promise.allSettled(
      modulePaths.map(path => moduleUtils.loadModule(path))
    );

    return results.map((result, index) => ({
      path: modulePaths[index],
      success: result.status === 'fulfilled',
      module: result.status === 'fulfilled' ? result.value : null,
      error: result.status === 'rejected' ? result.reason : null
    }));
  },

  /**
   * Créer une instance d'outil avec validation
   * @param {string} toolName - Nom de l'outil
   * @param {Function} ToolClass - Classe de l'outil
   * @param {object} options - Options d'initialisation
   * @returns {object} Instance d'outil
   */
  createTool: (toolName, ToolClass, options = {}) => {
    try {
      // Validation des paramètres
      if (!ToolClass || typeof ToolClass !== 'function') {
        throw new Error(`Classe d'outil invalide pour ${toolName}`);
      }

      // Créer l'instance
      const instance = new ToolClass(options);

      // Ajouter des métadonnées
      instance._toolName = toolName;
      instance._createdAt = Date.now();

      return instance;
    } catch (error) {
      console.error(`Erreur lors de la création de l'outil ${toolName}:`, error);
      throw error;
    }
  },

  /**
   * Extraire les métadonnées d'un module d'outil
   * @param {object} module - Module chargé
   * @returns {object} Métadonnées de l'outil
   */
  extractToolMetadata: (module) => {
    if (module.default && module.default.tool) {
      const tool = module.default.tool;
      return {
        name: tool.name,
        title: tool.title,
        type: tool.type,
        description: tool.description,
        isVisible: true
      };
    }
    return null;
  }
};

/**
 * Configuration simplifiée
 */
export class SimplifiedArchitecture {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialiser l'architecture simplifiée
   * @param {object} options - Options de configuration
   */
  async initialize(options = {}) {
    if (this.initialized) {
      console.warn('Architecture déjà initialisée');
      return;
    }

    try {
      console.log('🚀 Initialisation de l\'architecture simplifiée AG-Tablette...');

      const config = {
        enablePerformanceMonitoring: true,
        enableValidation: true,
        debugMode: false,
        ...options
      };

      // Activer le monitoring de performance si demandé
      if (config.enablePerformanceMonitoring) {
        performanceMonitor.enable();
      }

      // Configurer les gestionnaires d'événements globaux si en mode debug
      if (config.debugMode) {
        this.setupDebugEventListeners();
      }

      this.initialized = true;
      console.log('✅ Architecture simplifiée initialisée');

      // Émettre événement d'initialisation avec events natifs
      eventUtils.emit('architecture:initialized', { config });

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation:', error);
      throw error;
    }
  }

  /**
   * Configurer les écouteurs d'événements de debug
   */
  setupDebugEventListeners() {
    // Logger tous les événements personnalisés en mode debug
    const originalDispatchEvent = window.dispatchEvent;
    window.dispatchEvent = function (event) {
      if (event instanceof CustomEvent) {
        console.log(`[Event] ${event.type}`, event.detail);
      }
      return originalDispatchEvent.call(this, event);
    };
  }

  /**
   * Obtenir le statut de l'architecture
   * @returns {object}
   */
  getStatus() {
    return {
      initialized: this.initialized,
      performance: performanceMonitor.enabled ? performanceMonitor.getReport() : null,
      cache: smartCache.getStats(),
      validation: validator.getStats()
    };
  }

  /**
   * Nettoyer l'architecture
   */
  cleanup() {
    if (performanceMonitor.enabled) {
      performanceMonitor.disable();
    }
    smartCache.cleanup();
    this.initialized = false;

    eventUtils.emit('architecture:cleanup');
    console.log('🧹 Architecture nettoyée');
  }
}

// Instance singleton
export const architecture = new SimplifiedArchitecture();

/**
 * Initialisation rapide
 * @param {object} options - Options de configuration
 */
export const initializeArchitecture = async (options = {}) => {
  return architecture.initialize(options);
};

/**
 * Utilitaires globaux
 */
export const architectureUtils = {
  /**
   * Vérifier si l'architecture est initialisée
   */
  isInitialized: () => architecture.initialized,

  /**
   * Obtenir un rapport complet du système
   */
  getSystemReport: () => architecture.getStatus(),

  /**
   * Redémarrer l'architecture
   */
  restart: async (options = {}) => {
    architecture.cleanup();
    await architecture.initialize(options);
  }
};

// Auto-initialisation en développement
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeArchitecture({ debugMode: true });
    });
  } else {
    initializeArchitecture({ debugMode: true });
  }
}
