import { app, setState } from '../App';
import { Coordinates } from '../Objects/Coordinates';
import { Tool } from './Tool';

/**
 * Classe de base pour tous les outils de géométrie
 * Fournit une interface commune et une gestion d'état standardisée
 */
export class BaseGeometryTool extends Tool {
  constructor(name, title, type = 'geometryCreator') {
    super(name, title, type);
    
    // État commun pour tous les outils géométriques
    this.currentStep = null;
    this.points = [];
    this.segments = [];
    this.numberOfPointsDrawn = 0;
    this.constraints = null;
    
    // Bind des méthodes pour éviter les problèmes de contexte
    this.handler = this.handler.bind(this);
    this.validateInput = this.validateInput.bind(this);
  }

  /**
   * Validation des entrées communes
   * @param {string} method - Nom de la méthode appelante
   * @param {object} data - Données à valider
   * @returns {boolean} - True si valide, false sinon
   */
  validateInput(method, data = {}) {
    if (!app.workspace) {
      console.error(`${method}: Workspace non disponible`);
      this.showErrorNotification('Erreur: Espace de travail non initialisé');
      return false;
    }

    if (data.coordinates && (!data.coordinates.x === undefined || !data.coordinates.y === undefined)) {
      console.error(`${method}: Coordonnées invalides`);
      this.showErrorNotification('Erreur: Coordonnées invalides');
      return false;
    }

    return true;
  }

  /**
   * Affiche une notification d'erreur standardisée
   * @param {string} message - Message à afficher
   */
  showErrorNotification(message) {
    window.dispatchEvent(new CustomEvent('show-notif', { 
      detail: { message, type: 'error' } 
    }));
  }

  /**
   * Affiche une notification d'information standardisée
   * @param {string} message - Message à afficher
   */
  showInfoNotification(message) {
    window.dispatchEvent(new CustomEvent('show-notif', { 
      detail: { message, type: 'info' } 
    }));
  }

  /**
   * Validation et récupération des coordonnées de souris
   * @returns {Coordinates|null} - Coordonnées valides ou null
   */
  getValidMouseCoordinates() {
    if (!app.workspace.lastKnownMouseCoordinates) {
      console.error('Coordonnées de souris non disponibles');
      return null;
    }
    return new Coordinates(app.workspace.lastKnownMouseCoordinates);
  }

  /**
   * Transition d'état sécurisée
   * @param {string} newStep - Nouvel état
   * @param {object} additionalData - Données supplémentaires
   */
  safeSetState(newStep, additionalData = {}) {
    try {
      setState({ 
        tool: { 
          ...app.tool, 
          name: this.name, 
          currentStep: newStep,
          ...additionalData
        } 
      });
    } catch (error) {
      console.error('Erreur lors du changement d\'état:', error);
      this.showErrorNotification('Erreur lors du changement d\'état');
    }
  }

  /**
   * Nettoyage standard à la fin d'un outil
   */
  cleanupTool() {
    app.upperCanvasLayer.removeAllObjects();
    this.removeListeners();
    this.stopAnimation();
    
    // Réinitialiser les propriétés communes
    this.currentStep = null;
    this.points = [];
    this.segments = [];
    this.numberOfPointsDrawn = 0;
    this.constraints = null;
  }

  /**
   * Démarrage standard d'un outil
   */
  standardStart() {
    if (!this.validateInput('start')) return;
    
    this.cleanupTool();
    this.currentStep = 'initialized';
  }

  /**
   * Fin standard d'un outil
   */
  end() {
    this.cleanupTool();
  }

  /**
   * Gestion d'erreur centralisée pour les actions d'outil
   * @param {Function} action - Action à exécuter
   * @param {string} actionName - Nom de l'action pour le debug
   */
  async safeExecuteAction(action, actionName = 'action') {
    try {
      await action();
    } catch (error) {
      console.error(`Erreur lors de l'exécution de ${actionName}:`, error);
      this.showErrorNotification(`Erreur lors de ${actionName}: ${error.message}`);
      
      // Retour à un état sûr
      this.safeSetState('error');
    }
  }
}
