import { performanceMonitor } from '@core';

/**
 * Service central pour la gestion du système d'aide
 * Responsable du chargement, recherche et historique des tutoriels
 */
export class HelpSystem {
  constructor() {
    this.tutorialsCache = new Map();
    this.searchIndex = new Map();
    this.history = [];
    this.maxHistoryItems = 20;
    this.currentLanguage = this.detectLanguage();
    this.initialized = false;
  }

  /**
   * Détecte la langue du navigateur (fr, nl, en)
   * Fallback: français
   */
  detectLanguage() {
    const browserLang = navigator.language || navigator.userLanguage || 'fr';
    const langCode = browserLang.split('-')[0].toLowerCase();

    // Mapper les codes langue supportés
    const supportedLangs = { fr: 'fr', nl: 'nl', en: 'en' };
    return supportedLangs[langCode] || 'fr';
  }

  /**
   * Initialiser le système d'aide
   * Charge les tutoriels disponibles et construit l'index de recherche
   */
  async initialize() {
    if (this.initialized) return;

    let perfTracker = null;
    try {
      perfTracker = performanceMonitor?.startMeasure?.('HelpSystem.initialize');
    } catch (e) {
      // performanceMonitor peut ne pas être disponible en tests
    }

    try {
      // Charger la liste des tutoriels disponibles depuis le manifest
      const tutorialsManifest = await this.loadTutorialsManifest();

      // Construire l'index de recherche sans charger tous les tutoriels
      this.buildSearchIndex(tutorialsManifest);

      // Charger l'historique depuis IndexedDB
      await this.loadHistory();

      this.initialized = true;

      if (import.meta.env.DEV) {
        console.log(`HelpSystem initialisé avec ${tutorialsManifest.length} tutoriels disponibles`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation de HelpSystem:', error);
      throw error;
    } finally {
      try {
        if (perfTracker) performanceMonitor?.endMeasure?.(perfTracker);
      } catch (e) {
        // Silently ignore
      }
    }
  }

  /**
   * Charger le manifest des tutoriels disponibles
   * @returns {Promise<Array>} Liste des tutoriels avec métadonnées
   */
  async loadTutorialsManifest() {
    try {
      const response = await fetch('/data/help/manifest.json');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} lors du chargement du manifest`);
      }
      const manifest = await response.json();

      // Debug log en tests
      if (import.meta.env.MODE === 'test' || import.meta.env.DEV) {
        console.log('Manifest loaded:', Array.isArray(manifest), typeof manifest, manifest);
      }

      return manifest;
    } catch (error) {
      console.warn('Manifest des tutoriels non trouvé, initialisation avec liste vide:', error);
      return [];
    }
  }

  /**
   * Récupérer un tutoriel complet par nom d'outil
   * @param {string} toolName - Nom de l'outil (ex: 'createCircle')
   * @param {string} [lang] - Code langue (fr, nl, en). Détecte si absent
   * @returns {Promise<Object>} Tutoriel JSON validé
   */
  async getTutorial(toolName, lang = null) {
    const language = lang || this.currentLanguage;
    let perfTracker = null;
    try {
      perfTracker = performanceMonitor?.startMeasure?.(`HelpSystem.getTutorial.${toolName}`);
    } catch (e) {
      // performanceMonitor peut ne pas être disponible en tests
    }

    try {
      // Validation basique du nom d'outil
      if (!toolName || typeof toolName !== 'string' || toolName.trim().length === 0) {
        throw new Error('Nom d\'outil invalide: le toolName est requis et doit être une chaîne non-vide');
      }

      // Vérifier le cache
      const cacheKey = `${toolName}-${language}`;
      if (this.tutorialsCache.has(cacheKey)) {
        return this.tutorialsCache.get(cacheKey);
      }

      // Charger le tutoriel depuis le fichier JSON
      const tutorial = await this.loadTutorialFile(toolName);

      // Valider le tutoriel contre le schéma
      const schemaValidation = this.validateTutorial(tutorial);
      if (!schemaValidation.isValid) {
        throw new Error(`Tutoriel invalide: ${schemaValidation.getAllMessages().join(', ')}`);
      }

      // Ajouter au cache
      this.tutorialsCache.set(cacheKey, tutorial);

      // Ajouter à l'historique
      await this.addToHistory(toolName);

      return tutorial;
    } catch (error) {
      console.error(`Erreur lors du chargement du tutoriel ${toolName}:`, error);
      return null;
    } finally {
      try {
        if (perfTracker) performanceMonitor?.endMeasure?.(perfTracker);
      } catch (e) {
        // Silently ignore
      }
    }
  }

  /**
   * Charger un fichier tutoriel JSON
   * @private
   */
  async loadTutorialFile(toolName) {
    const url = `/data/help/geometrie/${toolName}.json`;
    const response = await fetch(url);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Tutoriel non trouvé pour l'outil: ${toolName}`);
      }
      throw new Error(`HTTP ${response.status} lors du chargement du tutoriel`);
    }

