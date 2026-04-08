import { resetToolsVisibility, tools } from '@store/tools';
import {
  activeTool,
  appActions,
  currentEnvironment,
  currentStep,
  filename,
  fullHistoryState,
  historyState,
  settings,
  tangramState,
  toolState,
  workspaceData
} from '../../store/appState';
import { resetKitVisibility } from '../../store/kit';
import { initFullHistoryManager } from './Managers/FullHistoryManager';
import { initHistoryManager } from './Managers/HistoryManager';
import { initSaveFileEventListener } from './Managers/SaveFileManager';
import { initSelectManager } from './Managers/SelectManager';
import { Workspace } from './Objects/Workspace';
import { uniqId } from './Tools/utils';

/**
 * @typedef {object} Settings Configuration de l'application
 * @property {number} magnetismDistance - Distance de magnétisme.
 * @property {number} selectionDistance - Distance de sélection.
 * @property {number} precision - Précision des calculs.
 * @property {number} maxZoomLevel - Niveau de zoom maximal.
 * @property {number} minZoomLevel - Niveau de zoom minimal.
 * @property {number} mainMenuWidth - Largeur du menu principal.
 * @property {string} constraintsDrawColor - Couleur pour dessiner les contraintes.
 * @property {string} temporaryDrawColor - Couleur pour les dessins temporaires.
 * @property {string} referenceDrawColor - Couleur de référence pour le dessin.
 * @property {string} referenceDrawColor2 - Deuxième couleur de référence pour le dessin.
 * @property {number} geometryTransformationAnimationDuration - Durée de l'animation pour la transformation géométrique.
 * @property {boolean} geometryTransformationAnimation - Activer/désactiver l'animation de transformation géométrique.
 * @property {boolean} automaticAdjustment - Ajustement automatique.
 * @property {boolean} areShapesPointed - Indique si les formes sont pointées.
 * @property {number} shapesSize - Taille des formes.
 * @property {number} numberOfDivisionParts - Nombre de parties pour la division.
 * @property {number} numberOfRegularPoints - Nombre de points pour les formes régulières.
 * @property {string} shapesDrawColor - Couleur de dessin pour les formes.
 * @property {number} shapeOpacity - Opacité des formes.
 * @property {number} scalarNumerator - Numérateur pour la mise à l'échelle.
 * @property {number} scalarDenominator - Dénominateur pour la mise à l'échelle.
 * @property {boolean} gridShown - Afficher/masquer la grille.
 * @property {string} gridType - Type de grille ('none', 'square', 'triangle').
 * @property {number} gridSize - Taille de la grille.
 */

/**
 * @typedef {object} HistoryState État de l'historique
 * @property {number} index - Index actuel dans l'historique.
 * @property {Array<object>} steps - Les étapes de l'historique.
 * @property {object | null} startSituation - Situation de départ.
 * @property {Settings} startSettings - Paramètres de départ.
 */

/**
 * @typedef {object} FullHistoryState État complet de l'historique (pour la relecture)
 * @property {number} index - Index actuel.
 * @property {number} actionIndex - Index de l'action en cours.
 * @property {number} numberOfActions - Nombre total d'actions.
 * @property {Array<object>} steps - Les étapes de l'historique complet.
 * @property {boolean} isRunning - Indique si la relecture de l'historique complet est en cours.
 */

/**
 * @typedef {object} TangramState État spécifique au Tangram
 * @property {boolean} isSilhouetteShown - Indique si la silhouette du Tangram est affichée.
 */

/**
 * Classe principale de l'application gérant l'état global, les paramètres, l'historique et les événements.
 * @class App
 */
