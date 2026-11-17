/**
 * Registre centralisé des configurations d'aide contextuelle
 * Permet aux outils de s'enregistrer avec leur configuration spécifique
 * Pattern: Singleton avec Map interne
 */
class HelpConfigRegistry {
  static instance = null;

  constructor() {
    this.configs = new Map();
  }

  static getInstance() {
    if (!HelpConfigRegistry.instance) {
      HelpConfigRegistry.instance = new HelpConfigRegistry();
    }
    return HelpConfigRegistry.instance;
  }

  /**
   * Enregistre une configuration d'aide pour un outil
   * @param {string} toolName - Nom de l'outil (e.g., 'createQuadrilateral')
   * @param {object} config - Configuration avec structure:
   *   {
   *     steps: [...],
   *     getStepConfig: (state) => { target, text }
   *   }
   */
  register(toolName, config) {
    if (!toolName || typeof toolName !== 'string') {
      console.warn('[HelpConfigRegistry] toolName doit être une string', toolName);
      return;
    }
    if (!config || typeof config.getStepConfig !== 'function') {
      console.warn('[HelpConfigRegistry] config doit avoir une fonction getStepConfig', toolName);
      return;
    }
    this.configs.set(toolName, config);
  }

  /**
   * Récupère la configuration d'aide pour un outil
   * @param {string} toolName - Nom de l'outil
   * @returns {object|null} Configuration ou null si non enregistrée
   */
  get(toolName) {
    return this.configs.get(toolName) || null;
  }

  /**
   * Vérifie si un outil a une configuration d'aide enregistrée
   * @param {string} toolName - Nom de l'outil
   * @returns {boolean}
   */
  has(toolName) {
    return this.configs.has(toolName);
  }

  /**
   * Retourne toutes les configurations enregistrées
   * @returns {Map}
   */
  getAll() {
    return new Map(this.configs);
  }

  /**
   * Supprime la configuration d'un outil
   * @param {string} toolName - Nom de l'outil
   */
  unregister(toolName) {
    this.configs.delete(toolName);
  }

  /**
   * Vide le registre (utile pour tests)
   */
  clear() {
    this.configs.clear();
  }
}

export const helpConfigRegistry = HelpConfigRegistry.getInstance();