    return await response.json();
  }

  /**
   * Valider un tutoriel contre le schéma
   * @private
   */
  validateTutorial(tutorial) {
    // Validation basique JSON schema
    const required = ['toolName', 'metadata', 'steps'];
    const missingFields = required.filter(field => !(field in tutorial));

    if (missingFields.length > 0) {
      return {
        isValid: false,
        getAllMessages: () => [`Champs manquants: ${missingFields.join(', ')}`]
      };
    }

    if (!Array.isArray(tutorial.steps) || tutorial.steps.length === 0) {
      return {
        isValid: false,
        getAllMessages: () => ['Le tutoriel doit avoir au moins une étape']
      };
    }

    return { isValid: true, getAllMessages: () => [] };
  }

  /**
   * Construire l'index de recherche à partir du manifest
   * @private
   */
  buildSearchIndex(tutorialsManifest) {
    // Vérifier que le manifest est un array
    if (!Array.isArray(tutorialsManifest)) {
      console.warn('Manifest des tutoriels n\'est pas un array, initialisation avec liste vide');
      return;
    }

    tutorialsManifest.forEach(tutorial => {
      const lang = this.currentLanguage;
      const keywords = tutorial.metadata?.keywords?.[lang] || [];
      const title = tutorial.metadata?.title?.[lang] || '';
      const description = tutorial.metadata?.description?.[lang] || '';

      const searchTerms = [
        tutorial.toolName,
        title,
        description,
        ...keywords
      ].filter(Boolean).join(' ').toLowerCase();

      this.searchIndex.set(tutorial.toolName, {
        title,
        searchTerms,
        category: tutorial.metadata?.category,
        difficulty: tutorial.metadata?.difficulty
      });
    });
  }

  /**
   * Rechercher des tutoriels par requête
   * @param {string} query - Terme de recherche
   * @returns {Array} Résultats de recherche triés par pertinence
   */
  search(query) {
    if (!query || query.trim().length === 0) {
      return [];
    }

    let perfTracker = null;
    try {
      perfTracker = performanceMonitor?.startMeasure?.('HelpSystem.search');
    } catch (e) {
      // performanceMonitor peut ne pas être disponible
    }

    try {
      const queryLower = query.toLowerCase();
      const results = [];

      this.searchIndex.forEach((entry, toolName) => {
        const score = this.calculateRelevanceScore(queryLower, entry);
        if (score > 0) {
          results.push({
            toolName,
            title: entry.title,
            category: entry.category,
            difficulty: entry.difficulty,
            score
          });
        }
      });

      // Trier par score décroissant
      return results.sort((a, b) => b.score - a.score);
    } finally {
      try {
        if (perfTracker) performanceMonitor?.endMeasure?.(perfTracker);
      } catch (e) {
        // Silently ignore
      }
    }
  }

  /**
   * Calculer le score de pertinence pour un résultat de recherche
   * @private
   */
  calculateRelevanceScore(query, entry) {
    let score = 0;

    // Correspondance exacte du nom d'outil: score maximum
    if (entry.searchTerms.includes(query)) {
      score += 100;
    }

    // Correspondance au début du titre: score élevé
    if (entry.searchTerms.startsWith(query)) {
      score += 50;
    }

    // Correspondance partielle: score modéré
    if (entry.searchTerms.includes(query)) {
      score += 25;
    }

    // Correspondance mot par mot
    const words = entry.searchTerms.split(/\s+/);
    const matchingWords = words.filter(word => word.includes(query)).length;
    score += matchingWords * 10;

    return score;
  }

  /**
   * Récupérer l'historique des tutoriels consultés
   * @returns {Array} Liste des outils consultés récemment
   */
  getHistory() {
    return [...this.history];
  }

  /**
   * Ajouter un tutoriel à l'historique
   * @private
   */
  async addToHistory(toolName) {
    // Éviter les doublons: retirer si présent et réajouter au début
    this.history = this.history.filter(h => h.toolName !== toolName);

    this.history.unshift({
      toolName,
      timestamp: new Date().toISOString()
    });

    // Limiter l'historique
    if (this.history.length > this.maxHistoryItems) {
      this.history = this.history.slice(0, this.maxHistoryItems);
    }

    // Persister dans IndexedDB
    await this.persistHistory();
  }

  /**
   * Charger l'historique depuis IndexedDB
   * @private
   */
  async loadHistory() {
    try {
      const db = await this.getDatabase();
      const tx = db.transaction('helpHistory', 'readonly');
      const store = tx.objectStore('helpHistory');
      const request = store.get('history');

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          if (request.result) {
            this.history = request.result.items || [];
          }
          resolve();
        };
        request.onerror = reject;
      });
    } catch (error) {
      console.warn('Impossible de charger l\'historique depuis IndexedDB:', error);
      this.history = [];
    }
  }

  /**
   * Persister l'historique dans IndexedDB
   * @private
   */
  async persistHistory() {
    try {
      const db = await this.getDatabase();
      const tx = db.transaction('helpHistory', 'readwrite');
      const store = tx.objectStore('helpHistory');

      store.put({
        id: 'history',
        items: this.history,
        updatedAt: new Date().toISOString()
      });

      return new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = reject;
      });
    } catch (error) {
      console.warn('Impossible de persister l\'historique dans IndexedDB:', error);
    }
  }

  /**
   * Obtenir accès à la base de données IndexedDB
   * @private
   */
  getDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ag-tablette-help', 2);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        // Supprimer l'ancien store s'il existe
        if (db.objectStoreNames.contains('helpHistory')) {
          db.deleteObjectStore('helpHistory');
        }
        // Créer le nouveau store avec keyPath
        db.createObjectStore('helpHistory', { keyPath: 'id' });
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Effacer l'historique
   */
  async clearHistory() {
    this.history = [];
    await this.persistHistory();
  }

  /**
   * Définir la langue
   */
  setLanguage(lang) {
    if (['fr', 'nl', 'en'].includes(lang)) {
      this.currentLanguage = lang;
      // Invalider le cache lors du changement de langue
      this.tutorialsCache.clear();
    }
  }

  /**
   * Obtenir la langue actuelle
   */
  getLanguage() {
    return this.currentLanguage;
  }

  /**
   * Récupérer tous les tutoriels disponibles
   * @returns {Array} Liste de tous les tutoriels avec métadonnées
   */
  async getAllTutorials() {
    try {
      const manifest = await this.loadTutorialsManifest();
      return manifest;
    } catch (error) {
      console.error('Erreur lors de la récupération de tous les tutoriels:', error);
      return [];
    }
  }
}

// Singleton global pour accès depuis n'importe où
let helpSystemInstance = null;

/**
 * Obtenir l'instance unique du HelpSystem
 */
export function getHelpSystem() {
  if (!helpSystemInstance) {
    helpSystemInstance = new HelpSystem();
  }
  return helpSystemInstance;
}

/**
 * Initialiser le HelpSystem globalement
 */
export async function initializeHelpSystem() {
  const helpSystem = getHelpSystem();
  await helpSystem.initialize();
  return helpSystem;
}