export class App {
  /**
   * Crée une instance de App.
   * Initialise les dimensions du canvas, l'outil sélectionné, les paramètres par défaut,
   * l'historique, l'historique complet, l'état du tangram et d'autres états internes.
   */
  constructor() {
    /** @type {number | null} Largeur du canvas */
    this.canvasWidth = null;
    /** @type {number | null} Hauteur du canvas */
    this.canvasHeight = null;

    /** @type {object | null} L'outil actuellement sélectionné par l'utilisateur */
    this.tool = null;

    /** @type {Settings} Paramètres de l'application */
    this.settings = {
      magnetismDistance: 20,
      selectionDistance: 20,
      precision: 1.5,
      maxZoomLevel: 10,
      minZoomLevel: 0.1,
      mainMenuWidth: 250,
      constraintsDrawColor: '#080',
      temporaryDrawColor: '#E90CC8',
      referenceDrawColor: '#a6dbff',
      referenceDrawColor2: '#4a88b2',

      geometryTransformationAnimationDuration: 2,
      geometryTransformationAnimation: false,

      automaticAdjustment: true,
      areShapesPointed: true,
      shapesSize: 2,
      numberOfDivisionParts: 2,
      numberOfRegularPoints: 3,
      shapesDrawColor: '#ff0000',
      shapeOpacity: 0.7,
      scalarNumerator: 1,
      scalarDenominator: 1,
    };

    /** @type {HistoryState} Historique des actions de l'utilisateur */
    this.history = {
      index: -1,
      steps: [],
      startSituation: null,
      startSettings: { ...this.settings },
    };

    /** @type {FullHistoryState} Historique complet pour la relecture des actions */
    this.fullHistory = {
      index: 0,
      actionIndex: 0,
      numberOfActions: 0,
      steps: [],
      isRunning: false,
    };

    /** @type {TangramState} État spécifique à l'outil Tangram */
    this.tangram = {
      isSilhouetteShown: false,
    };

    /** @type {boolean} Indique si une action a été effectuée depuis la dernière sauvegarde */
    this.stepSinceSave = false;
    /** @type {boolean} Indique si l'application a démarré */
    this.started = false;
    /** @type {boolean} Indique si l'application est en cours de chargement */
    this.appLoading = false;
    /** @type {number} Index pour la prochaine couleur de groupe à assigner */
    this.nextGroupColorIdx = 0;
    /** @type {string} Numéro de version de l'application */
    this.version = '1.0.0';

    this.workspace = new Workspace();

    /** @type {object} État par défaut de l'application, utilisé pour la réinitialisation */
    this.defaultState = {
      tool: null,
      settings: { ...this.settings },
      history: { ...this.history },
      fullHistory: { ...this.fullHistory },
      tangram: { ...this.tangram },
      stepSinceSave: this.stepSinceSave,
    };

    /**
     * @type {Object.<string, Object.<string, Function>>}
     * Compteur et registre des écouteurs d'événements.
     * La clé externe est le nom de l'événement, la clé interne est un ID unique pour l'écouteur.
     */
    this.listenerCounter = {};

    initSaveFileEventListener(this);
    initSelectManager(this);
  }

  /**
   * Ajoute un écouteur d'événements à la fenêtre et le stocke pour pouvoir le supprimer ultérieurement.
   * @param {string} listenerName - Le nom de l'événement (ex: 'click', 'tool-changed').
   * @param {Function} func - La fonction callback à exécuter lorsque l'événement est déclenché.
   * @returns {string} Un ID unique pour l'écouteur d'événement ajouté, utile pour le supprimer.
   */
  addListener(listenerName, func) {
    const id = uniqId();
    if (!this.listenerCounter[listenerName]) {
      this.listenerCounter[listenerName] = {};
    }
    this.listenerCounter[listenerName][id] = func;
    window.addEventListener(listenerName, func);
    return id;
  }

  /**
   * Supprime un écouteur d'événements de la fenêtre en utilisant son nom et l'ID retourné par addListener.
   * @param {string} listenerName - Le nom de l'événement.
   * @param {string} id - L'ID unique de l'écouteur à supprimer.
   * @returns {void}
   */
  removeListener(listenerName, id) {
    if (
      !id ||
      !this.listenerCounter[listenerName] ||
      !this.listenerCounter[listenerName][id]
    ) {
      // Vérification ajoutée pour la robustesse
      return;
    }
    window.removeEventListener(
      listenerName,
      this.listenerCounter[listenerName][id],
    );
    this.listenerCounter[listenerName][id] = null;
  }

  /**
   * Réinitialise certains paramètres de l'application à leurs valeurs par défaut.
   * Cela inclut la visibilité des outils, la visibilité du kit, et certains paramètres spécifiques
   * tout en conservant l'état actuel de la grille.
   * @returns {void}
   */
  resetSettings() {
    resetToolsVisibility();
    resetKitVisibility();
    appActions.updateSettings(app.defaultState.settings);
  }
}

export const app = new App();
if (typeof window !== 'undefined') {
  window.app = app;

  // Pont de compatibilité SYNCHRONE
  // On écoute les événements émis par appActions pour mettre à jour l'objet app immédiatement

  const syncTool = () => {
    const toolName = activeTool.get();
    const step = currentStep.get();
    const state = toolState.get();
    const toolInfo = tools.get().find((t) => t.name === toolName);

    const oldToolName = app.tool?.name;
    const previousFamily = app.tool?.selectedFamily || null;
    const previousTemplate = app.tool?.selectedTemplate || null;

    app.tool = {
      ...(app.tool || {}),
      ...state,
      name: toolName,
      currentStep: step,
      selectedFamily:
        toolName === oldToolName
          ? (state.selectedFamily ?? previousFamily ?? null)
          : (state.selectedFamily ?? null),
      // Priorité au template venant du state si fourni, sinon fallback sur le précédent.
      selectedTemplate:
        toolName === oldToolName
          ? (state.selectedTemplate ?? previousTemplate ?? null)
          : (state.selectedTemplate ?? null),
      title: toolInfo?.title,
      type: toolInfo?.type,
    };

    if (toolName !== oldToolName) {
      window.dispatchEvent(new CustomEvent('tool-changed', { detail: app }));
    }
    window.dispatchEvent(new CustomEvent('tool-updated', { detail: app }));
    window.dispatchEvent(new CustomEvent('state-changed', { detail: app }));
  };

  window.addEventListener('tool:activated', syncTool);
  window.addEventListener('tool:state-changed', syncTool);
  window.addEventListener('tool-step-changed', syncTool);
  window.addEventListener('tool-template-changed', syncTool);

  window.addEventListener('settings:updated', () => {
    app.settings = settings.get();
    window.dispatchEvent(new CustomEvent('settings-changed', { detail: app }));
    window.dispatchEvent(new CustomEvent('state-changed', { detail: app }));
  });
  window.addEventListener('history:state-changed', () => {
    app.history = historyState.get();
    window.dispatchEvent(new CustomEvent('history-changed', { detail: app }));
    window.dispatchEvent(new CustomEvent('state-changed', { detail: app }));
  });

  window.addEventListener('app:full-history-changed', () => {
    app.fullHistory = fullHistoryState.get();
    window.dispatchEvent(new CustomEvent('state-changed', { detail: app }));
  });

  window.addEventListener('environment:changed', () => {
    app.environment = currentEnvironment.get();
    if (app.environment && app.history.startSituation === null) {
      appActions.setHistoryState({
        startSituation: app.workspace.data,
        startSettings: { ...app.settings },
      });
    }
  });

  window.addEventListener('tangram:state-changed', () => {
    app.tangram = tangramState.get();
    window.dispatchEvent(new CustomEvent('tangram-changed', { detail: app }));
    window.dispatchEvent(new CustomEvent('state-changed', { detail: app }));
  });

  window.addEventListener('app:filename-changed', (e) => {
    app.filename = e.detail.filename;
  });

  window.addEventListener('app:step-since-save-changed', (e) => {
    app.stepSinceSave = e.detail.stepSinceSave;
  });

  window.addEventListener('app:started-changed', (e) => {
    app.started = e.detail.started;
    if (app.started) {
      window.dispatchEvent(new CustomEvent('app-started', { detail: app }));
    }
  });

  window.addEventListener('workspace:updated', () => {
    app.workspaceData = workspaceData.get();
    window.dispatchEvent(new CustomEvent('state-changed', { detail: app }));
  });

  // Synchronisation initiale
  syncTool();
  app.settings = settings.get();
  app.history = historyState.get();
  app.fullHistory = fullHistoryState.get();
  app.tangram = tangramState.get();
  app.filename = filename.get();

  initHistoryManager();
  initFullHistoryManager();
}
